const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Shop = require('../models/Shop');
const { verifyShopifyWebhook } = require('../middleware/shopifyAuth');

// Shopify OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { shop, code, state } = req.query;
    
    if (!shop || !code) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Verify state parameter for security
    if (state !== req.session.state) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }
    
    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(shop, code);
    
    // Save or update shop in database
    const shopData = {
      shop: shop.replace('.myshopify.com', ''),
      accessToken,
      scope: process.env.SHOPIFY_SCOPES,
      isActive: true
    };
    
    await Shop.findOneAndUpdate(
      { shop: shopData.shop },
      shopData,
      { upsert: true, new: true }
    );
    
    // Generate JWT for session
    const token = jwt.sign(
      { shop: shopData.shop },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Redirect to app
    res.redirect(`/app?token=${token}`);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Install app
router.get('/install', async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop parameter is required' });
    }
    
    // Generate state for security
    const state = Math.random().toString(36).substring(7);
    req.session.state = state;
    
    // Build authorization URL
    const authUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${process.env.SHOPIFY_API_KEY}&` +
      `scope=${process.env.SHOPIFY_SCOPES}&` +
      `redirect_uri=${process.env.SHOPIFY_APP_URL}/api/auth/callback&` +
      `state=${state}`;
    
    res.redirect(authUrl);
    
  } catch (error) {
    console.error('Install error:', error);
    res.status(500).json({ error: 'Installation failed' });
  }
});

// Verify webhook
router.post('/webhook', verifyShopifyWebhook, async (req, res) => {
  try {
    const { shop, topic } = req.body;
    
    switch (topic) {
      case 'app/uninstalled':
        await handleAppUninstalled(shop);
        break;
      case 'orders/create':
        await handleOrderCreated(req.body);
        break;
      case 'orders/updated':
        await handleOrderUpdated(req.body);
        break;
      default:
        console.log(`Unhandled webhook topic: ${topic}`);
    }
    
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get current shop info
router.get('/shop', authenticateToken, async (req, res) => {
  try {
    const shop = await Shop.findOne({ shop: req.shop });
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    res.json({
      shop: shop.shop,
      plan: shop.plan,
      isActive: shop.isActive,
      settings: shop.settings,
      createdAt: shop.createdAt
    });
    
  } catch (error) {
    console.error('Get shop error:', error);
    res.status(500).json({ error: 'Failed to get shop info' });
  }
});

// Update shop settings
router.put('/shop/settings', authenticateToken, async (req, res) => {
  try {
    const shop = await Shop.findOne({ shop: req.shop });
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    await shop.updateSettings(req.body);
    
    res.json({ message: 'Settings updated successfully' });
    
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Helper function to exchange code for access token
async function exchangeCodeForToken(shop, code) {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Token exchange failed: ${data.error_description}`);
  }
  
  return data.access_token;
}

// Helper function to handle app uninstalled
async function handleAppUninstalled(shop) {
  try {
    await Shop.findOneAndUpdate(
      { shop: shop.replace('.myshopify.com', '') },
      { isActive: false }
    );
    console.log(`App uninstalled for shop: ${shop}`);
  } catch (error) {
    console.error('Error handling app uninstalled:', error);
  }
}

// Helper function to handle order created
async function handleOrderCreated(orderData) {
  try {
    // Process new order
    console.log('New order created:', orderData.id);
    // Add your order processing logic here
  } catch (error) {
    console.error('Error handling order created:', error);
  }
}

// Helper function to handle order updated
async function handleOrderUpdated(orderData) {
  try {
    // Process order update
    console.log('Order updated:', orderData.id);
    // Add your order update logic here
  } catch (error) {
    console.error('Error handling order updated:', error);
  }
}

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.shop = user.shop;
    next();
  });
}

module.exports = router;
