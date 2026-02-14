// AI Ticket Classification Test Suite
// Run this to test the classification API

const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';

// Test tickets for classification
const testTickets = [
  {
    text: "I forgot my password and can't login to my email account. It says invalid password.",
    expected_category: "Password Reset",
    expected_priority: "high",
    expected_automation: true
  },
  {
    text: "VPN is not working from home office. Getting connection timeout error when trying to connect.",
    expected_category: "VPN Issue", 
    expected_priority: "high",
    expected_automation: true
  },
  {
    text: "I need Microsoft Office 365 installed on my work computer for the new project.",
    expected_category: "Software Install",
    expected_priority: "medium", 
    expected_automation: false
  },
  {
    text: "My laptop is running very slow and takes forever to start up. Applications are lagging.",
    expected_category: "Device Slow",
    expected_priority: "medium",
    expected_automation: true
  },
  {
    text: "I can't access the shared network drive. Getting permission denied error message.",
    expected_category: "Account Access",
    expected_priority: "high",
    expected_automation: true
  }
];

async function testSingleClassification() {
  console.log('🧪 Testing Single Ticket Classification...\n');

  try {
    const response = await axios.post(`${API_BASE}/classify`, {
      ticket_text: testTickets[0].text,
      user_id: '550e8400-e29b-41d4-a716-446655440000'
    });

    console.log('✅ Single Classification Result:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

  } catch (error) {
    console.error('❌ Single classification test failed:', error.response?.data || error.message);
  }
}

async function testBatchClassification() {
  console.log('🔄 Testing Batch Classification...\n');

  try {
    const tickets = testTickets.map((ticket, index) => ({
      id: `test-ticket-${index}`,
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      text: ticket.text
    }));

    const response = await axios.post(`${API_BASE}/classify/batch`, {
      tickets: tickets
    });

    console.log('✅ Batch Classification Result:');
    console.log(`Total: ${response.data.data.summary.total}`);
    console.log(`Successful: ${response.data.data.summary.successful}`);
    console.log(`Failed: ${response.data.data.summary.failed}`);
    console.log(`Success Rate: ${response.data.data.summary.success_rate}`);
    console.log('');

    // Analyze results
    response.data.data.results.forEach((result, index) => {
      const testTicket = testTickets[index];
      const classification = result.classification;
      
      console.log(`📝 Ticket ${index + 1}: "${testTicket.text.substring(0, 50)}..."`);
      console.log(`   Expected: ${testTicket.expected_category} | Got: ${classification?.category}`);
      console.log(`   Expected: ${testTicket.expected_priority} | Got: ${classification?.priority}`);
      console.log(`   Expected: ${testTicket.expected_automation} | Got: ${classification?.automation_possible}`);
      console.log(`   Confidence: ${classification?.confidence}`);
      console.log(`   Status: ${result.status}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Batch classification test failed:', error.response?.data || error.message);
  }
}

async function testCategoriesEndpoint() {
  console.log('📋 Testing Categories Endpoint...\n');

  try {
    const response = await axios.get(`${API_BASE}/classify/categories`);

    console.log('✅ Available Categories:');
    response.data.data.forEach(category => {
      console.log(`   🏷️  ${category.name}`);
      console.log(`      Description: ${category.description}`);
      console.log(`      Automation: ${category.automation_possible ? '✅' : '❌'}`);
      console.log(`      Typical Priority: ${category.typical_priority}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Categories test failed:', error.response?.data || error.message);
  }
}

async function testValidationEndpoint() {
  console.log('✅ Testing Validation Endpoint...\n');

  try {
    // Test valid classification
    const validClassification = {
      category: 'Password Reset',
      priority: 'high',
      automation_possible: true,
      confidence: 0.95,
      reasoning: 'Password reset request detected'
    };

    const response = await axios.post(`${API_BASE}/classify/validate`, {
      classification: validClassification
    });

    console.log('✅ Valid Classification Result:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    // Test invalid classification
    const invalidClassification = {
      category: 'Invalid Category',
      priority: 'invalid',
      automation_possible: 'not_boolean',
      confidence: 1.5
    };

    const invalidResponse = await axios.post(`${API_BASE}/classify/validate`, {
      classification: invalidClassification
    });

    console.log('❌ Invalid Classification Result:');
    console.log(JSON.stringify(invalidResponse.data, null, 2));
    console.log('');

  } catch (error) {
    console.error('❌ Validation test failed:', error.response?.data || error.message);
  }
}

async function testStatisticsEndpoint() {
  console.log('📊 Testing Statistics Endpoint...\n');

  try {
    const response = await axios.get(`${API_BASE}/classify/stats`);

    console.log('✅ Classification Statistics:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

  } catch (error) {
    console.error('❌ Statistics test failed:', error.response?.data || error.message);
  }
}

async function testHealthEndpoint() {
  console.log('🏥 Testing Health Endpoint...\n');

  try {
    const response = await axios.get(`${API_BASE}/health`);

    console.log('✅ Health Check Result:');
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Service: ${response.data.service}`);
    console.log(`   Version: ${response.data.version}`);
    console.log(`   Database: ${response.data.database.connected ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`   OpenAI Configured: ${response.data.openai_configured ? '✅ Yes' : '❌ No'}`);
    console.log('');

  } catch (error) {
    console.error('❌ Health check test failed:', error.response?.data || error.message);
  }
}

async function testErrorHandling() {
  console.log('🛡️ Testing Error Handling...\n');

  try {
    // Test missing ticket text
    try {
      await axios.post(`${API_BASE}/classify`, {});
    } catch (error) {
      console.log('✅ Missing ticket text error handled correctly:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.error}`);
      console.log('');
    }

    // Test empty batch
    try {
      await axios.post(`${API_BASE}/classify/batch`, { tickets: [] });
    } catch (error) {
      console.log('✅ Empty batch error handled correctly:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.error}`);
      console.log('');
    }

    // Test large batch
    try {
      const largeBatch = Array(60).fill({ text: 'test' });
      await axios.post(`${API_BASE}/classify/batch`, { tickets: largeBatch });
    } catch (error) {
      console.log('✅ Large batch error handled correctly:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.error}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
  }
}

// Performance test
async function testPerformance() {
  console.log('⚡ Testing Performance...\n');

  try {
    const startTime = Date.now();
    const promises = [];

    // Send 20 classification requests concurrently
    for (let i = 0; i < 20; i++) {
      const ticketIndex = i % testTickets.length;
      promises.push(
        axios.post(`${API_BASE}/classify`, {
          ticket_text: testTickets[ticketIndex].text,
          user_id: `test-user-${i}`
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

  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting AI Classification Test Suite...\n');
  
  await testHealthEndpoint();
  await testCategoriesEndpoint();
  await testSingleClassification();
  await testBatchClassification();
  await testValidationEndpoint();
  await testStatisticsEndpoint();
  await testErrorHandling();
  await testPerformance();
  
  console.log('🏁 Classification test suite completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testSingleClassification,
  testBatchClassification,
  testCategoriesEndpoint,
  testValidationEndpoint,
  testStatisticsEndpoint,
  testHealthEndpoint,
  testErrorHandling,
  testPerformance,
  runAllTests
};
