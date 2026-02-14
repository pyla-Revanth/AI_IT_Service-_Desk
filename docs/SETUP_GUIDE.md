# AI IT Service Desk - Complete Setup Guide

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18.x or higher
- **Python**: 3.8 or higher  
- **Database**: Supabase (PostgreSQL)
- **Memory**: Minimum 4GB RAM
- **Storage**: Minimum 10GB free space
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### Required Accounts
- **Supabase Account**: https://supabase.com
- **OpenAI Account**: https://platform.openai.com
- **Git**: For version control

## 🚀 Quick Setup (5 Minutes)

### 1. Clone Repository
```bash
git clone <repository-url>
cd AI_IT_Service-_Desk
```

### 2. Automated Setup
```bash
# Windows
.\setup.ps1

# Linux/macOS
chmod +x setup.sh
./setup.sh
```

### 3. Configure Environment
```bash
# Backend configuration
cd backend
cp .env.example .env
# Edit .env with your credentials

# Frontend configuration  
cd ../frontend
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 4. Database Setup
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project
3. Run SQL from `database/schema.sql`
4. Get API keys from Settings → API

### 5. Start Application
```bash
# From root directory
npm run dev
```

## 🔧 Detailed Configuration

### Backend Environment Variables
Create `backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Configuration  
OPENAI_API_KEY=sk-your-openai-key

# Server Configuration
FRONTEND_URL=http://localhost:3000
PORT=3001
NODE_ENV=development

# Optional: Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### Frontend Environment Variables
Create `frontend/.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional: Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=true
```

## 📊 Database Setup

### 1. Create Supabase Project
1. Sign up/login to [Supabase](https://supabase.com)
2. Click "New Project"
3. Choose organization and database password
4. Wait for project creation (2-3 minutes)

### 2. Run Database Schema
1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of `database/schema.sql`
3. Paste and run the SQL
4. Verify tables are created

### 3. Configure Authentication
1. Go to Authentication → Settings
2. Configure email provider
3. Set site URL: `http://localhost:3000`
4. Enable email confirmations

### 4. Get API Keys
1. Go to Settings → API
2. Copy Project URL and anon key
3. Go to Settings → Database → API
4. Copy service_role key

## 🤖 AI Configuration

### OpenAI Setup
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create account and add payment method
3. Go to API Keys → Create new key
4. Copy key to `.env` file

### Test AI Integration
```bash
# Test OpenAI connection
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Hello"}]}'
```

## 🔌 Automation Setup

### Python Dependencies
```bash
# Install required Python packages
pip install psutil winshell  # Windows
pip install psutil python-nmap  # Linux/macOS
```

### Script Permissions
```bash
# Linux/macOS - Make scripts executable
chmod +x scripts/*.py

# Windows - Run as Administrator for system scripts
```

### Test Automation Scripts
```bash
# Test disk cleanup
python3 scripts/disk_cleanup.py '{"min_free_space_gb": 5}'

# Test VPN restart  
python3 scripts/vpn_restart.py '{"vpn_service": "openvpn"}'
```

## 🌐 Running the Application

### Development Mode
```bash
# Start both frontend and backend
npm run dev

# Start individually
npm run dev:frontend  # Port 3000
npm run dev:backend   # Port 3001
```

### Production Mode
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔍 Verification Steps

### 1. Health Checks
```bash
# Backend health
curl http://localhost:3001/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### 2. Database Connection
```bash
# Test database connection
cd backend
node -e "const db = require('./database/client'); db.getTickets().then(console.log)"
```

### 3. Frontend Access
1. Open browser to `http://localhost:3000`
2. Should see login/signup page
3. Create test account
4. Verify email confirmation

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
netstat -tulpn | grep :3000
# Kill process
kill -9 <PID>
```

#### Database Connection Failed
```bash
# Check Supabase URL and keys
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection
curl -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  "$SUPABASE_URL/rest/v1/tickets"
```

#### OpenAI API Errors
```bash
# Verify API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

#### Python Script Errors
```bash
# Check Python version
python3 --version

# Install missing packages
pip3 install -r requirements.txt
```

### Log Locations
- **Backend logs**: `backend/logs/app.log`
- **Frontend logs**: Browser console
- **Database logs**: Supabase Dashboard
- **Automation logs**: Console output

### Debug Mode
Enable debug logging:
```env
# backend/.env
LOG_LEVEL=debug
NODE_ENV=development

# frontend/.env.local  
NEXT_PUBLIC_ENABLE_DEBUG=true
```

## 🔒 Security Configuration

### Environment Security
```bash
# Set proper file permissions
chmod 600 .env
chmod 600 .env.local

# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

### API Security
- Use HTTPS in production
- Implement rate limiting
- Validate all inputs
- Use parameterized queries
- Enable CORS properly

### Database Security
- Use Row Level Security (RLS)
- Limit service key usage
- Regular backups
- Monitor access logs

## 📈 Performance Optimization

### Backend Optimization
```bash
# Enable Node.js clustering
export NODE_OPTIONS="--max-old-space-size=4096"

# Use PM2 for production
npm install -g pm2
pm2 start backend/server.js -i max
```

### Database Optimization
- Add proper indexes
- Use connection pooling
- Optimize queries
- Monitor performance

### Frontend Optimization
```bash
# Analyze bundle size
npm run build:npm-analyze

# Enable compression
npm install compression
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Backend (Railway)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### Database (Supabase)
- Already hosted by Supabase
- Configure backup settings
- Monitor usage metrics

## 📞 Support

### Getting Help
1. Check [FAQ](docs/FAQ.md)
2. Search [Issues](../../issues)
3. Join [Discord Community](https://discord.gg/...)
4. Email support@company.com

### Contributing
1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

---

**Next Steps**: After setup, see [User Guide](USER_GUIDE.md) for usage instructions.
