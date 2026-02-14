const express = require('express');
const db = require('./supabase-db');
const aiClassifier = require('./ai-classifier');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Error handling middleware
const handleAsyncError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation middleware
const validateTicket = (req, res, next) => {
  const { user_id, issue_text, category, priority } = req.body;
  
  if (!user_id || !issue_text || !category || !priority) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: user_id, issue_text, category, priority'
    });
  }

  const validCategories = ['software', 'hardware', 'network', 'account', 'security', 'other'];
  const validPriorities = ['low', 'medium', 'high', 'critical'];

  if (!validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
    });
  }

  if (!validPriorities.includes(priority)) {
    return res.status(400).json({
      success: false,
      error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
    });
  }

  next();
};

// POST /tickets → Create ticket
router.post('/tickets', validateTicket, handleAsyncError(async (req, res) => {
  try {
    const { user_id, issue_text, category, priority } = req.body;

    const ticketData = {
      id: uuidv4(),
      user_id,
      issue_text,
      category,
      priority,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const ticket = await db.createTicket(ticketData);

    res.status(201).json({
      success: true,
      data: ticket,
      message: 'Ticket created successfully'
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create ticket',
      details: error.message
    });
  }
}));

// GET /tickets → List tickets
router.get('/tickets', handleAsyncError(async (req, res) => {
  try {
    const {
      user_id,
      status,
      category,
      priority,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {};
    if (user_id) filters.user_id = user_id;
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (priority) filters.priority = priority;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    filters.offset = offset;
    filters.limit = parseInt(limit);

    const tickets = await db.getTickets(filters);

    // Get total count for pagination
    const allTickets = await db.getTickets({ user_id, status, category, priority });
    const total = allTickets.length;

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('List tickets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tickets',
      details: error.message
    });
  }
}));

// POST /tickets/classify → AI classify
router.post('/tickets/classify', handleAsyncError(async (req, res) => {
  try {
    const { issue_text, category, priority } = req.body;

    if (!issue_text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: issue_text'
      });
    }

    // Get AI classification
    const classification = await aiClassifier.classifyTicket(issue_text, category, priority);

    // Check if automation should be suggested
    const shouldAutomate = await aiClassifier.shouldAutomate(issue_text, classification.category);

    res.json({
      success: true,
      data: {
        ...classification,
        automation_suggested: shouldAutomate,
        classification_timestamp: new Date().toISOString()
      },
      message: 'Ticket classified successfully'
    });
  } catch (error) {
    console.error('AI classification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to classify ticket',
      details: error.message
    });
  }
}));

// POST /tickets/resolve → Resolve ticket
router.post('/tickets/resolve', handleAsyncError(async (req, res) => {
  try {
    const { ticket_id, action_taken, resolved_by_agent, resolution_time } = req.body;

    if (!ticket_id || !action_taken || !resolved_by_agent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: ticket_id, action_taken, resolved_by_agent'
      });
    }

    // Check if ticket exists
    const ticket = await db.getTicketById(ticket_id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    // Create resolution record
    const resolutionData = {
      id: uuidv4(),
      ticket_id,
      action_taken,
      resolved_by_agent,
      resolution_time: resolution_time || 30,
      created_at: new Date().toISOString()
    };

    const resolution = await db.createResolution(resolutionData);

    // Update ticket status to resolved
    await db.updateTicket(ticket_id, {
      status: 'resolved',
      resolved_at: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      data: {
        resolution,
        ticket: { ...ticket, status: 'resolved' }
      },
      message: 'Ticket resolved successfully'
    });
  } catch (error) {
    console.error('Resolve ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve ticket',
      details: error.message
    });
  }
}));

// GET /tickets/:id → Get specific ticket
router.get('/tickets/:id', handleAsyncError(async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await db.getTicketById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket',
      details: error.message
    });
  }
}));

// PUT /tickets/:id → Update ticket
router.put('/tickets/:id', handleAsyncError(async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.created_at;
    delete updates.user_id;

    const ticket = await db.updateTicket(id, updates);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket updated successfully'
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ticket',
      details: error.message
    });
  }
}));

// DELETE /tickets/:id → Delete ticket
router.delete('/tickets/:id', handleAsyncError(async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await db.getTicketById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    // Delete ticket (cascade will handle resolutions)
    await supabase.from('tickets').delete().eq('id', id);

    res.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete ticket',
      details: error.message
    });
  }
}));

// GET /tickets/stats → Get ticket statistics
router.get('/tickets/stats', handleAsyncError(async (req, res) => {
  try {
    const stats = await db.getTicketStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
}));

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Unhandled error in ticket API:', error);
  
  if (error.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      details: 'A ticket with this identifier already exists'
    });
  }

  if (error.code === '23503') { // Foreign key constraint violation
    return res.status(400).json({
      success: false,
      error: 'Invalid reference',
      details: 'Referenced resource does not exist'
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;
