const axios = require('axios');
const FormData = require('form-data');
const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');

async function runSystemTest() {
    console.log('🔍 Running system tests...\n');
    const tests = {
        passed: 0,
        failed: 0
    };

    // Test 1: Backend Health Check
    try {
        const health = await axios.get('http://localhost:4000/api/health');
        assert(health.data.ok === true);
        console.log('✅ Backend API health check passed');
        tests.passed++;
    } catch (error) {
        console.error('❌ Backend API health check failed:', error.message);
        tests.failed++;
    }

    // Test 2: FastAPI Forecast Service
    try {
        const health = await axios.get('http://localhost:8000/health');
        assert(health.data.ok === true);
        console.log('✅ Forecast service health check passed');
        tests.passed++;
    } catch (error) {
        console.error('❌ Forecast service health check failed:', error.message);
        tests.failed++;
    }

    // Test 3: MongoDB Connection
    try {
        const response = await axios.get('http://localhost:4000/api/forecasts?days=1');
        assert(Array.isArray(response.data.forecasts));
        console.log('✅ MongoDB connection test passed');
        tests.passed++;
    } catch (error) {
        console.error('❌ MongoDB connection test failed:', error.message);
        tests.failed++;
    }

    // Test 4: Full Forecast Pipeline
    try {
        const sampleData = `date,quantity\n2023-01-01,10\n2023-01-02,15\n2023-01-03,12`;
        const form = new FormData();
        form.append('file', Buffer.from(sampleData), 'test.csv');
        form.append('period', '7');
        
        const forecast = await axios.post('http://localhost:4000/api/forecast', form, {
            headers: { ...form.getHeaders() }
        });

        assert(forecast.data.historical.length > 0);
        assert(forecast.data.predictions.length > 0);
        console.log('✅ Forecast pipeline test passed');
        tests.passed++;
    } catch (error) {
        console.error('❌ Forecast pipeline test failed:', error.message);
        tests.failed++;
    }

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`Passed: ${tests.passed}`);
    console.log(`Failed: ${tests.failed}`);
    
    return tests.failed === 0;
}

// Run if called directly
if (require.main === module) {
    runSystemTest().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = runSystemTest;