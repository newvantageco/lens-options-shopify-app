#!/bin/bash

# 🛑 Stop Testing Environment for Lens Options Shopify App
# This script stops all testing services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

print_header "🛑 Stopping Lens Options App Testing Environment"

# Stop test server
if [ -f ".test-server.pid" ]; then
    TEST_PID=$(cat .test-server.pid)
    if kill -0 $TEST_PID 2>/dev/null; then
        kill $TEST_PID
        print_success "Test server stopped (PID: $TEST_PID)"
    else
        print_warning "Test server was not running"
    fi
    rm -f .test-server.pid
else
    print_warning "No test server PID file found"
fi

# Stop frontend server
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        print_success "Frontend server stopped (PID: $FRONTEND_PID)"
    else
        print_warning "Frontend server was not running"
    fi
    rm -f .frontend.pid
else
    print_warning "No frontend server PID file found"
fi

# Kill any remaining Node.js processes on our ports
print_status "Checking for remaining processes on ports 3001 and 5173..."

# Kill processes on port 3001
PORT_3001_PID=$(lsof -ti:3001 2>/dev/null || echo "")
if [ ! -z "$PORT_3001_PID" ]; then
    kill $PORT_3001_PID 2>/dev/null || true
    print_success "Killed process on port 3001 (PID: $PORT_3001_PID)"
fi

# Kill processes on port 5173
PORT_5173_PID=$(lsof -ti:5173 2>/dev/null || echo "")
if [ ! -z "$PORT_5173_PID" ]; then
    kill $PORT_5173_PID 2>/dev/null || true
    print_success "Killed process on port 5173 (PID: $PORT_5173_PID)"
fi

print_success "🎉 All testing services stopped successfully!"
print_status "You can now start testing again with: ./start-testing.sh"
