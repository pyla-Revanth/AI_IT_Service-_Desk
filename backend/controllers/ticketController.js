const db = require('../database/client');
const TriageAgent = require('../../agents/triage-agent');
const ResolutionAgent = require('../../agents/resolution-agent');

class TicketController {
  constructor() {
    this.triageAgent = new TriageAgent();
    this.resolutionAgent = new ResolutionAgent();
  }

  async createTicket(req, res) {
    try {
      const { title, description, user_id, user_email, category, priority } = req.body;

      // Validate required fields
      if (!title || !description || !user_id || !user_email) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: title, description, user_id, user_email'
        });
      }

      // AI Classification
      const classificationResult = await this.triageAgent.classifyTicket(title, description, {
        user_id,
        user_email
      });

      const ticketData = {
        title,
        description,
        category: category || classificationResult.classification.category,
        priority: priority || classificationResult.classification.priority,
        urgency_score: classificationResult.classification.urgency_score,
        impact_level: classificationResult.classification.impact_level,
        status: 'open',
        user_id,
        user_email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ai_classification: classificationResult.classification,
        tags: classificationResult.classification.tags
      };

      const { data, error } = await db.createTicket(ticketData);

      if (error) {
        console.error('Ticket creation error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to create ticket'
        });
      }

      // Get automation suggestions
      const automationSuggestions = await this.triageAgent.suggestAutomation(data);

      res.status(201).json({
        success: true,
        ticket: data,
        automation_suggestions: automationSuggestions
      });

    } catch (error) {
      console.error('Ticket controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getTickets(req, res) {
    try {
      const { 
        status, 
        user_id, 
        priority, 
        category,
        page = 1, 
        limit = 50 
      } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (user_id) filters.user_id = user_id;
      if (priority) filters.priority = priority;
      if (category) filters.category = category;

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

  async getTicket(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await db.getTickets({ id });

      if (error) {
        console.error('Ticket fetch error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch ticket'
        });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      res.json({
        success: true,
        ticket: data[0]
      });

    } catch (error) {
      console.error('Ticket controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async updateTicket(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Add updated timestamp
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

  async assignTicket(req, res) {
    try {
      const { id } = req.params;
      const { assigned_to, assigned_by } = req.body;

      const updates = {
        assigned_to,
        assigned_at: new Date().toISOString(),
        status: 'in_progress',
        updated_at: new Date().toISOString()
      };

      const { data, error } = await db.updateTicket(id, updates);

      if (error) {
        console.error('Ticket assignment error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to assign ticket'
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

  async resolveTicket(req, res) {
    try {
      const { id } = req.params;
      const { resolution, resolved_by } = req.body;

      const updates = {
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        resolution: {
          method: resolution.method || 'manual',
          steps_taken: resolution.steps_taken || [],
          resolution_time: resolution.resolution_time || 0,
          resolved_by,
          notes: resolution.notes || ''
        }
      };

      const { data, error } = await db.updateTicket(id, updates);

      if (error) {
        console.error('Ticket resolution error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to resolve ticket'
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

  async getTicketStats(req, res) {
    try {
      const { user_id, role } = req.query;

      let filters = {};
      if (user_id && role !== 'admin') {
        filters.user_id = user_id;
      }

      const { data: tickets, error } = await db.getTickets(filters);

      if (error) {
        console.error('Stats fetch error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch statistics'
        });
      }

      // Calculate statistics
      const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        in_progress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        closed: tickets.filter(t => t.status === 'closed').length,
        by_priority: {
          low: tickets.filter(t => t.priority === 'low').length,
          medium: tickets.filter(t => t.priority === 'medium').length,
          high: tickets.filter(t => t.priority === 'high').length,
          critical: tickets.filter(t => t.priority === 'critical').length
        },
        by_category: {
          software: tickets.filter(t => t.category === 'software').length,
          hardware: tickets.filter(t => t.category === 'hardware').length,
          network: tickets.filter(t => t.category === 'network').length,
          account: tickets.filter(t => t.category === 'account').length,
          security: tickets.filter(t => t.category === 'security').length,
          other: tickets.filter(t => t.category === 'other').length
        },
        avg_resolution_time: this.calculateAvgResolutionTime(tickets),
        ai_classified: tickets.filter(t => t.ai_classification).length
      };

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Stats controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  calculateAvgResolutionTime(tickets) {
    const resolvedTickets = tickets.filter(t => t.resolved_at);
    if (resolvedTickets.length === 0) return 0;

    const totalTime = resolvedTickets.reduce((sum, ticket) => {
      const created = new Date(ticket.created_at);
      const resolved = new Date(ticket.resolved_at);
      return sum + (resolved - created);
    }, 0);

    return Math.round(totalTime / resolvedTickets.length / (1000 * 60)); // minutes
  }
}

module.exports = TicketController;
