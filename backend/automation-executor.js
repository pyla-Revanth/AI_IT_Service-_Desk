const { PythonShell } = require('python-shell');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const db = require('./supabase-db');

class AutomationExecutor {
  constructor() {
    this.scriptsPath = path.join(__dirname, '../scripts');
    this.logsPath = path.join(__dirname, '../logs');
    
    // Ensure logs directory exists
    this.ensureLogsDirectory();
  }

  // Ensure logs directory exists
  async ensureLogsDirectory() {
    try {
      await fs.mkdir(this.logsPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }

  // Execute automation script based on ticket classification
  async executeAutomation(ticket, classification) {
    try {
      console.log(`🔧 Starting automation for ticket ${ticket.id}: ${classification.category}`);

      // Create automation log entry
      const automationLog = {
        id: uuidv4(),
        ticket_id: ticket.id,
        script_name: null,
        status: 'starting',
        started_at: new Date().toISOString(),
        completed_at: null,
        output: null,
        error: null,
        success: null
      };

      // Store initial log entry
      const logEntry = await this.createAutomationLog(automationLog);

      // Determine which script to run based on category
      const scriptConfig = this.getScriptConfig(classification.category);
      
      if (!scriptConfig) {
        console.log(`❌ No automation script available for category: ${classification.category}`);
        await this.updateAutomationLog(logEntry.id, {
          status: 'failed',
          error: `No automation script available for category: ${classification.category}`,
          completed_at: new Date().toISOString(),
          success: false
        });
        return { success: false, message: 'No automation available' };
      }

      // Execute the Python script
      const result = await this.executePythonScript(scriptConfig, ticket);

      // Update automation log with results
      await this.updateAutomationLog(logEntry.id, {
        script_name: scriptConfig.script,
        status: result.success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        output: result.output,
        error: result.error,
        success: result.success
      });

      // Create resolution record if successful
      if (result.success) {
        await this.createResolutionRecord(ticket, result, scriptConfig);
      }

      console.log(`✅ Automation completed for ticket ${ticket.id}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      return result;

    } catch (error) {
      console.error(`❌ Automation execution failed for ticket ${ticket.id}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Get script configuration based on category
  getScriptConfig(category) {
    const configs = {
      'Device Slow': {
        script: 'disk_cleanup.py',
        description: 'Disk cleanup and optimization',
        parameters: {
          min_free_space_gb: 5,
          clear_temp: true,
          clear_cache: true,
          clear_logs: true
        }
      },
      'VPN Issue': {
        script: 'vpn_restart.py',
        description: 'VPN service restart and reconfiguration',
        parameters: {
          vpn_service: 'openvpn',
          restart_service: true,
          verify_connection: true,
          timeout_seconds: 30
        }
      },
      'Password Reset': {
        script: 'password_reset.py',
        description: 'Automated password reset',
        parameters: {
          reset_type: 'self_service',
          notify_user: true,
          force_change: false
        }
      }
    };

    return configs[category] || null;
  }

  // Execute Python script
  async executePythonScript(scriptConfig, ticket) {
    try {
      console.log(`🐍 Executing script: ${scriptConfig.script}`);

      const scriptPath = path.join(this.scriptsPath, scriptConfig.script);
      
      // Prepare parameters for the script
      const scriptParameters = {
        ...scriptConfig.parameters,
        ticket_id: ticket.id,
        user_id: ticket.user_id,
        issue_text: ticket.issue_text,
        timestamp: new Date().toISOString()
      };

      const options = {
        mode: 'text',
        pythonOptions: ['-u'],
        scriptPath: scriptPath,
        args: [JSON.stringify(scriptParameters)]
      };

      // Execute the script
      const results = await PythonShell.run(scriptConfig.script, options);
      
      const output = results.join('\n');
      console.log(`📤 Script output:`, output);

      // Parse script results
      const parsedResult = this.parseScriptOutput(output);

      return {
        success: parsedResult.success,
        output: output,
        parsed_output: parsedResult,
        script: scriptConfig.script,
        execution_time: parsedResult.execution_time || 0
      };

    } catch (error) {
      console.error(`Script execution error:`, error);
      return {
        success: false,
        error: error.message,
        output: error.stderr || error.message
      };
    }
  }

  // Parse script output to extract structured data
  parseScriptOutput(output) {
    try {
      // Look for JSON output in script results
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback parsing for non-JSON output
      const lines = output.split('\n');
      const result = {
        success: !output.includes('ERROR') && !output.includes('FAILED'),
        execution_time: 0,
        actions_performed: [],
        details: {}
      };

      // Extract execution time
      const timeMatch = output.match(/execution_time:\s*(\d+)/);
      if (timeMatch) {
        result.execution_time = parseInt(timeMatch[1]);
      }

      // Extract actions performed
      lines.forEach(line => {
        if (line.includes('CLEANED:')) {
          result.actions_performed.push(line.trim());
        }
        if (line.includes('RESTARTED:')) {
          result.actions_performed.push(line.trim());
        }
      });

      return result;

    } catch (error) {
      console.error('Failed to parse script output:', error);
      return {
        success: false,
        error: 'Failed to parse script output',
        execution_time: 0
      };
    }
  }

  // Create automation log entry
  async createAutomationLog(logData) {
    try {
      const { data, error } = await supabase
        .from('automation_logs')
        .insert([logData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create automation log:', error);
      throw error;
    }
  }

  // Update automation log entry
  async updateAutomationLog(logId, updates) {
    try {
      const { data, error } = await supabase
        .from('automation_logs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', logId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update automation log:', error);
      throw error;
    }
  }

  // Create resolution record
  async createResolutionRecord(ticket, automationResult, scriptConfig) {
    try {
      const resolutionData = {
        id: uuidv4(),
        ticket_id: ticket.id,
        action_taken: `Automated ${scriptConfig.description}: ${automationResult.parsed_output?.actions_performed?.join(', ') || 'Completed successfully'}`,
        resolved_by_agent: 'automation_system',
        resolution_time: automationResult.execution_time || 5,
        automation_script: scriptConfig.script,
        automation_output: automationResult.parsed_output,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('resolutions')
        .insert([resolutionData])
        .select()
        .single();

      if (error) throw error;

      // Update ticket status to resolved
      await db.updateTicket(ticket.id, {
        status: 'resolved',
        resolved_at: new Date().toISOString()
      });

      return data;
    } catch (error) {
      console.error('Failed to create resolution record:', error);
      throw error;
    }
  }

  // Get automation logs for a ticket
  async getAutomationLogs(ticketId) {
    try {
      const { data, error } = await supabase
        .from('automation_logs')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get automation logs:', error);
      return [];
    }
  }

  // Get automation statistics
  async getAutomationStats() {
    try {
      const { data: logs, error } = await supabase
        .from('automation_logs')
        .select('*');

      if (error) throw error;

      const stats = {
        total_automations: logs?.length || 0,
        successful_automations: logs?.filter(log => log.success === true).length || 0,
        failed_automations: logs?.filter(log => log.success === false).length || 0,
        success_rate: 0,
        avg_execution_time: 0,
        by_script: {},
        recent_automations: []
      };

      if (logs && logs.length > 0) {
        // Calculate success rate
        stats.success_rate = (stats.successful_automations / logs.length * 100).toFixed(2);

        // Calculate average execution time
        const totalTime = logs.reduce((sum, log) => sum + (log.execution_time || 0), 0);
        stats.avg_execution_time = (totalTime / logs.length).toFixed(2);

        // Group by script
        logs.forEach(log => {
          if (log.script_name) {
            stats.by_script[log.script_name] = (stats.by_script[log.script_name] || 0) + 1;
          }
        });

        // Recent automations (last 24 hours)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        stats.recent_automations = logs
          .filter(log => new Date(log.created_at) >= yesterday)
          .slice(0, 10);
      }

      return stats;
    } catch (error) {
      console.error('Failed to get automation stats:', error);
      return null;
    }
  }

  // Test automation system
  async testAutomation() {
    console.log('🧪 Testing automation system...');

    const testTicket = {
      id: 'test-ticket-id',
      user_id: 'test-user-id',
      issue_text: 'Test issue for automation',
      category: 'device_slow',
      priority: 'medium'
    };

    const testClassification = {
      category: 'Device Slow',
      priority: 'medium',
      automation_possible: true,
      confidence: 0.9
    };

    try {
      const result = await this.executeAutomation(testTicket, testClassification);
      console.log('✅ Automation test result:', result);
      return result;
    } catch (error) {
      console.error('❌ Automation test failed:', error);
      throw error;
    }
  }

  // Check if Python is available
  async checkPythonAvailability() {
    try {
      const { PythonShell } = require('python-shell');
      const testResult = await PythonShell.getVersion();
      console.log('🐍 Python version:', testResult);
      return { available: true, version: testResult };
    } catch (error) {
      console.error('❌ Python not available:', error);
      return { available: false, error: error.message };
    }
  }

  // Get available automation scripts
  getAvailableScripts() {
    return [
      {
        category: 'Device Slow',
        script: 'disk_cleanup.py',
        description: 'Disk cleanup and optimization',
        parameters: {
          min_free_space_gb: 'number',
          clear_temp: 'boolean',
          clear_cache: 'boolean',
          clear_logs: 'boolean'
        }
      },
      {
        category: 'VPN Issue',
        script: 'vpn_restart.py',
        description: 'VPN service restart and reconfiguration',
        parameters: {
          vpn_service: 'string',
          restart_service: 'boolean',
          verify_connection: 'boolean',
          timeout_seconds: 'number'
        }
      },
      {
        category: 'Password Reset',
        script: 'password_reset.py',
        description: 'Automated password reset',
        parameters: {
          reset_type: 'string',
          notify_user: 'boolean',
          force_change: 'boolean'
        }
      }
    ];
  }
}

module.exports = new AutomationExecutor();
