Setup
1. Node:
   cd backend
   npm install

2. Python (create venv)
   cd backend/python
   python -m venv .venv
   .venv\\Scripts\\activate    # Windows
   pip install -r requirements.txt
   # Note: prophet can require build tools or cmdstan. See https://facebook.github.io/prophet/docs/installation.html

3. Place a sample CSV in backend/data/sample.csv
   - Expected: columns date (YYYY-MM-DD) and quantity/sales (numeric)
   - If you prefer a Kaggle dataset, download it manually and place it here (Kaggle requires auth).

Run
1. Start Node backend:
   cd backend
   npm start

2. API:
   POST /api/forecast
    - multipart/form-data field 'file' => CSV
    - optional form fields: period (int), smoothing (int)
   Response JSON: { historical: [...], predictions: [{date,yhat,yhat_lower,yhat_upper}, ...] }

Example curl
curl -F "file=@/path/to/your.csv" -F "period=7" http://localhost:4000/api/forecast