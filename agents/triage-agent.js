const { OpenAI } = require('openai');

class TriageAgent {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async classifyTicket(title, description, userContext = {}) {
    try {
      const prompt = `
You are an expert IT support triage agent. Classify the following support ticket:

Title: ${title}
Description: ${description}
User Context: ${JSON.stringify(userContext, null, 2)}

Provide a JSON response with the following structure:
{
  "category": "software|hardware|network|account|security|other",
  "priority": "low|medium|high|critical",
  "urgency_score": 1-5,
  "impact_level": "individual|team|department|organization",
  "confidence": 0.0-1.0,
  "suggested_automation": ["script1", "script2"] or null,
  "escalation_required": boolean,
  "estimated_resolution_time": "minutes|hours|days",
  "tags": ["tag1", "tag2"],
  "classification_reasoning": "Brief explanation of classification"
}

Classification Guidelines:
- CRITICAL: System outages, security breaches, production down, data loss
- HIGH: User cannot work, major functionality broken, multiple users affected
- MEDIUM: Workarounds available, partial functionality, single user affected
- LOW: Minor issues, improvements, questions, documentation requests

Categories:
- SOFTWARE: Application errors, crashes, installation issues, updates
- HARDWARE: Device failures, peripherals, equipment issues
- NETWORK: Connectivity, VPN, WiFi, internet access
- ACCOUNT: Login, password, access, permissions
- SECURITY: Viruses, breaches, suspicious activity
- OTHER: General inquiries, training, requests
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert IT support triage agent. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const classification = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        classification: {
          ...classification,
          classified_at: new Date().toISOString(),
          agent_version: "1.0.0"
        }
      };

    } catch (error) {
      console.error('Triage classification error:', error);
      return {
        success: false,
        error: error.message,
        classification: {
          category: 'other',
          priority: 'medium',
          urgency_score: 3,
          impact_level: 'individual',
          confidence: 0.5,
          suggested_automation: null,
          escalation_required: false,
          estimated_resolution_time: 'hours',
          tags: ['unclassified'],
          classification_reasoning: 'Classification failed - using defaults'
        }
      };
    }
  }

  async suggestAutomation(ticket) {
    try {
      const prompt = `
Based on this ticket, suggest appropriate automation scripts:

Ticket: ${JSON.stringify(ticket, null, 2)}

Available automation categories:
- disk_cleanup: For disk space issues
- vpn_restart: For VPN connectivity problems
- service_restart: For service-related issues
- password_reset: For account access problems
- network_diagnostics: For network connectivity issues

Respond with JSON:
{
  "automation_suggestions": [
    {
      "script": "script_name",
      "confidence": 0.0-1.0,
      "reason": "Why this script should run",
      "parameters": {"key": "value"}
    }
  ],
  "manual_steps_required": boolean,
  "estimated_success_rate": 0.0-1.0
}
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an automation suggestion agent. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      console.error('Automation suggestion error:', error);
      return {
        automation_suggestions: [],
        manual_steps_required: true,
        estimated_success_rate: 0.0
      };
    }
  }

  async detectDuplicateTicket(title, description, existingTickets = []) {
    try {
      const prompt = `
Check if this new ticket is a duplicate of any existing tickets:

New Ticket:
Title: ${title}
Description: ${description}

Existing Tickets:
${existingTickets.map(t => `- ${t.title}: ${t.description.substring(0, 100)}...`).join('\n')}

Respond with JSON:
{
  "is_duplicate": boolean,
  "confidence": 0.0-1.0,
  "potential_duplicates": [
    {
      "ticket_id": "id",
      "title": "title",
      "similarity_score": 0.0-1.0,
      "reason": "Why it might be a duplicate"
    }
  ]
}
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a duplicate detection agent. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 400,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      console.error('Duplicate detection error:', error);
      return {
        is_duplicate: false,
        confidence: 0.0,
        potential_duplicates: []
      };
    }
  }
}

module.exports = TriageAgent;
