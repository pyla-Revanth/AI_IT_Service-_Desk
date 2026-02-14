const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database helper functions
class SupabaseDB {
  // Create a new ticket
  async createTicket(ticketData) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert([ticketData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }

  // Get all tickets with optional filtering
  async getTickets(filters = {}) {
    try {
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.user_id) query = query.eq('user_id', filters.user_id);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.priority) query = query.eq('priority', filters.priority);
      if (filters.limit) query = query.limit(filters.limit);
      if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  }

  // Get ticket by ID
  async getTicketById(id) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }
  }

  // Update ticket
  async updateTicket(id, updates) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  }

  // Create resolution
  async createResolution(resolutionData) {
    try {
      const { data, error } = await supabase
        .from('resolutions')
        .insert([resolutionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating resolution:', error);
      throw error;
    }
  }

  // Get ticket statistics
  async getTicketStats() {
    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('status, category, priority, created_at');

      if (error) throw error;

      const stats = {
        total: tickets?.length || 0,
        by_status: {},
        by_category: {},
        by_priority: {},
        recent_tickets: tickets?.filter(t => {
          const ticketDate = new Date(t.created_at);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return ticketDate >= weekAgo;
        }).length || 0
      };

      tickets?.forEach(ticket => {
        stats.by_status[ticket.status] = (stats.by_status[ticket.status] || 0) + 1;
        stats.by_category[ticket.category] = (stats.by_category[ticket.category] || 0) + 1;
        stats.by_priority[ticket.priority] = (stats.by_priority[ticket.priority] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  // Test database connection
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('count')
        .limit(1);

      if (error) throw error;
      return { connected: true, message: 'Database connection successful' };
    } catch (error) {
      console.error('Database connection test failed:', error);
      return { connected: false, message: error.message };
    }
  }
}

module.exports = new SupabaseDB();
