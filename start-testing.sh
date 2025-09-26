#!/bin/bash

# 🧪 Start Testing Environment for Lens Options Shopify App
# This script starts all the testing tools and interfaces

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
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
    echo -e "${CYAN}$1${NC}"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
}

# Check if test server is running
check_test_server() {
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Test server is already running on port 3001"
        return 0
    else
        print_warning "Test server is not running. Starting it now..."
        return 1
    fi
}

# Start test server
start_test_server() {
    print_status "Starting test server..."
    node test-server.js &
    TEST_SERVER_PID=$!
    
    # Wait for server to start
    sleep 3
    
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Test server started successfully (PID: $TEST_SERVER_PID)"
        echo $TEST_SERVER_PID > .test-server.pid
    else
        print_error "Failed to start test server"
        exit 1
    fi
}

# Start frontend development server
start_frontend() {
    print_status "Starting frontend development server..."
    
    if [ -d "frontend" ]; then
        cd frontend
        
        # Check if dependencies are installed
        if [ ! -d "node_modules" ]; then
            print_status "Installing frontend dependencies..."
            npm install
        fi
        
        # Start frontend server
        npm run dev &
        FRONTEND_PID=$!
        cd ..
        
        print_success "Frontend development server started (PID: $FRONTEND_PID)"
        echo $FRONTEND_PID > .frontend.pid
    else
        print_warning "Frontend directory not found, skipping frontend server"
    fi
}

# Open testing interfaces
open_interfaces() {
    print_status "Opening testing interfaces..."
    
    # Open web testing interface
    if command -v open &> /dev/null; then
        open test-interface.html
        print_success "Web testing interface opened in browser"
    elif command -v xdg-open &> /dev/null; then
        xdg-open test-interface.html
        print_success "Web testing interface opened in browser"
    else
        print_warning "Could not open browser automatically. Please open test-interface.html manually"
    fi
}

# Show testing information
show_testing_info() {
    print_header "\n🧪 Testing Environment Started Successfully!"
    echo ""
    print_status "Available Testing Interfaces:"
    echo "  🌐 Web Interface:     file://$(pwd)/test-interface.html"
    echo "  🔧 Test Server:       http://localhost:3001"
    echo "  📊 Health Check:      http://localhost:3001/health"
    echo "  🎨 Frontend Dev:      http://localhost:5173 (if started)"
    echo ""
    print_status "Available Testing Tools:"
    echo "  📝 Interactive CLI:   node interactive-test.js"
    echo "  🧪 Test Suite:        npm test"
    echo "  📋 Testing Guide:     ./TESTING_GUIDE.md"
    echo ""
    print_status "Quick Commands:"
    echo "  curl http://localhost:3001/health"
    echo "  curl http://localhost:3001/api/prescriptions"
    echo "  curl http://localhost:3001/api/lens-flows"
    echo ""
    print_status "To stop all services:"
    echo "  ./stop-testing.sh"
    echo ""
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    # Kill test server
    if [ -f ".test-server.pid" ]; then
        TEST_PID=$(cat .test-server.pid)
        if kill -0 $TEST_PID 2>/dev/null; then
            kill $TEST_PID
            print_success "Test server stopped"
        fi
        rm -f .test-server.pid
    fi
    
    # Kill frontend server
    if [ -f ".frontend.pid" ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            print_success "Frontend server stopped"
        fi
        rm -f .frontend.pid
    fi
}

# Handle Ctrl+C
trap cleanup EXIT

# Main execution
main() {
    print_header "🚀 Starting Lens Options App Testing Environment"
    echo ""
    
    check_node
    
    if ! check_test_server; then
        start_test_server
    fi
    
    start_frontend
    open_interfaces
    show_testing_info
    
    print_success "🎉 Testing environment is ready!"
    print_status "Press Ctrl+C to stop all services"
    
    # Keep script running
    while true; do
        sleep 1
    done
}

# Run main function
main "$@"
