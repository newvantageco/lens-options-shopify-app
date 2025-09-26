const mongoose = require('mongoose');

const orderLineItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  variantId: {
    type: String,
    required: true
  },
  productType: {
    type: String,
    enum: ['frame', 'lens', 'addon'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  compareAtPrice: Number,
  properties: {
    type: Map,
    of: String,
    default: new Map()
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  }
});

const orderSchema = new mongoose.Schema({
  shop: {
    type: String,
    required: true,
    lowercase: true
  },
  shopifyOrderId: {
    type: String,
    required: true,
    unique: true
  },
  orderNumber: String,
  customerId: String,
  customerEmail: String,
  
  // Order items
  lineItems: [orderLineItemSchema],
  
  // Bundling information
  bundles: [{
    bundleId: String,
    frameItem: orderLineItemSchema,
    lensItem: orderLineItemSchema,
    addOnItems: [orderLineItemSchema],
    totalPrice: Number,
    isNativeBundled: {
      type: Boolean,
      default: false
    }
  }],
  
  // Prescription information
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  prescriptionData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  
  // Lens flow information
  lensFlowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LensFlow'
  },
  selectedLens: {
    lensId: String,
    lensName: String,
    lensType: String,
    options: [{
      name: String,
      value: String,
      price: Number
    }],
    addOns: [{
      productId: String,
      variantId: String,
      name: String,
      price: Number
    }]
  },
  
  // Order status
  status: {
    type: String,
    enum: ['pending', 'processing', 'fulfilled', 'cancelled', 'refunded'],
    default: 'pending'
  },
  
  // Financial information
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  totalTax: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Processing information
  processingNotes: String,
  labMetadata: {
    type: Map,
    of: String,
    default: new Map()
  },
  
  // Fulfillment tracking
  fulfillmentStatus: {
    type: String,
    enum: ['unfulfilled', 'partial', 'fulfilled'],
    default: 'unfulfilled'
  },
  trackingNumber: String,
  trackingCompany: String,
  trackingUrl: String,
  
  // Audit information
  createdBy: String,
  updatedBy: String,
  lastProcessedAt: Date,
  
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  }
}, {
  timestamps: true
});

// Indexes for better performance
orderSchema.index({ shop: 1, status: 1 });
orderSchema.index({ shopifyOrderId: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ prescriptionId: 1 });
orderSchema.index({ lensFlowId: 1 });
orderSchema.index({ createdAt: 1 });

// Virtual for total lens items
orderSchema.virtual('lensItems').get(function() {
  return this.lineItems.filter(item => item.productType === 'lens');
});

// Virtual for total frame items
orderSchema.virtual('frameItems').get(function() {
  return this.lineItems.filter(item => item.productType === 'frame');
});

// Virtual for total addon items
orderSchema.virtual('addonItems').get(function() {
  return this.lineItems.filter(item => item.productType === 'addon');
});

// Method to add line item
orderSchema.methods.addLineItem = function(itemData) {
  this.lineItems.push(itemData);
  this.updatedAt = new Date();
  return this.save();
};

// Method to create bundle
orderSchema.methods.createBundle = function(bundleData) {
  this.bundles.push(bundleData);
  this.updatedAt = new Date();
  return this.save();
};

// Method to update status
orderSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  if (notes) {
    this.processingNotes = notes;
  }
  this.updatedAt = new Date();
  return this.save();
};

// Method to add tracking information
orderSchema.methods.addTracking = function(trackingData) {
  this.trackingNumber = trackingData.trackingNumber;
  this.trackingCompany = trackingData.trackingCompany;
  this.trackingUrl = trackingData.trackingUrl;
  this.fulfillmentStatus = 'fulfilled';
  this.updatedAt = new Date();
  return this.save();
};

// Static method to find orders by customer
orderSchema.statics.findByCustomer = function(shop, customerId) {
  return this.find({ shop, customerId }).sort({ createdAt: -1 });
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function(shop, status) {
  return this.find({ shop, status }).sort({ createdAt: -1 });
};

// Static method to find orders with prescriptions
orderSchema.statics.findWithPrescriptions = function(shop) {
  return this.find({ 
    shop, 
    prescriptionId: { $exists: true, $ne: null } 
  }).populate('prescriptionId').sort({ createdAt: -1 });
};

// Static method to get order statistics
orderSchema.statics.getOrderStats = function(shop, startDate, endDate) {
  const matchStage = {
    shop,
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        averageOrderValue: { $avg: '$totalPrice' }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);
