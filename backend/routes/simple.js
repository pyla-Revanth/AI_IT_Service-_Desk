const express = require('express');
const SimpleTicketController = require('../controllers/simpleTicketController');
const ResolutionController = require('../controllers/resolutionController');

const router = express.Router();
const ticketController = new SimpleTicketController();
const resolutionController = new ResolutionController();

// Ticket routes
router.get('/tickets', (req, res) => ticketController.getTickets(req, res));
router.get('/tickets/stats', (req, res) => ticketController.getTicketStats(req, res));
router.get('/tickets/:id', (req, res) => ticketController.getTicket(req, res));
router.post('/tickets', (req, res) => ticketController.createTicket(req, res));
router.put('/tickets/:id', (req, res) => ticketController.updateTicket(req, res));
router.delete('/tickets/:id', (req, res) => ticketController.deleteTicket(req, res));

// Resolution routes
router.get('/resolutions', (req, res) => resolutionController.getResolutions(req, res));
router.get('/resolutions/stats', (req, res) => resolutionController.getResolutionStats(req, res));
router.get('/resolutions/:id', (req, res) => resolutionController.getResolution(req, res));
router.post('/resolutions', (req, res) => resolutionController.createResolution(req, res));
router.put('/resolutions/:id', (req, res) => resolutionController.updateResolution(req, res));

// Combined routes
router.get('/tickets-with-resolutions', (req, res) => resolutionController.getTicketsWithResolutions(req, res));

module.exports = router;
