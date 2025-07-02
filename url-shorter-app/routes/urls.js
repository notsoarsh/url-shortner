const express = require('express');
const Url = require('../models/Url');
const { validateUrl, handleValidationErrors, sanitizeUrl } = require('../middleware/security');

const router = express.Router();

// Create shortened URL
router.post('/shorten', validateUrl, handleValidationErrors, async (req, res) => {
  try {
    let { url, customAlias, ttlDays } = req.body;
    
    // Sanitize URL
    url = sanitizeUrl(url);
    
    // Check if URL already exists
    let existingUrl = await Url.findOne({ originalUrl: url, isActive: true });
    if (existingUrl) {
      return res.json({
        success: true,
        data: existingUrl,
        message: 'URL already shortened'
      });
    }
    
    // Check if custom alias is already taken
    if (customAlias) {
      const aliasExists = await Url.findOne({ 
        $or: [
          { customAlias: customAlias },
          { shortCode: customAlias }
        ]
      });
      
      if (aliasExists) {
        return res.status(400).json({
          error: 'Custom alias already exists'
        });
      }
    }
    
    // Generate short code using crypto
    const crypto = require('crypto');
    const generateShortCode = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      const length = parseInt(process.env.SHORT_CODE_LENGTH) || 8;
      
      for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, chars.length);
        result += chars[randomIndex];
      }
      return result;
    };
    
    const shortCode = generateShortCode();
    
    // Calculate expiration date
    const ttl = ttlDays || parseInt(process.env.DEFAULT_TTL_DAYS) || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttl);
    
    // Create new URL document
    const newUrl = new Url({
      originalUrl: url,
      shortCode,
      customAlias: customAlias || undefined,
      expiresAt,
      creator: req.ip || 'anonymous'
    });
    
    await newUrl.save();
    
    res.status(201).json({
      success: true,
      data: newUrl,
      message: 'URL shortened successfully'
    });
    
  } catch (error) {
    console.error('Error shortening URL:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Short code or alias already exists'
      });
    }
    
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get URL analytics
router.get('/analytics/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const url = await Url.findOne({
      $or: [
        { shortCode: code },
        { customAlias: code }
      ],
      isActive: true
    });
    
    if (!url) {
      return res.status(404).json({
        error: 'Short URL not found'
      });
    }
    
    // Prepare analytics data
    const analytics = {
      originalUrl: url.originalUrl,
      shortUrl: url.shortUrl,
      clicks: url.clicks,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
      isActive: url.isActive,
      clickHistory: url.clickHistory.map(click => ({
        timestamp: click.timestamp,
        userAgent: click.userAgent,
        referrer: click.referrer
      })),
      dailyClicks: {}
    };
    
    // Group clicks by day
    url.clickHistory.forEach(click => {
      const date = click.timestamp.toISOString().split('T')[0];
      analytics.dailyClicks[date] = (analytics.dailyClicks[date] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get all URLs (with pagination)
router.get('/urls', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    
    const urls = await Url.find({ isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-clickHistory');
    
    const total = await Url.countDocuments({ isActive: true });
    
    res.json({
      success: true,
      data: {
        urls,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching URLs:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Delete URL
router.delete('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const url = await Url.findOneAndUpdate(
      {
        $or: [
          { shortCode: code },
          { customAlias: code }
        ]
      },
      { isActive: false },
      { new: true }
    );
    
    if (!url) {
      return res.status(404).json({
        error: 'Short URL not found'
      });
    }
    
    res.json({
      success: true,
      message: 'URL deactivated successfully'
    });
    
  } catch (error) {
    console.error('Error deleting URL:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
