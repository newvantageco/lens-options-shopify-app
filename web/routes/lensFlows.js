const express = require('express');
const router = express.Router();
const LensFlow = require('../models/LensFlow');
const { makeShopifyRequest, sanitizeShopDomain } = require('../middleware/shopifyAuth');
const { authenticateToken } = require('../middleware/auth');

// Get all lens flows for a shop
router.get('/', authenticateToken, async (req, res) => {
  try {
    const flows = await LensFlow.find({ 
      shop: req.shop, 
      isActive: true 
    }).sort({ createdAt: -1 });
    
    res.json(flows);
  } catch (error) {
    console.error('Get lens flows error:', error);
    res.status(500).json({ error: 'Failed to get lens flows' });
  }
});

// Get specific lens flow
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const flow = await LensFlow.findOne({ 
      _id: req.params.id, 
      shop: req.shop 
    });
    
    if (!flow) {
      return res.status(404).json({ error: 'Lens flow not found' });
    }
    
    res.json(flow);
  } catch (error) {
    console.error('Get lens flow error:', error);
    res.status(500).json({ error: 'Failed to get lens flow' });
  }
});

// Create new lens flow
router.post('/', authenticateToken, async (req, res) => {
  try {
    const flowData = {
      ...req.body,
      shop: req.shop
    };
    
    const flow = new LensFlow(flowData);
    await flow.save();
    
    res.status(201).json(flow);
  } catch (error) {
    console.error('Create lens flow error:', error);
    res.status(500).json({ error: 'Failed to create lens flow' });
  }
});

// Update lens flow
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const flow = await LensFlow.findOneAndUpdate(
      { _id: req.params.id, shop: req.shop },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!flow) {
      return res.status(404).json({ error: 'Lens flow not found' });
    }
    
    res.json(flow);
  } catch (error) {
    console.error('Update lens flow error:', error);
    res.status(500).json({ error: 'Failed to update lens flow' });
  }
});

// Delete lens flow
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const flow = await LensFlow.findOneAndUpdate(
      { _id: req.params.id, shop: req.shop },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    
    if (!flow) {
      return res.status(404).json({ error: 'Lens flow not found' });
    }
    
    res.json({ message: 'Lens flow deleted successfully' });
  } catch (error) {
    console.error('Delete lens flow error:', error);
    res.status(500).json({ error: 'Failed to delete lens flow' });
  }
});

// Add lens to flow
router.post('/:id/lenses', authenticateToken, async (req, res) => {
  try {
    const flow = await LensFlow.findOne({ 
      _id: req.params.id, 
      shop: req.shop 
    });
    
    if (!flow) {
      return res.status(404).json({ error: 'Lens flow not found' });
    }
    
    await flow.addLens(req.body);
    
    res.json(flow);
  } catch (error) {
    console.error('Add lens error:', error);
    res.status(500).json({ error: 'Failed to add lens' });
  }
});

// Assign product to flow
router.post('/:id/products', authenticateToken, async (req, res) => {
  try {
    const { productId, productHandle, productTitle } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    const flow = await LensFlow.findOne({ 
      _id: req.params.id, 
      shop: req.shop 
    });
    
    if (!flow) {
      return res.status(404).json({ error: 'Lens flow not found' });
    }
    
    await flow.assignProduct({
      productId,
      productHandle,
      productTitle
    });
    
    res.json(flow);
  } catch (error) {
    console.error('Assign product error:', error);
    res.status(500).json({ error: 'Failed to assign product' });
  }
});

// Assign collection to flow
router.post('/:id/collections', authenticateToken, async (req, res) => {
  try {
    const { collectionId, collectionHandle, collectionTitle } = req.body;
    
    if (!collectionId) {
      return res.status(400).json({ error: 'Collection ID is required' });
    }
    
    const flow = await LensFlow.findOneAndUpdate(
      { _id: req.params.id, shop: req.shop },
      {
        $push: {
          assignedCollections: {
            collectionId,
            collectionHandle,
            collectionTitle
          }
        },
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!flow) {
      return res.status(404).json({ error: 'Lens flow not found' });
    }
    
    res.json(flow);
  } catch (error) {
    console.error('Assign collection error:', error);
    res.status(500).json({ error: 'Failed to assign collection' });
  }
});

// Get products for assignment
router.get('/:id/products/available', authenticateToken, async (req, res) => {
  try {
    const products = await makeShopifyRequest(
      req.shop,
      '/products.json?limit=50&published_status=published'
    );
    
    res.json(products.products);
  } catch (error) {
    console.error('Get available products error:', error);
    res.status(500).json({ error: 'Failed to get available products' });
  }
});

// Get collections for assignment
router.get('/:id/collections/available', authenticateToken, async (req, res) => {
  try {
    const collections = await makeShopifyRequest(
      req.shop,
      '/collections.json?limit=50'
    );
    
    res.json(collections.collections);
  } catch (error) {
    console.error('Get available collections error:', error);
    res.status(500).json({ error: 'Failed to get available collections' });
  }
});

// Get flow by product (for frontend)
router.get('/product/:productId', async (req, res) => {
  try {
    const flows = await LensFlow.findByProduct(req.shop, req.params.productId);
    
    if (flows.length === 0) {
      return res.status(404).json({ error: 'No lens flow found for this product' });
    }
    
    res.json(flows[0]); // Return first matching flow
  } catch (error) {
    console.error('Get flow by product error:', error);
    res.status(500).json({ error: 'Failed to get lens flow' });
  }
});

// Get flow by collection (for frontend)
router.get('/collection/:collectionId', async (req, res) => {
  try {
    const flows = await LensFlow.findByCollection(req.shop, req.params.collectionId);
    
    if (flows.length === 0) {
      return res.status(404).json({ error: 'No lens flow found for this collection' });
    }
    
    res.json(flows[0]); // Return first matching flow
  } catch (error) {
    console.error('Get flow by collection error:', error);
    res.status(500).json({ error: 'Failed to get lens flow' });
  }
});

// Duplicate lens flow
router.post('/:id/duplicate', authenticateToken, async (req, res) => {
  try {
    const originalFlow = await LensFlow.findOne({ 
      _id: req.params.id, 
      shop: req.shop 
    });
    
    if (!originalFlow) {
      return res.status(404).json({ error: 'Lens flow not found' });
    }
    
    const duplicatedFlow = new LensFlow({
      ...originalFlow.toObject(),
      _id: undefined,
      name: `${originalFlow.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await duplicatedFlow.save();
    
    res.status(201).json(duplicatedFlow);
  } catch (error) {
    console.error('Duplicate lens flow error:', error);
    res.status(500).json({ error: 'Failed to duplicate lens flow' });
  }
});

// Get flow statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const Order = require('../models/Order');
    
    const stats = await Order.aggregate([
      {
        $match: {
          lensFlowId: mongoose.Types.ObjectId(req.params.id),
          shop: req.shop
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          averageOrderValue: { $avg: '$totalPrice' }
        }
      }
    ]);
    
    res.json(stats[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 });
  } catch (error) {
    console.error('Get flow stats error:', error);
    res.status(500).json({ error: 'Failed to get flow statistics' });
  }
});

module.exports = router;
