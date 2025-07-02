const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2048
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  customAlias: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // Allows null values to be non-unique
  },
  clicks: {
    type: Number,
    default: 0
  },
  clickHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    userAgent: String,
    ipAddress: String,
    referrer: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 } // TTL index
  },
  isActive: {
    type: Boolean,
    default: true
  },
  creator: {
    type: String,
    default: 'anonymous'
  }
}, {
  timestamps: true
});

// Indexes for performance
urlSchema.index({ shortCode: 1 });
urlSchema.index({ customAlias: 1 });
urlSchema.index({ createdAt: 1 });
urlSchema.index({ clicks: -1 });

// Virtual for short URL
urlSchema.virtual('shortUrl').get(function() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/${this.customAlias || this.shortCode}`;
});

// Transform output
urlSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Url', urlSchema);
