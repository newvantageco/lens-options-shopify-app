const mongoose = require('mongoose');

const prescriptionTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['single-vision', 'progressive', 'reading', 'non-prescription', 'frame-only']
  },
  displayName: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    nativeBundling: {
      type: Boolean,
      default: false
    },
    allowAddOns: {
      type: Boolean,
      default: true
    },
    requirePrescription: {
      type: Boolean,
      default: true
    }
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  }
});

const lensGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: String,
  icon: String,
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  }
});

const lensOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  compareAtPrice: Number,
  isRecommended: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  }
});

const lensSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    required: true,
    enum: ['clear', 'blue-light-blocking', 'photochromic', 'sunglasses', 'polarized-sunglasses']
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  compareAtPrice: Number,
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  options: [lensOptionSchema],
  addOns: [{
    productId: {
      type: String,
      required: true
    },
    variantId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  }
});

const lensFlowSchema = new mongoose.Schema({
  shop: {
    type: String,
    required: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  },
  prescriptionTypes: [prescriptionTypeSchema],
  lensGroups: [lensGroupSchema],
  lenses: [lensSchema],
  assignedProducts: [{
    productId: {
      type: String,
      required: true
    },
    productHandle: String,
    productTitle: String
  }],
  assignedCollections: [{
    collectionId: {
      type: String,
      required: true
    },
    collectionHandle: String,
    collectionTitle: String
  }],
  settings: {
    showMatrixImage: {
      type: Boolean,
      default: true
    },
    allowQuickBuy: {
      type: Boolean,
      default: true
    },
    requirePrescriptionUpload: {
      type: Boolean,
      default: false
    },
    customCSS: String,
    customJS: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
lensFlowSchema.index({ shop: 1, isActive: 1 });
lensFlowSchema.index({ 'assignedProducts.productId': 1 });
lensFlowSchema.index({ 'assignedCollections.collectionId': 1 });

// Virtual for total lens count
lensFlowSchema.virtual('totalLenses').get(function() {
  return this.lenses.filter(lens => lens.isActive).length;
});

// Method to add lens to flow
lensFlowSchema.methods.addLens = function(lensData) {
  this.lenses.push(lensData);
  this.updatedAt = new Date();
  return this.save();
};

// Method to assign product to flow
lensFlowSchema.methods.assignProduct = function(productData) {
  const existingProduct = this.assignedProducts.find(
    p => p.productId === productData.productId
  );
  
  if (!existingProduct) {
    this.assignedProducts.push(productData);
    this.updatedAt = new Date();
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Static method to find flows by product
lensFlowSchema.statics.findByProduct = function(shop, productId) {
  return this.find({
    shop,
    isActive: true,
    'assignedProducts.productId': productId
  });
};

// Static method to find flows by collection
lensFlowSchema.statics.findByCollection = function(shop, collectionId) {
  return this.find({
    shop,
    isActive: true,
    'assignedCollections.collectionId': collectionId
  });
};

module.exports = mongoose.model('LensFlow', lensFlowSchema);
