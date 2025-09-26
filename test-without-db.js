#!/usr/bin/env node

/**
 * Test Script Without Database
 * Tests the app structure and basic functionality without requiring MongoDB
 */

const express = require('express');
const path = require('path');

console.log('🧪 Testing Lens Options App (Without Database)...\n');

// Test 1: Create Express app
console.log('1. Testing Express app setup...');
try {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Test middleware
  app.use((req, res, next) => {
    console.log(`   📝 ${req.method} ${req.path}`);
    next();
  });
  
  console.log('✅ Express app created successfully');
} catch (error) {
  console.log('❌ Express app creation failed:', error.message);
  process.exit(1);
}

// Test 2: Test route structure
console.log('\n2. Testing route structure...');
try {
  const fs = require('fs');
  const routeFiles = [
    './web/routes/auth.js',
    './web/routes/lensFlows.js',
    './web/routes/prescriptions.js',
    './web/routes/orders.js',
    './web/routes/settings.js',
    './web/routes/webhooks.js'
  ];
  
  routeFiles.forEach(routeFile => {
    if (fs.existsSync(routeFile)) {
      const content = fs.readFileSync(routeFile, 'utf8');
      if (content.includes('router.get') || content.includes('router.post')) {
        console.log(`   ✅ ${routeFile} - has routes`);
      } else {
        console.log(`   ⚠️  ${routeFile} - no routes found`);
      }
    } else {
      console.log(`   ❌ ${routeFile} - missing`);
    }
  });
} catch (error) {
  console.log('❌ Route structure test failed:', error.message);
}

// Test 3: Test model structure
console.log('\n3. Testing model structure...');
try {
  const fs = require('fs');
  const modelFiles = [
    './web/models/Shop.js',
    './web/models/LensFlow.js',
    './web/models/Prescription.js',
    './web/models/Order.js'
  ];
  
  modelFiles.forEach(modelFile => {
    if (fs.existsSync(modelFile)) {
      const content = fs.readFileSync(modelFile, 'utf8');
      if (content.includes('mongoose.Schema') && content.includes('module.exports')) {
        console.log(`   ✅ ${modelFile} - valid model`);
      } else {
        console.log(`   ⚠️  ${modelFile} - invalid model structure`);
      }
    } else {
      console.log(`   ❌ ${modelFile} - missing`);
    }
  });
} catch (error) {
  console.log('❌ Model structure test failed:', error.message);
}

// Test 4: Test middleware structure
console.log('\n4. Testing middleware structure...');
try {
  const fs = require('fs');
  const middlewareFiles = [
    './web/middleware/auth.js',
    './web/middleware/shopifyAuth.js'
  ];
  
  middlewareFiles.forEach(middlewareFile => {
    if (fs.existsSync(middlewareFile)) {
      const content = fs.readFileSync(middlewareFile, 'utf8');
      if (content.includes('module.exports') && (content.includes('function') || content.includes('=>'))) {
        console.log(`   ✅ ${middlewareFile} - valid middleware`);
      } else {
        console.log(`   ⚠️  ${middlewareFile} - invalid middleware structure`);
      }
    } else {
      console.log(`   ❌ ${middlewareFile} - missing`);
    }
  });
} catch (error) {
  console.log('❌ Middleware structure test failed:', error.message);
}

// Test 5: Test frontend structure
console.log('\n5. Testing frontend structure...');
try {
  const fs = require('fs');
  const frontendFiles = [
    './frontend/src/App.tsx',
    './frontend/src/components/Layout.tsx',
    './frontend/src/pages/Dashboard.tsx',
    './frontend/src/services/api.ts',
    './frontend/package.json',
    './frontend/vite.config.ts'
  ];
  
  frontendFiles.forEach(frontendFile => {
    if (fs.existsSync(frontendFile)) {
      console.log(`   ✅ ${frontendFile} - exists`);
    } else {
      console.log(`   ❌ ${frontendFile} - missing`);
    }
  });
} catch (error) {
  console.log('❌ Frontend structure test failed:', error.message);
}

// Test 6: Test extension structure
console.log('\n6. Testing extension structure...');
try {
  const fs = require('fs');
  const extensionFiles = [
    './extensions/lens-options-product-block/shopify.extension.toml',
    './extensions/lens-options-product-block/src/ProductBlock.tsx',
    './extensions/lens-options-product-block/src/index.tsx',
    './extensions/lens-options-cart-block/shopify.extension.toml',
    './extensions/lens-options-cart-block/src/CartBlock.tsx',
    './extensions/lens-options-cart-block/src/index.tsx'
  ];
  
  extensionFiles.forEach(extensionFile => {
    if (fs.existsSync(extensionFile)) {
      console.log(`   ✅ ${extensionFile} - exists`);
    } else {
      console.log(`   ❌ ${extensionFile} - missing`);
    }
  });
} catch (error) {
  console.log('❌ Extension structure test failed:', error.message);
}

// Test 7: Test static files
console.log('\n7. Testing static files...');
try {
  const fs = require('fs');
  const staticFiles = [
    './web/public/lens-options.js',
    './web/public/lens-options.css'
  ];
  
  staticFiles.forEach(staticFile => {
    if (fs.existsSync(staticFile)) {
      const stats = fs.statSync(staticFile);
      console.log(`   ✅ ${staticFile} - ${(stats.size / 1024).toFixed(1)}KB`);
    } else {
      console.log(`   ❌ ${staticFile} - missing`);
    }
  });
} catch (error) {
  console.log('❌ Static files test failed:', error.message);
}

// Test 8: Test configuration files
console.log('\n8. Testing configuration files...');
try {
  const fs = require('fs');
  const configFiles = [
    './package.json',
    './shopify.app.toml',
    './env.example',
    './README.md'
  ];
  
  configFiles.forEach(configFile => {
    if (fs.existsSync(configFile)) {
      console.log(`   ✅ ${configFile} - exists`);
    } else {
      console.log(`   ❌ ${configFile} - missing`);
    }
  });
} catch (error) {
  console.log('❌ Configuration files test failed:', error.message);
}

// Test 9: Test package.json scripts
console.log('\n9. Testing package.json scripts...');
try {
  const packageJson = require('./package.json');
  const requiredScripts = ['start', 'dev', 'build'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts[script]) {
      console.log(`   ✅ Script '${script}': ${packageJson.scripts[script]}`);
    } else {
      console.log(`   ❌ Script '${script}' missing`);
    }
  });
  
  // Check dependencies
  const requiredDeps = ['express', 'mongoose', 'cors', 'helmet'];
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`   ✅ Dependency '${dep}': ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`   ❌ Dependency '${dep}' missing`);
    }
  });
} catch (error) {
  console.log('❌ Package.json test failed:', error.message);
}

// Test 10: Test Shopify app configuration
console.log('\n10. Testing Shopify app configuration...');
try {
  const fs = require('fs');
  const tomlContent = fs.readFileSync('./shopify.app.toml', 'utf8');
  
  if (tomlContent.includes('name = "lens-options"')) {
    console.log('   ✅ App name configured');
  } else {
    console.log('   ⚠️  App name not found');
  }
  
  if (tomlContent.includes('embedded = true')) {
    console.log('   ✅ App is configured as embedded');
  } else {
    console.log('   ⚠️  Embedded configuration not found');
  }
  
  if (tomlContent.includes('scopes =')) {
    console.log('   ✅ Scopes configured');
  } else {
    console.log('   ⚠️  Scopes not configured');
  }
} catch (error) {
  console.log('❌ Shopify app configuration test failed:', error.message);
}

console.log('\n🎉 Structure tests completed!');
console.log('\n📋 To run the full app:');
console.log('   1. Install MongoDB: brew install mongodb-community');
console.log('   2. Start MongoDB: brew services start mongodb-community');
console.log('   3. Configure .env file');
console.log('   4. Start backend: npm run dev');
console.log('   5. Start frontend: cd frontend && npm run dev');
console.log('\n🚀 The app structure is ready for testing!');
