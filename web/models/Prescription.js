const mongoose = require('mongoose');
const crypto = require('crypto');

const prescriptionDataSchema = new mongoose.Schema({
  // Right Eye (OD)
  odSphere: String,
  odCylinder: String,
  odAxis: String,
  odAdd: String,
  odPrism: String,
  odBase: String,
  
  // Left Eye (OS)
  osSphere: String,
  osCylinder: String,
  osAxis: String,
  osAdd: String,
  osPrism: String,
  osBase: String,
  
  // Pupillary Distance
  pd: String,
  pdMonocular: {
    od: String,
    os: String
  },
  
  // Additional measurements
  segmentHeight: String,
  frameWidth: String,
  bridgeWidth: String,
  templeLength: String,
  
  // Prescription details
  prescriptionType: {
    type: String,
    enum: ['single-vision', 'progressive', 'reading', 'non-prescription', 'frame-only'],
    required: true
  },
  
  // Doctor information
  doctorName: String,
  doctorPhone: String,
  doctorAddress: String,
  prescriptionDate: Date,
  expirationDate: Date,
  
  // Customer information
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  customerDateOfBirth: Date,
  
  // File uploads
  uploadedFiles: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Validation status
  isValidated: {
    type: Boolean,
    default: false
  },
  validatedBy: String,
  validatedAt: Date,
  validationNotes: String,
  
  // Encryption
  isEncrypted: {
    type: Boolean,
    default: true
  },
  encryptedData: String,
  
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  }
}, {
  timestamps: true
});

const prescriptionSchema = new mongoose.Schema({
  shop: {
    type: String,
    required: true,
    lowercase: true
  },
  orderId: String,
  customerId: String,
  sessionId: String,
  prescriptionData: prescriptionDataSchema,
  
  // Status tracking
  status: {
    type: String,
    enum: ['draft', 'submitted', 'validated', 'rejected', 'fulfilled'],
    default: 'draft'
  },
  
  // Processing information
  processingNotes: String,
  labMetadata: {
    type: Map,
    of: String,
    default: new Map()
  },
  
  // Compliance
  isHIPAACompliant: {
    type: Boolean,
    default: true
  },
  dataRetentionDate: Date,
  
  // Audit trail
  createdBy: String,
  updatedBy: String,
  lastAccessedAt: Date,
  accessCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance and compliance
prescriptionSchema.index({ shop: 1, status: 1 });
prescriptionSchema.index({ orderId: 1 });
prescriptionSchema.index({ customerId: 1 });
prescriptionSchema.index({ sessionId: 1 });
prescriptionSchema.index({ dataRetentionDate: 1 });
prescriptionSchema.index({ createdAt: 1 });

// Encryption methods
prescriptionSchema.methods.encryptData = function() {
  if (!this.prescriptionData.isEncrypted && this.prescriptionData.encryptedData) {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from(this._id.toString()));
    
    let encrypted = cipher.update(JSON.stringify(this.prescriptionData), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    this.prescriptionData.encryptedData = {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
    
    this.prescriptionData.isEncrypted = true;
  }
};

prescriptionSchema.methods.decryptData = function() {
  if (this.prescriptionData.isEncrypted && this.prescriptionData.encryptedData) {
    try {
      const algorithm = 'aes-256-gcm';
      const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
      const iv = Buffer.from(this.prescriptionData.encryptedData.iv, 'hex');
      const authTag = Buffer.from(this.prescriptionData.encryptedData.authTag, 'hex');
      
      const decipher = crypto.createDecipher(algorithm, key);
      decipher.setAAD(Buffer.from(this._id.toString()));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(this.prescriptionData.encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }
  return this.prescriptionData;
};

// Method to update access tracking
prescriptionSchema.methods.trackAccess = function(userId) {
  this.lastAccessedAt = new Date();
  this.accessCount += 1;
  this.updatedBy = userId;
  return this.save();
};

// Method to set data retention date
prescriptionSchema.methods.setDataRetentionDate = function(retentionDays = 2555) {
  this.dataRetentionDate = new Date();
  this.dataRetentionDate.setDate(this.dataRetentionDate.getDate() + retentionDays);
  return this.save();
};

// Static method to find prescriptions for cleanup
prescriptionSchema.statics.findForCleanup = function() {
  return this.find({
    dataRetentionDate: { $lte: new Date() }
  });
};

// Static method to anonymize old prescriptions
prescriptionSchema.statics.anonymizeOldPrescriptions = async function() {
  const oldPrescriptions = await this.findForCleanup();
  
  for (const prescription of oldPrescriptions) {
    // Anonymize prescription data
    prescription.prescriptionData = {
      prescriptionType: prescription.prescriptionData.prescriptionType,
      isEncrypted: true,
      encryptedData: 'ANONYMIZED'
    };
    
    // Remove personal information
    prescription.customerId = null;
    prescription.sessionId = null;
    prescription.processingNotes = 'Data anonymized for compliance';
    
    await prescription.save();
  }
  
  return oldPrescriptions.length;
};

// Pre-save middleware
prescriptionSchema.pre('save', function(next) {
  if (this.isNew) {
    this.setDataRetentionDate();
  }
  
  if (this.isModified('prescriptionData') && this.prescriptionData.isEncrypted) {
    this.encryptData();
  }
  
  next();
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
