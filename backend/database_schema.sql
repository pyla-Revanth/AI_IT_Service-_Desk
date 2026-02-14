-- AI IT Service Desk Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'agent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('software', 'hardware', 'network', 'account', 'security', 'other')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    user_id UUID REFERENCES public.users(id) NOT NULL,
    user_email TEXT NOT NULL,
    assigned_to UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    ai_classification JSONB,
    resolution JSONB
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Automation scripts table
CREATE TABLE IF NOT EXISTS public.automation_scripts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    script_path TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    success_rate DECIMAL(3,2) DEFAULT 1.0,
    last_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_ticket_id ON public.chat_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON public.chat_messages(timestamp);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_scripts ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Tickets policies
CREATE POLICY "Users can view own tickets" ON public.tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tickets" ON public.tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" ON public.tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'agent')
        )
    );

CREATE POLICY "Admins can update all tickets" ON public.tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'agent')
        )
    );

-- Chat messages policies
CREATE POLICY "Users can view messages for own tickets" ON public.chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tickets 
            WHERE id = ticket_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages for own tickets" ON public.chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tickets 
            WHERE id = ticket_id AND user_id = auth.uid()
        )
    );

-- Automation scripts policies (read-only for users)
CREATE POLICY "Anyone can view automation scripts" ON public.automation_scripts
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage automation scripts" ON public.automation_scripts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamps
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_automation_scripts_updated_at
    BEFORE UPDATE ON public.automation_scripts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample automation scripts
INSERT INTO public.automation_scripts (name, description, category, script_path, parameters) VALUES
('Clear Cache', 'Clear system cache to resolve performance issues', 'software', 'auto_fix.py', '{"action": "clear_cache"}'),
('Restart Service', 'Restart a specific service', 'software', 'auto_fix.py', '{"action": "restart_service", "service_name": "web_server"}'),
('Reset Password', 'Reset user password and send reset link', 'account', 'auto_fix.py', '{"action": "reset_password"}'),
('Network Diagnostics', 'Check network connectivity and diagnose issues', 'network', 'auto_fix.py', '{"action": "check_network"}'),
('System Health Check', 'Run comprehensive system diagnostics', 'system', 'auto_fix.py', '{"action": "diagnose"}')
ON CONFLICT DO NOTHING;
