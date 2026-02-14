const db = require('../database/supabase-client');

class SimpleTicketController {
  // Create a new ticket
  async createTicket(req, res) {
    try {
      const { user_id, issue_text, category, priority } = req.body;

      // Validate required fields
      if (!user_id || !issue_text || !category || !priority) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: user_id, issue_text, category, priority'
        });
      }

      const ticketData = {
        user_id,
        issue_text,
        category,
        priority,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await db.createTicket(ticketData);

      if (error) {
        console.error('Ticket creation error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to create ticket'
        });
      }

      res.status(201).json({
        success: true,
        ticket: data
      });

    } catch (error) {
      console.error('Ticket controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get all tickets with optional filtering
  async getTickets(req, res) {
    try {
      const { 
        user_id, 
        status, 
        category, 
        priority,
        page = 1, 
        limit = 50 
      } = req.query;

      const filters = {};
      if (user_id) filters.user_id = user_id;
      if (status) filters.status = status;
      if (category) filters.category = category;
      if (priority) filters.priority = priority;

      const { data, error } = await db.getTickets(filters);

      if (error) {
        console.error('Tickets fetch error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch tickets'
        });
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedData = data.slice(startIndex, endIndex);

      res.json({
        success: true,
        tickets: paginatedData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: data.length,
          pages: Math.ceil(data.length / limit)
        }
      });

    } catch (error) {
      console.error('Tickets controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get specific ticket by ID
  async getTicket(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await db.getTicketById(id);

      if (error) {
        console.error('Ticket fetch error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch ticket'
        });
      }

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      res.json({
        success: true,
        ticket: data
      });

    } catch (error) {
      console.error('Ticket controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Update ticket status
  async updateTicket(req, res) {
    try {
      const { id } = req.params;
      const { status, category, priority } = req.body;

      const updates = {};
      if (status) updates.status = status;
      if (category) updates.category = category;
      if (priority) updates.priority = priority;
      updates.updated_at = new Date().toISOString();

      const { data, error } = await db.updateTicket(id, updates);

      if (error) {
        console.error('Ticket update error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to update ticket'
        });
      }

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      res.json({
        success: true,
        ticket: data
      });

    } catch (error) {
      console.error('Ticket controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Delete ticket
  async deleteTicket(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await db.deleteTicket(id);

      if (error) {
        console.error('Ticket deletion error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to delete ticket'
        });
      }

      res.json({
        success: true,
        message: 'Ticket deleted successfully'
      });

    } catch (error) {
      console.error('Ticket controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get ticket statistics
  async getTicketStats(req, res) {
    try {
      const { data, error } = await db.getTicketStats();

      if (error) {
        console.error('Stats fetch error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch statistics'
        });
      }

      res.json({
        success: true,
        stats: data
      });

    } catch (error) {
      console.error('Stats controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = SimpleTicketController;
