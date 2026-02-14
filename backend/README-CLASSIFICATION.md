# AI Ticket Classification Service

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your OpenAI and Supabase credentials

# Run database schema
# Copy database/classification-schema.sql to Supabase SQL Editor

# Start classification service
npm run classification

# Run tests
npm run test-classification
```

## 📋 API Endpoints

### Base URL
```
http://localhost:3002/api
```

---

## 🤖 Classification Endpoints

### Classify Single Ticket
```http
POST /api/classify
```

**Request Body:**
```json
{
  "ticket_text": "I forgot my password and can't login to my email",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "Password Reset",
    "priority": "high",
    "automation_possible": true,
    "confidence": 0.95,
    "reasoning": "Password reset request detected with high confidence"
  },
  "message": "Ticket classified successfully"
}
```

### Classify Multiple Tickets
```http
POST /api/classify/batch
```

**Request Body:**
```json
{
  "tickets": [
    {
      "id": "ticket-1",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "text": "VPN is not working from home office"
    },
    {
      "id": "ticket-2", 
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "text": "Need Microsoft Office installed"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "ticket_id": "ticket-1",
        "classification": {
          "category": "VPN Issue",
          "priority": "high",
          "automation_possible": true,
          "confidence": 0.88
        },
        "status": "success"
      }
    ],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0,
      "success_rate": "100.00%"
    }
  }
}
```

### Get Classification Statistics
```http
GET /api/classify/stats
```

**Query Parameters:**
- `user_id` (optional): Filter by specific user

**Response:**
```json
{
  "success": true,
  "data": {
    "total_classifications": 150,
    "by_category": {
      "Password Reset": 45,
      "VPN Issue": 30,
      "Software Install": 25,
      "Device Slow": 30,
      "Account Access": 20
    },
    "by_priority": {
      "low": 20,
      "medium": 60,
      "high": 50,
      "critical": 20
    },
    "automation_possible_rate": 0.73,
    "avg_confidence": 0.87
  }
}
```

### Get Available Categories
```http
GET /api/classify/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Password Reset",
      "description": "User needs password reset, forgot password, locked account",
      "automation_possible": true,
      "typical_priority": "high"
    },
    {
      "name": "VPN Issue",
      "description": "Cannot connect to VPN, VPN slow, VPN configuration",
      "automation_possible": true,
      "typical_priority": "high"
    }
  ]
}
```

### Validate Classification
```http
POST /api/classify/validate
```

**Request Body:**
```json
{
  "classification": {
    "category": "Password Reset",
    "priority": "high",
    "automation_possible": true,
    "confidence": 0.95
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "is_valid": true,
    "errors": []
  }
}
```

### Test Classification
```http
POST /api/classify/test
```

**Response:**
```json
{
  "success": true,
  "message": "Classification tests completed - check console for results"
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
  "service": "AI Ticket Classification Service",
  "environment": "development",
  "database": {
    "connected": true,
    "message": "Database connection successful"
  },
  "openai_configured": true
}
```

---

## 📊 Categories

### Supported Categories

1. **Password Reset**
   - Description: User needs password reset, forgot password, locked account
   - Automation Possible: ✅ Yes
   - Typical Priority: High

2. **VPN Issue**
   - Description: Cannot connect to VPN, VPN slow, VPN configuration
   - Automation Possible: ✅ Yes
   - Typical Priority: High

3. **Software Install**
   - Description: Need to install software, software not working, update issues
   - Automation Possible: ❌ No
   - Typical Priority: Medium

4. **Device Slow**
   - Description: Computer running slow, performance issues, lagging
   - Automation Possible: ✅ Yes
   - Typical Priority: Medium

5. **Account Access**
   - Description: Cannot login, account locked, permission issues
   - Automation Possible: ✅ Yes
   - Typical Priority: High

---

## 🧪 Testing

### Run Test Suite
```bash
npm run test-classification
```

### Test Coverage
- ✅ Single ticket classification
- ✅ Batch classification
- ✅ Categories endpoint
- ✅ Validation endpoint
- ✅ Statistics endpoint
- ✅ Health check
- ✅ Error handling
- ✅ Performance testing

### Manual Testing

```bash
# Classify single ticket
curl -X POST http://localhost:3002/api/classify \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_text": "I forgot my password and cannot login",
    "user_id": "test-user-id"
  }'

# Get categories
curl http://localhost:3002/api/classify/categories

# Health check
curl http://localhost:3002/api/health
```

---

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server Configuration
PORT=3002
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

---

## 📈 Performance

### Benchmarks
- **Single Classification**: ~500ms
- **Batch Classification**: ~200ms per ticket
- **Concurrent Requests**: 50+ requests/second
- **Memory Usage**: <100MB
- **Accuracy**: 85-95% confidence

### Optimization Tips
1. Use batch processing for multiple tickets
2. Implement caching for repeated classifications
3. Monitor OpenAI API usage and costs
4. Use fallback classification when AI is unavailable

---

## 🛡️ Security

### Input Validation
- Ticket text length validation (max 10,000 characters)
- Category validation against allowed values
- Priority validation against allowed values
- Confidence range validation (0-1)

### Rate Limiting
- 100 requests per 15 minutes per IP
- Batch size limited to 50 tickets
- Request size limited to 10MB

### Error Handling
- Graceful fallback to keyword-based classification
- Comprehensive error logging
- Sanitized error responses
- Database transaction safety

---

## 📝 Database Schema

### ticket_classifications Table

```sql
CREATE TABLE ticket_classifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    ticket_text TEXT NOT NULL,
    category TEXT CHECK (category IN ('Password Reset', 'VPN Issue', 'Software Install', 'Device Slow', 'Account Access')),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    automation_possible BOOLEAN NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    reasoning TEXT,
    classification_method TEXT DEFAULT 'ai',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🚀 Deployment

### Production Setup

1. **Environment:**
   ```env
   NODE_ENV=production
   PORT=3002
   ```

2. **Database:**
   - Run classification schema in Supabase
   - Enable RLS policies
   - Set up monitoring

3. **OpenAI:**
   - Configure API key
   - Monitor usage and costs
   - Set up rate limits

4. **Monitoring:**
   - Health checks every minute
   - Performance metrics
   - Error rate monitoring

---

## 📞 Support

For issues:
1. Check OpenAI API key and credits
2. Verify Supabase connection
3. Review error logs
4. Run test suite for diagnostics
