#!/bin/bash

# AI IT Service Desk - Quick Setup Script
echo "🚀 Setting up AI IT Service Desk Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd ../backend
npm install

# Create environment files
echo "🔧 Setting up environment files..."
cp .env.example .env
echo "✅ Created backend/.env - Please update with your credentials"

cd ../frontend
cat > .env.local << EOL
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EOL
echo "✅ Created frontend/.env.local - Please update with your credentials"

cd ..

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Run the database schema from 'backend/database_schema.sql' in Supabase SQL editor"
echo "3. Update backend/.env with your Supabase URL and service role key"
echo "4. Update backend/.env with your OpenAI API key"
echo "5. Update frontend/.env.local with your Supabase URL and anon key"
echo "6. Run 'npm run dev' to start the application"
echo ""
echo "🌐 Application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "📚 For detailed instructions, see README.md"
