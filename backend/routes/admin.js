const express = require('express');
const db = require('../supabase-db');

const router = express.Router();

// Error handling middleware
const handleAsyncError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// GET /api/admin/stats → Get dashboard statistics
router.get('/stats', handleAsyncError(async (req, res) => {
  try {
    const { dateRange = '7d', category = 'all' } = req.query;

    console.log(`📊 Fetching admin stats for range: ${dateRange}, category: ${category}`);

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (dateRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Fetch tickets with filters
    let ticketsQuery = db.supabase
      .from('tickets')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (category !== 'all') {
      ticketsQuery = ticketsQuery.eq('category', category);
    }

    const { data: tickets, error: ticketsError } = await ticketsQuery;
    if (ticketsError) throw ticketsError;

    // Calculate statistics
    const totalTickets = tickets?.length || 0;
    const autoResolvedTickets = tickets?.filter(t => 
      t.resolution && t.resolution.resolved_by_agent === 'automation_system'
    ).length || 0;
    const escalatedTickets = tickets?.filter(t => 
      t.status === 'escalated'
    ).length || 0;

    // Calculate average resolution time
    const resolvedTickets = tickets?.filter(t => t.resolution_time) || [];
    const avgResolutionTime = resolvedTickets.length > 0 
      ? resolvedTickets.reduce((sum, t) => sum + t.resolution_time, 0) / resolvedTickets.length
      : 0;

    // Tickets by category
    const categoryStats = {};
    tickets?.forEach(ticket => {
      categoryStats[ticket.category] = (categoryStats[ticket.category] || 0) + 1;
    });

    const ticketsByCategory = Object.entries(categoryStats).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));

    // Tickets by priority
    const priorityStats = {};
    tickets?.forEach(ticket => {
      priorityStats[ticket.priority] = (priorityStats[ticket.priority] || 0) + 1;
    });

    const ticketsByPriority = [
      { priority: 'Critical', count: priorityStats.critical || 0 },
      { priority: 'High', count: priorityStats.high || 0 },
      { priority: 'Medium', count: priorityStats.medium || 0 },
      { priority: 'Low', count: priorityStats.low || 0 }
    ];

    // Resolution trend (last 7 days)
    const resolutionTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const dayTickets = tickets?.filter(t => {
        const ticketDate = new Date(t.created_at);
        return ticketDate >= date && ticketDate < nextDate;
      }) || [];

      const resolved = dayTickets.filter(t => t.status === 'resolved').length;
      const escalated = dayTickets.filter(t => t.status === 'escalated').length;

      resolutionTrend.push({
        date: date.toLocaleDateString(),
        resolved,
        escalated
      });
    }
    resolutionTrend.reverse(); // Show oldest first

    // Recent activity
    const recentActivity = tickets?.slice(0, 20).map(ticket => ({
      id: ticket.id,
      title: ticket.issue_text,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      resolution_time: ticket.resolution_time,
      user_email: ticket.user_email,
      created_at: ticket.created_at
    })) || [];

    const stats = {
      totalTickets,
      autoResolvedTickets,
      escalatedTickets,
      avgResolutionTime,
      successRate: totalTickets > 0 ? ((resolvedTickets.length / totalTickets) * 100) : 0,
      ticketsByCategory,
      ticketsByPriority,
      resolutionTrend,
      recentActivity
    };

    res.json({
      success: true,
      data: stats,
      message: 'Statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
}));

// GET /api/admin/tickets → Get tickets for admin dashboard
router.get('/tickets', handleAsyncError(async (req, res) => {
  try {
    const { dateRange = '7d', category = 'all', page = 1, limit = 50 } = req.query;

    console.log(`📋 Fetching admin tickets for range: ${dateRange}, category: ${category}`);

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (dateRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Fetch tickets with filters
    let ticketsQuery = db.supabase
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
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (category !== 'all') {
      ticketsQuery = ticketsQuery.eq('category', category);
    }

    const { data: tickets, error: ticketsError } = await ticketsQuery;
    if (ticketsError) throw ticketsError;

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedTickets = tickets?.slice(offset, offset + parseInt(limit)) || [];

    res.json({
      success: true,
      data: paginatedTickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: tickets?.length || 0,
        pages: Math.ceil((tickets?.length || 0) / parseInt(limit))
      },
      message: `Retrieved ${paginatedTickets.length} tickets`
    });

  } catch (error) {
    console.error('Admin tickets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tickets',
      details: error.message
    });
  }
}));

// GET /api/admin/performance → Get performance metrics
router.get('/performance', handleAsyncError(async (req, res) => {
  try {
    const { days = 30 } = req.query;

    console.log(`📈 Fetching performance metrics for last ${days} days`);

    // Fetch automation logs for performance analysis
    const { data: automationLogs, error: logsError } = await db.supabase
      .from('automation_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (logsError) throw logsError;

    // Calculate performance metrics
    const totalAutomations = automationLogs?.length || 0;
    const successfulAutomations = automationLogs?.filter(log => log.success === true).length || 0;
    const failedAutomations = automationLogs?.filter(log => log.success === false).length || 0;
    const successRate = totalAutomations > 0 ? (successfulAutomations / totalAutomations) * 100 : 0;

    // Calculate average execution time
    const executionTimes = automationLogs?.filter(log => log.execution_time).map(log => log.execution_time) || [];
    const avgExecutionTime = executionTimes.length > 0 
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length 
      : 0;

    // Performance by script
    const scriptPerformance = {};
    automationLogs?.forEach(log => {
      if (!scriptPerformance[log.script_name]) {
        scriptPerformance[log.script_name] = {
          total: 0,
          successful: 0,
          failed: 0,
          totalTime: 0,
          avgTime: 0
        };
      }
      scriptPerformance[log.script_name].total++;
      scriptPerformance[log.script_name][log.success ? 'successful' : 'failed']++;
      scriptPerformance[log.script_name].totalTime += log.execution_time || 0;
    });

    // Calculate averages for each script
    Object.keys(scriptPerformance).forEach(script => {
      const perf = scriptPerformance[script];
      perf.avgTime = perf.totalTime / perf.total;
      perf.successRate = (perf.successful / perf.total) * 100;
    });

    const performance = {
      totalAutomations,
      successfulAutomations,
      failedAutomations,
      successRate: Math.round(successRate * 100) / 100,
      avgExecutionTime: Math.round(avgExecutionTime * 100) / 100,
      scriptPerformance,
      trend: {
        daily: [], // Could be calculated from database stats table
        weekly: []  // Could be calculated from database stats table
      }
    };

    res.json({
      success: true,
      data: performance,
      message: 'Performance metrics retrieved successfully'
    });

  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance metrics',
      details: error.message
    });
  }
}));

// GET /api/admin/logs → Get system logs
router.get('/logs', handleAsyncError(async (req, res) => {
  try {
    const { level = 'all', limit = 100, page = 1 } = req.query;

    console.log(`📝 Fetching system logs: level=${level}, limit=${limit}`);

    // This would typically query a logs table
    // For now, returning recent automation logs as system logs
    const { data: logs, error } = await db.supabase
      .from('automation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    // Filter by level if specified
    let filteredLogs = logs;
    if (level !== 'all') {
      filteredLogs = logs.filter(log => {
        if (level === 'error') return !log.success;
        if (level === 'success') return log.success;
        return true;
      });
    }

    res.json({
      success: true,
      data: filteredLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredLogs?.length || 0,
        pages: Math.ceil((filteredLogs?.length || 0) / parseInt(limit))
      },
      message: `Retrieved ${filteredLogs?.length || 0} log entries`
    });

  } catch (error) {
    console.error('System logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system logs',
      details: error.message
    });
  }
}));

// POST /api/admin/export → Export dashboard data
router.post('/export', handleAsyncError(async (req, res) => {
  try {
    const { format = 'json', dateRange = '30d', category = 'all' } = req.body;

    console.log(`📤 Exporting data: format=${format}, range=${dateRange}`);

    // Fetch data based on parameters
    const statsResponse = await fetch(`/api/admin/stats?dateRange=${dateRange}&category=${category}`);
    const statsData = await statsResponse.json();

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(statsData.data.recentActivity || []);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=admin-export-${Date.now()}.csv`);
      res.send(csv);
    } else {
      // Return JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=admin-export-${Date.now()}.json`);
      res.json(statsData);
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data',
      details: error.message
    });
  }
}));

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = ['ID', 'Title', 'Category', 'Priority', 'Status', 'Resolution Time', 'Created', 'User Email'];
  const csvRows = [headers.join(',')];

  data.forEach(row => {
    const csvRow = [
      row.id,
      `"${row.title.replace(/"/g, '""')}"`,
      row.category,
      row.priority,
      row.status,
      row.resolution_time || '',
      row.created_at,
      row.user_email
    ];
    csvRows.push(csvRow.join(','));
  });

  return csvRows.join('\n');
}

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Unhandled error in admin API:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;
