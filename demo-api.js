#!/usr/bin/env node

/**
 * Demo API Test Script for Lens Options App
 * This script demonstrates the API functionality
 */

const mongoose = require('mongoose');
const Shop = require('./web/models/Shop');
const LensFlow = require('./web/models/LensFlow');
const Prescription = require('./web/models/Prescription');
const Order = require('./web/models/Order');

console.log('🚀 Lens Options API Demo\n');

async function runDemo() {
  try {
    // Connect to MongoDB (in-memory for demo)
    console.log('1. Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/lens-options-demo', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Create a demo shop
    console.log('\n2. Creating demo shop...');
    const demoShop = new Shop({
      shop: 'demo-store',
      accessToken: 'demo-token',
      scope: 'read_products,write_products',
      plan: 'pro',
      settings: {
        customCSS: '.demo-custom { color: blue; }',
        customJS: 'console.log("Demo custom JS loaded");',
        nativeBundling: true,
        encryptPrescriptionData: true
      }
    });
    await demoShop.save();
    console.log('✅ Demo shop created:', demoShop.shop);

    // Create a demo lens flow
    console.log('\n3. Creating demo lens flow...');
    const demoLensFlow = new LensFlow({
      shop: 'demo-store',
      name: 'Premium Lens Collection',
      description: 'High-quality prescription lenses for all needs',
      prescriptionTypes: [
        {
          name: 'single-vision',
          displayName: 'Single Vision',
          isActive: true,
          settings: {
            requirePrescription: true,
            allowAddOns: true
          }
        },
        {
          name: 'progressive',
          displayName: 'Progressive',
          isActive: true,
          settings: {
            requirePrescription: true,
            allowAddOns: true
          }
        }
      ],
      lensGroups: [
        {
          name: 'clear-lenses',
          displayName: 'Clear Lenses',
          description: 'Standard clear prescription lenses',
          sortOrder: 1,
          isActive: true
        },
        {
          name: 'premium-lenses',
          displayName: 'Premium Lenses',
          description: 'Advanced lens technologies',
          sortOrder: 2,
          isActive: true
        }
      ],
      lenses: [
        {
          name: 'standard-clear',
          displayName: 'Standard Clear',
          description: 'Basic clear prescription lens',
          type: 'clear',
          basePrice: 49.99,
          isActive: true,
          sortOrder: 1,
          options: [
            {
              name: 'anti-reflective',
              displayName: 'Anti-Reflective Coating',
              price: 29.99,
              isRecommended: true
            },
            {
              name: 'blue-light',
              displayName: 'Blue Light Protection',
              price: 39.99,
              isRecommended: false
            }
          ],
          addOns: [
            {
              productId: 'addon-1',
              variantId: 'addon-1-var',
              name: 'Lens Protection Plan',
              price: 19.99,
              isActive: true
            }
          ]
        },
        {
          name: 'premium-progressive',
          displayName: 'Premium Progressive',
          description: 'Advanced progressive lens technology',
          type: 'progressive',
          basePrice: 199.99,
          compareAtPrice: 249.99,
          isActive: true,
          sortOrder: 2,
          options: [
            {
              name: 'premium-coating',
              displayName: 'Premium Multi-Coat',
              price: 59.99,
              isRecommended: true
            }
          ],
          addOns: []
        }
      ],
      assignedProducts: [
        {
          productId: '123456789',
          productHandle: 'demo-frame',
          productTitle: 'Demo Eyeglass Frame'
        }
      ],
      settings: {
        showMatrixImage: true,
        allowQuickBuy: true,
        requirePrescriptionUpload: false
      }
    });
    await demoLensFlow.save();
    console.log('✅ Demo lens flow created:', demoLensFlow.name);

    // Create a demo prescription
    console.log('\n4. Creating demo prescription...');
    const demoPrescription = new Prescription({
      shop: 'demo-store',
      customerId: 'customer-123',
      prescriptionData: {
        prescriptionType: 'single-vision',
        odSphere: '-2.50',
        odCylinder: '-0.75',
        odAxis: '90',
        osSphere: '-2.25',
        osCylinder: '-0.50',
        osAxis: '85',
        pd: '62',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+1234567890',
        isValidated: false
      },
      status: 'draft'
    });
    await demoPrescription.save();
    console.log('✅ Demo prescription created for:', demoPrescription.prescriptionData.customerName);

    // Create a demo order
    console.log('\n5. Creating demo order...');
    const demoOrder = new Order({
      shop: 'demo-store',
      shopifyOrderId: 'order-123456',
      orderNumber: '1001',
      customerId: 'customer-123',
      customerEmail: 'john@example.com',
      lineItems: [
        {
          productId: '123456789',
          variantId: 'frame-var-1',
          productType: 'frame',
          title: 'Demo Eyeglass Frame',
          quantity: 1,
          price: 149.99,
          properties: new Map([
            ['_productType', 'frame'],
            ['_bundleId', 'bundle-1']
          ])
        },
        {
          productId: 'lens-123',
          variantId: 'lens-var-1',
          productType: 'lens',
          title: 'Standard Clear Lens',
          quantity: 1,
          price: 49.99,
          properties: new Map([
            ['_productType', 'lens'],
            ['_bundleId', 'bundle-1'],
            ['_lensName', 'Standard Clear'],
            ['_prescriptionType', 'single-vision']
          ])
        }
      ],
      selectedLens: {
        lensId: 'lens-123',
        lensName: 'Standard Clear',
        lensType: 'clear',
        options: [
          {
            name: 'anti-reflective',
            value: 'Anti-Reflective Coating',
            price: 29.99
          }
        ],
        addOns: []
      },
      prescriptionId: demoPrescription._id,
      lensFlowId: demoLensFlow._id,
      subtotal: 229.97,
      totalTax: 18.40,
      totalPrice: 248.37,
      currency: 'USD',
      status: 'pending'
    });
    await demoOrder.save();
    console.log('✅ Demo order created:', demoOrder.orderNumber);

    // Test data retrieval
    console.log('\n6. Testing data retrieval...');
    
    const shops = await Shop.find({});
    console.log(`✅ Found ${shops.length} shops`);
    
    const lensFlows = await LensFlow.find({});
    console.log(`✅ Found ${lensFlows.length} lens flows`);
    
    const prescriptions = await Prescription.find({});
    console.log(`✅ Found ${prescriptions.length} prescriptions`);
    
    const orders = await Order.find({});
    console.log(`✅ Found ${orders.length} orders`);

    // Test lens flow by product
    console.log('\n7. Testing lens flow lookup by product...');
    const flowByProduct = await LensFlow.findByProduct('demo-store', '123456789');
    if (flowByProduct.length > 0) {
      console.log('✅ Found lens flow for product:', flowByProduct[0].name);
    } else {
      console.log('❌ No lens flow found for product');
    }

    // Test order statistics
    console.log('\n8. Testing order statistics...');
    const orderStats = await Order.getOrderStats('demo-store', new Date('2024-01-01'), new Date('2024-12-31'));
    console.log('✅ Order statistics:', orderStats);

    // Display summary
    console.log('\n📊 Demo Data Summary:');
    console.log(`   Shops: ${shops.length}`);
    console.log(`   Lens Flows: ${lensFlows.length}`);
    console.log(`   Prescriptions: ${prescriptions.length}`);
    console.log(`   Orders: ${orders.length}`);
    
    console.log('\n🎯 API Endpoints Available:');
    console.log('   GET    /api/lens-flows');
    console.log('   POST   /api/lens-flows');
    console.log('   GET    /api/prescriptions');
    console.log('   POST   /api/prescriptions');
    console.log('   GET    /api/orders');
    console.log('   POST   /api/orders');
    console.log('   GET    /api/settings');
    console.log('   PUT    /api/settings');

    console.log('\n🎉 Demo completed successfully!');
    console.log('\n💡 To test the API:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Visit: http://localhost:3000/health');
    console.log('   3. Test endpoints with curl or Postman');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error(error.stack);
  } finally {
    // Clean up
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the demo
runDemo().catch(console.error);
