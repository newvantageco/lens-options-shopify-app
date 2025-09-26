const crypto = require('crypto');

// Verify Shopify webhook signature
function verifyShopifyWebhook(req, res, next) {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const body = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  if (hash !== hmac) {
    return res.status(401).json({ error: 'Unauthorized webhook' });
  }

  next();
}

// Verify Shopify request signature
function verifyShopifyRequest(req, res, next) {
  const hmac = req.query.hmac;
  const query = { ...req.query };
  delete query.hmac;
  delete query.signature;

  const message = Object.keys(query)
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');

  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(message, 'utf8')
    .digest('hex');

  if (hash !== hmac) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }

  next();
}

// Get Shopify access token for shop
async function getShopifyAccessToken(shop) {
  try {
    const Shop = require('../models/Shop');
    const shopData = await Shop.findOne({ shop });
    
    if (!shopData) {
      throw new Error('Shop not found');
    }
    
    return await shopData.getAccessToken();
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// Make authenticated request to Shopify API
async function makeShopifyRequest(shop, endpoint, options = {}) {
  try {
    const accessToken = await getShopifyAccessToken(shop);
    
    const response = await fetch(`https://${shop}.myshopify.com/admin/api/2023-10${endpoint}`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Shopify API request error:', error);
    throw error;
  }
}

// Validate shop domain
function validateShopDomain(shop) {
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
  return shopRegex.test(shop);
}

// Sanitize shop domain
function sanitizeShopDomain(shop) {
  return shop.replace('.myshopify.com', '').toLowerCase();
}

module.exports = {
  verifyShopifyWebhook,
  verifyShopifyRequest,
  getShopifyAccessToken,
  makeShopifyRequest,
  validateShopDomain,
  sanitizeShopDomain
};
