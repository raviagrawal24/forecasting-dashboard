const axios = require('axios');
const FormData = require('form-data');

async function runTest() {
  const sampleCsv = `date,quantity
2025-10-01,12
2025-10-02,9
2025-10-03,15
2025-10-04,11
2025-10-05,14
2025-10-06,10
2025-10-07,13
`;

  const form = new FormData();
  form.append('file', Buffer.from(sampleCsv), {
    filename: 'sample-test.csv',
    contentType: 'text/csv'
  });
  form.append('period', '7');
  form.append('interval', '0.9');

  try {
    const res = await axios.post('http://localhost:4000/api/forecast', form, {
      headers: { ...form.getHeaders() },
      timeout: 2 * 60 * 1000
    });
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Request failed:', err?.response?.data || err.message);
    process.exit(1);
  }
}

runTest();