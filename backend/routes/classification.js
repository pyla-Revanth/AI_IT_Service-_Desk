const express = require('express');
const aiClassifier = require('../ai-ticket-classifier');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Error handling middleware
const handleAsyncError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// POST /api/classify → Classify single ticket
router.post('/classify', handleAsyncError(async (req, res) => {
  try {
    const { ticket_text, user_id } = req.body;

    if (!ticket_text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: ticket_text'
      });
    }

    console.log('🎫 Processing classification request:', ticket_text.substring(0, 100) + '...');

    const classification = await aiClassifier.classifyTicket(ticket_text, user_id);

    res.json({
      success: true,
      data: classification,
      message: 'Ticket classified successfully'
    });

  } catch (error) {
    console.error('Classification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to classify ticket',
      details: error.message
    });
  }
}));

// POST /api/classify/batch → Classify multiple tickets
router.post('/classify/batch', handleAsyncError(async (req, res) => {
  try {
    const { tickets } = req.body;

    if (!tickets || !Array.isArray(tickets)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: tickets (must be array)'
      });
    }

    if (tickets.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tickets array cannot be empty'
      });
    }

    if (tickets.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 tickets allowed per batch'
      });
    }

    console.log(`🔄 Processing batch classification for ${tickets.length} tickets`);

    const results = await aiClassifier.batchClassify(tickets);

    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: tickets.length,
          successful,
          failed,
          success_rate: (successful / tickets.length * 100).toFixed(2) + '%'
        }
      },
      message: `Batch classification complete: ${successful}/${tickets.length} successful`
    });

  } catch (error) {
    console.error('Batch classification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to classify batch',
      details: error.message
    });
  }
}));

// GET /api/classify/stats → Get classification statistics
router.get('/classify/stats', handleAsyncError(async (req, res) => {
  try {
    const { user_id } = req.query;

    const stats = await aiClassifier.getClassificationStats(user_id);

    if (!stats) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }

    res.json({
      success: true,
      data: stats,
      message: 'Statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
}));

// POST /api/classify/test → Test classification with sample tickets
router.post('/classify/test', handleAsyncError(async (req, res) => {
  try {
    console.log('🧪 Running classification tests...');

    await aiClassifier.testClassification();

    res.json({
      success: true,
      message: 'Classification tests completed - check console for results'
    });

  } catch (error) {
    console.error('Test classification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run classification tests',
      details: error.message
    });
  }
}));

// GET /api/classify/categories → Get available categories
router.get('/classify/categories', (req, res) => {
  try {
    const categories = [
      {
        name: 'Password Reset',
        description: 'User needs password reset, forgot password, locked account',
        automation_possible: true,
        typical_priority: 'high'
      },
      {
        name: 'VPN Issue',
        description: 'Cannot connect to VPN, VPN slow, VPN configuration',
        automation_possible: true,
        typical_priority: 'high'
      },
      {
        name: 'Software Install',
        description: 'Need to install software, software not working, update issues',
        automation_possible: false,
        typical_priority: 'medium'
      },
      {
        name: 'Device Slow',
        description: 'Computer running slow, performance issues, lagging',
        automation_possible: true,
        typical_priority: 'medium'
      },
      {
        name: 'Account Access',
        description: 'Cannot login, account locked, permission issues',
        automation_possible: true,
        typical_priority: 'high'
      }
    ];

    res.json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully'
    });

  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      details: error.message
    });
  }
});

// POST /api/classify/validate → Validate classification result
router.post('/classify/validate', (req, res) => {
  try {
    const { classification } = req.body;

    if (!classification) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: classification'
      });
    }

    const validCategories = ['Password Reset', 'VPN Issue', 'Software Install', 'Device Slow', 'Account Access'];
    const validPriorities = ['low', 'medium', 'high', 'critical'];

    const validation = {
      is_valid: true,
      errors: []
    };

    // Validate category
    if (!validCategories.includes(classification.category)) {
      validation.is_valid = false;
      validation.errors.push(`Invalid category: ${classification.category}. Must be one of: ${validCategories.join(', ')}`);
    }

    // Validate priority
    if (!validPriorities.includes(classification.priority)) {
      validation.is_valid = false;
      validation.errors.push(`Invalid priority: ${classification.priority}. Must be one of: ${validPriorities.join(', ')}`);
    }

    // Validate confidence
    if (typeof classification.confidence !== 'number' || classification.confidence < 0 || classification.confidence > 1) {
      validation.is_valid = false;
      validation.errors.push('Confidence must be a number between 0 and 1');
    }

    // Validate automation_possible
    if (typeof classification.automation_possible !== 'boolean') {
      validation.is_valid = false;
      validation.errors.push('automation_possible must be a boolean');
    }

    res.json({
      success: true,
      data: validation,
      message: validation.is_valid ? 'Classification is valid' : 'Classification has validation errors'
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate classification',
      details: error.message
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Unhandled error in classification API:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;
