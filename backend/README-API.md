# AI IT Service Desk API Documentation

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your Supabase and OpenAI credentials

# Start development server
npm run dev

# Run API tests
npm test
```

## 📋 API Endpoints

### Base URL
```
http://localhost:3001/api
```

### Authentication
Currently using service role key for development. Add JWT middleware for production.

---

## 🎫 Ticket Management

### Create Ticket
```http
POST /api/tickets
```

**Request Body:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "issue_text": "Cannot connect to VPN from home office",
  "category": "network",
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "issue_text": "Cannot connect to VPN from home office",
    "category": "network",
    "priority": "high",
    "status": "open",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z"
  },
  "message": "Ticket created successfully"
}
```

### List Tickets
```http
GET /api/tickets
```

**Query Parameters:**
- `user_id` (optional): Filter by user ID
- `status` (optional): Filter by status (open, in_progress, resolved, closed)
- `category` (optional): Filter by category
- `priority` (optional): Filter by priority
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "issue_text": "Cannot connect to VPN from home office",
      "category": "network",
      "priority": "high",
      "status": "open",
      "created_at": "2024-01-01T12:00:00.000Z",
      "updated_at": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### Get Specific Ticket
```http
GET /api/tickets/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "issue_text": "Cannot connect to VPN from home office",
    "category": "network",
    "priority": "high",
    "status": "open",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

### Update Ticket
```http
PUT /api/tickets/:id
```

**Request Body:**
```json
{
  "status": "in_progress",
  "priority": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "issue_text": "Cannot connect to VPN from home office",
    "category": "network",
    "priority": "medium",
    "status": "in_progress",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T12:05:00.000Z"
  },
  "message": "Ticket updated successfully"
}
```

### Delete Ticket
```http
DELETE /api/tickets/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket deleted successfully"
}
```

---

## 🤖 AI Classification

### Classify Ticket
```http
POST /api/tickets/classify
```

**Request Body:**
```json
{
  "issue_text": "Cannot connect to VPN from home office. Getting error message 'Connection timeout'",
  "category": "network",
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "network",
    "priority": "high",
    "confidence": 0.95,
    "urgency_score": 4,
    "impact_level": "individual",
    "suggested_automation": "vpn_restart",
    "classification_reasoning": "Network connectivity issue affecting user's ability to work remotely",
    "estimated_resolution_time": 15,
    "automation_suggested": true,
    "classification_timestamp": "2024-01-01T12:00:00.000Z"
  },
  "message": "Ticket classified successfully"
}
```

---

## ✅ Ticket Resolution

### Resolve Ticket
```http
POST /api/tickets/resolve
```

**Request Body:**
```json
{
  "ticket_id": "550e8400-e29b-41d4-a716-446655440001",
  "action_taken": "Restarted VPN service and provided new configuration file. User successfully connected.",
  "resolved_by_agent": "ai_assistant",
  "resolution_time": 15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resolution": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "ticket_id": "550e8400-e29b-41d4-a716-446655440001",
      "action_taken": "Restarted VPN service and provided new configuration file. User successfully connected.",
      "resolved_by_agent": "ai_assistant",
      "resolution_time": 15,
      "created_at": "2024-01-01T12:15:00.000Z"
    },
    "ticket": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "status": "resolved",
      "resolved_at": "2024-01-01T12:15:00.000Z"
    }
  },
  "message": "Ticket resolved successfully"
}
```

---

## 📊 Statistics

### Get Ticket Statistics
```http
GET /api/tickets/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "by_status": {
      "open": 45,
      "in_progress": 30,
      "resolved": 60,
      "closed": 15
    },
    "by_category": {
      "network": 40,
      "software": 35,
      "hardware": 30,
      "account": 25,
      "security": 15,
      "other": 5
    },
    "by_priority": {
      "low": 30,
      "medium": 60,
      "high": 45,
      "critical": 15
    },
    "recent_tickets": 25
  }
}
```

---

## 🏥 Health Check

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0",
  "environment": "development",
  "database": {
    "connected": true,
    "message": "Database connection successful"
  }
}
```

---

## 🚨 Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information (development only)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## 🔧 Environment Variables

Create `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🧪 Testing

Run the test suite:

```bash
npm test
```

This will test:
- All API endpoints
- Error handling
- Performance benchmarks
- Database connectivity

---

## 📝 Examples

### cURL Examples

```bash
# Create ticket
curl -X POST http://localhost:3001/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "issue_text": "Cannot connect to VPN",
    "category": "network",
    "priority": "high"
  }'

# List tickets
curl http://localhost:3001/api/tickets

# Classify ticket
curl -X POST http://localhost:3001/api/tickets/classify \
  -H "Content-Type: application/json" \
  -d '{
    "issue_text": "Cannot connect to VPN from home office",
    "category": "network",
    "priority": "high"
  }'

# Resolve ticket
curl -X POST http://localhost:3001/api/tickets/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "550e8400-e29b-41d4-a716-446655440001",
    "action_taken": "Restarted VPN service",
    "resolved_by_agent": "ai_assistant",
    "resolution_time": 15
  }'
```

### JavaScript/Node.js Examples

```javascript
const axios = require('axios');

// Create ticket
async function createTicket() {
  try {
    const response = await axios.post('http://localhost:3001/api/tickets', {
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      issue_text: 'Cannot connect to VPN',
      category: 'network',
      priority: 'high'
    });
    console.log('Ticket created:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Classify ticket
async function classifyTicket(issueText) {
  try {
    const response = await axios.post('http://localhost:3001/api/tickets/classify', {
      issue_text: issueText,
      category: 'network',
      priority: 'high'
    });
    console.log('Classification:', response.data.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}
```

---

## 🚀 Deployment

### Production Setup

1. **Environment Variables:**
   ```env
   NODE_ENV=production
   PORT=3001
   FRONTEND_URL=https://your-frontend.com
   ```

2. **Database:**
   - Use connection pooling
   - Enable RLS policies
   - Set up backups

3. **Security:**
   - Add JWT authentication
   - Enable HTTPS
   - Configure CORS properly
   - Set up rate limiting

4. **Monitoring:**
   - Add logging
   - Set up health checks
   - Monitor performance metrics

---

## 📞 Support

For issues and questions:
1. Check the error responses
2. Review the test suite
3. Check environment variables
4. Verify database schema
