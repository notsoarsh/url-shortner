require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const Url = require('./models/Url');
const urlRoutes = require('./routes/urls');
const { createRateLimiter, securityHeaders } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
    },
  },
}));
app.use(securityHeaders);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.BASE_URL] 
    : ['http://localhost:3002', 'http://127.0.0.1:3002'],
  credentials: true
}));

// Rate limiting
app.use('/api/', createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urlshortener')
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Routes
app.use('/api/urls', urlRoutes);

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Analytics page
app.get('/analytics/:code', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'analytics.html'));
});

// URL redirection (must be last route)
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    // Find URL by short code or custom alias
    const url = await Url.findOne({
      $or: [
        { shortCode: code },
        { customAlias: code }
      ],
      isActive: true
    });
    
    if (!url) {
      return res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
    }
    
    // Check if URL has expired
    if (url.expiresAt && new Date() > url.expiresAt) {
      // Deactivate expired URL
      await Url.findByIdAndUpdate(url._id, { isActive: false });
      return res.status(410).sendFile(path.join(__dirname, 'views', 'expired.html'));
    }
    
    // Record click analytics
    const clickData = {
      timestamp: new Date(),
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      referrer: req.get('Referrer') || 'direct'
    };
    
    // Update click count and history
    await Url.findByIdAndUpdate(url._id, {
      $inc: { clicks: 1 },
      $push: { clickHistory: clickData }
    });
    
    // Redirect to original URL
    res.redirect(301, url.originalUrl);
    
  } catch (error) {
    console.error('Error redirecting:', error);
    res.status(500).sendFile(path.join(__dirname, 'views', '500.html'));
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 URL Shortener server running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});
