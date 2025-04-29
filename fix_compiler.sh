#!/bin/bash

# Fix GaiaScript Compiler Script
echo "====== GaiaScript Compiler Fix ======"
echo "$(date)"
echo "--------------------------------"

# Create symbolic link to .gaia if it doesn't exist
if [ ! -L ".gaia" ]; then
  echo "Creating symbolic link to gaia/.gaia..."
  ln -s /Users/pascaldisse/gaia/.gaia .gaia
  if [ ! -L ".gaia" ]; then
    echo "Failed to create symbolic link to compiler. Exiting."
    exit 1
  fi
fi

# Check if main.gaia exists
if [ ! -f "main.gaia" ]; then
  echo "Error: main.gaia file not found!"
  exit 1
fi

# Create required directories
mkdir -p build/src/components

# Use our custom wrapper to run the compiler with proper error handling
echo "Running GaiaScript compiler via wrapper..."
node gaia_compiler_wrapper.js

# Check if compilation was successful
if [ $? -eq 0 ]; then
  echo "✅ GaiaScript compilation and setup complete!"
  exit 0
else
  echo "❌ GaiaScript compilation failed. Please check the error messages above."
  
  # Try alternate approach: use direct command line options
  echo "Trying alternate approach with direct command line options..."
  
  # Create a temporary copy of main.gaia
  cp main.gaia main.gaia.temp
  
  # Run the compiler directly with specific options
  echo "Running compiler directly..."
  node .gaia/comp/build.js --platform=web --no-execute main.gaia.temp build/gaia-compiled.js
  
  # Check if this approach worked
  if [ $? -eq 0 ]; then
    echo "✅ Alternative compilation approach succeeded!"
    rm main.gaia.temp
    exit 0
  else
    echo "❌ All compilation approaches failed."
    rm main.gaia.temp
    exit 1
  fi
fi
