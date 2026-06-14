#!/bin/bash

# Restart script for Gaia App (Vite)
# This script will kill any running instances, rebuild the app, and restart the dev server

echo "====== Gaia App Restart Script ======"
echo "$(date)"
echo "--------------------------------"

# Kill any running vite processes
if [ -f ".gaia-server.pid" ]; then
  echo "Stopping existing process..."
  OLD_PID=$(cat .gaia-server.pid)
  if kill -0 $OLD_PID 2>/dev/null; then
    kill $OLD_PID
    echo "Stopped process with PID $OLD_PID"
    sleep 2
  else
    echo "No active process found with PID $OLD_PID"
  fi
  rm .gaia-server.pid
else
  echo "Checking for any vite processes..."
  pkill -f "vite" || echo "No vite processes found"
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

# Start vite preview server
echo "Starting preview server with vite..."
nohup npm run preview -- --port 3000 > /dev/null 2>&1 &
echo $! > .gaia-server.pid

# Give server time to start
echo "Waiting for server to start..."
sleep 3

# Verify server is running
if [ -f ".gaia-server.pid" ]; then
  SERVER_PID=$(cat .gaia-server.pid)
  if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server started successfully with PID $SERVER_PID!"
    PORT="3000"
    URL="http://localhost:$PORT"
    echo "🌐 App is available at: $URL"

    if [ "$(uname)" == "Darwin" ]; then
      echo "Opening in browser..."
      open $URL
    fi
  else
    echo "❌ Server process failed to start properly!"
    exit 1
  fi
else
  echo "❌ Failed to start server!"
  exit 1
fi

echo "--------------------------------"
echo "✨ Restart completed successfully."
echo "👉 To stop the server later, run: kill $(cat .gaia-server.pid)"
