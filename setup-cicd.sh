#!/bin/bash

# 🚀 CI/CD Setup Script for Lens Options Shopify App
# This script helps set up the CI/CD pipeline and required dependencies

set -e

echo "🚀 Setting up CI/CD for Lens Options Shopify App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    npm install
    print_success "Main dependencies installed"
    
    print_status "Installing frontend dependencies..."
    cd frontend && npm install
    cd ..
    print_success "Frontend dependencies installed"
}

# Install development dependencies
install_dev_dependencies() {
    print_status "Installing development dependencies..."
    
    # Backend dev dependencies
    npm install --save-dev eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
    npm install --save-dev jest @types/jest supertest
    npm install --save-dev @lhci/cli
    
    # Frontend dev dependencies
    cd frontend
    npm install --save-dev @testing-library/react @testing-library/jest-dom
    npm install --save-dev @playwright/test
    npm install --save-dev @vitest/coverage-v8
    cd ..
    
    print_success "Development dependencies installed"
}

# Create configuration files
create_config_files() {
    print_status "Creating configuration files..."
    
    # ESLint configuration
    cat > .eslintrc.js << 'EOF'
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
};
EOF

    # Prettier configuration
    cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
EOF

    # Jest configuration
    cat > jest.config.js << 'EOF'
module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'web/**/*.js',
    '!web/**/*.test.js',
    '!web/**/*.spec.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
EOF

    # Jest setup file
    cat > jest.setup.js << 'EOF'
// Jest setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars';
EOF

    # Lighthouse configuration
    cat > lighthouse.config.js << 'EOF'
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3001'],
      startServerCommand: 'npm start',
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
EOF

    print_success "Configuration files created"
}

# Create sample test files
create_sample_tests() {
    print_status "Creating sample test files..."
    
    # Create test directory
    mkdir -p __tests__
    
    # Sample backend test
    cat > __tests__/health.test.js << 'EOF'
const request = require('supertest');
const app = require('../web/index');

describe('Health Check', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });
});
EOF

    # Sample frontend test
    mkdir -p frontend/src/__tests__
    cat > frontend/src/__tests__/App.test.tsx << 'EOF'
import { render, screen } from '@testing-library/react';
import { App } from '../App';

describe('App', () => {
  test('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Lens Options/i)).toBeInTheDocument();
  });
});
EOF

    print_success "Sample test files created"
}

# Setup environment variables
setup_env() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cp env.example .env
        print_success "Environment file created from template"
        print_warning "Please update .env with your actual values"
    else
        print_warning ".env file already exists, skipping creation"
    fi
}

# Run initial tests
run_tests() {
    print_status "Running initial tests..."
    
    # Run backend tests
    if npm test; then
        print_success "Backend tests passed"
    else
        print_warning "Backend tests failed - this is expected for initial setup"
    fi
    
    # Run frontend tests
    cd frontend
    if npm test -- --run; then
        print_success "Frontend tests passed"
    else
        print_warning "Frontend tests failed - this is expected for initial setup"
    fi
    cd ..
}

# Main setup function
main() {
    echo "🚀 Starting CI/CD setup for Lens Options Shopify App..."
    echo ""
    
    check_node
    check_npm
    install_dependencies
    install_dev_dependencies
    create_config_files
    create_sample_tests
    setup_env
    run_tests
    
    echo ""
    print_success "🎉 CI/CD setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update .env file with your actual values"
    echo "2. Configure GitHub repository secrets"
    echo "3. Set up environments in GitHub repository settings"
    echo "4. Push your changes to trigger the CI/CD pipeline"
    echo ""
    echo "📚 For detailed setup instructions, see:"
    echo "   .github/CI_CD_SETUP.md"
    echo ""
    echo "🔗 GitHub Repository:"
    echo "   https://github.com/newvantageco/lens-options-shopify-app"
    echo ""
}

# Run main function
main "$@"
