const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIClassifier {
  // Classify ticket using AI
  async classifyTicket(issueText, category, priority) {
    try {
      const prompt = `
      Classify this IT support ticket and provide detailed analysis:
      
      Issue: ${issueText}
      Category: ${category}
      Priority: ${priority}
      
      Respond with a JSON object containing:
      - category: (software, hardware, network, account, security, other)
      - priority: (low, medium, high, critical)
      - confidence: (0-1)
      - urgency_score: (1-5)
      - impact_level: (individual, team, department, organization)
      - suggested_automation: (if applicable)
      - classification_reasoning: (brief explanation)
      - estimated_resolution_time: (in minutes)
      
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
        max_tokens: 300
      });

      const classification = JSON.parse(response.choices[0].message.content);
      return classification;
    } catch (error) {
      console.error('AI classification error:', error);
      
      // Fallback classification
      return {
        category: category || 'other',
        priority: priority || 'medium',
        confidence: 0.5,
        urgency_score: 3,
        impact_level: 'individual',
        suggested_automation: null,
        classification_reasoning: 'AI classification failed, using provided values',
        estimated_resolution_time: 30
      };
    }
  }

  // Generate resolution plan
  async generateResolution(ticket) {
    try {
      const prompt = `
      Generate a resolution plan for this IT support ticket:
      
      Title: ${ticket.issue_text}
      Category: ${ticket.category}
      Priority: ${ticket.priority}
      
      Respond with a JSON object containing:
      - steps: [array of resolution steps]
      - automation_suggested: (true/false)
      - automation_script: (if applicable)
      - estimated_time: (in minutes)
      - complexity: (low, medium, high)
      - success_probability: (0-1)
      - manual_intervention_required: (true/false)
      
      Provide specific, actionable steps that can be automated or performed manually.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert IT support technician. Provide practical, step-by-step solutions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 400
      });

      const resolution = JSON.parse(response.choices[0].message.content);
      return resolution;
    } catch (error) {
      console.error('Resolution generation error:', error);
      
      // Fallback resolution
      return {
        steps: ['Investigate the issue', 'Provide manual solution', 'Verify resolution'],
        automation_suggested: false,
        automation_script: null,
        estimated_time: 30,
        complexity: 'medium',
        success_probability: 0.7,
        manual_intervention_required: true
      };
    }
  }

  // Check if automation should be triggered
  async shouldAutomate(issueText, category) {
    try {
      const automationKeywords = {
        'network': ['vpn', 'connection', 'wifi', 'network', 'internet'],
        'hardware': ['disk', 'memory', 'performance', 'slow'],
        'account': ['password', 'login', 'access', 'account'],
        'software': ['install', 'update', 'crash', 'error']
      };

      const text = issueText.toLowerCase();
      const keywords = automationKeywords[category] || [];
      
      return keywords.some(keyword => text.includes(keyword));
    } catch (error) {
      console.error('Automation check error:', error);
      return false;
    }
  }
}

module.exports = new AIClassifier();
