import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database helpers
export const db = {
  // Tickets
  async getTickets(filters = {}) {
    let query = supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority)
    }

    const { data, error } = await query
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

  // Chat Messages
  async getChatMessages(ticketId) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('timestamp', { ascending: true })

    return { data, error }
  },

  async createChatMessage(messageData) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([messageData])
      .select()
      .single()

    return { data, error }
  },

  // Users
  async getUser(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    return { data, error }
  },

  async updateUser(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    return { data, error }
  },

  // Automation Scripts
  async getAutomationScripts() {
    const { data, error } = await supabase
      .from('automation_scripts')
      .select('*')
      .order('success_rate', { ascending: false })

    return { data, error }
  },

  async updateAutomationScript(id, updates) {
    const { data, error } = await supabase
      .from('automation_scripts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }
}

export default db
