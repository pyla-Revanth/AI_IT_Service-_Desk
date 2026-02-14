// Automation System Test Suite
// Run this to test the automation executor

const axios = require('axios');

const API_BASE = 'http://localhost:3003/api';

// Test data
const testTicket = {
  id: 'test-ticket-123',
  user_id: 'test-user-456',
  issue_text: 'My computer is running very slow and takes forever to start up.',
  category: 'device_slow',
  priority: 'medium'
};

const testClassification = {
  category: 'Device Slow',
  priority: 'medium',
  automation_possible: true,
  confidence: 0.92,
  reasoning: 'Performance issue detected with high confidence'
};

async function testAutomationExecution() {
  console.log('🔧 Testing Automation Execution...\n');

  try {
    const response = await axios.post(`${API_BASE}/automation/execute`, {
      ticket_id: testTicket.id,
      ticket: testTicket,
      classification: testClassification
    });

    console.log('✅ Automation Execution Result:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    // Wait a bit and check logs
    await new Promise(resolve => setTimeout(resolve, 2000));

    const logsResponse = await axios.get(`${API_BASE}/automation/logs/${testTicket.id}`);
    console.log('📋 Automation Logs:');
    console.log(JSON.stringify(logsResponse.data, null, 2));
    console.log('');

  } catch (error) {
    console.error('❌ Automation execution test failed:', error.response?.data || error.message);
  }
}

async function testManualExecution() {
  console.log('🔧 Testing Manual Script Execution...\n');

  try {
    const response = await axios.post(`${API_BASE}/automation/manual`, {
      script_name: 'disk_cleanup.py',
      parameters: {
        min_free_space_gb: 5,
        clear_temp: true,
        clear_cache: true
      },
      ticket_id: 'manual-test-789'
    });

    console.log('✅ Manual Execution Result:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

  } catch (error) {
    console.error('❌ Manual execution test failed:', error.response?.data || error.message);
  }
}

async function testAutomationStats() {
  console.log('📊 Testing Automation Statistics...\n');

  try {
    const response = await axios.get(`${API_BASE}/automation/stats`);

    console.log('✅ Automation Statistics:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

  } catch (error) {
    console.error('❌ Automation stats test failed:', error.response?.data || error.message);
  }
}

async function testAvailableScripts() {
  console.log('📜 Testing Available Scripts...\n');

  try {
    const response = await axios.get(`${API_BASE}/automation/scripts`);

    console.log('✅ Available Scripts:');
    response.data.data.forEach((script, index) => {
      console.log(`${index + 1}. ${script.category}`);
      console.log(`   Script: ${script.script}`);
      console.log(`   Description: ${script.description}`);
      console.log(`   Parameters: ${JSON.stringify(script.parameters, null, 2)}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Available scripts test failed:', error.response?.data || error.message);
  }
}

async function testPythonCheck() {
  console.log('🐍 Testing Python Availability...\n');

  try {
    const response = await axios.get(`${API_BASE}/automation/python/check`);

    console.log('✅ Python Check Result:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

  } catch (error) {
    console.error('❌ Python check test failed:', error.response?.data || error.message);
  }
}

async function testAutomationTest() {
  console.log('🧪 Testing Automation System Test...\n');

  try {
    const response = await axios.post(`${API_BASE}/automation/test`);

    console.log('✅ Automation System Test Result:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

  } catch (error) {
    console.error('❌ Automation system test failed:', error.response?.data || error.message);
  }
}

async function testHealthCheck() {
  console.log('🏥 Testing Health Check...\n');

  try {
    const response = await axios.get(`${API_BASE}/health`);

    console.log('✅ Health Check Result:');
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Service: ${response.data.service}`);
    console.log(`   Version: ${response.data.version}`);
    console.log(`   Python Available: ${response.data.python_available ? '✅ Yes' : '❌ No'}`);
    if (response.data.python_version) {
      console.log(`   Python Version: ${response.data.python_version}`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Health check test failed:', error.response?.data || error.message);
  }
}

async function testErrorHandling() {
  console.log('🛡️ Testing Error Handling...\n');

  try {
    // Test missing fields
    try {
      await axios.post(`${API_BASE}/automation/execute`, {
        ticket_id: testTicket.id
        // Missing ticket and classification
      });
    } catch (error) {
      console.log('✅ Missing fields error handled correctly:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.error}`);
      console.log('');
    }

    // Test invalid automation possibility
    try {
      await axios.post(`${API_BASE}/automation/execute`, {
        ticket_id: testTicket.id,
        ticket: testTicket,
        classification: {
          ...testClassification,
          automation_possible: false
        }
      });
    } catch (error) {
      console.log('✅ Automation not possible error handled correctly:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.error}`);
      console.log('');
    }

    // Test non-existent ticket
    try {
      await axios.get(`${API_BASE}/automation/logs/non-existent-ticket`);
    } catch (error) {
      console.log('✅ Non-existent ticket error handled correctly:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.error}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
  }
}

async function testPerformance() {
  console.log('⚡ Testing Performance...\n');

  try {
    const startTime = Date.now();
    const promises = [];

    // Send 10 concurrent automation requests
    for (let i = 0; i < 10; i++) {
      promises.push(
        axios.post(`${API_BASE}/automation/execute`, {
          ticket_id: `perf-test-${i}`,
          ticket: { ...testTicket, id: `perf-test-${i}` },
          classification: testClassification
        })
      );
    }

    const results = await Promise.all(promises);
    const endTime = Date.now();

    console.log(`✅ Performance Test Results:`);
    console.log(`   Requests: ${results.length}`);
    console.log(`   Total Time: ${endTime - startTime}ms`);
    console.log(`   Average Time: ${(endTime - startTime) / results.length}ms per request`);
    console.log(`   Requests/Second: ${(results.length / (endTime - startTime) * 1000).toFixed(2)}`);
    console.log('');

    const successful = results.filter(r => r.data.success).length;
    console.log(`   Success Rate: ${(successful / results.length * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Automation System Test Suite...\n');
  
  await testHealthCheck();
  await testPythonCheck();
  await testAvailableScripts();
  await testAutomationExecution();
  await testManualExecution();
  await testAutomationStats();
  await testAutomationTest();
  await testErrorHandling();
  await testPerformance();
  
  console.log('🏁 Automation system test suite completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testAutomationExecution,
  testManualExecution,
  testAutomationStats,
  testAvailableScripts,
  testPythonCheck,
  testAutomationTest,
  testHealthCheck,
  testErrorHandling,
  testPerformance,
  runAllTests
};
