// =============================================
// AI Voice EMR Blockchain — Main Server
// =============================================
// This is the entry point of our backend.
// It loads environment variables, sets up middleware,
// connects routes, and starts the Express server.
// =============================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import route modules
const emrRoutes = require('./routes/emrRoutes');
const blockchainRoutes = require('./routes/blockchainRoutes');
const verificationRoutes = require('./routes/verificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ---- Middleware ----
// cors: allows the React frontend (on a different port) to talk to this server
// express.json: parses incoming JSON request bodies
app.use(cors());
app.use(express.json());

// ---- Health Check ----
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AI Voice EMR Blockchain — Backend is running',
    version: '1.0.0',
    endpoints: {
      emr: '/api/emr',
      blockchain: '/api/blockchain'
    }
  });
});

// ---- Routes ----
app.use('/api', emrRoutes);
app.use('/api', blockchainRoutes);
app.use('/api', verificationRoutes);

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ---- Start Server ----
app.listen(PORT, () => {
  console.log(`\n✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/`);
  console.log(`📄 EMR endpoints: http://localhost:${PORT}/api/emr`);
  console.log(`⛓️  Blockchain:    http://localhost:${PORT}/api/blockchain\n`);
});

module.exports = app;
