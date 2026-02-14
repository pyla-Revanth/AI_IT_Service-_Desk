# AI IT Service Desk Platform

An autonomous IT service desk platform that uses AI to classify, diagnose, and resolve helpdesk tickets automatically.

## Features

- 🤖 **AI Ticket Classification**: Automatically categorize and prioritize tickets using OpenAI
- 💬 **Chat-based IT Assistant**: Interactive AI assistant for real-time support
- ⚡ **Automation Script Executor**: Python scripts for automated issue resolution
- 📊 **Ticket Dashboard**: Real-time ticket management and monitoring
- 🔐 **Supabase Authentication**: Secure user authentication and authorization
- 📝 **Resolution Logs**: Comprehensive tracking of all ticket activities

## Tech Stack

### Frontend
- Next.js 14
- Tailwind CSS
- TypeScript
- Supabase Client
- Lucide React Icons

### Backend
- Node.js + Express
- OpenAI API
- Supabase (PostgreSQL)
- Python automation scripts
- Socket.io for real-time updates

## Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Supabase account
- OpenAI API key

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd AI_IT_Service-_Desk

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project
2. Run the database schema from `backend/database_schema.sql` in your Supabase SQL editor
3. Get your project URL and service role key from Supabase settings

### 3. Configure Environment Variables

```bash
# In backend directory
cp .env.example .env
```

Edit `.env` with your credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
FRONTEND_URL=http://localhost:3000
PORT=3001
```

### 4. Set Up Frontend Environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Start the Application

```bash
# From root directory - starts both frontend and backend
npm run dev

# Or start individually:
# Frontend (port 3000)
cd frontend && npm run dev

# Backend (port 3001)
cd backend && npm run dev
```

## Usage

### Creating Tickets
1. Sign up or log in to the application
2. Click "Create New Ticket"
3. Enter title and description
4. AI automatically classifies and prioritizes the ticket

### Chat Assistant
1. Select a ticket from the dashboard
2. Use the chat interface to get AI assistance
3. AI can trigger automation scripts for common issues

### Automation Scripts
The system includes pre-built automation scripts:
- Cache clearing
- Service restarts
- Password resets
- Network diagnostics
- System health checks

## API Endpoints

### Tickets
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets` - Get tickets (supports filtering)

### Chat
- `POST /api/chat` - Send message to AI assistant

### Automation
- `GET /api/automation/scripts` - Get available scripts
- `POST /api/automation/execute` - Execute automation script

### Health
- `GET /api/health` - Health check endpoint

## Database Schema

### Tables
- `users` - User profiles and roles
- `tickets` - Support tickets with AI classification
- `chat_messages` - Chat history
- `automation_scripts` - Available automation scripts

## Security Features

- Row Level Security (RLS) in Supabase
- Rate limiting on API endpoints
- Helmet.js for security headers
- Input validation and sanitization
- CORS configuration

## Development

### Adding New Automation Scripts
1. Create Python script in `backend/automation/`
2. Add script metadata to `automation_scripts` table
3. Update script execution logic in `server.js`

### Customizing AI Prompts
Modify the classification and chat prompts in `backend/server.js` to fit your specific use case.

### Frontend Components
- `TicketDashboard` - Main ticket management interface
- `ChatInterface` - AI assistant chat component
- `AuthGuard` - Authentication wrapper

## Deployment

### Frontend (Vercel)
1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Railway/Render)
1. Connect repository to Railway/Render
2. Set environment variables
3. Deploy with automatic builds

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check existing GitHub issues
2. Create new issue with detailed description
3. Contact development team

---

**Note**: This is an MVP prototype designed for hackathon-level demonstrations. Production use requires additional security, scalability, and monitoring features.