const express = require('express');
const automationExecutor = require('../automation-executor');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Error handling middleware
const handleAsyncError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// POST /api/automation/execute → Execute automation for a ticket
router.post('/execute', handleAsyncError(async (req, res) => {
  try {
    const { ticket_id, ticket, classification } = req.body;

    if (!ticket_id || !ticket || !classification) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: ticket_id, ticket, classification'
      });
    }

    if (!classification.automation_possible) {
      return res.status(400).json({
        success: false,
        error: 'Automation not possible for this ticket category'
      });
    }

    console.log(`🔧 Executing automation for ticket ${ticket_id}`);

    const result = await automationExecutor.executeAutomation(ticket, classification);

    res.json({
      success: true,
      data: {
        automation_id: result.automation_id || uuidv4(),
        ticket_id: ticket_id,
        script_used: result.script,
        execution_time: result.execution_time,
        success: result.success,
        output: result.output,
        parsed_output: result.parsed_output,
        timestamp: new Date().toISOString()
      },
      message: result.success ? 'Automation completed successfully' : 'Automation failed'
    });

  } catch (error) {
    console.error('Automation execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute automation',
      details: error.message
    });
  }
}));

// GET /api/automation/logs/:ticket_id → Get automation logs for a ticket
router.get('/logs/:ticket_id', handleAsyncError(async (req, res) => {
  try {
    const { ticket_id } = req.params;

    if (!ticket_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing ticket_id parameter'
      });
    }

    const logs = await automationExecutor.getAutomationLogs(ticket_id);

    res.json({
      success: true,
      data: logs,
      message: `Found ${logs.length} automation logs for ticket ${ticket_id}`
    });

  } catch (error) {
    console.error('Get automation logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch automation logs',
      details: error.message
    });
  }
}));

// GET /api/automation/stats → Get automation statistics
router.get('/stats', handleAsyncError(async (req, res) => {
  try {
    const stats = await automationExecutor.getAutomationStats();

    if (!stats) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch automation statistics'
      });
    }

    res.json({
      success: true,
      data: stats,
      message: 'Automation statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Get automation stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch automation statistics',
      details: error.message
    });
  }
}));

// GET /api/automation/scripts → Get available automation scripts
router.get('/scripts', handleAsyncError(async (req, res) => {
  try {
    const scripts = automationExecutor.getAvailableScripts();

    res.json({
      success: true,
      data: scripts,
      message: 'Available automation scripts retrieved successfully'
    });

  } catch (error) {
    console.error('Get scripts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch automation scripts',
      details: error.message
    });
  }
}));

// POST /api/automation/test → Test automation system
router.post('/test', handleAsyncError(async (req, res) => {
  try {
    console.log('🧪 Running automation test...');

    const result = await automationExecutor.testAutomation();

    res.json({
      success: true,
      data: result,
      message: 'Automation test completed'
    });

  } catch (error) {
    console.error('Automation test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run automation test',
      details: error.message
    });
  }
}));

// GET /api/automation/python/check → Check Python availability
router.get('/python/check', handleAsyncError(async (req, res) => {
  try {
    const pythonCheck = await automationExecutor.checkPythonAvailability();

    res.json({
      success: true,
      data: pythonCheck,
      message: pythonCheck.available ? 'Python is available' : 'Python is not available'
    });

  } catch (error) {
    console.error('Python check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check Python availability',
      details: error.message
    });
  }
}));

// POST /api/automation/manual → Manual script execution
router.post('/manual', handleAsyncError(async (req, res) => {
  try {
    const { script_name, parameters, ticket_id } = req.body;

    if (!script_name || !parameters) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: script_name, parameters'
      });
    }

    console.log(`🔧 Manual execution of script: ${script_name}`);

    // Create a mock ticket for manual execution
    const mockTicket = {
      id: ticket_id || uuidv4(),
      user_id: 'manual-execution-user',
      issue_text: `Manual execution of ${script_name}`,
      category: 'Manual Execution'
    };

    const mockClassification = {
      category: 'Manual Execution',
      priority: 'medium',
      automation_possible: true
    };

    const scriptConfig = {
      script: script_name,
      description: `Manual execution of ${script_name}`,
      parameters
    };

    const result = await automationExecutor.executePythonScript(scriptConfig, mockTicket);

    // Create automation log
    const automationLog = {
      id: uuidv4(),
      ticket_id: mockTicket.id,
      script_name: script_name,
      status: result.success ? 'completed' : 'failed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      output: result.output,
      error: result.error,
      success: result.success,
      execution_type: 'manual'
    };

    await automationExecutor.createAutomationLog(automationLog);

    res.json({
      success: true,
      data: {
        execution_id: uuidv4(),
        script_name,
        parameters,
        result,
        timestamp: new Date().toISOString()
      },
      message: result.success ? 'Manual script executed successfully' : 'Manual script execution failed'
    });

  } catch (error) {
    console.error('Manual script execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute manual script',
      details: error.message
    });
  }
}));

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Unhandled error in automation API:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;
