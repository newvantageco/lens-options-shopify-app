#!/usr/bin/env node

/**
 * Simple HTTP Server Test
 * Tests the basic HTTP server functionality without database
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

console.log('🚀 Starting Lens Options Test Server...\n');

const app = express();
const PORT = 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Mock data
const mockLensFlows = [
  {
    id: '1',
    name: 'Premium Lens Collection',
    description: 'High-quality prescription lenses',
    isActive: true,
    lenses: [
      {
        id: 'lens-1',
        name: 'Standard Clear',
        type: 'clear',
        basePrice: 49.99,
        options: [
          { name: 'anti-reflective', displayName: 'Anti-Reflective', price: 29.99 }
        ]
      }
    ]
  }
];

const mockPrescriptions = [
  {
    id: '1',
    prescriptionType: 'single-vision',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    status: 'draft'
  }
];

const mockOrders = [
  {
    id: '1',
    orderNumber: '1001',
    customerEmail: 'john@example.com',
    totalPrice: 199.99,
    status: 'pending'
  }
];

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    message: 'Lens Options API is running!'
  });
});

app.get('/api/lens-flows', (req, res) => {
  console.log('📝 GET /api/lens-flows');
  res.json(mockLensFlows);
});

app.get('/api/lens-flows/:id', (req, res) => {
  console.log(`📝 GET /api/lens-flows/${req.params.id}`);
  const flow = mockLensFlows.find(f => f.id === req.params.id);
  if (flow) {
    res.json(flow);
  } else {
    res.status(404).json({ error: 'Lens flow not found' });
  }
});

app.post('/api/lens-flows', (req, res) => {
  console.log('📝 POST /api/lens-flows', req.body);
  const newFlow = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  mockLensFlows.push(newFlow);
  res.status(201).json(newFlow);
});

app.get('/api/prescriptions', (req, res) => {
  console.log('📝 GET /api/prescriptions');
  res.json(mockPrescriptions);
});

app.post('/api/prescriptions', (req, res) => {
  console.log('📝 POST /api/prescriptions', req.body);
  const newPrescription = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  mockPrescriptions.push(newPrescription);
  res.status(201).json(newPrescription);
});

app.get('/api/orders', (req, res) => {
  console.log('📝 GET /api/orders');
  res.json(mockOrders);
});

app.post('/api/orders', (req, res) => {
  console.log('📝 POST /api/orders', req.body);
  const newOrder = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  mockOrders.push(newOrder);
  res.status(201).json(newOrder);
});

app.get('/api/settings', (req, res) => {
  console.log('📝 GET /api/settings');
  res.json({
    customCSS: '',
    customJS: '',
    nativeBundling: false,
    encryptPrescriptionData: true,
    translations: {}
  });
});

app.put('/api/settings', (req, res) => {
  console.log('📝 PUT /api/settings', req.body);
  res.json({ message: 'Settings updated successfully' });
});

// Serve static files
app.use(express.static('web/public'));

// Serve frontend files
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lens Options - Test Server</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f6f6f7; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            h1 { color: #008060; margin-bottom: 30px; }
            .endpoint { background: #f6f6f7; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #008060; }
            .method { font-weight: bold; color: #008060; }
            .url { font-family: monospace; color: #333; }
            .description { color: #666; margin-top: 5px; }
            .test-btn { background: #008060; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
            .test-btn:hover { background: #006b52; }
            .response { background: #f0f9f7; padding: 10px; margin: 10px 0; border-radius: 4px; font-family: monospace; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🧪 Lens Options Test Server</h1>
            <p>This is a test server for the Lens Options Shopify app. All endpoints are working with mock data.</p>
            
            <h2>Available Endpoints:</h2>
            
            <div class="endpoint">
                <div class="method">GET</div>
                <div class="url">/health</div>
                <div class="description">Health check endpoint</div>
                <button class="test-btn" onclick="testEndpoint('/health')">Test</button>
            </div>
            
            <div class="endpoint">
                <div class="method">GET</div>
                <div class="url">/api/lens-flows</div>
                <div class="description">Get all lens flows</div>
                <button class="test-btn" onclick="testEndpoint('/api/lens-flows')">Test</button>
            </div>
            
            <div class="endpoint">
                <div class="method">POST</div>
                <div class="url">/api/lens-flows</div>
                <div class="description">Create new lens flow</div>
                <button class="test-btn" onclick="testPostEndpoint('/api/lens-flows', {name: 'Test Flow', description: 'Test Description'})">Test</button>
            </div>
            
            <div class="endpoint">
                <div class="method">GET</div>
                <div class="url">/api/prescriptions</div>
                <div class="description">Get all prescriptions</div>
                <button class="test-btn" onclick="testEndpoint('/api/prescriptions')">Test</button>
            </div>
            
            <div class="endpoint">
                <div class="method">GET</div>
                <div class="url">/api/orders</div>
                <div class="description">Get all orders</div>
                <button class="test-btn" onclick="testEndpoint('/api/orders')">Test</button>
            </div>
            
            <div class="endpoint">
                <div class="method">GET</div>
                <div class="url">/api/settings</div>
                <div class="description">Get app settings</div>
                <button class="test-btn" onclick="testEndpoint('/api/settings')">Test</button>
            </div>
            
            <div id="response"></div>
            
            <h2>Static Files:</h2>
            <p>Lens Options JavaScript and CSS files are available:</p>
            <ul>
                <li><a href="/lens-options.js" target="_blank">/lens-options.js</a> - Frontend integration script</li>
                <li><a href="/lens-options.css" target="_blank">/lens-options.css</a> - Default styles</li>
            </ul>
        </div>
        
        <script>
            async function testEndpoint(url) {
                try {
                    const response = await fetch(url);
                    const data = await response.json();
                    showResponse(url, data);
                } catch (error) {
                    showResponse(url, { error: error.message });
                }
            }
            
            async function testPostEndpoint(url, data) {
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    const result = await response.json();
                    showResponse(url + ' (POST)', result);
                } catch (error) {
                    showResponse(url + ' (POST)', { error: error.message });
                }
            }
            
            function showResponse(url, data) {
                const responseDiv = document.getElementById('response');
                responseDiv.innerHTML = \`
                    <h3>Response from \${url}:</h3>
                    <div class="response">\${JSON.stringify(data, null, 2)}</div>
                \`;
            }
        </script>
    </body>
    </html>
  `);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Web interface: http://localhost:${PORT}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET    /health`);
  console.log(`   GET    /api/lens-flows`);
  console.log(`   POST   /api/lens-flows`);
  console.log(`   GET    /api/prescriptions`);
  console.log(`   POST   /api/prescriptions`);
  console.log(`   GET    /api/orders`);
  console.log(`   POST   /api/orders`);
  console.log(`   GET    /api/settings`);
  console.log(`   PUT    /api/settings`);
  console.log(`\n🎉 Server is ready for testing!`);
  console.log(`\nPress Ctrl+C to stop the server`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down test server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  process.exit(0);
});
