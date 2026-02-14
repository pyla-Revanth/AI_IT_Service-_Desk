const express = require('express');
const TicketController = require('../controllers/ticketController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const ticketController = new TicketController();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /api/tickets - Get all tickets with optional filtering
router.get('/', (req, res) => {
  ticketController.getTickets(req, res);
});

// GET /api/tickets/stats - Get ticket statistics
router.get('/stats', (req, res) => {
  ticketController.getTicketStats(req, res);
});

// GET /api/tickets/:id - Get specific ticket
router.get('/:id', (req, res) => {
  ticketController.getTicket(req, res);
});

// POST /api/tickets - Create new ticket
router.post('/', (req, res) => {
  ticketController.createTicket(req, res);
});

// PUT /api/tickets/:id - Update ticket
router.put('/:id', (req, res) => {
  ticketController.updateTicket(req, res);
});

// POST /api/tickets/:id/assign - Assign ticket to agent
router.post('/:id/assign', (req, res) => {
  ticketController.assignTicket(req, res);
});

// POST /api/tickets/:id/resolve - Resolve ticket
router.post('/:id/resolve', (req, res) => {
  ticketController.resolveTicket(req, res);
});

module.exports = router;
