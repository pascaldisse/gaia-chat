/**
 * GaiaScript Standalone Server
 * A lightweight server for the GaiaScript version of Gaia Chat
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuration
const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.gaia': 'text/plain',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

// Create the HTTP server
const server = http.createServer((req, res) => {
  // Parse the URL
  const parsedUrl = url.parse(req.url);
  
  // Extract the pathname
  let pathname = parsedUrl.pathname;
  
  // Default to index.html if the path is the root or a directory
  if (pathname === '/' || pathname.endsWith('/')) {
    pathname += 'index.html';
  }
  
  // Resolve the file path
  const filePath = path.join(PUBLIC_DIR, pathname);
  
  // Get the file extension
  const ext = path.extname(filePath);
  
  // Determine the content type based on the file extension
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  // Read the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Handle file not found
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(PUBLIC_DIR, '404.html'), (err, data) => {
          if (err) {
            // If even the 404 page is not found, send a basic 404 response
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(data);
          }
        });
      } else {
        // For other errors, send a 500 response
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // On success, send the file data with the appropriate content type
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`GaiaScript server running at http://localhost:${PORT}`);
  console.log(`Serving files from ${PUBLIC_DIR}`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use a different port.`);
  } else {
    console.error(`Server error: ${err}`);
  }
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server terminated');
    process.exit(0);
  });
});