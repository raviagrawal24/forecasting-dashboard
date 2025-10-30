// Example: call backend /api/forecast with uploaded file from the UI
async function uploadAndForecast(file) {
    const form = new FormData();
    form.append('file', file);
    form.append('period', '7');
    form.append('interval', '0.9');

    const resp = await fetch('http://localhost:4000/api/forecast', {
        method: 'POST',
        body: form
    });
    const json = await resp.json();
    if (resp.ok) {
        // json.historical and json.predictions -> update chart
        updatePredictionChartFromData(
            json.historical.map(h => ({ date: new Date(h.date), value: h.y })),
            json.predictions.map(p => ({ date: new Date(p.date), value: p.yhat, lower: p.yhat_lower, upper: p.yhat_upper }))
        );
        updatePredictionInsightsFromPrediction(json.historical, json.predictions);
    } else {
        console.error('Forecast error', json);
    }
}