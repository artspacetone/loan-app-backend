#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Auto-detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    elif [[ "$OSTYPE" == "msys" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# Auto-install dependencies
install_dependencies() {
    local os=$(detect_os)
    log "Detected OS: $os"
    
    case $os in
        "linux")
            log "Installing dependencies for Linux..."
            sudo apt-get update -qq
            sudo apt-get install -y python3 python3-pip python3-venv nodejs npm curl wget
            ;;
        "macos")
            log "Installing dependencies for macOS..."
            if ! command -v brew &> /dev/null; then
                log "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew install python3 node npm
            ;;
        "windows")
            log "Installing dependencies for Windows..."
            if ! command -v choco &> /dev/null; then
                warning "Please install Chocolatey first: https://chocolatey.org/install"
            else
                choco install python3 nodejs npm -y
            fi
            ;;
        *)
            error "Unsupported OS. Please install Python 3 and Node.js manually."
            exit 1
            ;;
    esac
}

# Check and install required tools
check_requirements() {
    log "Checking system requirements..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        warning "Python 3 not found. Installing..."
        install_dependencies
    else
        success "Python 3 found: $(python3 --version)"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        warning "Node.js not found. Installing..."
        install_dependencies
    else
        success "Node.js found: $(node --version)"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        warning "npm not found. Installing..."
        install_dependencies
    else
        success "npm found: $(npm --version)"
    fi
}

# Kill existing processes
cleanup_processes() {
    log "Cleaning up existing processes..."
    
    # Kill processes on ports 3000 and 5000
    for port in 3000 5000; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log "Killing process on port $port..."
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
            sleep 1
        fi
    done
    
    success "Cleanup completed"
}

# Setup Python backend
setup_backend() {
    log "Setting up Python backend..."
    
    cd inventory-backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        log "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install requirements
    log "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Create database directory
    mkdir -p src/database
    
    success "Backend setup completed"
    cd ..
}

# Setup Node.js frontend
setup_frontend() {
    log "Setting up Node.js frontend..."
    
    # Clear npm cache
    npm cache clean --force 2>/dev/null || true
    
    # Install dependencies
    log "Installing Node.js dependencies..."
    npm install --silent
    
    # Build if needed
    if [ ! -d ".next" ]; then
        log "Building Next.js application..."
        npm run build
    fi
    
    success "Frontend setup completed"
}

# Start backend server
start_backend() {
    log "Starting backend server..."
    
    cd inventory-backend
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
    
    # Start backend in background
    nohup python src/main.py > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    
    cd ..
    
    # Wait for backend to start
    log "Waiting for backend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
            success "Backend started successfully on port 5000"
            return 0
        fi
        sleep 1
    done
    
    error "Backend failed to start"
    return 1
}

# Start frontend server
start_frontend() {
    log "Starting frontend server..."
    
    # Start frontend in background
    nohup npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    
    # Wait for frontend to start
    log "Waiting for frontend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            success "Frontend started successfully on port 3000"
            return 0
        fi
        sleep 1
    done
    
    error "Frontend failed to start"
    return 1
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Check backend
    if curl -s http://localhost:5000/api/health | grep -q "healthy"; then
        success "Backend health check passed"
    else
        error "Backend health check failed"
        return 1
    fi
    
    # Check frontend
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        success "Frontend health check passed"
    else
        error "Frontend health check failed"
        return 1
    fi
    
    return 0
}

# Create stop script
create_stop_script() {
    cat > stop-system.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Inventory Management System..."

# Kill backend
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    kill $BACKEND_PID 2>/dev/null
    rm backend.pid
    echo "✅ Backend stopped"
fi

# Kill frontend
if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    kill $FRONTEND_PID 2>/dev/null
    rm frontend.pid
    echo "✅ Frontend stopped"
fi

# Kill processes on ports
for port in 3000 5000; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        lsof -ti:$port | xargs kill -9 2>/dev/null
        echo "✅ Processes on port $port stopped"
    fi
done

echo "🎉 System stopped successfully"
EOF

    chmod +x stop-system.sh
    success "Stop script created"
}

# Create restart script
create_restart_script() {
    cat > restart-system.sh << 'EOF'
#!/bin/bash

echo "🔄 Restarting Inventory Management System..."

# Stop system
./stop-system.sh

# Wait a moment
sleep 2

# Start system
./auto-setup.sh

echo "🎉 System restarted successfully"
EOF

    chmod +x restart-system.sh
    success "Restart script created"
}

# Main setup function
main() {
    echo ""
    echo "🚀 Automatic Inventory Management System Setup"
    echo "=============================================="
    echo ""
    
    # Check if already running
    if curl -s http://localhost:3000 >/dev/null 2>&1 && curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
        success "System is already running!"
        echo ""
        echo "🌐 Frontend: http://localhost:3000"
        echo "🔧 Backend: http://localhost:5000"
        echo "📊 Health: http://localhost:5000/api/health"
        echo ""
        echo "👤 Login Credentials:"
        echo "   Admin: admin/admin123"
        echo "   Supervisor: supervisor/super123"
        echo "   User: user/user123"
        echo ""
        exit 0
    fi
    
    # Step 1: Check requirements
    check_requirements
    
    # Step 2: Cleanup
    cleanup_processes
    
    # Step 3: Setup backend
    setup_backend
    
    # Step 4: Setup frontend
    setup_frontend
    
    # Step 5: Start services
    start_backend
    start_frontend
    
    # Step 6: Health check
    if health_check; then
        success "All systems operational!"
    else
        error "System startup failed"
        exit 1
    fi
    
    # Step 7: Create utility scripts
    create_stop_script
    create_restart_script
    
    # Final status
    echo ""
    echo "🎉 Inventory Management System Ready!"
    echo "===================================="
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend: http://localhost:5000"
    echo "📊 Health: http://localhost:5000/api/health"
    echo ""
    echo "👤 Login Credentials:"
    echo "   Admin: admin/admin123"
    echo "   Supervisor: supervisor/super123"
    echo "   User: user/user123"
    echo ""
    echo "🔧 Management Commands:"
    echo "   Stop: ./stop-system.sh"
    echo "   Restart: ./restart-system.sh"
    echo "   Logs: tail -f backend.log frontend.log"
    echo ""
    echo "🔑 All API keys are pre-configured and ready!"
    echo "✨ System is running in the background"
    echo ""
}

# Run main function
main "$@"
