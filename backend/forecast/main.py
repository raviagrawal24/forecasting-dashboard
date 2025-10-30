from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
from prophet import Prophet
import io
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Forecast Service")

@app.get("/health")
async def health():
    return {"ok": True}

def load_and_prepare(bytes_io):
    df = pd.read_csv(bytes_io)
    # detect date column
    date_col = None
    for c in df.columns:
        if c.lower() in ('date','ds','day'):
            date_col = c
            break
    if date_col is None:
        date_col = df.columns[0]
    df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
    df = df.dropna(subset=[date_col])
    # detect value column
    val_col = None
    for c in df.columns:
        if c.lower() in ('y','value','quantity','qty','sold','sales'):
            val_col = c
            break
    if val_col is None:
        numeric = df.select_dtypes(include=[np.number]).columns
        if len(numeric) == 0:
            raise ValueError("No numeric column found for values")
        val_col = numeric[0]
    df = df[[date_col, val_col]].rename(columns={date_col: 'ds', val_col: 'y'})
    df = df.groupby(df['ds'].dt.floor('D')).agg({'y':'sum'}).reset_index()
    df = df.sort_values('ds')
    return df

@app.post("/forecast")
async def forecast_endpoint(file: UploadFile = File(...), period: int = Form(7), interval: float = Form(0.9)):
    try:
        content = await file.read()
        df = load_and_prepare(io.BytesIO(content))
        if df.shape[0] < 3:
            raise HTTPException(status_code=400, detail="Need at least 3 days of historical data")
        m = Prophet(daily_seasonality=True, weekly_seasonality=True, yearly_seasonality=False, interval_width=interval)
        m.fit(df)
        future = m.make_future_dataframe(periods=period, freq='D')
        fc = m.predict(future)
        hist_out = [{'date': d.strftime('%Y-%m-%d'), 'y': float(v)} for d, v in zip(df['ds'], df['y'])]
        pred_rows = fc.tail(period)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
        preds = []
        for _, r in pred_rows.iterrows():
            preds.append({
                'date': r['ds'].strftime('%Y-%m-%d'),
                'yhat': float(r['yhat']),
                'yhat_lower': float(r['yhat_lower']),
                'yhat_upper': float(r['yhat_upper'])
            })
        return JSONResponse({'historical': hist_out, 'predictions': preds, 'model': {'interval_width': interval}})
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))