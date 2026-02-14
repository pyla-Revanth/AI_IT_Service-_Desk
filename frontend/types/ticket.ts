export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  user_id: string;
  user_email: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  ai_classification?: {
    confidence: number;
    suggested_category: string;
    suggested_priority: string;
  };
  resolution?: {
    method: 'automated' | 'manual';
    script_used?: string;
    steps_taken: string[];
    resolution_time: number;
  };
}

export interface ChatMessage {
  id: string;
  ticket_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    script_suggestion?: string;
    automation_triggered?: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin' | 'agent';
  created_at: string;
}

export interface AutomationScript {
  id: string;
  name: string;
  description: string;
  category: string;
  script_path: string;
  parameters: Record<string, any>;
  success_rate: number;
  last_run?: string;
}
