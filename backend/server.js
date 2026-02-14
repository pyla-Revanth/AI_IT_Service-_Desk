const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');
const { PythonShell } = require('python-shell');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI Classification System
async function classifyTicket(title, description) {
  try {
    const prompt = `
    Classify this IT support ticket and provide a priority level:
    
    Title: ${title}
    Description: ${description}
    
    Respond with a JSON object containing:
    - category: (software, hardware, network, account, security, other)
    - priority: (low, medium, high, critical)
    - confidence: (0-1)
    - suggested_automation: (if applicable)
    
    Consider:
    - Critical: System outages, security breaches, production issues
    - High: User cannot work, major functionality broken
    - Medium: Workarounds available, partial functionality
    - Low: Minor issues, improvements, questions
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert IT support ticket classifier. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    const classification = JSON.parse(response.choices[0].message.content);
    return classification;
  } catch (error) {
    console.error('Classification error:', error);
    return {
      category: 'other',
      priority: 'medium',
      confidence: 0.5,
      suggested_automation: null
    };
  }
}

// AI Chat Assistant
async function generateChatResponse(message, ticketContext, history) {
  try {
    const systemPrompt = `
    You are an AI IT support assistant. Help users resolve their technical issues.
    
    Guidelines:
    - Be helpful, professional, and concise
    - Ask clarifying questions if needed
    - Suggest relevant automation scripts when applicable
    - Provide step-by-step solutions
    - Escalate to human agents for complex issues
    
    Current ticket context:
    ${JSON.stringify(ticketContext, null, 2)}
    
    Recent conversation:
    ${history.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n')}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const aiResponse = response.choices[0].message.content;
    
    // Check if automation should be triggered
    const automationKeywords = ['reset', 'restart', 'clear cache', 'reboot', 'run script'];
    const shouldTriggerAutomation = automationKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    return {
      response: aiResponse,
      metadata: {
        automation_triggered: shouldTriggerAutomation,
        script_suggestion: shouldTriggerAutomation ? 'auto-fix' : null
      }
    };
  } catch (error) {
    console.error('Chat response error:', error);
    return {
      response: 'I apologize, but I encountered an error. Please try again or contact a human agent.',
      metadata: {}
    };
  }
}

// Automation Script Executor
async function executeAutomationScript(scriptName, parameters, ticketId) {
  try {
    const scriptPath = `./automation/${scriptName}.py`;
    
    const options = {
      mode: 'text',
      pythonOptions: ['-u'],
      scriptPath: scriptPath,
      args: [JSON.stringify(parameters), ticketId]
    };

    const results = await PythonShell.run(scriptPath, options);
    
    return {
      success: true,
      output: results.join('\n'),
      execution_time: Date.now()
    };
  } catch (error) {
    console.error('Script execution error:', error);
    return {
      success: false,
      error: error.message,
      execution_time: Date.now()
    };
  }
}

// API Routes

// Create and classify new ticket
app.post('/api/tickets', async (req, res) => {
  try {
    const { title, description, user_id, user_email } = req.body;
    
    // Classify ticket with AI
    const classification = await classifyTicket(title, description);
    
    const ticketData = {
      id: uuidv4(),
      title,
      description,
      category: classification.category,
      priority: classification.priority,
      status: 'open',
      user_id,
      user_email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ai_classification: classification
    };

    const { data, error } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select();

    if (error) throw error;

    res.json({ success: true, ticket: data[0] });
  } catch (error) {
    console.error('Ticket creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get tickets
app.get('/api/tickets', async (req, res) => {
  try {
    const { status, user_id } = req.query;
    let query = supabase.from('tickets').select('*').order('created_at', { ascending: false });
    
    if (status) query = query.eq('status', status);
    if (user_id) query = query.eq('user_id', user_id);

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, tickets: data });
  } catch (error) {
    console.error('Tickets fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, ticketId, userId } = req.body;
    
    // Get ticket context
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError) throw ticketError;

    // Get chat history
    const { data: history, error: historyError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('timestamp', { ascending: true })
      .limit(10);

    if (historyError) throw historyError;

    // Generate AI response
    const aiResponse = await generateChatResponse(message, ticket, history);

    // Trigger automation if suggested
    if (aiResponse.metadata.automation_triggered) {
      const scriptResult = await executeAutomationScript(
        aiResponse.metadata.script_suggestion,
        { ticketId, userId },
        ticketId
      );
      
      aiResponse.metadata.script_result = scriptResult;
    }

    res.json(aiResponse);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get automation scripts
app.get('/api/automation/scripts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('automation_scripts')
      .select('*')
      .order('success_rate', { ascending: false });

    if (error) throw error;

    res.json({ success: true, scripts: data });
  } catch (error) {
    console.error('Scripts fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute automation script
app.post('/api/automation/execute', async (req, res) => {
  try {
    const { scriptId, parameters, ticketId } = req.body;
    
    // Get script details
    const { data: script, error } = await supabase
      .from('automation_scripts')
      .select('*')
      .eq('id', scriptId)
      .single();

    if (error) throw error;

    // Execute script
    const result = await executeAutomationScript(script.script_path, parameters, ticketId);

    // Update script statistics
    await supabase
      .from('automation_scripts')
      .update({
        last_run: new Date().toISOString(),
        success_rate: result.success ? script.success_rate : Math.max(0, script.success_rate - 0.1)
      })
      .eq('id', scriptId);

    res.json({ success: true, result });
  } catch (error) {
    console.error('Script execution error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`AI IT Service Desk backend running on port ${PORT}`);
});
