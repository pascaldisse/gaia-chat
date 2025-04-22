const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

// Import API route handlers
const llmRoutes = require('./routes/llm');
const personaRoutes = require('./routes/personas');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// API Routes
app.use('/api/llm', llmRoutes);
app.use('/api/personas', personaRoutes);

// Serve static assets from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: err.message || 'Internal Server Error'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}/api/llm/health`);
});

// Add proper shutdown handling
process.on('SIGINT', () => {
  console.log('\nShutting down API server...');
  server.close(() => {
    console.log('API server stopped');
    process.exit(0);
  });
});