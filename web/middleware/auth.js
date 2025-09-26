const jwt = require('jsonwebtoken');

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

// Middleware to authenticate session token (for frontend)
function authenticateSession(req, res, next) {
  const token = req.query.token || req.body.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Session token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid session token' });
    }
    req.shop = user.shop;
    next();
  });
}

// Middleware to check if shop is active
async function checkShopActive(req, res, next) {
  try {
    const Shop = require('../models/Shop');
    const shop = await Shop.findOne({ shop: req.shop, isActive: true });
    
    if (!shop) {
      return res.status(403).json({ error: 'Shop is not active' });
    }
    
    req.shopData = shop;
    next();
  } catch (error) {
    console.error('Check shop active error:', error);
    res.status(500).json({ error: 'Failed to verify shop status' });
  }
}

// Middleware to validate request data
function validateRequest(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }
    
    next();
  };
}

// Middleware to handle async errors
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Middleware to log requests
function logRequests(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}

// Middleware to rate limit by shop
function rateLimitByShop() {
  const requests = new Map();
  
  return (req, res, next) => {
    const shop = req.shop;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100;
    
    if (!requests.has(shop)) {
      requests.set(shop, []);
    }
    
    const shopRequests = requests.get(shop);
    
    // Remove old requests
    const validRequests = shopRequests.filter(time => now - time < windowMs);
    requests.set(shop, validRequests);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    validRequests.push(now);
    next();
  };
}

module.exports = {
  authenticateToken,
  authenticateSession,
  checkShopActive,
  validateRequest,
  asyncHandler,
  logRequests,
  rateLimitByShop
};
