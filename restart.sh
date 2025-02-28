#!/bin/bash

# Restart script for Gaia App
# This script will kill any running instances, rebuild the app, and restart the server

echo "====== Gaia App Restart Script ======"
echo "$(date)"
echo "--------------------------------"

# Kill any running serve processes
echo "Stopping existing serve processes..."
pkill -f "serve -s build" || echo "No serve processes found"

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

# Start the server
echo "Starting server..."
nohup serve -s build > serve.log 2>&1 &

# Verify server is running
sleep 2
if pgrep -f "serve -s build" > /dev/null; then
  echo "Server started successfully!"
  echo "App is available at http://localhost:3000"
else
  echo "Failed to start server!"
  exit 1
fi

echo "--------------------------------"
echo "Restart completed successfully."