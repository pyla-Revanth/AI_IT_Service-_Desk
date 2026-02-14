const { createClient } = require('@supabase/supabase-js');

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

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Get user role from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, email, name')
      .eq('id', user.id)
      .single();

    if (userError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user data'
      });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: userData?.role || 'user',
      name: userData?.name || user.email
    };

    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

module.exports = authMiddleware;
