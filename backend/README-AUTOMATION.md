# Automation Executor System

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database schema
# Copy database/automation-schema.sql to Supabase SQL Editor

# Start automation service
npm run automation

# Run tests
npm run test-automation
```

## 📋 API Endpoints

### Base URL
```
http://localhost:3003/api
```

---

## 🔧 Automation Endpoints

### Execute Automation
```http
POST /api/automation/execute
```

**Request Body:**
```json
{
  "ticket_id": "ticket-uuid",
  "ticket": {
    "id": "ticket-uuid",
    "user_id": "user-uuid",
    "issue_text": "My computer is running very slow",
    "category": "device_slow",
    "priority": "medium"
  },
  "classification": {
    "category": "Device Slow",
    "priority": "medium",
    "automation_possible": true,
    "confidence": 0.92
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "automation_id": "automation-uuid",
    "ticket_id": "ticket-uuid",
    "script_used": "disk_cleanup.py",
    "execution_time": 120,
    "success": true,
    "output": "Disk cleanup completed successfully...",
    "parsed_output": {
      "actions_performed": ["CLEANED: temp files", "CLEANED: browser cache"],
      "space_freed_gb": 2.5
    },
    "timestamp": "2024-01-01T12:00:00.000Z"
  },
  "message": "Automation completed successfully"
}
```

### Get Automation Logs
```http
GET /api/automation/logs/:ticket_id
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log-uuid",
      "ticket_id": "ticket-uuid",
      "script_name": "disk_cleanup.py",
      "status": "completed",
      "started_at": "2024-01-01T10:00:00.000Z",
      "completed_at": "2024-01-01T10:05:00.000Z",
      "execution_time": 300,
      "output": "Script output...",
      "success": true,
      "execution_type": "automated"
    }
  ],
  "message": "Found 1 automation logs for ticket ticket-uuid"
}
```

### Get Automation Statistics
```http
GET /api/automation/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_automations": 150,
    "successful_automations": 142,
    "failed_automations": 8,
    "success_rate": "94.67",
    "avg_execution_time": "180.25",
    "by_script": {
      "disk_cleanup.py": 85,
      "vpn_restart.py": 45,
      "password_reset.py": 20
    },
    "recent_automations": [...]
  }
}
```

### Get Available Scripts
```http
GET /api/automation/scripts
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "category": "Device Slow",
      "script": "disk_cleanup.py",
      "description": "Disk cleanup and optimization",
      "parameters": {
        "min_free_space_gb": "number",
        "clear_temp": "boolean",
        "clear_cache": "boolean",
        "clear_logs": "boolean"
      }
    }
  ]
}
```

### Test Automation System
```http
POST /api/automation/test
```

**Response:**
```json
{
  "success": true,
  "data": {
    "script": "disk_cleanup.py",
    "execution_time": 45,
    "success": true,
    "output": "Test execution completed"
  },
  "message": "Automation test completed"
}
```

### Manual Script Execution
```http
POST /api/automation/manual
```

**Request Body:**
```json
{
  "script_name": "disk_cleanup.py",
  "parameters": {
    "min_free_space_gb": 5,
    "clear_temp": true,
    "clear_cache": true
  },
  "ticket_id": "manual-execution-id"
}
```

### Check Python Availability
```http
GET /api/automation/python/check
```

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "version": "Python 3.9.7"
  },
  "message": "Python is available"
}
```

---

## 🐍 Python Scripts Integration

### Supported Scripts

1. **Disk Cleanup** (`disk_cleanup.py`)
   - **Category**: Device Slow
   - **Parameters**:
     - `min_free_space_gb`: Minimum free space required (default: 5)
     - `clear_temp`: Clear temporary files (default: true)
     - `clear_cache`: Clear browser cache (default: true)
     - `clear_logs`: Clear system logs (default: true)
   - **Output**: JSON with actions performed and space freed

2. **VPN Restart** (`vpn_restart.py`)
   - **Category**: VPN Issue
   - **Parameters**:
     - `vpn_service`: VPN service name (default: "openvpn")
     - `restart_service`: Restart VPN service (default: true)
     - `verify_connection`: Test connection after restart (default: true)
     - `timeout_seconds`: Connection timeout (default: 30)
   - **Output**: JSON with restart status and connection test

3. **Password Reset** (`password_reset.py`)
   - **Category**: Password Reset
   - **Parameters**:
     - `reset_type`: Type of reset (default: "self_service")
     - `notify_user`: Send notification (default: true)
     - `force_change`: Force password change (default: false)
   - **Output**: JSON with reset status and user notification

---

## 📊 Database Schema

### Automation Logs Table
```sql
CREATE TABLE automation_logs (
    id UUID PRIMARY KEY,
    ticket_id UUID NOT NULL,
    script_name TEXT,
    status TEXT CHECK (status IN ('starting', 'running', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    execution_time INTEGER, -- in seconds
    output TEXT,
    error TEXT,
    success BOOLEAN,
    execution_type TEXT DEFAULT 'automated',
    parameters JSONB
);
```

### Enhanced Resolutions Table
```sql
ALTER TABLE resolutions ADD COLUMN automation_script TEXT;
ALTER TABLE resolutions ADD COLUMN automation_output JSONB;
ALTER TABLE resolutions ADD COLUMN automation_log_id UUID;
```

### Automation Statistics Table
```sql
CREATE TABLE automation_stats (
    id UUID PRIMARY KEY,
    script_name TEXT NOT NULL,
    execution_date DATE DEFAULT CURRENT_DATE,
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    avg_execution_time DECIMAL(10,2) DEFAULT 0
);
```

---

## 🧪 Testing

### Run Test Suite
```bash
npm run test-automation
```

### Test Coverage
- ✅ Automation execution
- ✅ Manual script execution
- ✅ Automation logs retrieval
- ✅ Statistics generation
- ✅ Available scripts listing
- ✅ Python availability check
- ✅ Error handling
- ✅ Performance testing

### Manual Testing

```bash
# Test automation execution
curl -X POST http://localhost:3003/api/automation/execute \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "test-ticket",
    "ticket": {"issue_text": "Computer is slow"},
    "classification": {"category": "Device Slow", "automation_possible": true}
  }'

# Get automation stats
curl http://localhost:3003/api/automation/stats

# Check Python availability
curl http://localhost:3003/api/automation/python/check
```

---

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
# Automation Service
AUTOMATION_PORT=3003
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# Python Configuration
PYTHON_PATH=python3
SCRIPTS_PATH=./scripts
LOGS_PATH=./logs
```

### Script Configuration

Each Python script should:
1. Accept JSON parameters via command line
2. Return structured JSON output
3. Handle errors gracefully
4. Log execution details
5. Measure execution time

---

## 📈 Performance & Monitoring

### Metrics Tracked
- **Execution Time**: Time taken for each script
- **Success Rate**: Percentage of successful executions
- **Error Rate**: Percentage of failed executions
- **Script Usage**: Frequency of each script type
- **Resource Usage**: CPU and memory consumption

### Monitoring Features
- Real-time execution status
- Detailed error logging
- Performance analytics
- Automated statistics updates
- Health checks for Python availability

---

## 🛡️ Security & Safety

### Security Measures
- Script validation before execution
- Parameter sanitization
- Execution timeout handling
- Error isolation and logging
- Row Level Security (RLS) on database

### Safety Features
- Script execution limits
- Resource usage monitoring
- Rollback capabilities
- Manual override options
- Comprehensive audit logging

---

## 🚀 Deployment

### Production Setup

1. **Environment:**
   ```env
   NODE_ENV=production
   AUTOMATION_PORT=3003
   ```

2. **Python Environment:**
   - Ensure Python 3.8+ is installed
   - Configure script execution permissions
   - Set up proper logging
   - Monitor resource usage

3. **Database:**
   - Run automation schema in Supabase
   - Enable RLS policies
   - Set up monitoring
   - Configure backup strategy

4. **Monitoring:**
   - Health checks every minute
   - Performance metrics collection
   - Error rate monitoring
   - Resource usage tracking

---

## 📞 Troubleshooting

### Common Issues

1. **Python Script Not Found**
   - Check script path in automation-executor.js
   - Verify scripts directory exists
   - Ensure Python is installed

2. **Script Execution Timeout**
   - Check script logic for infinite loops
   - Increase timeout in configuration
   - Monitor resource usage

3. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Review RLS policies

4. **Performance Issues**
   - Monitor execution times
   - Optimize script logic
   - Check resource constraints

### Debug Mode
```javascript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development';
if (DEBUG) console.log('Debug info:', data);
```

---

## 🔄 Future Enhancements

### Planned Features
- [ ] Script scheduling system
- [ ] Advanced error recovery
- [ ] Real-time execution monitoring
- [ ] Script version management
- [ ] Resource usage quotas
- [ ] Multi-server support
- [ ] Web-based script editor

### Improvements
- [ ] Enhanced logging system
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Better error messages
- [ ] Automated testing
