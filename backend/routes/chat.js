const express = require('express');
const ChatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const chatController = new ChatController();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// POST /api/chat/send - Send message and get AI response
router.post('/send', (req, res) => {
  chatController.sendMessage(req, res);
});

// GET /api/chat/:ticketId - Get chat history for ticket
router.get('/:ticketId', (req, res) => {
  chatController.getChatHistory(req, res);
});

// POST /api/chat/:ticketId/resolve - Generate AI resolution plan
router.post('/:ticketId/resolve', (req, res) => {
  chatController.generateResolution(req, res);
});

// POST /api/chat/automation - Execute automation script
router.post('/automation', (req, res) => {
  chatController.executeAutomation(req, res);
});

// POST /api/chat/:ticketId/verify - Verify resolution
router.post('/:ticketId/verify', (req, res) => {
  chatController.verifyResolution(req, res);
});

module.exports = router;
