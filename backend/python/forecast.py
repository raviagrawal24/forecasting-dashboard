import argparse
import json
import sys
import pandas as pd
import numpy as np

# Prophet import (supports prophet or fbprophet)
try:
    from prophet import Prophet
except Exception:
    try:
        from fbprophet import Prophet
    except Exception as e:
        print("prophet import failed: " + str(e), file=sys.stderr)
        sys.exit(2)

def load_and_prepare(path):
    df = pd.read_csv(path)
    # find date column
    date_col = None
    for c in df.columns:
        if c.lower() in ('date','ds','day'):
            date_col = c
            break
    if date_col is None:
        # attempt to parse first column as date
        date_col = df.columns[0]
    df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
    df = df.dropna(subset=[date_col])
    # find value column
    val_col = None
    for c in df.columns:
        if c.lower() in ('y','value','quantity','qty','sold','sales'):
            val_col = c
            break
    if val_col is None:
        # take next numeric column
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols):
            val_col = numeric_cols[0]
        else:
            raise ValueError("No numeric column found for values")
    df = df[[date_col, val_col]].rename(columns={date_col: 'ds', val_col: 'y'})
    # aggregate by day
    df = df.groupby(df['ds'].dt.floor('D')).agg({'y':'sum'}).reset_index()
    df = df.sort_values('ds')
    return df

def forecast(df, period=7, smoothing=3, interval_width=0.9):
    m = Prophet(daily_seasonality=True, weekly_seasonality=True, yearly_seasonality=False, interval_width=interval_width)
    m.fit(df)
    future = m.make_future_dataframe(periods=period, freq='D')
    fc = m.predict(future)
    # merge historical and predicted
    hist = df.copy()
    hist['y'] = hist['y'].astype(float)
    hist_out = [{'date': d.strftime('%Y-%m-%d'), 'y': float(v)} for d, v in zip(hist['ds'], hist['y'])]
    pred_rows = fc.tail(period)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
    preds = []
    for _, r in pred_rows.iterrows():
        preds.append({
            'date': r['ds'].strftime('%Y-%m-%d'),
            'yhat': float(r['yhat']),
            'yhat_lower': float(r['yhat_lower']),
            'yhat_upper': float(r['yhat_upper'])
        })
    return {'historical': hist_out, 'predictions': preds, 'model': {'interval_width': interval_width}}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--file', required=True)
    parser.add_argument('--period', type=int, default=7)
    parser.add_argument('--smoothing', type=int, default=3)
    parser.add_argument('--interval', type=float, default=0.9)
    args = parser.parse_args()

    try:
        df = load_and_prepare(args.file)
        if df.shape[0] < 3:
            print(json.dumps({'error': 'Need at least 3 days of historical data'}))
            sys.exit(3)
        result = forecast(df, period=args.period, smoothing=args.smoothing, interval_width=args.interval)
        print(json.dumps(result))
    except Exception as e:
        print("Error: " + str(e), file=sys.stderr)
        sys.exit(4)

if __name__ == '__main__':
    main()