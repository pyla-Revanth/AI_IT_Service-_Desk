-- AI IT Service Desk - Simplified Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    issue_text TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('software', 'hardware', 'network', 'account', 'security', 'other')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resolutions table
CREATE TABLE IF NOT EXISTS public.resolutions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    action_taken TEXT NOT NULL,
    resolved_by_agent TEXT NOT NULL,
    resolution_time INTEGER NOT NULL, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON public.tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_resolutions_ticket_id ON public.resolutions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_resolutions_agent ON public.resolutions(resolved_by_agent);

-- Row Level Security (RLS)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolutions ENABLE ROW LEVEL SECURITY;

-- Tickets policies
CREATE POLICY "Users can view own tickets" ON public.tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tickets" ON public.tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets" ON public.tickets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" ON public.tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'agent')
        )
    );

CREATE POLICY "Admins can update all tickets" ON public.tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'agent')
        )
    );

-- Resolutions policies
CREATE POLICY "Users can view resolutions for own tickets" ON public.resolutions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tickets 
            WHERE id = ticket_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create resolutions for own tickets" ON public.resolutions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tickets 
            WHERE id = ticket_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all resolutions" ON public.resolutions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'agent')
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates
CREATE TRIGGER handle_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- No additional user table needed for this simple version
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle new user signup (optional)
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data (optional - for testing)
INSERT INTO public.tickets (user_id, issue_text, category, priority, status) VALUES
    ('00000000-0000-0000-0000-000000000000', 'Cannot connect to VPN', 'network', 'high', 'open'),
    ('00000000-0000-0000-0000-000000000001', 'Computer running very slow', 'hardware', 'medium', 'in_progress'),
    ('00000000-0000-0000-0000-000000000002', 'Need password reset', 'account', 'low', 'resolved')
ON CONFLICT DO NOTHING;

-- Insert sample resolutions
INSERT INTO public.resolutions (ticket_id, action_taken, resolved_by_agent, resolution_time) VALUES
    ((SELECT id FROM public.tickets WHERE issue_text = 'Need password reset' LIMIT 1), 
     'Reset user password and sent reset link via email', 'ai_assistant', 5),
    ((SELECT id FROM public.tickets WHERE issue_text = 'Computer running very slow' LIMIT 1), 
     'Cleared temporary files and restarted system', 'ai_assistant', 15)
ON CONFLICT DO NOTHING;
