const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database helper functions
const db = {
  supabase,
  
  // Generic query helper
  async query(table, options = {}) {
    let query = supabase.from(table);
    
    if (options.select) {
      query = query.select(options.select);
    }
    
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    if (options.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending });
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.range) {
      query = query.range(options.range.from, options.range.to);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Database query error for table ${table}:`, error);
      throw error;
    }
    
    return data;
  },
  
  // Insert helper
  async insert(table, data) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();
      
    if (error) {
      console.error(`Database insert error for table ${table}:`, error);
      throw error;
    }
    
    return result;
  },
  
  // Update helper
  async update(table, data, where) {
    let query = supabase.from(table).update(data);
    
    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data: result, error } = await query.select();
    
    if (error) {
      console.error(`Database update error for table ${table}:`, error);
      throw error;
    }
    
    return result;
  },
  
  // Delete helper
  async delete(table, where) {
    let query = supabase.from(table).delete();
    
    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Database delete error for table ${table}:`, error);
      throw error;
    }
    
    return data;
  },
  
  // Test connection
  async testConnection() {
    try {
      const { data, error } = await supabase.from('tickets').select('count').limit(1);
      if (error) throw error;
      console.log('✅ Supabase connection successful');
      return true;
    } catch (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
  }
};

module.exports = db;
