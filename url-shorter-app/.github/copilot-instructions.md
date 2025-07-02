# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Context
This is a Node.js URL shortener application built with Express.js and MongoDB. The application provides secure URL shortening services with analytics and security features.

## Key Features
- URL shortening with custom aliases
- Secure redirection with validation
- MongoDB persistence with TTL
- Rate limiting and security middleware
- Click analytics and statistics
- Modern responsive UI
- RESTful API endpoints

## Code Style Guidelines
- Use ES6+ features and async/await
- Implement proper error handling and validation
- Follow RESTful API conventions
- Use middleware for cross-cutting concerns
- Implement security best practices
- Write clean, documented code

## Security Requirements
- Validate all user inputs
- Implement rate limiting
- Use HTTPS enforcement
- Sanitize URLs for safety
- Protect against malicious links
- Use secure random generation for short codes

## Database Guidelines
- Use Mongoose for MongoDB operations
- Implement proper indexing
- Use TTL for automatic cleanup
- Handle connection errors gracefully
- Validate data at schema level
