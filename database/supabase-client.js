import { createClient } from '@supabase/supabase-js'

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database helper functions
export const db = {
  // Tickets table operations
  async getTickets(filters = {}) {
    let query = supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority)
    }

    const { data, error } = await query
    return { data, error }
  },

  async getTicketById(id) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  },

  async createTicket(ticketData) {
    const { data, error } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select()
      .single()

    return { data, error }
  },

  async updateTicket(id, updates) {
    const { data, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  },

  async deleteTicket(id) {
    const { data, error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id)

    return { data, error }
  },

  // Resolutions table operations
  async getResolutions(filters = {}) {
    let query = supabase
      .from('resolutions')
      .select('*')
      .order('resolution_time', { ascending: false })

    if (filters.ticket_id) {
      query = query.eq('ticket_id', filters.ticket_id)
    }
    if (filters.resolved_by_agent) {
      query = query.eq('resolved_by_agent', filters.resolved_by_agent)
    }

    const { data, error } = await query
    return { data, error }
  },

  async getResolutionById(id) {
    const { data, error } = await supabase
      .from('resolutions')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  },

  async createResolution(resolutionData) {
    const { data, error } = await supabase
      .from('resolutions')
      .insert([resolutionData])
      .select()
      .single()

    return { data, error }
  },

  async updateResolution(id, updates) {
    const { data, error } = await supabase
      .from('resolutions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  },

  // Join operations
  async getTicketsWithResolutions(filters = {}) {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        resolutions (
          id,
          action_taken,
          resolved_by_agent,
          resolution_time
        )
      `)
      .order('created_at', { ascending: false })

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id)
    }

    const { data: result, error: queryError } = await query
    return { data: result, error: queryError }
  },

  // Analytics and statistics
  async getTicketStats() {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('status, category, priority, created_at')

    if (error) return { data: null, error }

    // Calculate statistics
    const stats = {
      total: tickets?.length || 0,
      by_status: {},
      by_category: {},
      by_priority: {},
      avg_resolution_time: 0
    }

    tickets?.forEach(ticket => {
      // Count by status
      stats.by_status[ticket.status] = (stats.by_status[ticket.status] || 0) + 1
      
      // Count by category
      stats.by_category[ticket.category] = (stats.by_category[ticket.category] || 0) + 1
      
      // Count by priority
      stats.by_priority[ticket.priority] = (stats.by_priority[ticket.priority] || 0) + 1
    })

    return { data: stats, error: null }
  }
}

export default supabase
