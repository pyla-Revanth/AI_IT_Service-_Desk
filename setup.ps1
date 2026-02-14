# AI IT Service Desk - PowerShell Setup Script
Write-Host "🚀 Setting up AI IT Service Desk Platform..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python 3 is not installed. Please install Python 3.8+ first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
npm install

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location ..\backend
npm install

# Create environment files
Write-Host "🔧 Setting up environment files..." -ForegroundColor Yellow
Copy-Item .env.example .env
Write-Host "✅ Created backend\.env - Please update with your credentials" -ForegroundColor Green

Set-Location ..\frontend
@"
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
"@ | Out-File -FilePath .env.local -Encoding UTF8
Write-Host "✅ Created frontend\.env.local - Please update with your credentials" -ForegroundColor Green

Set-Location ..

Write-Host ""
Write-Host "🎉 Setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Create a Supabase project at https://supabase.com"
Write-Host "2. Run the database schema from 'backend\database_schema.sql' in Supabase SQL editor"
Write-Host "3. Update backend\.env with your Supabase URL and service role key"
Write-Host "4. Update backend\.env with your OpenAI API key"
Write-Host "5. Update frontend\.env.local with your Supabase URL and anon key"
Write-Host "6. Run 'npm run dev' to start the application"
Write-Host ""
Write-Host "🌐 Application will be available at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000"
Write-Host "   Backend:  http://localhost:3001"
Write-Host ""
Write-Host "📚 For detailed instructions, see README.md" -ForegroundColor Cyan
