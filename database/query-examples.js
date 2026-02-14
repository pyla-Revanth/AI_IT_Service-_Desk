// Supabase Query Examples
// This file demonstrates how to use the database helper functions

const db = require('./supabase-client');

// ==================== TICKET QUERIES ====================

// Example 1: Create a new ticket
async function createTicketExample() {
  const ticketData = {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    issue_text: 'Cannot connect to VPN from home office',
    category: 'network',
    priority: 'high',
    status: 'open'
  };

  const { data, error } = await db.createTicket(ticketData);
  
  if (error) {
    console.error('Error creating ticket:', error);
  } else {
    console.log('Created ticket:', data);
  }
  
  return { data, error };
}

// Example 2: Get all tickets for a specific user
async function getUserTicketsExample() {
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  
  const { data, error } = await db.getTickets({ 
    user_id: userId,
    status: 'open' 
  });
  
  if (error) {
    console.error('Error fetching tickets:', error);
  } else {
    console.log(`Found ${data.length} tickets for user:`, data);
  }
  
  return { data, error };
}

// Example 3: Get tickets by category and priority
async function getFilteredTicketsExample() {
  const { data, error } = await db.getTickets({ 
    category: 'network',
    priority: 'high',
    status: 'open'
  });
  
  if (error) {
    console.error('Error fetching filtered tickets:', error);
  } else {
    console.log(`Found ${data.length} high-priority network tickets:`, data);
  }
  
  return { data, error };
}

// Example 4: Update ticket status
async function updateTicketStatusExample() {
  const ticketId = '550e8400-e29b-41d4-a716-446655440001';
  
  const { data, error } = await db.updateTicket(ticketId, {
    status: 'in_progress'
  });
  
  if (error) {
    console.error('Error updating ticket:', error);
  } else {
    console.log('Updated ticket:', data);
  }
  
  return { data, error };
}

// Example 5: Get ticket statistics
async function getTicketStatsExample() {
  const { data, error } = await db.getTicketStats();
  
  if (error) {
    console.error('Error fetching stats:', error);
  } else {
    console.log('Ticket statistics:', data);
    console.log(`Total tickets: ${data.total}`);
    console.log('By status:', data.by_status);
    console.log('By category:', data.by_category);
    console.log('By priority:', data.by_priority);
  }
  
  return { data, error };
}

// ==================== RESOLUTION QUERIES ====================

// Example 6: Create a resolution for a ticket
async function createResolutionExample() {
  const resolutionData = {
    ticket_id: '550e8400-e29b-41d4-a716-446655440001',
    action_taken: 'Restarted VPN service and provided new configuration file',
    resolved_by_agent: 'ai_assistant',
    resolution_time: 15 // minutes
  };

  const { data, error } = await db.createResolution(resolutionData);
  
  if (error) {
    console.error('Error creating resolution:', error);
  } else {
    console.log('Created resolution:', data);
  }
  
  return { data, error };
}

// Example 7: Get resolutions for a specific ticket
async function getTicketResolutionsExample() {
  const ticketId = '550e8400-e29b-41d4-a716-446655440001';
  
  const { data, error } = await db.getResolutions({ 
    ticket_id: ticketId 
  });
  
  if (error) {
    console.error('Error fetching resolutions:', error);
  } else {
    console.log(`Found ${data.length} resolutions for ticket:`, data);
  }
  
  return { data, error };
}

// Example 8: Get resolutions by agent
async function getAgentResolutionsExample() {
  const { data, error } = await db.getResolutions({ 
    resolved_by_agent: 'ai_assistant' 
  });
  
  if (error) {
    console.error('Error fetching agent resolutions:', error);
  } else {
    console.log(`AI Assistant resolved ${data.length} tickets:`, data);
  }
  
  return { data, error };
}

// ==================== COMPLEX QUERIES ====================

// Example 9: Get tickets with their resolutions (join operation)
async function getTicketsWithResolutionsExample() {
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  
  const { data, error } = await db.getTicketsWithResolutions({ 
    user_id: userId 
  });
  
  if (error) {
    console.error('Error fetching tickets with resolutions:', error);
  } else {
    console.log('Tickets with resolutions:', data);
    data.forEach(ticket => {
      console.log(`Ticket: ${ticket.issue_text}`);
      console.log(`Resolutions: ${ticket.resolutions?.length || 0}`);
      ticket.resolutions?.forEach(resolution => {
        console.log(`  - ${resolution.action_taken} (${resolution.resolution_time} min)`);
      });
    });
  }
  
  return { data, error };
}

// Example 10: Advanced filtering with pagination
async function getPaginatedTicketsExample() {
  const { data, error } = await db.getTickets({ 
    status: 'open',
    priority: ['high', 'critical'] // This would need modification in the helper function
  });
  
  if (error) {
    console.error('Error fetching paginated tickets:', error);
  } else {
    // Manual pagination
    const page = 1;
    const limit = 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedData = data.slice(startIndex, endIndex);
    
    console.log(`Page ${page} of ${Math.ceil(data.length / limit)}:`, paginatedData);
    console.log(`Total records: ${data.length}`);
  }
  
  return { data, error };
}

// ==================== RAW SQL EXAMPLES ====================

// Example 11: Raw SQL query for complex filtering
async function rawSQLQueryExample() {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      resolutions (
        id,
        action_taken,
        resolved_by_agent,
        resolution_time
      )
    `)
    .eq('status', 'open')
    .in('priority', ['high', 'critical'])
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error with raw SQL query:', error);
  } else {
    console.log('High priority open tickets:', data);
  }
  
  return { data, error };
}

// Example 12: Aggregate query for dashboard
async function aggregateQueryExample() {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      status,
      category,
      priority,
      created_at
    `)
    .gte('created_at', '2024-01-01')
    .lte('created_at', '2024-12-31');

  if (error) {
    console.error('Error with aggregate query:', error);
  } else {
    // Manual aggregation
    const monthlyStats = {};
    data.forEach(ticket => {
      const month = new Date(ticket.created_at).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyStats[month]) {
        monthlyStats[month] = { total: 0, by_status: {} };
      }
      monthlyStats[month].total++;
      monthlyStats[month].by_status[ticket.status] = 
        (monthlyStats[month].by_status[ticket.status] || 0) + 1;
    });
    
    console.log('Monthly statistics:', monthlyStats);
  }
  
  return { data, error };
}

// ==================== EXPORT ALL EXAMPLES ====================

module.exports = {
  createTicketExample,
  getUserTicketsExample,
  getFilteredTicketsExample,
  updateTicketStatusExample,
  getTicketStatsExample,
  createResolutionExample,
  getTicketResolutionsExample,
  getAgentResolutionsExample,
  getTicketsWithResolutionsExample,
  getPaginatedTicketsExample,
  rawSQLQueryExample,
  aggregateQueryExample
};

// ==================== USAGE EXAMPLE ====================

// How to use these examples:
/*
const examples = require('./query-examples');

// Create a ticket
examples.createTicketExample();

// Get user tickets
examples.getUserTicketsExample();

// Get ticket statistics
examples.getTicketStatsExample();

// Create a resolution
examples.createResolutionExample();

// Get tickets with resolutions
examples.getTicketsWithResolutionsExample();
*/
