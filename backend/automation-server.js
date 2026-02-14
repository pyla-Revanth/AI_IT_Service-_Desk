const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const automationRoutes = require('./routes/automation');

const app = express();
const PORT = process.env.AUTOMATION_PORT || 3003;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs (lower for automation)
  message: {
    success: false,
    error: 'Too many automation requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const automationExecutor = require('./automation-executor');
    const pythonCheck = await automationExecutor.checkPythonAvailability();
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'Automation Execution Service',
      environment: process.env.NODE_ENV || 'development',
      python_available: pythonCheck.available,
      python_version: pythonCheck.version
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API routes
app.use('/api', automationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(500).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: error.stack,
      details: error.message 
    })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

const server = app.listen(PORT, () => {
  console.log(`🤖 Automation Execution Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n📋 Available Endpoints:`);
  console.log(`   POST   /api/automation/execute - Execute automation for ticket`);
  console.log(`   GET    /api/automation/logs/:ticket_id - Get automation logs`);
  console.log(`   GET    /api/automation/stats - Get automation statistics`);
  console.log(`   GET    /api/automation/scripts - Get available scripts`);
  console.log(`   POST   /api/automation/test - Test automation system`);
  console.log(`   GET    /api/automation/python/check - Check Python availability`);
  console.log(`   POST   /api/automation/manual - Manual script execution`);
  console.log(`   GET    /api/health - Health check`);
});

module.exports = app;
