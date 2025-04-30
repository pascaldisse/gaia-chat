#!/bin/bash

# Restart script for Gaia App
# This script will kill any running instances, rebuild the app, and restart the server
# The server will continue running even if the terminal is closed

echo "====== Gaia App Restart Script ======"
echo "$(date)"
echo "--------------------------------"

# Ensure serve is installed
if ! command -v serve &> /dev/null; then
  echo "Installing serve globally..."
  npm install -g serve
fi

# Kill any running serve processes by finding their PID file
if [ -f ".gaia-server.pid" ]; then
  echo "Stopping existing serve process..."
  OLD_PID=$(cat .gaia-server.pid)
  if kill -0 $OLD_PID 2>/dev/null; then
    kill $OLD_PID
    echo "Stopped serve process with PID $OLD_PID"
    sleep 2
  else
    echo "No active process found with PID $OLD_PID"
  fi
  rm .gaia-server.pid
else
  # Try to find and kill any running serve processes
  echo "Checking for any serve processes..."
  pkill -f "serve -s build" || echo "No serve processes found"
fi

# Install dependencies if needed
if [ "$1" == "--install" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the app
echo "Building application..."
npm run build

if [ $? -ne 0 ]; then
  echo "Build failed! Exiting."
  exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the server with nohup and disown to ensure it keeps running after terminal closes
echo "Starting server with serve..."
LOG_FILE="logs/serve-$(date +%Y%m%d-%H%M%S).log"

# Start serve with nohup, redirect output, and use disown to detach from shell
nohup serve -s build -l 3000 > "$LOG_FILE" 2>&1 & 
echo $! > .gaia-server.pid

# Give server time to start
echo "Waiting for server to start..."
sleep 5

# Verify server is running by checking PID
if [ -f ".gaia-server.pid" ]; then
  SERVER_PID=$(cat .gaia-server.pid)
  if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server started successfully with PID $SERVER_PID!"
    echo "📝 Logs available at: $LOG_FILE"
    
    # Try to determine the URL using netstat or lsof
    PORT="3000"
    URL="http://localhost:$PORT"
    echo "🌐 App is available at: $URL"
    
    # Try to open in browser if on macOS
    if [ "$(uname)" == "Darwin" ]; then
      echo "Opening in browser..."
      open $URL
    fi
  else
    echo "❌ Server process failed to start properly!"
    cat "$LOG_FILE"
    exit 1
  fi
else
  echo "❌ Failed to start server! PID file not created."
  exit 1
fi

echo "--------------------------------"
echo "✨ Restart completed successfully. Server will continue running even if terminal is closed."
echo "👉 To stop the server later, run: kill $(cat .gaia-server.pid)"