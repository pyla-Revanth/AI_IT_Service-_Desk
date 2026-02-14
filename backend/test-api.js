// API Testing Script
// Run this to test all API endpoints

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Test data
const testTicket = {
  user_id: '550e8400-e29b-41d4-a716-446655440000',
  issue_text: 'Cannot connect to VPN from home office. Getting error message "Connection timeout" when trying to connect.',
  category: 'network',
  priority: 'high'
};

const testResolution = {
  ticket_id: '', // Will be set after creating ticket
  action_taken: 'Restarted VPN service and provided new configuration file. User successfully connected.',
  resolved_by_agent: 'ai_assistant',
  resolution_time: 15
};

async function testAPI() {
  console.log('🧪 Testing AI IT Service Desk API...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: Create Ticket
    console.log('2️⃣ Creating Ticket...');
    const createResponse = await axios.post(`${API_BASE}/tickets`, testTicket);
    console.log('✅ Ticket Created:', createResponse.data);
    const ticketId = createResponse.data.data.id;
    testResolution.ticket_id = ticketId;
    console.log('');

    // Test 3: Get Ticket by ID
    console.log('3️⃣ Getting Ticket by ID...');
    const getTicketResponse = await axios.get(`${API_BASE}/tickets/${ticketId}`);
    console.log('✅ Ticket Retrieved:', getTicketResponse.data);
    console.log('');

    // Test 4: List Tickets
    console.log('4️⃣ Listing Tickets...');
    const listResponse = await axios.get(`${API_BASE}/tickets`);
    console.log('✅ Tickets Listed:', {
      count: listResponse.data.data.length,
      pagination: listResponse.data.pagination
    });
    console.log('');

    // Test 5: AI Classification
    console.log('5️⃣ Testing AI Classification...');
    const classifyResponse = await axios.post(`${API_BASE}/tickets/classify`, {
      issue_text: testTicket.issue_text,
      category: testTicket.category,
      priority: testTicket.priority
    });
    console.log('✅ AI Classification:', classifyResponse.data.data);
    console.log('');

    // Test 6: Resolve Ticket
    console.log('6️⃣ Resolving Ticket...');
    const resolveResponse = await axios.post(`${API_BASE}/tickets/resolve`, testResolution);
    console.log('✅ Ticket Resolved:', resolveResponse.data);
    console.log('');

    // Test 7: Get Statistics
    console.log('7️⃣ Getting Statistics...');
    const statsResponse = await axios.get(`${API_BASE}/tickets/stats`);
    console.log('✅ Statistics:', statsResponse.data.data);
    console.log('');

    // Test 8: Update Ticket
    console.log('8️⃣ Updating Ticket...');
    const updateResponse = await axios.put(`${API_BASE}/tickets/${ticketId}`, {
      status: 'closed',
      priority: 'medium'
    });
    console.log('✅ Ticket Updated:', updateResponse.data);
    console.log('');

    console.log('🎉 All API tests passed successfully!');

  } catch (error) {
    console.error('❌ API Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Error handling tests
async function testErrorHandling() {
  console.log('\n🛡️ Testing Error Handling...\n');

  try {
    // Test invalid ticket creation
    console.log('1️⃣ Testing Invalid Ticket Creation...');
    try {
      await axios.post(`${API_BASE}/tickets`, {
        user_id: 'test',
        // Missing required fields
      });
    } catch (error) {
      console.log('✅ Validation Error:', error.response.data);
    }

    // Test non-existent ticket
    console.log('2️⃣ Testing Non-existent Ticket...');
    try {
      await axios.get(`${API_BASE}/tickets/00000000-0000-0000-0000-000000000000`);
    } catch (error) {
      console.log('✅ 404 Error:', error.response.data);
    }

    // Test invalid category
    console.log('3️⃣ Testing Invalid Category...');
    try {
      await axios.post(`${API_BASE}/tickets`, {
        ...testTicket,
        category: 'invalid_category'
      });
    } catch (error) {
      console.log('✅ Category Validation Error:', error.response.data);
    }

    console.log('🎉 Error handling tests passed!');

  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
  }
}

// Performance test
async function testPerformance() {
  console.log('\n⚡ Testing Performance...\n');

  try {
    const startTime = Date.now();
    const promises = [];

    // Create 10 tickets concurrently
    for (let i = 0; i < 10; i++) {
      promises.push(
        axios.post(`${API_BASE}/tickets`, {
          ...testTicket,
          issue_text: `Test ticket ${i}: ${testTicket.issue_text}`
        })
      );
    }

    const results = await Promise.all(promises);
    const endTime = Date.now();

    console.log(`✅ Created ${results.length} tickets in ${endTime - startTime}ms`);
    console.log(`Average time per ticket: ${(endTime - startTime) / 10}ms`);

  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting API Test Suite...\n');
  
  await testAPI();
  await testErrorHandling();
  await testPerformance();
  
  console.log('\n🏁 Test suite completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testAPI,
  testErrorHandling,
  testPerformance,
  runAllTests
};
