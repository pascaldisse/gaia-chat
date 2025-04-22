// Simple test script to verify the API server is working
// Run with: node simple-test.js

const http = require('http');

function testEndpoint(path, callback) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: path,
    method: 'GET',
    timeout: 3000
  };
  
  console.log(`Testing endpoint: ${path}`);
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      try {
        const parsed = JSON.parse(data);
        console.log('Response:', JSON.stringify(parsed, null, 2));
        if (callback) callback(null, parsed);
      } catch (e) {
        console.log('Raw response:', data);
        if (callback) callback(e);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
    if (callback) callback(e);
  });
  
  req.end();
}

// Test the health endpoint
testEndpoint('/api/llm/health', (err) => {
  if (err) {
    console.error('API server may not be running or has an error');
    process.exit(1);
  }
  
  // Test the models endpoint
  testEndpoint('/api/llm/models');
});