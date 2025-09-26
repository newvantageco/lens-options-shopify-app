const express = require('express');
const router = express.Router();
const multer = require('multer');
const AWS = require('aws-sdk');
const Prescription = require('../models/Prescription');
const { authenticateToken, validateRequest, asyncHandler } = require('../middleware/auth');
const Joi = require('joi');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Validation schemas
const prescriptionSchema = Joi.object({
  prescriptionType: Joi.string().valid('single-vision', 'progressive', 'reading', 'non-prescription', 'frame-only').required(),
  odSphere: Joi.string().allow(''),
  odCylinder: Joi.string().allow(''),
  odAxis: Joi.string().allow(''),
  odAdd: Joi.string().allow(''),
  osSphere: Joi.string().allow(''),
  osCylinder: Joi.string().allow(''),
  osAxis: Joi.string().allow(''),
  osAdd: Joi.string().allow(''),
  pd: Joi.string().allow(''),
  customerName: Joi.string().allow(''),
  customerEmail: Joi.string().email().allow(''),
  customerPhone: Joi.string().allow(''),
  doctorName: Joi.string().allow(''),
  doctorPhone: Joi.string().allow(''),
  prescriptionDate: Joi.date().allow(''),
  expirationDate: Joi.date().allow('')
});

// Get prescriptions for a shop
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, customerId } = req.query;
  const skip = (page - 1) * limit;
  
  const filter = { shop: req.shop };
  if (status) filter.status = status;
  if (customerId) filter.customerId = customerId;
  
  const prescriptions = await Prescription.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Prescription.countDocuments(filter);
  
  res.json({
    prescriptions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get specific prescription
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const prescription = await Prescription.findOne({ 
    _id: req.params.id, 
    shop: req.shop 
  });
  
  if (!prescription) {
    return res.status(404).json({ error: 'Prescription not found' });
  }
  
  // Track access
  await prescription.trackAccess(req.shop);
  
  res.json(prescription);
}));

// Create new prescription
router.post('/', authenticateToken, validateRequest(prescriptionSchema), asyncHandler(async (req, res) => {
  const prescriptionData = {
    ...req.body,
    shop: req.shop,
    status: 'draft'
  };
  
  const prescription = new Prescription(prescriptionData);
  await prescription.save();
  
  res.status(201).json(prescription);
}));

// Update prescription
router.put('/:id', authenticateToken, validateRequest(prescriptionSchema), asyncHandler(async (req, res) => {
  const prescription = await Prescription.findOneAndUpdate(
    { _id: req.params.id, shop: req.shop },
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  
  if (!prescription) {
    return res.status(404).json({ error: 'Prescription not found' });
  }
  
  res.json(prescription);
}));

// Upload prescription files
router.post('/:id/upload', authenticateToken, upload.array('files', 5), asyncHandler(async (req, res) => {
  const prescription = await Prescription.findOne({ 
    _id: req.params.id, 
    shop: req.shop 
  });
  
  if (!prescription) {
    return res.status(404).json({ error: 'Prescription not found' });
  }
  
  const uploadedFiles = [];
  
  for (const file of req.files) {
    const fileName = `prescriptions/${req.shop}/${req.params.id}/${Date.now()}-${file.originalname}`;
    
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ServerSideEncryption: 'AES256'
    };
    
    const result = await s3.upload(uploadParams).promise();
    
    uploadedFiles.push({
      filename: fileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: result.Location
    });
  }
  
  prescription.prescriptionData.uploadedFiles.push(...uploadedFiles);
  await prescription.save();
  
  res.json({ uploadedFiles });
}));

// Validate prescription
router.post('/:id/validate', authenticateToken, asyncHandler(async (req, res) => {
  const { isValidated, validationNotes } = req.body;
  
  const prescription = await Prescription.findOneAndUpdate(
    { _id: req.params.id, shop: req.shop },
    {
      'prescriptionData.isValidated': isValidated,
      'prescriptionData.validatedBy': req.shop,
      'prescriptionData.validatedAt': new Date(),
      'prescriptionData.validationNotes': validationNotes,
      status: isValidated ? 'validated' : 'rejected',
      updatedAt: new Date()
    },
    { new: true }
  );
  
  if (!prescription) {
    return res.status(404).json({ error: 'Prescription not found' });
  }
  
  res.json(prescription);
}));

// Delete prescription
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const prescription = await Prescription.findOneAndDelete({ 
    _id: req.params.id, 
    shop: req.shop 
  });
  
  if (!prescription) {
    return res.status(404).json({ error: 'Prescription not found' });
  }
  
  // Delete associated files from S3
  if (prescription.prescriptionData.uploadedFiles) {
    for (const file of prescription.prescriptionData.uploadedFiles) {
      try {
        await s3.deleteObject({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: file.filename
        }).promise();
      } catch (error) {
        console.error('Error deleting file from S3:', error);
      }
    }
  }
  
  res.json({ message: 'Prescription deleted successfully' });
}));

// Get prescription statistics
router.get('/stats/overview', authenticateToken, asyncHandler(async (req, res) => {
  const stats = await Prescription.aggregate([
    { $match: { shop: req.shop } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const total = await Prescription.countDocuments({ shop: req.shop });
  
  res.json({
    total,
    byStatus: stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {})
  });
}));

// Export prescriptions (for compliance)
router.get('/export/csv', authenticateToken, asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.find({ shop: req.shop })
    .select('prescriptionData.customerName prescriptionData.customerEmail prescriptionData.prescriptionType status createdAt')
    .sort({ createdAt: -1 });
  
  const csv = [
    'Customer Name,Customer Email,Prescription Type,Status,Created Date',
    ...prescriptions.map(p => [
      p.prescriptionData.customerName || '',
      p.prescriptionData.customerEmail || '',
      p.prescriptionData.prescriptionType || '',
      p.status || '',
      p.createdAt.toISOString()
    ].join(','))
  ].join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=prescriptions.csv');
  res.send(csv);
}));

// Cleanup old prescriptions (for compliance)
router.post('/cleanup', authenticateToken, asyncHandler(async (req, res) => {
  const anonymizedCount = await Prescription.anonymizeOldPrescriptions();
  
  res.json({ 
    message: `Anonymized ${anonymizedCount} old prescriptions for compliance` 
  });
}));

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files' });
    }
  }
  
  if (error.message === 'Invalid file type') {
    return res.status(400).json({ error: 'Invalid file type' });
  }
  
  next(error);
});

module.exports = router;
