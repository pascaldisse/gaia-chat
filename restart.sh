#!/bin/bash

# Restart script for Gaia Chat
# This script restarts both the frontend and API server

echo "====== Gaia Chat Restart Script ======"
echo "$(date)"
echo "--------------------------------"

# Kill any running server processes
find_and_kill_process() {
  echo "Checking for running $1 processes..."
  
  if [ -f ".$1.pid" ]; then
    PID=$(cat ".$1.pid")
    if kill -0 $PID 2>/dev/null; then
      echo "Stopping $1 process with PID $PID..."
      kill $PID
      sleep 2
    else
      echo "No active $1 process found with PID $PID"
    fi
    rm ".$1.pid"
  else
    # Try to find processes by command pattern
    if [ "$1" = "frontend" ]; then
      pkill -f "serve -s build" || echo "No frontend processes found"
    elif [ "$1" = "api" ]; then
      pkill -f "node server/index.js" || echo "No API server processes found"
    fi
  fi
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop existing processes
find_and_kill_process "frontend"
find_and_kill_process "api"

# Install dependencies if needed
if [ "$1" == "--install" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Ensure serve is installed
if ! command -v serve &> /dev/null; then
  echo "Installing serve globally..."
  npm install -g serve
fi

# Build the app
echo "Building application..."
npm run build

if [ $? -ne 0 ]; then
  echo "Build failed! Exiting."
  exit 1
fi

# Start API server
echo "Starting API server..."
API_LOG_FILE="logs/api-server-$(date +%Y%m%d-%H%M%S).log"

(nohup node server/index.js > "$API_LOG_FILE" 2>&1 </dev/null & echo $! > .api.pid) &

# Give API server time to start
echo "Waiting for API server to start..."
sleep 3

# Start frontend server
echo "Starting frontend server..."
FRONTEND_LOG_FILE="logs/frontend-$(date +%Y%m%d-%H%M%S).log"

(nohup serve -s build -l 3000 > "$FRONTEND_LOG_FILE" 2>&1 </dev/null & echo $! > .frontend.pid) &

# Give frontend server time to start
echo "Waiting for frontend server to start..."
sleep 3

# Verify servers are running
verify_server() {
  if [ -f ".$1.pid" ]; then
    SERVER_PID=$(cat ".$1.pid")
    if kill -0 $SERVER_PID 2>/dev/null; then
      echo "✅ $2 started successfully with PID $SERVER_PID!"
      echo "📝 Logs available at: $3"
      return 0
    else
      echo "❌ $2 process failed to start properly!"
      cat "$3"
      return 1
    fi
  else
    echo "❌ Failed to start $2! PID file not created."
    return 1
  fi
}

# Check API server status
API_PORT=5000
API_URL="http://localhost:$API_PORT/api/llm/health"
verify_server "api" "API server" "$API_LOG_FILE"
API_STATUS=$?

# Check frontend server status
FRONTEND_PORT=3000
FRONTEND_URL="http://localhost:$FRONTEND_PORT"
verify_server "frontend" "Frontend server" "$FRONTEND_LOG_FILE"
FRONTEND_STATUS=$?

# Display URLs
if [ $API_STATUS -eq 0 ]; then
  echo "🌐 API server is available at: $API_URL"
fi

if [ $FRONTEND_STATUS -eq 0 ]; then
  echo "🌐 Frontend is available at: $FRONTEND_URL"
  
  # Try to open in browser if on macOS
  if [ "$(uname)" == "Darwin" ]; then
    echo "Opening in browser..."
    open $FRONTEND_URL
  fi
fi

echo "--------------------------------"
echo "✨ Restart completed. Servers will continue running even if terminal is closed."
echo "👉 To stop the servers later, run: kill $(cat .api.pid 2>/dev/null || echo 'N/A') $(cat .frontend.pid 2>/dev/null || echo 'N/A')"