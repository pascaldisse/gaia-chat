#!/bin/bash

# Show memory status
echo "Memory before build:"
free -h

# Attempt to free some memory
echo "Attempting to free some memory before build..."
sync
echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || echo "Unable to drop caches (normal if not running as root)"
echo "Memory after clearing caches:"
free -h

# Build with minimal memory usage but more than the default limits
echo "Building application with increased memory settings..."
NODE_ENV=production NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size" npm run build
BUILD_RESULT=$?

# Check if build was successful
if [ $BUILD_RESULT -eq 0 ]; then
  echo "Build completed successfully!"
else
  echo "Build failed with exit code $BUILD_RESULT"
fi

exit $BUILD_RESULT