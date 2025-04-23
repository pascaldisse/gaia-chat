#!/bin/bash

# Restart script for Gaia Chat GaiaScript version
# This script sets up a lightweight HTTP server for the GaiaScript version of the app

echo "====== Gaia Chat GaiaScript Version Restart Script ======"
echo "$(date)"
echo "--------------------------------"

# Forcefully kill any processes using the server port
echo "Forcefully terminating any existing server processes..."
GAIA_PORT=8080
lsof -ti :$GAIA_PORT | xargs kill -9 2>/dev/null || echo "No processes using port $GAIA_PORT"

# Kill any running server processes
if [ -f ".gaiascript.pid" ]; then
  PID=$(cat ".gaiascript.pid")
  if kill -0 $PID 2>/dev/null; then
    echo "Stopping GaiaScript server process with PID $PID..."
    kill -9 $PID
    sleep 2
  else
    echo "No active GaiaScript server process found with PID $PID"
  fi
  rm -f ".gaiascript.pid"
else
  # Try to find processes by command pattern
  pkill -9 -f "http-server.*$GAIA_PORT" 2>/dev/null || echo "No GaiaScript server processes found"
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Ensure http-server is installed
if ! command -v http-server &> /dev/null; then
  echo "Installing http-server globally..."
  npm install -g http-server
fi

# Copy runtime files to static directory
echo "Setting up GaiaScript files..."
mkdir -p public/gaiascript
cp src/gaiascript/*.js public/gaiascript/
cp src/gaiascript/*.gaia public/gaiascript/
cp src/gaiascript/index.html public/gaiascript/index.html

# Start GaiaScript server
echo "Starting GaiaScript server..."
GAIA_LOG_FILE="logs/gaiascript-server-$(date +%Y%m%d-%H%M%S).log"

(nohup http-server public -p $GAIA_PORT > "$GAIA_LOG_FILE" 2>&1 </dev/null & echo $! > .gaiascript.pid) &

# Give server time to start
echo "Waiting for GaiaScript server to start..."
sleep 3

# Verify server is running
if [ -f ".gaiascript.pid" ]; then
  SERVER_PID=$(cat ".gaiascript.pid")
  if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ GaiaScript server started successfully with PID $SERVER_PID!"
    echo "📝 Logs available at: $GAIA_LOG_FILE"
    GAIA_STATUS=0
  else
    echo "❌ GaiaScript server process failed to start properly!"
    cat "$GAIA_LOG_FILE"
    GAIA_STATUS=1
  fi
else
  echo "❌ Failed to start GaiaScript server! PID file not created."
  GAIA_STATUS=1
fi

# Display URLs
if [ $GAIA_STATUS -eq 0 ]; then
  GAIA_URL="http://localhost:$GAIA_PORT/gaiascript"
  echo "🌐 GaiaScript version is available at: $GAIA_URL"
  
  # Try to open in browser if on macOS
  if [ "$(uname)" == "Darwin" ]; then
    echo "Opening in browser..."
    open $GAIA_URL
  fi
fi

echo "--------------------------------"
echo "✨ Restart completed. Server will continue running even if terminal is closed."
echo "👉 To stop the server later, run: kill $(cat .gaiascript.pid 2>/dev/null || echo 'N/A')"
echo ""
echo "Note: This is the GaiaScript version of the application, which uses a simplified implementation."
echo "To run the full React version, use ./restart.sh or ./restart-full.sh instead."