const { OpenAI } = require('openai');
const { spawn } = require('child_process');
const path = require('path');

class ResolutionAgent {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.scriptsPath = path.join(__dirname, '..', 'scripts');
  }

  async generateResolution(ticket, chatHistory = []) {
    try {
      const prompt = `
You are an expert IT resolution agent. Analyze this ticket and provide a comprehensive resolution plan:

Ticket Information:
${JSON.stringify(ticket, null, 2)}

Recent Chat History:
${chatHistory.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Provide a JSON response:
{
  "analysis": {
    "root_cause": "Identified root cause",
    "complexity": "simple|moderate|complex",
    "estimated_time": "resolution time estimate",
    "required_skills": ["skill1", "skill2"]
  },
  "resolution_plan": {
    "steps": [
      {
        "step": 1,
        "action": "Specific action to take",
        "automation": "script_name or null",
        "manual": true/false,
        "description": "Detailed description"
      }
    ],
    "verification_steps": ["How to verify the fix"],
    "rollback_plan": "How to rollback if needed"
  },
  "automation_suggestions": [
    {
      "script": "script_name",
      "parameters": {"key": "value"},
      "confidence": 0.0-1.0,
      "reason": "Why this automation"
    }
  ],
  "escalation_criteria": {
    "should_escalate": boolean,
    "reason": "Why escalation might be needed",
    "escalation_level": "L1|L2|L3|Management"
  }
}

Consider:
- Previous similar issues and their resolutions
- Available automation scripts
- System impact and user impact
- Risk assessment
- Verification requirements
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert IT resolution agent. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const resolution = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        resolution: {
          ...resolution,
          generated_at: new Date().toISOString(),
          agent_version: "1.0.0"
        }
      };

    } catch (error) {
      console.error('Resolution generation error:', error);
      return {
        success: false,
        error: error.message,
        resolution: {
          analysis: {
            root_cause: 'Unable to determine automatically',
            complexity: 'complex',
            estimated_time: 'unknown',
            required_skills: ['human_agent']
          },
          resolution_plan: {
            steps: [{
              step: 1,
              action: 'Escalate to human agent',
              automation: null,
              manual: true,
              description: 'Manual intervention required'
            }],
            verification_steps: ['Verify with user'],
            rollback_plan: 'Contact support team'
          },
          automation_suggestions: [],
          escalation_criteria: {
            should_escalate: true,
            reason: 'AI resolution failed',
            escalation_level: 'L2'
          }
        }
      };
    }
  }

  async executeAutomation(scriptName, parameters = {}) {
    try {
      const scriptPath = path.join(this.scriptsPath, `${scriptName}.py`);
      
      return new Promise((resolve, reject) => {
        const process = spawn('python3', [scriptPath, JSON.stringify(parameters)]);
        
        let output = '';
        let errorOutput = '';
        
        process.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        process.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        process.on('close', (code) => {
          const result = {
            success: code === 0,
            exit_code: code,
            output: output.trim(),
            error: errorOutput.trim(),
            execution_time: new Date().toISOString()
          };
          
          if (code === 0) {
            resolve(result);
          } else {
            reject(result);
          }
        });
        
        process.on('error', (error) => {
          reject({
            success: false,
            error: error.message,
            execution_time: new Date().toISOString()
          });
        });
      });
      
    } catch (error) {
      throw new Error(`Script execution failed: ${error.message}`);
    }
  }

  async generateChatResponse(message, ticket, history, context = {}) {
    try {
      const prompt = `
You are an AI IT support assistant helping with a support ticket.

Current Ticket Context:
${JSON.stringify(ticket, null, 2)}

Recent Conversation:
${history.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User Message: ${message}

Additional Context: ${JSON.stringify(context, null, 2)}

Provide a helpful, professional response. If automation should be triggered, include it in your response.

Respond with JSON:
{
  "response": "Your helpful response to the user",
  "actions": [
    {
      "type": "automation|manual|escalation",
      "description": "Action to take",
      "script": "script_name if automation",
      "parameters": {"key": "value"},
      "confidence": 0.0-1.0
    }
  ],
  "follow_up_questions": ["question1", "question2"] or [],
  "status_update": "new status for ticket or null"
}

Guidelines:
- Be helpful and professional
- Ask clarifying questions if needed
- Suggest automation when appropriate
- Provide step-by-step instructions
- Know when to escalate to human agents
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI IT support assistant. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      console.error('Chat response generation error:', error);
      return {
        response: 'I apologize, but I encountered an error. Let me connect you with a human agent who can better assist you.',
        actions: [{
          type: 'escalation',
          description: 'Escalate to human agent due to AI error',
          confidence: 1.0
        }],
        follow_up_questions: [],
        status_update: 'escalated'
      };
    }
  }

  async verifyResolution(ticket, resolutionSteps) {
    try {
      const prompt = `
Verify if the following resolution successfully resolved the ticket:

Original Ticket:
${JSON.stringify(ticket, null, 2)}

Resolution Steps Applied:
${resolutionSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Respond with JSON:
{
  "resolution_successful": boolean,
  "confidence": 0.0-1.0,
  "verification_results": [
    {
      "check": "What was verified",
      "result": "pass|fail|unknown",
      "details": "Additional information"
    }
  ],
  "additional_steps_needed": ["step1", "step2"] or [],
  "recommendation": "next steps recommendation"
}
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a resolution verification agent. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      console.error('Resolution verification error:', error);
      return {
        resolution_successful: false,
        confidence: 0.0,
        verification_results: [],
        additional_steps_needed: ['Manual verification required'],
        recommendation: 'Escalate to human agent for verification'
      };
    }
  }
}

module.exports = ResolutionAgent;
