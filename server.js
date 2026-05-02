const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

// Custom Modules
const { apiLimiter } = require('./src/middleware/security');

/**
 * Entry point for the NaagrikInfo API Server.
 * Architectural Note: This file serves as the orchestration layer, 
 * delegating core logic to domain-specific services and routes.
 */
const app = express();
const PORT = Number(process.env.PORT) || 8787;

// --- Middlewares ---

// Security headers (XSS protection, Clickjacking prevention, etc.)
app.use(helmet({
  contentSecurityPolicy: false // Disabled for CDN compatibility
}));

// Payload compression for bandwidth efficiency
app.use(compression());

// Standard parsers
app.use(cors());
app.use(express.json());

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '.')));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// --- Modularized Routes ---
const apiRoutes = require('./src/routes/api');
const { errorHandler } = require('./src/middleware/errorHandler');

app.use('/api', apiRoutes);

// --- Health Check ---
app.get('/api/health', (_req, res) => {
  res.status(200).json({ 
    ok: true,
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'live-political-backend' 
  });
});

/**
 * Fallback route for undefined API endpoints.
 */
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// Global Error Handler
app.use(errorHandler);

// --- Server Lifecycle ---

if (process.env.NODE_ENV !== 'test' && (process.env.NODE_ENV !== 'production' || !process.env.VERCEL)) {
  app.listen(PORT, () => {
    console.log(`[NaagrikInfo] Production-grade backend running on port ${PORT}`);
  });
}

module.exports = app;
