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