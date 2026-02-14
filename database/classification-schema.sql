-- Ticket Classifications Table for AI Classification Results
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ticket Classifications table
CREATE TABLE IF NOT EXISTS public.ticket_classifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    ticket_text TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Password Reset', 'VPN Issue', 'Software Install', 'Device Slow', 'Account Access')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    automation_possible BOOLEAN NOT NULL DEFAULT false,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    reasoning TEXT,
    classification_method TEXT NOT NULL DEFAULT 'ai' CHECK (classification_method IN ('ai', 'fallback', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ticket_classifications_user_id ON public.ticket_classifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_classifications_category ON public.ticket_classifications(category);
CREATE INDEX IF NOT EXISTS idx_ticket_classifications_priority ON public.ticket_classifications(priority);
CREATE INDEX IF NOT EXISTS idx_ticket_classifications_created_at ON public.ticket_classifications(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_classifications_automation_possible ON public.ticket_classifications(automation_possible);

-- Row Level Security (RLS)
ALTER TABLE public.ticket_classifications ENABLE ROW LEVEL SECURITY;

-- Classification policies
CREATE POLICY "Users can view own classifications" ON public.ticket_classifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own classifications" ON public.ticket_classifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all classifications" ON public.ticket_classifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'agent')
        )
    );

CREATE POLICY "Admins can manage all classifications" ON public.ticket_classifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'agent')
        )
    );

-- Function to get classification statistics
CREATE OR REPLACE FUNCTION public.get_classification_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_classifications BIGINT,
    password_reset_count BIGINT,
    vpn_issue_count BIGINT,
    software_install_count BIGINT,
    device_slow_count BIGINT,
    account_access_count BIGINT,
    automation_possible_count BIGINT,
    automation_rate DECIMAL(5,2),
    avg_confidence DECIMAL(5,2),
    high_priority_count BIGINT,
    critical_priority_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_classifications,
        COUNT(*) FILTER (WHERE category = 'Password Reset') as password_reset_count,
        COUNT(*) FILTER (WHERE category = 'VPN Issue') as vpn_issue_count,
        COUNT(*) FILTER (WHERE category = 'Software Install') as software_install_count,
        COUNT(*) FILTER (WHERE category = 'Device Slow') as device_slow_count,
        COUNT(*) FILTER (WHERE category = 'Account Access') as account_access_count,
        COUNT(*) FILTER (WHERE automation_possible = true) as automation_possible_count,
        ROUND(
            (COUNT(*) FILTER (WHERE automation_possible = true) * 100.0 / NULLIF(COUNT(*), 0)), 2
        ) as automation_rate,
        ROUND(AVG(confidence), 2) as avg_confidence,
        COUNT(*) FILTER (WHERE priority = 'high') as high_priority_count,
        COUNT(*) FILTER (WHERE priority = 'critical') as critical_priority_count
    FROM public.ticket_classifications
    WHERE (p_user_id IS NULL OR user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get classification trends
CREATE OR REPLACE FUNCTION public.get_classification_trends(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    total_classifications BIGINT,
    automation_possible_count BIGINT,
    automation_rate DECIMAL(5,2),
    avg_confidence DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_classifications,
        COUNT(*) FILTER (WHERE automation_possible = true) as automation_possible_count,
        ROUND(
            (COUNT(*) FILTER (WHERE automation_possible = true) * 100.0 / NULLIF(COUNT(*), 0)), 2
        ) as automation_rate,
        ROUND(AVG(confidence), 2) as avg_confidence
    FROM public.ticket_classifications
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
    GROUP BY DATE(created_at)
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data (optional - for testing)
INSERT INTO public.ticket_classifications (
    user_id, 
    ticket_text, 
    category, 
    priority, 
    automation_possible, 
    confidence, 
    reasoning
) VALUES
    ('00000000-0000-0000-0000-000000000000', 
     'I forgot my password and cannot login to my email', 
     'Password Reset', 
     'high', 
     true, 
     0.95, 
     'Password reset request detected with high confidence'),
    ('00000000-0000-0000-0000-000000000001', 
     'VPN is not working from home office', 
     'VPN Issue', 
     'high', 
     true, 
     0.88, 
     'VPN connectivity issue detected'),
    ('00000000-0000-0000-0000-000000000002', 
     'My computer is running very slow', 
     'Device Slow', 
     'medium', 
     true, 
     0.92, 
     'Performance issue detected')
ON CONFLICT DO NOTHING;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_classification_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_classification_trends(INTEGER) TO authenticated;
