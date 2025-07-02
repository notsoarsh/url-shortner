# URL Shortener 🔗

A modern, secure, and feature-rich URL shortener application built with Node.js, Express.js, and MongoDB. Transform long URLs into short, shareable links with advanced analytics and security features.

## ✨ Features

### Core Functionality
- **🚀 URL Shortening**: Generate unique, short URLs from long URLs
- **⚡ Fast Redirection**: Instant and reliable URL redirection
- **✅ URL Validation**: Comprehensive validation for safe, properly formatted URLs
- **💾 Persistent Storage**: MongoDB storage for durability and scalability

### Advanced Features
- **⏰ TTL Support**: Automatic URL expiration with configurable time-to-live
- **📊 Analytics Dashboard**: Detailed click tracking and usage statistics
- **🎨 Custom Aliases**: Create memorable custom aliases for your URLs
- **🔒 Security**: Rate limiting, HTTPS enforcement, and malicious link protection

### Analytics & Monitoring
- **📈 Click Statistics**: Total clicks, daily activity, and trends
- **🕐 Real-time Tracking**: Live click monitoring and activity feeds
- **🌐 Referrer Analysis**: Track traffic sources and referrer domains
- **📱 Device Analytics**: Browser and user agent information
- **📊 Visual Charts**: Daily click charts and usage patterns

## 🛡️ Security Features

- **🚨 Rate Limiting**: Prevents abuse with configurable request limits
- **🔐 Input Validation**: Comprehensive URL and input sanitization
- **🛡️ Security Headers**: Helmet.js for enhanced security headers
- **🚫 Malicious URL Detection**: Prevents shortening of harmful links
- **⏰ Automatic Cleanup**: TTL-based URL expiration and cleanup
- **🔒 HTTPS Enforcement**: Secure protocol enforcement

## 🚀 Quick Start

### Prerequisites
- Node.js (v14.0.0 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd url-shorter-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/urlshortener
   BASE_URL=http://localhost:3000
   NODE_ENV=development
   
   # Security
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   
   # URL Settings
   DEFAULT_TTL_DAYS=30
   MAX_URL_LENGTH=2048
   SHORT_CODE_LENGTH=8
   ```

4. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI in .env
   ```

5. **Run the application**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   - Main App: http://localhost:3000
   - Analytics: http://localhost:3000/analytics/{code}

## 📖 API Documentation

### Shorten URL
**POST** `/api/urls/shorten`

```json
{
  "url": "https://example.com/very/long/url",
  "customAlias": "my-link",
  "ttlDays": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shortCode": "abc12345",
    "customAlias": "my-link",
    "originalUrl": "https://example.com/very/long/url",
    "shortUrl": "http://localhost:3000/my-link",
    "clicks": 0,
    "createdAt": "2025-07-01T10:00:00.000Z",
    "expiresAt": "2025-07-31T10:00:00.000Z"
  }
}
```

### Get Analytics
**GET** `/api/urls/analytics/{code}`

**Response:**
```json
{
  "success": true,
  "data": {
    "originalUrl": "https://example.com/very/long/url",
    "shortUrl": "http://localhost:3000/my-link",
    "clicks": 42,
    "createdAt": "2025-07-01T10:00:00.000Z",
    "expiresAt": "2025-07-31T10:00:00.000Z",
    "clickHistory": [...],
    "dailyClicks": {...}
  }
}
```

### List URLs
**GET** `/api/urls/urls?page=1&limit=10`

### Delete URL
**DELETE** `/api/urls/{code}`

## 🏗️ Project Structure

```
url-shorter-app/
├── 📁 models/
│   └── Url.js              # MongoDB schema
├── 📁 routes/
│   └── urls.js             # API routes
├── 📁 middleware/
│   └── security.js         # Security middleware
├── 📁 public/
│   ├── 📁 css/
│   │   └── style.css       # Styles
│   └── 📁 js/
│       ├── app.js          # Main frontend
│       └── analytics.js    # Analytics frontend
├── 📁 views/
│   ├── index.html          # Main page
│   ├── analytics.html      # Analytics page
│   ├── 404.html            # Not found page
│   ├── expired.html        # Expired URL page
│   └── 500.html            # Error page
├── server.js               # Main server file
├── package.json            # Dependencies
├── .env.example            # Environment template
└── README.md               # This file
```

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/urlshortener` |
| `BASE_URL` | Base URL for short links | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | `development` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `DEFAULT_TTL_DAYS` | Default URL expiration | `30` |
| `MAX_URL_LENGTH` | Maximum URL length | `2048` |
| `SHORT_CODE_LENGTH` | Short code length | `8` |

### MongoDB Indexes

The application automatically creates the following indexes:
- `shortCode` (unique)
- `customAlias` (unique, sparse)
- `createdAt`
- `clicks` (descending)
- `expiresAt` (TTL index)

## 🔧 Development

### Prerequisites for Development
- Node.js v14+
- MongoDB
- Git

### Development Commands
```bash
# Install dependencies
npm install

# Start development server (auto-restart)
npm run dev

# Start production server
npm start

# Check for issues
npm audit

# Fix security issues
npm audit fix
```

### Code Style
- Use ES6+ features and async/await
- Implement proper error handling
- Follow RESTful API conventions
- Use middleware for cross-cutting concerns
- Write clean, documented code

## 📊 Monitoring & Analytics

### Available Metrics
- **Total Clicks**: Lifetime click count
- **Daily Activity**: Clicks per day with trends
- **Referrer Analysis**: Traffic source tracking
- **Geographic Data**: Click location insights
- **Device Analytics**: Browser and platform stats
- **Performance Metrics**: Response times and errors

### Analytics Dashboard Features
- 📈 Real-time click charts
- 🌐 Top referrer tracking
- 📱 Device and browser analytics
- ⏰ Recent activity feed
- 📊 Daily/weekly/monthly trends

## 🔐 Security Best Practices

### Implemented Security Measures
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes all user inputs
- **URL Validation**: Checks for malicious links
- **HTTPS Enforcement**: Secure protocol usage
- **Security Headers**: Comprehensive header protection
- **TTL Cleanup**: Automatic expired URL removal

### Recommended Additional Security
- Use HTTPS in production
- Implement user authentication
- Add CAPTCHA for high-volume usage
- Monitor for abuse patterns
- Regular security audits

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   BASE_URL=https://your-domain.com
   MONGODB_URI=mongodb+srv://...
   ```

2. **Security Considerations**
   - Use strong JWT secrets
   - Enable HTTPS
   - Configure rate limiting
   - Set up monitoring

3. **Recommended Hosting**
   - **Backend**: Heroku, Railway, DigitalOcean
   - **Database**: MongoDB Atlas
   - **CDN**: Cloudflare (optional)

### Docker Deployment (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network connectivity

**Port Already in Use**
- Change PORT in `.env`
- Kill existing processes: `pkill node`

**Rate Limit Errors**
- Adjust rate limiting in `.env`
- Check IP restrictions

### Getting Help
- 📖 Check this README
- 🐛 Create an issue
- 💬 Contact support

## 🎯 Roadmap

- [ ] User authentication system
- [ ] Custom domains support
- [ ] Bulk URL shortening
- [ ] QR code generation
- [ ] Advanced analytics
- [ ] Team collaboration features
- [ ] API rate tiers
- [ ] Mobile app

---

**Built with ❤️ using Node.js, Express.js, and MongoDB**
