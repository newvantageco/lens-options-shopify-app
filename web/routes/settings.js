const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const { authenticateToken, validateRequest, asyncHandler } = require('../middleware/auth');
const Joi = require('joi');

// Validation schemas
const settingsSchema = Joi.object({
  customCSS: Joi.string().allow(''),
  customJS: Joi.string().allow(''),
  nativeBundling: Joi.boolean().default(false),
  singleLineitemBundling: Joi.boolean().default(false),
  savePrescriptionInOrder: Joi.boolean().default(false),
  encryptPrescriptionData: Joi.boolean().default(true),
  dataRetentionDays: Joi.number().min(30).max(3650).default(2555),
  translations: Joi.object().pattern(Joi.string(), Joi.string()).default({})
});

const lensFlowSettingsSchema = Joi.object({
  showMatrixImage: Joi.boolean().default(true),
  allowQuickBuy: Joi.boolean().default(true),
  requirePrescriptionUpload: Joi.boolean().default(false),
  customCSS: Joi.string().allow(''),
  customJS: Joi.string().allow('')
});

// Get shop settings
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ shop: req.shop });
  
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found' });
  }
  
  res.json({
    settings: shop.settings,
    plan: shop.plan,
    isActive: shop.isActive
  });
}));

// Update shop settings
router.put('/', authenticateToken, validateRequest(settingsSchema), asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ shop: req.shop });
  
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found' });
  }
  
  await shop.updateSettings(req.body);
  
  res.json({ message: 'Settings updated successfully' });
}));

// Get translation settings
router.get('/translations', authenticateToken, asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ shop: req.shop });
  
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found' });
  }
  
  res.json(shop.settings.translations || {});
}));

// Update translation settings
router.put('/translations', authenticateToken, asyncHandler(async (req, res) => {
  const { translations } = req.body;
  
  if (!translations || typeof translations !== 'object') {
    return res.status(400).json({ error: 'Invalid translations data' });
  }
  
  const shop = await Shop.findOne({ shop: req.shop });
  
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found' });
  }
  
  shop.settings.translations = translations;
  await shop.save();
  
  res.json({ message: 'Translations updated successfully' });
}));

// Get available locales
router.get('/locales', authenticateToken, asyncHandler(async (req, res) => {
  const locales = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'nl', name: 'Dutch' },
    { code: 'sv', name: 'Swedish' },
    { code: 'da', name: 'Danish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'fi', name: 'Finnish' },
    { code: 'pl', name: 'Polish' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' }
  ];
  
  res.json(locales);
}));

// Get default translations
router.get('/translations/default', authenticateToken, asyncHandler(async (req, res) => {
  const defaultTranslations = {
    en: {
      'select_prescription_type': 'Select Prescription Type',
      'single_vision': 'Single Vision',
      'progressive': 'Progressive',
      'reading': 'Reading',
      'non_prescription': 'Non-Prescription',
      'frame_only': 'Frame Only',
      'select_lens': 'Select Lens',
      'lens_options': 'Lens Options',
      'add_ons': 'Add-Ons',
      'review_selection': 'Review Selection',
      'add_to_cart': 'Add to Cart',
      'upload_prescription': 'Upload Prescription',
      'enter_manually': 'Enter Manually',
      'prescription_details': 'Prescription Details',
      'right_eye': 'Right Eye (OD)',
      'left_eye': 'Left Eye (OS)',
      'sphere': 'Sphere',
      'cylinder': 'Cylinder',
      'axis': 'Axis',
      'add': 'Add',
      'pupillary_distance': 'Pupillary Distance',
      'recommended': 'Recommended',
      'price': 'Price',
      'compare_at_price': 'Compare at Price',
      'select': 'Select',
      'continue': 'Continue',
      'back': 'Back',
      'close': 'Close',
      'loading': 'Loading...',
      'error': 'Error',
      'success': 'Success',
      'required_field': 'This field is required',
      'invalid_email': 'Please enter a valid email address',
      'file_too_large': 'File size must be less than 10MB',
      'invalid_file_type': 'Please upload a valid image or PDF file'
    }
  };
  
  res.json(defaultTranslations);
}));

// Export settings
router.get('/export', authenticateToken, asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ shop: req.shop });
  
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found' });
  }
  
  const exportData = {
    shop: shop.shop,
    plan: shop.plan,
    settings: shop.settings,
    metadata: shop.metadata,
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=settings.json');
  res.json(exportData);
}));

// Import settings
router.post('/import', authenticateToken, asyncHandler(async (req, res) => {
  const { settings, translations, metadata } = req.body;
  
  const shop = await Shop.findOne({ shop: req.shop });
  
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found' });
  }
  
  if (settings) {
    shop.settings = { ...shop.settings, ...settings };
  }
  
  if (translations) {
    shop.settings.translations = { ...shop.settings.translations, ...translations };
  }
  
  if (metadata) {
    shop.metadata = { ...shop.metadata, ...metadata };
  }
  
  await shop.save();
  
  res.json({ message: 'Settings imported successfully' });
}));

// Reset settings to defaults
router.post('/reset', authenticateToken, asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ shop: req.shop });
  
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found' });
  }
  
  shop.settings = {
    customCSS: '',
    customJS: '',
    nativeBundling: false,
    singleLineitemBundling: false,
    savePrescriptionInOrder: false,
    encryptPrescriptionData: true,
    dataRetentionDays: 2555,
    translations: new Map()
  };
  
  await shop.save();
  
  res.json({ message: 'Settings reset to defaults' });
}));

// Get shop plan information
router.get('/plan', authenticateToken, asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ shop: req.shop });
  
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found' });
  }
  
  const planInfo = {
    current: shop.plan,
    features: getPlanFeatures(shop.plan),
    limits: getPlanLimits(shop.plan)
  };
  
  res.json(planInfo);
}));

// Update shop plan
router.put('/plan', authenticateToken, asyncHandler(async (req, res) => {
  const { plan } = req.body;
  
  if (!['basic', 'pro', 'enterprise'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }
  
  const shop = await Shop.findOne({ shop: req.shop });
  
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found' });
  }
  
  shop.plan = plan;
  await shop.save();
  
  res.json({ 
    message: 'Plan updated successfully',
    plan: shop.plan,
    features: getPlanFeatures(shop.plan)
  });
}));

// Helper function to get plan features
function getPlanFeatures(plan) {
  const features = {
    basic: [
      'Unlimited lens flows',
      'Basic lens types',
      'Prescription handling',
      'Cart bundling',
      'Email support'
    ],
    pro: [
      'Everything in Basic',
      'Advanced lens types',
      'Add-on products',
      'Custom CSS/JS injection',
      'Analytics integration',
      'Priority support',
      'Native bundling',
      'Matrix images'
    ],
    enterprise: [
      'Everything in Pro',
      'Custom integrations',
      'Dedicated support',
      'Custom development',
      'SLA guarantee',
      'Advanced analytics',
      'Multi-store support'
    ]
  };
  
  return features[plan] || features.basic;
}

// Helper function to get plan limits
function getPlanLimits(plan) {
  const limits = {
    basic: {
      lensFlows: 'unlimited',
      lensesPerFlow: 'unlimited',
      prescriptionsPerMonth: 100,
      ordersPerMonth: 50,
      storage: '1GB'
    },
    pro: {
      lensFlows: 'unlimited',
      lensesPerFlow: 'unlimited',
      prescriptionsPerMonth: 500,
      ordersPerMonth: 200,
      storage: '10GB'
    },
    enterprise: {
      lensFlows: 'unlimited',
      lensesPerFlow: 'unlimited',
      prescriptionsPerMonth: 'unlimited',
      ordersPerMonth: 'unlimited',
      storage: 'unlimited'
    }
  };
  
  return limits[plan] || limits.basic;
}

module.exports = router;
