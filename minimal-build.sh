#!/bin/bash

echo "Creating minimal build to work around memory limitations..."

# Create build directory
mkdir -p build/static/js
mkdir -p build/static/css
mkdir -p build/static/media

# Show memory status
free -h

# Copy public assets
cp -r public/* build/

# Create minimal index.html that points to CDN versions of React
cat > build/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link rel="icon" href="/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  <meta name="description" content="Gaia - AI Assistant" />
  <link rel="apple-touch-icon" href="/logo192.png" />
  <link rel="manifest" href="/manifest.json" />
  <title>Gaia</title>
  <!-- CDN stylesheets -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="/static/css/main.css" rel="stylesheet">
</head>
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root">
    <div style="text-align: center; margin-top: 20vh;">
      <img src="/logo192.png" alt="Gaia" style="width: 100px; height: 100px;" />
      <h1>Gaia is starting up...</h1>
      <p>If this message persists, please check your server logs.</p>
    </div>
  </div>
  
  <!-- CDN scripts instead of bundled React -->
  <script src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
  
  <!-- Bootstrap JS bundle for UI components -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  
  <!-- Placeholder for our app code -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Gaia App: Loading minimal version due to server constraints');
      
      // Display maintenance message
      const root = document.getElementById('root');
      root.innerHTML = `
        <div style="text-align: center; margin-top: 20vh; font-family: sans-serif;">
          <img src="/logo192.png" alt="Gaia" style="width: 100px; height: 100px;" />
          <h1>Gaia - Maintenance Mode</h1>
          <p>The server is currently operating in minimal mode due to resource constraints.</p>
          <p>Please contact the administrator to resolve this issue.</p>
          <div style="margin-top: 30px;">
            <button id="reload-btn" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Try Full Reload
            </button>
          </div>
        </div>
      `;
      
      // Add reload functionality
      document.getElementById('reload-btn').addEventListener('click', function() {
        location.reload(true);
      });
    });
  </script>
</body>
</html>
EOL

# Create simple CSS file
cat > build/static/css/main.css << 'EOL'
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOL

echo "Minimal build completed. This is a temporary solution due to memory constraints."
echo "The application will run in maintenance mode."