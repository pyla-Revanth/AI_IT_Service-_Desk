const { OpenAI } = require('openai');
const db = require('./supabase-db');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AITicketClassifier {
  constructor() {
    this.categories = [
      'Password Reset',
      'VPN Issue', 
      'Software Install',
      'Device Slow',
      'Account Access'
    ];
    
    this.priorities = ['low', 'medium', 'high', 'critical'];
  }

  // Classify ticket using OpenAI
  async classifyTicket(ticketText, userId = null) {
    try {
      console.log('🤖 Starting AI classification for ticket:', ticketText.substring(0, 100) + '...');

      const prompt = `
      Classify this IT support ticket into one of the specified categories and assign priority.

      TICKET TEXT: "${ticketText}"

      CATEGORIES (choose exactly one):
      - Password Reset: User needs password reset, forgot password, locked account
      - VPN Issue: Cannot connect to VPN, VPN slow, VPN configuration
      - Software Install: Need to install software, software not working, update issues
      - Device Slow: Computer running slow, performance issues, lagging
      - Account Access: Cannot login, account locked, permission issues

      PRIORITIES (choose exactly one):
      - critical: System outage, security breach, production down
      - high: User cannot work, major functionality broken
      - medium: Workaround available, partial functionality
      - low: Minor issues, questions, improvements

      AUTOMATION POSSIBLE (true/false):
      Consider if this issue can be resolved with automated scripts:
      - Password Reset: true (automated reset possible)
      - VPN Issue: true (restart services, update config)
      - Software Install: false (requires manual intervention)
      - Device Slow: true (disk cleanup, optimization)
      - Account Access: true (permission reset)

      Respond with ONLY a JSON object in this exact format:
      {
        "category": "category_name",
        "priority": "priority_level", 
        "automation_possible": true/false,
        "confidence": 0.95,
        "reasoning": "brief explanation of classification"
      }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert IT support ticket classifier. Always respond with valid JSON only. Choose from the specified categories and priorities."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const classificationText = response.choices[0].message.content.trim();
      console.log('🧠 AI Response:', classificationText);

      // Parse JSON response
      let classification;
      try {
        classification = JSON.parse(classificationText);
      } catch (parseError) {
        console.error('❌ Failed to parse AI response:', parseError);
        throw new Error('Invalid AI response format');
      }

      // Validate classification
      const validatedClassification = this.validateClassification(classification);
      
      // Store classification in Supabase
      if (userId) {
        await this.storeClassification(userId, ticketText, validatedClassification);
      }

      console.log('✅ Classification complete:', validatedClassification);
      return validatedClassification;

    } catch (error) {
      console.error('❌ AI classification failed:', error.message);
      
      // Fallback classification
      return this.getFallbackClassification(ticketText);
    }
  }

  // Validate classification results
  validateClassification(classification) {
    const validated = {
      category: classification.category || 'Account Access',
      priority: classification.priority || 'medium',
      automation_possible: classification.automation_possible || false,
      confidence: classification.confidence || 0.5,
      reasoning: classification.reasoning || 'AI classification unavailable'
    };

    // Validate category
    if (!this.categories.includes(validated.category)) {
      console.warn('⚠️ Invalid category detected, using fallback');
      validated.category = 'Account Access';
    }

    // Validate priority
    if (!this.priorities.includes(validated.priority)) {
      console.warn('⚠️ Invalid priority detected, using fallback');
      validated.priority = 'medium';
    }

    // Validate confidence
    if (validated.confidence < 0 || validated.confidence > 1) {
      validated.confidence = 0.5;
    }

    return validated;
  }

  // Fallback classification using keyword matching
  getFallbackClassification(ticketText) {
    const text = ticketText.toLowerCase();
    
    // Keyword-based classification
    let category = 'Account Access';
    let priority = 'medium';
    let automation_possible = false;
    let reasoning = 'Fallback classification using keyword matching';

    if (text.includes('password') || text.includes('reset') || text.includes('forgot')) {
      category = 'Password Reset';
      priority = 'high';
      automation_possible = true;
      reasoning = 'Password-related issue detected';
    } else if (text.includes('vpn') || text.includes('connect') || text.includes('network')) {
      category = 'VPN Issue';
      priority = 'high';
      automation_possible = true;
      reasoning = 'VPN connectivity issue detected';
    } else if (text.includes('install') || text.includes('software') || text.includes('application')) {
      category = 'Software Install';
      priority = 'medium';
      automation_possible = false;
      reasoning = 'Software installation request detected';
    } else if (text.includes('slow') || text.includes('performance') || text.includes('lag')) {
      category = 'Device Slow';
      priority = 'medium';
      automation_possible = true;
      reasoning = 'Performance issue detected';
    } else if (text.includes('login') || text.includes('access') || text.includes('account')) {
      category = 'Account Access';
      priority = 'high';
      automation_possible = true;
      reasoning = 'Account access issue detected';
    }

    return {
      category,
      priority,
      automation_possible,
      confidence: 0.6,
      reasoning
    };
  }

  // Store classification results in Supabase
  async storeClassification(userId, ticketText, classification) {
    try {
      const classificationRecord = {
        id: require('uuid').v4(),
        user_id: userId,
        ticket_text: ticketText,
        category: classification.category,
        priority: classification.priority,
        automation_possible: classification.automation_possible,
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        classification_method: 'ai',
        created_at: new Date().toISOString()
      };

      // Store in classifications table
      const { data, error } = await supabase
        .from('ticket_classifications')
        .insert([classificationRecord])
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to store classification:', error);
        throw error;
      }

      console.log('💾 Classification stored in database:', data.id);
      return data;

    } catch (error) {
      console.error('❌ Database storage error:', error);
      // Don't throw error, just log it - classification can still work
      return null;
    }
  }

  // Batch classify multiple tickets
  async batchClassify(tickets) {
    console.log(`🔄 Starting batch classification for ${tickets.length} tickets`);
    
    const results = [];
    
    for (const ticket of tickets) {
      try {
        const classification = await this.classifyTicket(ticket.text, ticket.user_id);
        results.push({
          ticket_id: ticket.id,
          classification,
          status: 'success'
        });
      } catch (error) {
        console.error(`❌ Failed to classify ticket ${ticket.id}:`, error);
        results.push({
          ticket_id: ticket.id,
          classification: null,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`✅ Batch classification complete: ${results.filter(r => r.status === 'success').length}/${results.length} successful`);
    return results;
  }

  // Get classification statistics
  async getClassificationStats(userId = null) {
    try {
      let query = supabase
        .from('ticket_classifications')
        .select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total_classifications: data?.length || 0,
        by_category: {},
        by_priority: {},
        automation_possible_rate: 0,
        avg_confidence: 0,
        classification_method: 'ai'
      };

      data?.forEach(record => {
        // Count by category
        stats.by_category[record.category] = (stats.by_category[record.category] || 0) + 1;
        
        // Count by priority
        stats.by_priority[record.priority] = (stats.by_priority[record.priority] || 0) + 1;
      });

      // Calculate automation rate
      const automationPossible = data?.filter(r => r.automation_possible).length || 0;
      stats.automation_possible_rate = data?.length ? (automationPossible / data.length) : 0;

      // Calculate average confidence
      const totalConfidence = data?.reduce((sum, r) => sum + r.confidence, 0) || 0;
      stats.avg_confidence = data?.length ? (totalConfidence / data.length) : 0;

      return stats;

    } catch (error) {
      console.error('❌ Failed to get classification stats:', error);
      return null;
    }
  }

  // Test classification
  async testClassification() {
    const testTickets = [
      "I forgot my password and can't login to my email",
      "VPN is not working from home, getting connection timeout",
      "I need Microsoft Office installed on my computer",
      "My laptop is running very slow and takes forever to start",
      "I can't access the shared drive, getting permission denied"
    ];

    console.log('🧪 Running classification tests...');
    
    for (const ticket of testTickets) {
      const result = await this.classifyTicket(ticket);
      console.log(`📝 "${ticket}"`);
      console.log(`   Category: ${result.category}`);
      console.log(`   Priority: ${result.priority}`);
      console.log(`   Automation: ${result.automation_possible}`);
      console.log(`   Confidence: ${result.confidence}`);
      console.log(`   Reasoning: ${result.reasoning}`);
      console.log('');
    }
  }
}

module.exports = new AITicketClassifier();
