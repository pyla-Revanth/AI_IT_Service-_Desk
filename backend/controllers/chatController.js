const db = require('../database/client');
const ResolutionAgent = require('../../agents/resolution-agent');

class ChatController {
  constructor() {
    this.resolutionAgent = new ResolutionAgent();
  }

  async sendMessage(req, res) {
    try {
      const { message, ticketId, userId, context = {} } = req.body;

      // Validate required fields
      if (!message || !ticketId || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: message, ticketId, userId'
        });
      }

      // Get ticket context
      const { data: ticket, error: ticketError } = await db.getTickets({ id: ticketId });
      if (ticketError || !ticket || ticket.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      // Get chat history
      const { data: history, error: historyError } = await db.getChatMessages(ticketId);
      if (historyError) {
        console.error('Chat history fetch error:', historyError);
      }

      // Save user message
      const userMessage = {
        ticket_id: ticketId,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        sender_id: userId,
        message_type: 'text'
      };

      const { data: savedUserMessage, error: userMessageError } = await db.createChatMessage(userMessage);
      if (userMessageError) {
        console.error('User message save error:', userMessageError);
      }

      // Generate AI response
      const aiResponse = await this.resolutionAgent.generateChatResponse(
        message,
        ticket[0],
        history || [],
        context
      );

      // Save AI response
      const assistantMessage = {
        ticket_id: ticketId,
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date().toISOString(),
        metadata: {
          actions: aiResponse.actions,
          follow_up_questions: aiResponse.follow_up_questions,
          suggested_status: aiResponse.status_update
        },
        message_type: 'text'
      };

      const { data: savedAssistantMessage, error: assistantMessageError } = await db.createChatMessage(assistantMessage);
      if (assistantMessageError) {
        console.error('Assistant message save error:', assistantMessageError);
      }

      // Execute automation if suggested
      let automationResults = [];
      if (aiResponse.actions && aiResponse.actions.length > 0) {
        for (const action of aiResponse.actions) {
          if (action.type === 'automation' && action.script) {
            try {
              const result = await this.resolutionAgent.executeAutomation(
                action.script,
                action.parameters || {}
              );
              automationResults.push({
                script: action.script,
                success: result.success,
                result: result
              });
            } catch (error) {
              automationResults.push({
                script: action.script,
                success: false,
                error: error.message
              });
            }
          }
        }
      }

      // Update ticket status if suggested
      if (aiResponse.status_update) {
        await db.updateTicket(ticketId, {
          status: aiResponse.status_update,
          updated_at: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        response: aiResponse.response,
        actions: aiResponse.actions,
        follow_up_questions: aiResponse.follow_up_questions,
        automation_results: automationResults,
        messages: [savedUserMessage, savedAssistantMessage].filter(Boolean)
      });

    } catch (error) {
      console.error('Chat controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getChatHistory(req, res) {
    try {
      const { ticketId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const { data, error } = await db.getChatMessages(ticketId);

      if (error) {
        console.error('Chat history fetch error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch chat history'
        });
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedData = data.slice(startIndex, endIndex);

      res.json({
        success: true,
        messages: paginatedData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: data.length,
          pages: Math.ceil(data.length / limit)
        }
      });

    } catch (error) {
      console.error('Chat history controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async generateResolution(req, res) {
    try {
      const { ticketId } = req.params;

      // Get ticket details
      const { data: ticket, error: ticketError } = await db.getTickets({ id: ticketId });
      if (ticketError || !ticket || ticket.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      // Get chat history
      const { data: history, error: historyError } = await db.getChatMessages(ticketId);
      if (historyError) {
        console.error('Chat history fetch error:', historyError);
      }

      // Generate resolution plan
      const resolution = await this.resolutionAgent.generateResolution(
        ticket[0],
        history || []
      );

      res.json({
        success: true,
        resolution: resolution.resolution
      });

    } catch (error) {
      console.error('Resolution generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async executeAutomation(req, res) {
    try {
      const { scriptName, parameters, ticketId } = req.body;

      if (!scriptName) {
        return res.status(400).json({
          success: false,
          error: 'Missing script name'
        });
      }

      // Execute automation script
      const result = await this.resolutionAgent.executeAutomation(
        scriptName,
        parameters || {}
      );

      // Log automation execution
      if (ticketId) {
        const logMessage = {
          ticket_id: ticketId,
          role: 'system',
          content: `Automation script '${scriptName}' executed`,
          timestamp: new Date().toISOString(),
          metadata: {
            script: scriptName,
            parameters,
            result: result
          },
          message_type: 'system'
        };

        await db.createChatMessage(logMessage);
      }

      res.json({
        success: true,
        result
      });

    } catch (error) {
      console.error('Automation execution error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async verifyResolution(req, res) {
    try {
      const { ticketId } = req.params;
      const { resolutionSteps } = req.body;

      // Get ticket details
      const { data: ticket, error: ticketError } = await db.getTickets({ id: ticketId });
      if (ticketError || !ticket || ticket.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      // Verify resolution
      const verification = await this.resolutionAgent.verifyResolution(
        ticket[0],
        resolutionSteps || []
      );

      res.json({
        success: true,
        verification
      });

    } catch (error) {
      console.error('Resolution verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = ChatController;
