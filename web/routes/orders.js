const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const LensFlow = require('../models/LensFlow');
const Prescription = require('../models/Prescription');
const { authenticateToken, validateRequest, asyncHandler } = require('../middleware/auth');
const { makeShopifyRequest } = require('../middleware/shopifyAuth');
const Joi = require('joi');

// Validation schemas
const orderSchema = Joi.object({
  shopifyOrderId: Joi.string().required(),
  orderNumber: Joi.string().allow(''),
  customerId: Joi.string().allow(''),
  customerEmail: Joi.string().email().allow(''),
  lineItems: Joi.array().items(Joi.object({
    productId: Joi.string().required(),
    variantId: Joi.string().required(),
    productType: Joi.string().valid('frame', 'lens', 'addon').required(),
    title: Joi.string().required(),
    quantity: Joi.number().min(1).required(),
    price: Joi.number().min(0).required(),
    compareAtPrice: Joi.number().min(0).allow(null),
    properties: Joi.object().pattern(Joi.string(), Joi.string()).default({}),
    metadata: Joi.object().default({})
  })).required(),
  selectedLens: Joi.object({
    lensId: Joi.string().required(),
    lensName: Joi.string().required(),
    lensType: Joi.string().required(),
    options: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      value: Joi.string().required(),
      price: Joi.number().min(0).required()
    })).default([]),
    addOns: Joi.array().items(Joi.object({
      productId: Joi.string().required(),
      variantId: Joi.string().required(),
      name: Joi.string().required(),
      price: Joi.number().min(0).required()
    })).default([])
  }).required(),
  prescriptionId: Joi.string().allow(''),
  lensFlowId: Joi.string().required(),
  subtotal: Joi.number().min(0).required(),
  totalTax: Joi.number().min(0).default(0),
  totalPrice: Joi.number().min(0).required(),
  currency: Joi.string().default('USD')
});

// Get orders for a shop
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, customerId, startDate, endDate } = req.query;
  const skip = (page - 1) * limit;
  
  const filter = { shop: req.shop };
  if (status) filter.status = status;
  if (customerId) filter.customerId = customerId;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  const orders = await Order.find(filter)
    .populate('prescriptionId', 'prescriptionData.customerName prescriptionData.customerEmail')
    .populate('lensFlowId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Order.countDocuments(filter);
  
  res.json({
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get specific order
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const order = await Order.findOne({ 
    _id: req.params.id, 
    shop: req.shop 
  })
  .populate('prescriptionId')
  .populate('lensFlowId');
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json(order);
}));

// Create new order
router.post('/', authenticateToken, validateRequest(orderSchema), asyncHandler(async (req, res) => {
  const orderData = {
    ...req.body,
    shop: req.shop,
    status: 'pending'
  };
  
  // Create bundles if native bundling is enabled
  const lensFlow = await LensFlow.findById(req.body.lensFlowId);
  if (lensFlow && lensFlow.settings.nativeBundling) {
    orderData.bundles = await createBundles(req.body.lineItems, req.body.selectedLens);
  }
  
  const order = new Order(orderData);
  await order.save();
  
  // Update prescription status if linked
  if (req.body.prescriptionId) {
    await Prescription.findByIdAndUpdate(req.body.prescriptionId, {
      status: 'submitted',
      orderId: order._id
    });
  }
  
  res.status(201).json(order);
}));

// Update order status
router.put('/:id/status', authenticateToken, asyncHandler(async (req, res) => {
  const { status, processingNotes } = req.body;
  
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, shop: req.shop },
    {
      status,
      processingNotes,
      updatedAt: new Date()
    },
    { new: true }
  );
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json(order);
}));

// Add tracking information
router.put('/:id/tracking', authenticateToken, asyncHandler(async (req, res) => {
  const { trackingNumber, trackingCompany, trackingUrl } = req.body;
  
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, shop: req.shop },
    {
      trackingNumber,
      trackingCompany,
      trackingUrl,
      fulfillmentStatus: 'fulfilled',
      updatedAt: new Date()
    },
    { new: true }
  );
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  // Update Shopify order with tracking
  try {
    await updateShopifyOrderTracking(req.shop, order.shopifyOrderId, {
      trackingNumber,
      trackingCompany,
      trackingUrl
    });
  } catch (error) {
    console.error('Error updating Shopify order tracking:', error);
  }
  
  res.json(order);
}));

// Get orders by customer
router.get('/customer/:customerId', authenticateToken, asyncHandler(async (req, res) => {
  const orders = await Order.findByCustomer(req.shop, req.params.customerId);
  res.json(orders);
}));

// Get orders by status
router.get('/status/:status', authenticateToken, asyncHandler(async (req, res) => {
  const orders = await Order.findByStatus(req.shop, req.params.status);
  res.json(orders);
}));

// Get orders with prescriptions
router.get('/with-prescriptions', authenticateToken, asyncHandler(async (req, res) => {
  const orders = await Order.findWithPrescriptions(req.shop);
  res.json(orders);
}));

// Get order statistics
router.get('/stats/overview', authenticateToken, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  
  const stats = await Order.getOrderStats(req.shop, start, end);
  
  res.json({
    period: { start, end },
    stats: stats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        totalRevenue: stat.totalRevenue,
        averageOrderValue: stat.averageOrderValue
      };
      return acc;
    }, {})
  });
}));

// Export orders
router.get('/export/csv', authenticateToken, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const filter = { shop: req.shop };
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  const orders = await Order.find(filter)
    .populate('prescriptionId', 'prescriptionData.customerName prescriptionData.customerEmail')
    .populate('lensFlowId', 'name')
    .sort({ createdAt: -1 });
  
  const csv = [
    'Order ID,Order Number,Customer Email,Status,Total Price,Currency,Created Date,Lens Flow,Prescription Status',
    ...orders.map(order => [
      order.shopifyOrderId || '',
      order.orderNumber || '',
      order.customerEmail || '',
      order.status || '',
      order.totalPrice || 0,
      order.currency || 'USD',
      order.createdAt.toISOString(),
      order.lensFlowId?.name || '',
      order.prescriptionId?.status || 'N/A'
    ].join(','))
  ].join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
  res.send(csv);
}));

// Helper function to create bundles
async function createBundles(lineItems, selectedLens) {
  const bundles = [];
  const frameItems = lineItems.filter(item => item.productType === 'frame');
  const lensItems = lineItems.filter(item => item.productType === 'lens');
  const addonItems = lineItems.filter(item => item.productType === 'addon');
  
  for (const frameItem of frameItems) {
    const bundle = {
      bundleId: `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      frameItem,
      lensItem: lensItems.find(item => item.productId === selectedLens.lensId) || null,
      addOnItems: addonItems,
      totalPrice: frameItem.price + (lensItems.find(item => item.productId === selectedLens.lensId)?.price || 0) + addonItems.reduce((sum, item) => sum + item.price, 0),
      isNativeBundled: true
    };
    
    bundles.push(bundle);
  }
  
  return bundles;
}

// Helper function to update Shopify order tracking
async function updateShopifyOrderTracking(shop, orderId, trackingData) {
  const fulfillmentData = {
    fulfillment: {
      tracking_number: trackingData.trackingNumber,
      tracking_company: trackingData.trackingCompany,
      tracking_url: trackingData.trackingUrl,
      notify_customer: true
    }
  };
  
  await makeShopifyRequest(shop, `/orders/${orderId}/fulfillments.json`, {
    method: 'POST',
    body: JSON.stringify(fulfillmentData)
  });
}

module.exports = router;
