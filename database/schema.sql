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
    department TEXT,
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
    assigned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    ai_classification JSONB,
    resolution JSONB,
    tags TEXT[],
    impact_level TEXT DEFAULT 'individual' CHECK (impact_level IN ('individual', 'team', 'department', 'organization')),
    urgency_score INTEGER DEFAULT 3 CHECK (urgency_score >= 1 AND urgency_score <= 5)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'agent')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
    sender_id UUID REFERENCES public.users(id)
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
    execution_count INTEGER DEFAULT 0,
    last_run TIMESTAMP WITH TIME ZONE,
    last_status TEXT CHECK (last_status IN ('success', 'failed', 'timeout')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false
);

-- Ticket history for audit trail
CREATE TABLE IF NOT EXISTS public.ticket_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    changed_by UUID REFERENCES public.users(id) NOT NULL,
    field_changed TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge base for common solutions
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[],
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 0.0,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_published BOOLEAN DEFAULT true
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON public.tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_chat_messages_ticket_id ON public.chat_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON public.chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket_id ON public.ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON public.knowledge_base USING GIN(tags);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

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

-- Ticket history policies
CREATE POLICY "Users can view history for own tickets" ON public.ticket_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tickets 
            WHERE id = ticket_id AND user_id = auth.uid()
        )
    );

-- Knowledge base policies
CREATE POLICY "Anyone can view published knowledge base" ON public.knowledge_base
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage knowledge base" ON public.knowledge_base
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'agent')
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

CREATE TRIGGER handle_knowledge_base_updated_at
    BEFORE UPDATE ON public.knowledge_base
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

-- Function to log ticket changes
CREATE OR REPLACE FUNCTION public.log_ticket_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Log status changes
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO public.ticket_history (ticket_id, changed_by, field_changed, old_value, new_value)
            VALUES (NEW.id, NEW.assigned_to, 'status', OLD.status, NEW.status);
        END IF;
        
        -- Log assignment changes
        IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
            INSERT INTO public.ticket_history (ticket_id, changed_by, field_changed, old_value, new_value)
            VALUES (NEW.id, NEW.assigned_to, 'assigned_to', OLD.assigned_to, NEW.assigned_to);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log ticket changes
CREATE TRIGGER ticket_change_log
    AFTER UPDATE ON public.tickets
    FOR EACH ROW EXECUTE FUNCTION public.log_ticket_change();

-- Insert sample automation scripts
INSERT INTO public.automation_scripts (name, description, category, script_path, parameters) VALUES
('Disk Cleanup', 'Remove temporary files and free up disk space', 'system', '../scripts/disk_cleanup.py', '{"min_free_space_gb": 10}'),
('VPN Restart', 'Restart VPN service and reconnect', 'network', '../scripts/vpn_restart.py', '{"vpn_service": "openvpn"}'),
('Service Restart', 'Restart a specific system service', 'system', '../scripts/service_restart.py', '{"service_name": ""}'),
('Password Reset', 'Reset user password and send reset link', 'account', '../scripts/password_reset.py', '{"force_reset": false}'),
('Network Diagnostics', 'Run comprehensive network diagnostics', 'network', '../scripts/network_diagnostics.py', '{"ping_targets": ["8.8.8.8", "1.1.1.1"]}')
ON CONFLICT DO NOTHING;

-- Insert sample knowledge base articles
INSERT INTO public.knowledge_base (title, content, category, tags) VALUES
('Cannot Connect to VPN', '1. Check internet connection\n2. Verify VPN credentials\n3. Restart VPN client\n4. Contact IT if issue persists', 'network', ARRAY['vpn', 'connection', 'remote']),
('Slow Computer Performance', '1. Restart computer\n2. Clear temporary files\n3. Check disk space\n4. Update system\n5. Run virus scan', 'hardware', ARRAY['performance', 'slow', 'optimization']),
('Email Login Issues', '1. Verify password\n2. Check account lockout\n3. Clear browser cache\n4. Try different browser\n5. Reset password if needed', 'account', ARRAY['email', 'login', 'password'])
ON CONFLICT DO NOTHING;
