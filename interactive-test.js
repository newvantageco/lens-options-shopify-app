#!/usr/bin/env node

/**
 * 🧪 Interactive Testing Script for Lens Options Shopify App
 * This script provides an interactive way to test all app features
 */

const readline = require('readline');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Configuration
const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api`;

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility functions
const log = (message, color = 'white') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow');
const logInfo = (message) => log(`ℹ️  ${message}`, 'blue');
const logHeader = (message) => log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}\n`);

// API helper functions
const apiRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Test functions
const testHealthCheck = async () => {
  logHeader('🏥 Testing Health Check');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200) {
      logSuccess('Health check passed');
      logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    }
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    return false;
  }
};

const testPrescriptionAPI = async () => {
  logHeader('💊 Testing Prescription API');
  
  // Test GET prescriptions
  logInfo('Testing GET /api/prescriptions...');
  const getResult = await apiRequest('GET', '/prescriptions');
  if (getResult.success) {
    logSuccess('GET prescriptions successful');
    logInfo(`Found ${getResult.data.length} prescriptions`);
  } else {
    logError(`GET prescriptions failed: ${getResult.error}`);
  }
  
  // Test POST prescription
  logInfo('Testing POST /api/prescriptions...');
  const newPrescription = {
    prescriptionType: 'single-vision',
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    odSphere: '-2.00',
    osSphere: '-2.00',
    pd: '64',
    status: 'draft'
  };
  
  const postResult = await apiRequest('POST', '/prescriptions', newPrescription);
  if (postResult.success) {
    logSuccess('POST prescription successful');
    logInfo(`Created prescription with ID: ${postResult.data.id}`);
    return postResult.data.id;
  } else {
    logError(`POST prescription failed: ${postResult.error}`);
    return null;
  }
};

const testLensFlowsAPI = async () => {
  logHeader('🔍 Testing Lens Flows API');
  
  // Test GET lens flows
  logInfo('Testing GET /api/lens-flows...');
  const getResult = await apiRequest('GET', '/lens-flows');
  if (getResult.success) {
    logSuccess('GET lens flows successful');
    logInfo(`Found ${getResult.data.length} lens flows`);
  } else {
    logError(`GET lens flows failed: ${getResult.error}`);
  }
  
  // Test POST lens flow
  logInfo('Testing POST /api/lens-flows...');
  const newLensFlow = {
    name: 'Test Lens Flow',
    description: 'A test lens flow for testing purposes',
    isActive: true,
    prescriptionTypes: [
      {
        name: 'single-vision',
        displayName: 'Single Vision',
        isActive: true
      }
    ],
    lensGroups: [
      {
        name: 'clear-lenses',
        displayName: 'Clear Lenses',
        description: 'Standard clear prescription lenses',
        sortOrder: 1,
        isActive: true
      }
    ],
    lenses: [],
    settings: {
      showMatrixImage: true,
      allowQuickBuy: true,
      requirePrescriptionUpload: false
    }
  };
  
  const postResult = await apiRequest('POST', '/lens-flows', newLensFlow);
  if (postResult.success) {
    logSuccess('POST lens flow successful');
    logInfo(`Created lens flow with ID: ${postResult.data.id}`);
    return postResult.data.id;
  } else {
    logError(`POST lens flow failed: ${postResult.error}`);
    return null;
  }
};

const testOrdersAPI = async () => {
  logHeader('📦 Testing Orders API');
  
  // Test GET orders
  logInfo('Testing GET /api/orders...');
  const getResult = await apiRequest('GET', '/orders');
  if (getResult.success) {
    logSuccess('GET orders successful');
    logInfo(`Found ${getResult.data.length} orders`);
  } else {
    logError(`GET orders failed: ${getResult.error}`);
  }
  
  // Test POST order
  logInfo('Testing POST /api/orders...');
  const newOrder = {
    orderNumber: `LO-${Date.now()}`,
    customerEmail: 'customer@example.com',
    totalPrice: 199.99,
    currency: 'USD',
    status: 'pending',
    selectedLens: {
      lensName: 'Standard Clear',
      lensType: 'clear',
      basePrice: 50.00
    }
  };
  
  const postResult = await apiRequest('POST', '/orders', newOrder);
  if (postResult.success) {
    logSuccess('POST order successful');
    logInfo(`Created order with ID: ${postResult.data.id}`);
    return postResult.data.id;
  } else {
    logError(`POST order failed: ${postResult.error}`);
    return null;
  }
};

const testSettingsAPI = async () => {
  logHeader('⚙️  Testing Settings API');
  
  // Test GET settings
  logInfo('Testing GET /api/settings...');
  const getResult = await apiRequest('GET', '/settings');
  if (getResult.success) {
    logSuccess('GET settings successful');
    logInfo('Current settings retrieved');
  } else {
    logError(`GET settings failed: ${getResult.error}`);
  }
  
  // Test PUT settings
  logInfo('Testing PUT /api/settings...');
  const updatedSettings = {
    customCSS: '/* Test CSS */',
    customJS: '// Test JS',
    nativeBundling: true,
    singleLineitemBundling: false,
    savePrescriptionInOrder: true,
    encryptPrescriptionData: true,
    dataRetentionDays: 2555
  };
  
  const putResult = await apiRequest('PUT', '/settings', updatedSettings);
  if (putResult.success) {
    logSuccess('PUT settings successful');
    logInfo('Settings updated successfully');
  } else {
    logError(`PUT settings failed: ${putResult.error}`);
  }
};

const testStaticFiles = async () => {
  logHeader('📁 Testing Static Files');
  
  const staticFiles = [
    '/lens-options.js',
    '/lens-options.css'
  ];
  
  for (const file of staticFiles) {
    try {
      const response = await axios.get(`${BASE_URL}${file}`);
      if (response.status === 200) {
        logSuccess(`Static file ${file} accessible`);
        logInfo(`Size: ${response.data.length} bytes`);
      }
    } catch (error) {
      logError(`Static file ${file} not accessible: ${error.message}`);
    }
  }
};

const testFileUpload = async () => {
  logHeader('📤 Testing File Upload');
  
  // Create a test file
  const testFileContent = 'This is a test prescription file';
  const testFilePath = path.join(__dirname, 'test-prescription.txt');
  fs.writeFileSync(testFilePath, testFileContent);
  
  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('files', fs.createReadStream(testFilePath));
    
    const response = await axios.post(`${API_BASE}/prescriptions/1/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.status === 200) {
      logSuccess('File upload successful');
      logInfo('Test file uploaded successfully');
    }
  } catch (error) {
    logError(`File upload failed: ${error.message}`);
  } finally {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
};

const runAllTests = async () => {
  logHeader('🚀 Running All Tests');
  
  const results = {
    healthCheck: false,
    prescriptionAPI: false,
    lensFlowsAPI: false,
    ordersAPI: false,
    settingsAPI: false,
    staticFiles: false,
    fileUpload: false
  };
  
  // Run all tests
  results.healthCheck = await testHealthCheck();
  results.prescriptionAPI = await testPrescriptionAPI();
  results.lensFlowsAPI = await testLensFlowsAPI();
  results.ordersAPI = await testOrdersAPI();
  results.settingsAPI = await testSettingsAPI();
  results.staticFiles = await testStaticFiles();
  results.fileUpload = await testFileUpload();
  
  // Summary
  logHeader('📊 Test Results Summary');
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  logInfo(`Tests Passed: ${passed}/${total}`);
  
  Object.entries(results).forEach(([test, passed]) => {
    if (passed) {
      logSuccess(`${test}: PASSED`);
    } else {
      logError(`${test}: FAILED`);
    }
  });
  
  if (passed === total) {
    logSuccess('\n🎉 All tests passed! Your app is ready for launch!');
  } else {
    logWarning(`\n⚠️  ${total - passed} tests failed. Please check the issues above.`);
  }
};

const showMenu = () => {
  logHeader('🧪 Lens Options App - Interactive Testing');
  log('Choose a test to run:');
  log('1. Health Check');
  log('2. Prescription API');
  log('3. Lens Flows API');
  log('4. Orders API');
  log('5. Settings API');
  log('6. Static Files');
  log('7. File Upload');
  log('8. Run All Tests');
  log('9. Exit');
  log('');
};

const handleChoice = async (choice) => {
  switch (choice.trim()) {
    case '1':
      await testHealthCheck();
      break;
    case '2':
      await testPrescriptionAPI();
      break;
    case '3':
      await testLensFlowsAPI();
      break;
    case '4':
      await testOrdersAPI();
      break;
    case '5':
      await testSettingsAPI();
      break;
    case '6':
      await testStaticFiles();
      break;
    case '7':
      await testFileUpload();
      break;
    case '8':
      await runAllTests();
      break;
    case '9':
      logInfo('Goodbye! 👋');
      process.exit(0);
      break;
    default:
      logError('Invalid choice. Please try again.');
  }
  
  log('\n' + '='.repeat(50) + '\n');
  showMenu();
  askForChoice();
};

const askForChoice = () => {
  rl.question('Enter your choice (1-9): ', handleChoice);
};

// Main execution
const main = async () => {
  logHeader('🚀 Lens Options Shopify App - Interactive Testing');
  logInfo(`Testing server at: ${BASE_URL}`);
  logInfo('Make sure your test server is running on port 3001');
  log('');
  
  // Check if server is running
  try {
    await axios.get(`${BASE_URL}/health`);
    logSuccess('Test server is running and accessible!');
  } catch (error) {
    logError('Test server is not running or not accessible!');
    logInfo('Please start the test server with: node test-server.js');
    process.exit(1);
  }
  
  showMenu();
  askForChoice();
};

// Handle Ctrl+C
process.on('SIGINT', () => {
  logInfo('\n\nGoodbye! 👋');
  process.exit(0);
});

// Start the interactive testing
main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
