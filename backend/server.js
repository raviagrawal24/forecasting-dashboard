//Below is a compact, ready-to-run Node.jsbackend + Python forecasting service (Prophet) you can drop into your project. It accepts CSV uploads, runs a production-grade forecast using Prophet, returns predictions with uncertainty intervals, and exposes a sample-data endpoint. Follow the README steps to install and run.

//Node backend (Express) — handles uploads and spawns the Python forecasting script.
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
app.use(cors());
app.use(express.json());

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')),
});
const upload = multer({ storage });

const FORECAST_URL = process.env.FORECAST_URL || 'http://forecast:8000/forecast';

// health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// proxy endpoint: accepts multipart/form-data 'file'
app.post('/api/forecast', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'CSV file required (field name: file)' });

  const localPath = req.file.path;
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(localPath), req.file.originalname);
    form.append('period', req.body.period || '7');
    form.append('interval', req.body.interval || '0.9');

    const resp = await axios.post(FORECAST_URL, form, {
      headers: { ...form.getHeaders() },
      maxBodyLength: Infinity,
      timeout: 5 * 60 * 1000
    });

    // forward response JSON
    return res.status(resp.status).json(resp.data);
  } catch (err) {
    console.error('Error forwarding to forecast service:', err?.message || err);
    const detail = err?.response?.data || err?.message || 'Forecast service error';
    return res.status(500).json({ error: 'Forecasting failed', detail });
  } finally {
    // cleanup uploaded file
    try { fs.unlinkSync(localPath); } catch (e) { /* ignore */ }
  }
});

// Optionally serve frontend (if running backend from project root)
app.use('/', express.static(path.join(__dirname, '..')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on http://0.0.0.0:${PORT}`));

// Add these endpoints after your existing routes

// Get forecast history with filters
app.get('/api/forecasts', async (req, res) => {
    try {
        const days = parseInt(req.query.days || '7');
        const search = req.query.search || '';
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');

        const query = {
            uploadedAt: { 
                $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) 
            }
        };

        if (search) {
            query.$or = [
                { filename: new RegExp(search, 'i') },
                { 'metadata.model': new RegExp(search, 'i') }
            ];
        }

        const forecasts = await Forecast
            .find(query)
            .sort({ uploadedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select('filename uploadedAt predictions historical metadata');

        const total = await Forecast.countDocuments(query);

        res.json({
            forecasts,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                current: page,
                limit
            }
        });
    } catch (error) {
        console.error('Forecast history error:', error);
        res.status(500).json({ error: 'Failed to fetch forecasts' });
    }
});

// Get single forecast by ID with analysis
app.get('/api/forecasts/:id', async (req, res) => {
    try {
        const forecast = await Forecast.findById(req.params.id);
        if (!forecast) {
            return res.status(404).json({ error: 'Forecast not found' });
        }

        // Calculate accuracy metrics
        const metrics = calculateForecastMetrics(forecast);

        res.json({
            ...forecast.toObject(),
            metrics
        });
    } catch (error) {
        console.error('Forecast detail error:', error);
        res.status(500).json({ error: 'Failed to fetch forecast' });
    }
});

// Helper function for accuracy metrics
function calculateForecastMetrics(forecast) {
    const now = new Date();
    const completedPredictions = forecast.predictions
        .filter(p => new Date(p.date) < now);

    const metrics = {
        mape: 0,
        rmse: 0,
        completed: completedPredictions.length,
        total: forecast.predictions.length
    };

    if (completedPredictions.length > 0) {
        let sumError = 0;
        let sumSquaredError = 0;

        completedPredictions.forEach(pred => {
            const actual = forecast.historical.find(h => 
                new Date(h.date).toDateString() === new Date(pred.date).toDateString()
            )?.value;

            if (actual) {
                const error = Math.abs((actual - pred.value) / actual);
                const squaredError = Math.pow(actual - pred.value, 2);
                sumError += error;
                sumSquaredError += squaredError;
            }
        });

        metrics.mape = (sumError / completedPredictions.length) * 100;
        metrics.rmse = Math.sqrt(sumSquaredError / completedPredictions.length);
    }

    return metrics;
}