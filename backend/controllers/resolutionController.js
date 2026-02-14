const db = require('../database/supabase-client');

class ResolutionController {
  // Create a new resolution
  async createResolution(req, res) {
    try {
      const { ticket_id, action_taken, resolved_by_agent, resolution_time } = req.body;

      // Validate required fields
      if (!ticket_id || !action_taken || !resolved_by_agent || !resolution_time) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: ticket_id, action_taken, resolved_by_agent, resolution_time'
        });
      }

      const resolutionData = {
        ticket_id,
        action_taken,
        resolved_by_agent,
        resolution_time: parseInt(resolution_time),
        created_at: new Date().toISOString()
      };

      const { data, error } = await db.createResolution(resolutionData);

      if (error) {
        console.error('Resolution creation error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to create resolution'
        });
      }

      // Update ticket status to resolved
      await db.updateTicket(ticket_id, { status: 'resolved' });

      res.status(201).json({
        success: true,
        resolution: data
      });

    } catch (error) {
      console.error('Resolution controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get all resolutions with optional filtering
  async getResolutions(req, res) {
    try {
      const { 
        ticket_id, 
        resolved_by_agent,
        page = 1, 
        limit = 50 
      } = req.query;

      const filters = {};
      if (ticket_id) filters.ticket_id = ticket_id;
      if (resolved_by_agent) filters.resolved_by_agent = resolved_by_agent;

      const { data, error } = await db.getResolutions(filters);

      if (error) {
        console.error('Resolutions fetch error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch resolutions'
        });
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedData = data.slice(startIndex, endIndex);

      res.json({
        success: true,
        resolutions: paginatedData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: data.length,
          pages: Math.ceil(data.length / limit)
        }
      });

    } catch (error) {
      console.error('Resolutions controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get specific resolution by ID
  async getResolution(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await db.getResolutionById(id);

      if (error) {
        console.error('Resolution fetch error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch resolution'
        });
      }

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Resolution not found'
        });
      }

      res.json({
        success: true,
        resolution: data
      });

    } catch (error) {
      console.error('Resolution controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Update resolution
  async updateResolution(req, res) {
    try {
      const { id } = req.params;
      const { action_taken, resolved_by_agent, resolution_time } = req.body;

      const updates = {};
      if (action_taken) updates.action_taken = action_taken;
      if (resolved_by_agent) updates.resolved_by_agent = resolved_by_agent;
      if (resolution_time) updates.resolution_time = parseInt(resolution_time);

      const { data, error } = await db.updateResolution(id, updates);

      if (error) {
        console.error('Resolution update error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to update resolution'
        });
      }

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Resolution not found'
        });
      }

      res.json({
        success: true,
        resolution: data
      });

    } catch (error) {
      console.error('Resolution controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get tickets with their resolutions
  async getTicketsWithResolutions(req, res) {
    try {
      const { user_id } = req.query;

      const filters = {};
      if (user_id) filters.user_id = user_id;

      const { data, error } = await db.getTicketsWithResolutions(filters);

      if (error) {
        console.error('Tickets with resolutions fetch error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch tickets with resolutions'
        });
      }

      res.json({
        success: true,
        tickets: data
      });

    } catch (error) {
      console.error('Tickets with resolutions controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get resolution statistics
  async getResolutionStats(req, res) {
    try {
      const { data: resolutions, error } = await db.getResolutions();

      if (error) {
        console.error('Resolution stats fetch error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch resolution statistics'
        });
      }

      // Calculate statistics
      const stats = {
        total: resolutions?.length || 0,
        avg_resolution_time: 0,
        by_agent: {},
        resolutions_this_week: 0,
        resolutions_this_month: 0
      };

      if (resolutions && resolutions.length > 0) {
        // Calculate average resolution time
        const totalTime = resolutions.reduce((sum, res) => sum + res.resolution_time, 0);
        stats.avg_resolution_time = Math.round(totalTime / resolutions.length);

        // Count by agent
        resolutions.forEach(res => {
          stats.by_agent[res.resolved_by_agent] = (stats.by_agent[res.resolved_by_agent] || 0) + 1;
        });

        // Count recent resolutions
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        resolutions.forEach(res => {
          const resDate = new Date(res.created_at);
          if (resDate >= weekAgo) stats.resolutions_this_week++;
          if (resDate >= monthAgo) stats.resolutions_this_month++;
        });
      }

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Resolution stats controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = ResolutionController;
