const express = require('express');
const router = express.Router();
const { verifyShopifyWebhook } = require('../middleware/shopifyAuth');
const Order = require('../models/Order');
const Prescription = require('../models/Prescription');
const Shop = require('../models/Shop');

// Handle app uninstalled webhook
router.post('/app/uninstalled', verifyShopifyWebhook, async (req, res) => {
  try {
    const { shop } = req.body;
    const shopDomain = shop.replace('.myshopify.com', '');
    
    // Deactivate shop
    await Shop.findOneAndUpdate(
      { shop: shopDomain },
      { isActive: false, updatedAt: new Date() }
    );
    
    console.log(`App uninstalled for shop: ${shop}`);
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('App uninstalled webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle order created webhook
router.post('/orders/create', verifyShopifyWebhook, async (req, res) => {
  try {
    const orderData = req.body;
    const shopDomain = orderData.shop_domain.replace('.myshopify.com', '');
    
    // Check if this order contains lens products
    const hasLensProducts = orderData.line_items.some(item => 
      item.vendor === 'LensAdvizor' || 
      item.properties.some(prop => prop.name.startsWith('_lens'))
    );
    
    if (hasLensProducts) {
      // Process lens order
      await processLensOrder(shopDomain, orderData);
    }
    
    console.log(`Order created webhook processed for shop: ${shopDomain}, order: ${orderData.id}`);
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Order created webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle order updated webhook
router.post('/orders/updated', verifyShopifyWebhook, async (req, res) => {
  try {
    const orderData = req.body;
    const shopDomain = orderData.shop_domain.replace('.myshopify.com', '');
    
    // Update existing order if it exists
    const existingOrder = await Order.findOne({
      shop: shopDomain,
      shopifyOrderId: orderData.id.toString()
    });
    
    if (existingOrder) {
      await updateOrderFromShopify(existingOrder, orderData);
    }
    
    console.log(`Order updated webhook processed for shop: ${shopDomain}, order: ${orderData.id}`);
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Order updated webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle order cancelled webhook
router.post('/orders/cancelled', verifyShopifyWebhook, async (req, res) => {
  try {
    const orderData = req.body;
    const shopDomain = orderData.shop_domain.replace('.myshopify.com', '');
    
    // Update order status to cancelled
    await Order.findOneAndUpdate(
      {
        shop: shopDomain,
        shopifyOrderId: orderData.id.toString()
      },
      {
        status: 'cancelled',
        updatedAt: new Date()
      }
    );
    
    console.log(`Order cancelled webhook processed for shop: ${shopDomain}, order: ${orderData.id}`);
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Order cancelled webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle order paid webhook
router.post('/orders/paid', verifyShopifyWebhook, async (req, res) => {
  try {
    const orderData = req.body;
    const shopDomain = orderData.shop_domain.replace('.myshopify.com', '');
    
    // Update order status to processing
    await Order.findOneAndUpdate(
      {
        shop: shopDomain,
        shopifyOrderId: orderData.id.toString()
      },
      {
        status: 'processing',
        updatedAt: new Date()
      }
    );
    
    console.log(`Order paid webhook processed for shop: ${shopDomain}, order: ${orderData.id}`);
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Order paid webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle order fulfilled webhook
router.post('/orders/fulfilled', verifyShopifyWebhook, async (req, res) => {
  try {
    const orderData = req.body;
    const shopDomain = orderData.shop_domain.replace('.myshopify.com', '');
    
    // Update order status to fulfilled
    await Order.findOneAndUpdate(
      {
        shop: shopDomain,
        shopifyOrderId: orderData.id.toString()
      },
      {
        status: 'fulfilled',
        fulfillmentStatus: 'fulfilled',
        updatedAt: new Date()
      }
    );
    
    console.log(`Order fulfilled webhook processed for shop: ${shopDomain}, order: ${orderData.id}`);
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Order fulfilled webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle customer data request webhook (GDPR)
router.post('/customers/data_request', verifyShopifyWebhook, async (req, res) => {
  try {
    const { shop, customer } = req.body;
    const shopDomain = shop.replace('.myshopify.com', '');
    
    // Find all prescriptions for this customer
    const prescriptions = await Prescription.find({
      shop: shopDomain,
      'prescriptionData.customerEmail': customer.email
    });
    
    // Prepare customer data
    const customerData = {
      customer: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name
      },
      prescriptions: prescriptions.map(p => ({
        id: p._id,
        prescriptionType: p.prescriptionData.prescriptionType,
        createdAt: p.createdAt,
        status: p.status
      })),
      orders: await Order.find({
        shop: shopDomain,
        customerId: customer.id.toString()
      }).select('shopifyOrderId orderNumber totalPrice createdAt status')
    };
    
    // In a real implementation, you would send this data to the customer
    console.log(`Customer data request for shop: ${shopDomain}, customer: ${customer.email}`);
    console.log('Customer data:', JSON.stringify(customerData, null, 2));
    
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Customer data request webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle customer redact webhook (GDPR)
router.post('/customers/redact', verifyShopifyWebhook, async (req, res) => {
  try {
    const { shop, customer } = req.body;
    const shopDomain = shop.replace('.myshopify.com', '');
    
    // Anonymize customer data
    await Prescription.updateMany(
      {
        shop: shopDomain,
        'prescriptionData.customerEmail': customer.email
      },
      {
        $unset: {
          'prescriptionData.customerName': 1,
          'prescriptionData.customerEmail': 1,
          'prescriptionData.customerPhone': 1,
          'prescriptionData.customerDateOfBirth': 1
        },
        $set: {
          'prescriptionData.isAnonymized': true,
          updatedAt: new Date()
        }
      }
    );
    
    await Order.updateMany(
      {
        shop: shopDomain,
        customerId: customer.id.toString()
      },
      {
        $unset: {
          customerId: 1,
          customerEmail: 1
        },
        $set: {
          isAnonymized: true,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`Customer data redacted for shop: ${shopDomain}, customer: ${customer.email}`);
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Customer redact webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle shop redact webhook (GDPR)
router.post('/shop/redact', verifyShopifyWebhook, async (req, res) => {
  try {
    const { shop } = req.body;
    const shopDomain = shop.replace('.myshopify.com', '');
    
    // Anonymize all shop data
    await Prescription.updateMany(
      { shop: shopDomain },
      {
        $set: {
          'prescriptionData.isAnonymized': true,
          updatedAt: new Date()
        }
      }
    );
    
    await Order.updateMany(
      { shop: shopDomain },
      {
        $set: {
          isAnonymized: true,
          updatedAt: new Date()
        }
      }
    );
    
    // Delete shop record
    await Shop.findOneAndDelete({ shop: shopDomain });
    
    console.log(`Shop data redacted for shop: ${shopDomain}`);
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Shop redact webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Helper function to process lens order
async function processLensOrder(shopDomain, orderData) {
  try {
    // Extract lens information from line items
    const lensItems = orderData.line_items.filter(item => 
      item.vendor === 'LensAdvizor' || 
      item.properties.some(prop => prop.name.startsWith('_lens'))
    );
    
    if (lensItems.length === 0) return;
    
    // Create order record
    const order = new Order({
      shop: shopDomain,
      shopifyOrderId: orderData.id.toString(),
      orderNumber: orderData.order_number,
      customerId: orderData.customer?.id?.toString(),
      customerEmail: orderData.customer?.email,
      lineItems: orderData.line_items.map(item => ({
        productId: item.product_id.toString(),
        variantId: item.variant_id.toString(),
        productType: item.vendor === 'LensAdvizor' ? 'lens' : 'frame',
        title: item.title,
        quantity: item.quantity,
        price: parseFloat(item.price),
        compareAtPrice: item.compare_at_price ? parseFloat(item.compare_at_price) : null,
        properties: item.properties.reduce((acc, prop) => {
          acc[prop.name] = prop.value;
          return acc;
        }, {}),
        metadata: {}
      })),
      subtotal: parseFloat(orderData.subtotal_price),
      totalTax: parseFloat(orderData.total_tax),
      totalPrice: parseFloat(orderData.total_price),
      currency: orderData.currency,
      status: 'pending'
    });
    
    await order.save();
    
    console.log(`Lens order processed: ${order._id}`);
    
  } catch (error) {
    console.error('Error processing lens order:', error);
  }
}

// Helper function to update order from Shopify
async function updateOrderFromShopify(existingOrder, orderData) {
  try {
    existingOrder.status = orderData.financial_status === 'paid' ? 'processing' : 'pending';
    existingOrder.fulfillmentStatus = orderData.fulfillment_status || 'unfulfilled';
    existingOrder.updatedAt = new Date();
    
    await existingOrder.save();
    
  } catch (error) {
    console.error('Error updating order from Shopify:', error);
  }
}

module.exports = router;
