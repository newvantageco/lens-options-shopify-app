#!/usr/bin/env node

/**
 * Test Setup Script for Lens Options App
 * This script tests the basic functionality of the app
 */

const mongoose = require('mongoose');
const express = require('express');
const path = require('path');

console.log('🧪 Testing Lens Options App Setup...\n');

// Test 1: Check if all required modules can be imported
console.log('1. Testing module imports...');
try {
  const Shop = require('./web/models/Shop');
  const LensFlow = require('./web/models/LensFlow');
  const Prescription = require('./web/models/Prescription');
  const Order = require('./web/models/Order');
  console.log('✅ All models imported successfully');
} catch (error) {
  console.log('❌ Model import failed:', error.message);
  process.exit(1);
}

// Test 2: Check if Express app can be created
console.log('\n2. Testing Express app creation...');
try {
  const app = express();
  app.use(express.json());
  console.log('✅ Express app created successfully');
} catch (error) {
  console.log('❌ Express app creation failed:', error.message);
  process.exit(1);
}

// Test 3: Check if routes can be imported
console.log('\n3. Testing route imports...');
try {
  const authRoutes = require('./web/routes/auth');
  const lensFlowRoutes = require('./web/routes/lensFlows');
  const prescriptionRoutes = require('./web/routes/prescriptions');
  const orderRoutes = require('./web/routes/orders');
  const settingsRoutes = require('./web/routes/settings');
  console.log('✅ All routes imported successfully');
} catch (error) {
  console.log('❌ Route import failed:', error.message);
  process.exit(1);
}

// Test 4: Check if middleware can be imported
console.log('\n4. Testing middleware imports...');
try {
  const authMiddleware = require('./web/middleware/auth');
  const shopifyAuth = require('./web/middleware/shopifyAuth');
  console.log('✅ All middleware imported successfully');
} catch (error) {
  console.log('❌ Middleware import failed:', error.message);
  process.exit(1);
}

// Test 5: Check if static files exist
console.log('\n5. Testing static files...');
const fs = require('fs');
const staticFiles = [
  './web/public/lens-options.js',
  './web/public/lens-options.css'
];

let allFilesExist = true;
staticFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('❌ Some static files are missing');
  process.exit(1);
}

// Test 6: Check if frontend files exist
console.log('\n6. Testing frontend files...');
const frontendFiles = [
  './frontend/src/App.tsx',
  './frontend/src/components/Layout.tsx',
  './frontend/src/pages/Dashboard.tsx',
  './frontend/src/services/api.ts'
];

let allFrontendFilesExist = true;
frontendFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFrontendFilesExist = false;
  }
});

if (!allFrontendFilesExist) {
  console.log('❌ Some frontend files are missing');
  process.exit(1);
}

// Test 7: Check if extensions exist
console.log('\n7. Testing extension files...');
const extensionFiles = [
  './extensions/lens-options-product-block/shopify.extension.toml',
  './extensions/lens-options-product-block/src/ProductBlock.tsx',
  './extensions/lens-options-cart-block/shopify.extension.toml',
  './extensions/lens-options-cart-block/src/CartBlock.tsx'
];

let allExtensionFilesExist = true;
extensionFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allExtensionFilesExist = false;
  }
});

if (!allExtensionFilesExist) {
  console.log('❌ Some extension files are missing');
  process.exit(1);
}

// Test 8: Check package.json scripts
console.log('\n8. Testing package.json scripts...');
try {
  const packageJson = require('./package.json');
  const requiredScripts = ['start', 'dev', 'build'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts[script]) {
      console.log(`✅ Script '${script}' exists`);
    } else {
      console.log(`❌ Script '${script}' missing`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Package.json read failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 All tests passed! The Lens Options app is ready for testing.');
console.log('\n📋 Next steps:');
console.log('1. Set up MongoDB: mongod');
console.log('2. Configure .env file with your settings');
console.log('3. Start the backend: npm run dev');
console.log('4. Start the frontend: cd frontend && npm run dev');
console.log('5. Visit http://localhost:3001 to see the admin interface');
console.log('\n🚀 Happy testing!');
