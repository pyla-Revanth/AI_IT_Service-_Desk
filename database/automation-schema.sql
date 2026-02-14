-- Automation System Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Automation Logs table
CREATE TABLE IF NOT EXISTS public.automation_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID NOT NULL,
    script_name TEXT,
    status TEXT NOT NULL CHECK (status IN ('starting', 'running', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    execution_time INTEGER, -- in seconds
    output TEXT,
    error TEXT,
    success BOOLEAN,
    execution_type TEXT DEFAULT 'automated' CHECK (execution_type IN ('automated', 'manual', 'scheduled')),
    parameters JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Resolutions table (add automation fields)
ALTER TABLE public.resolutions 
ADD COLUMN IF NOT EXISTS automation_script TEXT,
ADD COLUMN IF NOT EXISTS automation_output JSONB,
ADD COLUMN IF NOT EXISTS automation_log_id UUID REFERENCES public.automation_logs(id);

-- Automation Schedules table (for future use)
CREATE TABLE IF NOT EXISTS public.automation_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    script_name TEXT NOT NULL,
    schedule_expression TEXT NOT NULL, -- cron expression
    parameters JSONB,
    is_active BOOLEAN DEFAULT true,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation Statistics table (for performance tracking)
CREATE TABLE IF NOT EXISTS public.automation_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    script_name TEXT NOT NULL,
    execution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    avg_execution_time DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_automation_logs_ticket_id ON public.automation_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_script_name ON public.automation_logs(script_name);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON public.automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON public.automation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_automation_logs_execution_type ON public.automation_logs(execution_type);

CREATE INDEX IF NOT EXISTS idx_automation_schedules_script_name ON public.automation_schedules(script_name);
CREATE INDEX IF NOT EXISTS idx_automation_schedules_is_active ON public.automation_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_schedules_next_run ON public.automation_schedules(next_run);

CREATE INDEX IF NOT EXISTS idx_automation_stats_script_name ON public.automation_stats(script_name);
CREATE INDEX IF NOT EXISTS idx_automation_stats_execution_date ON public.automation_stats(execution_date);

-- Row Level Security (RLS)
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_stats ENABLE ROW LEVEL SECURITY;

-- Automation Logs policies
CREATE POLICY "Users can view own automation logs" ON public.automation_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tickets t
            WHERE t.id = automation_logs.ticket_id AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all automation logs" ON public.automation_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'agent')
        )
    );

CREATE POLICY "System can create automation logs" ON public.automation_logs
    FOR INSERT WITH CHECK (execution_type = 'automated');

CREATE POLICY "Admins can manage automation logs" ON public.automation_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'agent')
        )
    );

-- Automation Schedules policies
CREATE POLICY "Admins can manage automation schedules" ON public.automation_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin')
        )
    );

-- Automation Stats policies
CREATE POLICY "Users can view automation stats" ON public.automation_stats
    FOR SELECT USING (true);

CREATE POLICY "System can update automation stats" ON public.automation_stats
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage automation stats" ON public.automation_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin')
        )
    );

-- Function to update automation statistics
CREATE OR REPLACE FUNCTION public.update_automation_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.automation_stats (script_name, execution_date, total_executions, successful_executions, failed_executions, avg_execution_time)
    SELECT 
        script_name,
        CURRENT_DATE,
        COUNT(*) as total_executions,
        COUNT(*) FILTER (WHERE success = true) as successful_executions,
        COUNT(*) FILTER (WHERE success = false) as failed_executions,
        AVG(execution_time) as avg_execution_time
    FROM public.automation_logs
    WHERE DATE(created_at) = CURRENT_DATE
    GROUP BY script_name
    ON CONFLICT (script_name, execution_date) 
    DO UPDATE SET
        total_executions = EXCLUDED.total_executions,
        successful_executions = EXCLUDED.successful_executions,
        failed_executions = EXCLUDED.failed_executions,
        avg_execution_time = EXCLUDED.avg_execution_time,
        updated_at = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update statistics
CREATE TRIGGER update_automation_stats_trigger
    AFTER INSERT ON public.automation_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_automation_stats();

-- Function to get automation performance metrics
CREATE OR REPLACE FUNCTION public.get_automation_performance(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    script_name TEXT,
    total_executions BIGINT,
    success_rate DECIMAL(5,2),
    avg_execution_time DECIMAL(10,2),
    last_execution TIMESTAMP WITH TIME ZONE,
    trend TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.script_name,
        COUNT(*) as total_executions,
        ROUND(
            (COUNT(*) FILTER (WHERE success = true) * 100.0 / NULLIF(COUNT(*), 0)), 2
        ) as success_rate,
        ROUND(AVG(al.execution_time), 2) as avg_execution_time,
        MAX(al.created_at) as last_execution,
        CASE 
            WHEN COUNT(*) FILTER (WHERE success = true) > 
                 (SELECT AVG(success_count) FROM (
                     SELECT COUNT(*) FILTER (WHERE success = true) as success_count
                     FROM public.automation_logs 
                     WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '1 day' * days_back
                     GROUP BY DATE(created_at)
                     ORDER BY DATE(created_at) DESC
                     LIMIT 7
                 ) THEN 'improving'
            WHEN COUNT(*) FILTER (WHERE success = true) < 
                 (SELECT AVG(success_count) FROM (
                     SELECT COUNT(*) FILTER (WHERE success = true) as success_count
                     FROM public.automation_logs 
                     WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '1 day' * days_back
                     GROUP BY DATE(created_at)
                     ORDER BY DATE(created_at) DESC
                     LIMIT 7
                 ) THEN 'declining'
            ELSE 'stable'
        END as trend
    FROM public.automation_logs al
    WHERE al.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
    GROUP BY al.script_name
    ORDER BY total_executions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get daily automation summary
CREATE OR REPLACE FUNCTION public.get_daily_automation_summary(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    date DATE,
    total_automations BIGINT,
    successful_automations BIGINT,
    failed_automations BIGINT,
    success_rate DECIMAL(5,2),
    avg_execution_time DECIMAL(10,2),
    top_script TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        target_date as date,
        COUNT(*) as total_automations,
        COUNT(*) FILTER (WHERE success = true) as successful_automations,
        COUNT(*) FILTER (WHERE success = false) as failed_automations,
        ROUND(
            (COUNT(*) FILTER (WHERE success = true) * 100.0 / NULLIF(COUNT(*), 0)), 2
        ) as success_rate,
        ROUND(AVG(execution_time), 2) as avg_execution_time,
        (
            SELECT script_name 
            FROM public.automation_logs 
            WHERE DATE(created_at) = target_date AND success = true
            GROUP BY script_name 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ) as top_script
    FROM public.automation_logs
    WHERE DATE(created_at) = target_date
    GROUP BY target_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample automation logs (for testing)
INSERT INTO public.automation_logs (
    ticket_id,
    script_name,
    status,
    started_at,
    completed_at,
    execution_time,
    output,
    success,
    execution_type,
    parameters
) VALUES
    ('00000000-0000-0000-0000-000000000001', 'disk_cleanup.py', 'completed', 
     '2024-01-01 10:00:00', '2024-01-01 10:05:00', 300,
     'Disk cleanup completed successfully. Cleaned 2.5GB of temporary files.', 
     '{"actions_performed": ["CLEANED: temp files", "CLEANED: browser cache", "CLEANED: system logs"], "space_freed_gb": 2.5}',
     true, 'automated', '{"min_free_space_gb": 5, "clear_temp": true, "clear_cache": true}'),
    
    ('00000000-0000-0000-0000-000000000002', 'vpn_restart.py', 'completed',
     '2024-01-01 11:00:00', '2024-01-01 11:02:00', 120,
     'VPN service restarted successfully. Connection verified.',
     '{"actions_performed": ["RESTARTED: VPN service", "VERIFIED: connection"], "connection_status": "success"}',
     true, 'automated', '{"vpn_service": "openvpn", "restart_service": true, "verify_connection": true}')
ON CONFLICT DO NOTHING;

-- Insert sample automation stats
INSERT INTO public.automation_stats (
    script_name,
    execution_date,
    total_executions,
    successful_executions,
    failed_executions,
    avg_execution_time
) VALUES
    ('disk_cleanup.py', '2024-01-01', 15, 14, 1, 280.5),
    ('vpn_restart.py', '2024-01-01', 8, 7, 1, 145.2)
ON CONFLICT (script_name, execution_date) DO UPDATE SET
    total_executions = EXCLUDED.total_executions,
    successful_executions = EXCLUDED.successful_executions,
    failed_executions = EXCLUDED.failed_executions,
    avg_execution_time = EXCLUDED.avg_execution_time,
    updated_at = NOW();

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.update_automation_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_automation_performance(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_automation_summary(DATE) TO authenticated;
