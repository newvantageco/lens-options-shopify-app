const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const shopSchema = new mongoose.Schema({
  shop: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  accessToken: {
    type: String,
    required: true
  },
  scope: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  plan: {
    type: String,
    enum: ['basic', 'pro', 'enterprise'],
    default: 'basic'
  },
  settings: {
    customCSS: String,
    customJS: String,
    nativeBundling: {
      type: Boolean,
      default: false
    },
    singleLineitemBundling: {
      type: Boolean,
      default: false
    },
    savePrescriptionInOrder: {
      type: Boolean,
      default: false
    },
    encryptPrescriptionData: {
      type: Boolean,
      default: true
    },
    dataRetentionDays: {
      type: Number,
      default: 2555 // 7 years
    },
    translations: {
      type: Map,
      of: String,
      default: new Map()
    }
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

// Index for better performance
shopSchema.index({ shop: 1 });
shopSchema.index({ isActive: 1 });

// Encrypt access token before saving
shopSchema.pre('save', async function(next) {
  if (this.isModified('accessToken')) {
    this.accessToken = await bcrypt.hash(this.accessToken, 12);
  }
  next();
});

// Virtual for decrypted access token
shopSchema.methods.getAccessToken = async function() {
  // In a real implementation, you'd decrypt the token here
  return this.accessToken;
};

// Method to update settings
shopSchema.methods.updateSettings = function(newSettings) {
  this.settings = { ...this.settings, ...newSettings };
  this.updatedAt = new Date();
  return this.save();
};

// Static method to find active shops
shopSchema.statics.findActiveShops = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('Shop', shopSchema);
