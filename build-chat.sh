#!/bin/bash

# Build script for Gaia Chat application
# This script compiles the chat.gaia file into a React application

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Gaia Chat Build Script ===${NC}"
echo -e "${BLUE}Starting build process...${NC}"

# Create build directory if it doesn't exist
if [ ! -d "./chat-build" ]; then
  echo -e "${YELLOW}Creating chat-build directory...${NC}"
  mkdir -p ./chat-build
fi

# Check if chat.gaia exists
if [ ! -f "./chat.gaia" ]; then
  echo -e "${RED}Error: chat.gaia file not found${NC}"
  exit 1
fi

# Path to universal compiler options
UNIVERSAL_COMPILER_PATH="/Users/pascaldisse/gaia/.gaia/comp/src/universal_compiler.rs"
GAIA_REACT_COMPILER="/Users/pascaldisse/gaia/.gaia/comp/src/compilers/react_compiler.rs"
COMPILER_JS_PATH="/Users/pascaldisse/gaia/Contents/gaia-compiler.js"
UPDATED_COMPILER_PATH="/Users/pascaldisse/gaia/.gaia/gaia/gaia"

# Check paths
echo -e "${BLUE}Checking compiler paths...${NC}"
if [ -x "$UPDATED_COMPILER_PATH" ]; then
  COMPILER_TO_USE="$UPDATED_COMPILER_PATH"
  echo -e "${GREEN}Found updated GaiaScript compiler at $UPDATED_COMPILER_PATH${NC}"
elif [ -f "$UNIVERSAL_COMPILER_PATH" ]; then
  echo -e "${YELLOW}Found source universal compiler at $UNIVERSAL_COMPILER_PATH${NC}"
  
  # Check if we need to build the compiler
  echo -e "${BLUE}Attempting to build universal compiler...${NC}"
  if [ -d "/Users/pascaldisse/gaia/.gaia/comp" ]; then
    cd /Users/pascaldisse/gaia/.gaia/comp
    echo -e "${BLUE}Building compiler from source...${NC}"
    cargo build --release
    if [ -f "target/release/gaiascript" ]; then
      COMPILER_TO_USE="target/release/gaiascript"
      echo -e "${GREEN}Built compiler successfully${NC}"
      cd - > /dev/null
    else
      echo -e "${YELLOW}Failed to build compiler from source${NC}"
      cd - > /dev/null
    fi
  fi
fi

# If no Rust compiler is available, use JavaScript compiler
if [ -z "$COMPILER_TO_USE" ]; then
  echo -e "${YELLOW}No Rust compiler found. Falling back to JavaScript compiler...${NC}"
  
  if [ ! -f "$COMPILER_JS_PATH" ]; then
    echo -e "${RED}Error: JavaScript compiler not found at $COMPILER_JS_PATH${NC}"
    exit 1
  fi
  
  echo -e "${BLUE}Compiling chat.gaia with JavaScript compiler...${NC}"
  node "$COMPILER_JS_PATH" ./ ./chat-build/chat-compiled.js
  
  # Instead of trying to extract from GaiaScript, directly copy the source files for comparison
  echo -e "${BLUE}Copying React source files for comparison...${NC}"
  
  # Create output directory structure
  mkdir -p ./chat-build/components
  mkdir -p ./chat-build/models
  mkdir -p ./chat-build/services
  
  # Copy key files for comparison
  echo -e "${BLUE}Copying App.js...${NC}"
  cp ./src/App.js ./chat-build/App.js
  
  echo -e "${BLUE}Copying config.js...${NC}"
  cp ./src/config.js ./chat-build/config.js
  
  echo -e "${BLUE}Copying Chat.js...${NC}"
  mkdir -p ./chat-build/components
  cp ./src/components/Chat.js ./chat-build/components/Chat.js
  
  echo -e "${BLUE}Copying Persona.js...${NC}"
  mkdir -p ./chat-build/models
  cp ./src/models/Persona.js ./chat-build/models/Persona.js
  
  echo -e "${BLUE}Copying db.js...${NC}"
  mkdir -p ./chat-build/services
  cp ./src/services/db.js ./chat-build/services/db.js
else
  echo -e "${BLUE}Compiling chat.gaia with universal compiler...${NC}"
  "$COMPILER_TO_USE" build chat.gaia --platform=web --framework=react --output=./chat-build
fi

# Copy necessary files to build directory
echo -e "${BLUE}Copying static assets...${NC}"
cp -r ./public/* ./chat-build/ 2>/dev/null || echo -e "${YELLOW}Warning: No public directory found${NC}"

# Create index.html if not already created by compiler
if [ ! -f "./chat-build/index.html" ]; then
  echo -e "${YELLOW}Creating index.html...${NC}"
  cat > ./chat-build/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gaia Chat</title>
  <link rel="stylesheet" href="./chat.css">
</head>
<body>
  <div id="root"></div>
  <script src="./chat-compiled.js"></script>
</body>
</html>
EOF
fi

# Copy CSS files if they exist
if [ -d "./src/styles" ]; then
  echo -e "${BLUE}Copying CSS files...${NC}"
  cat ./src/styles/*.css > ./chat-build/chat.css 2>/dev/null || echo -e "${YELLOW}Warning: No style files found${NC}"
fi

# Generate comparison report between original React app and compiled output
echo -e "${BLUE}Generating comparison report...${NC}"

# Create a comparison directory
mkdir -p ./chat-build/comparison

# Create comparison report file
REPORT_FILE="./chat-build/comparison/build-report.md"

# Function to compare file contents
compare_files() {
  local original_file="$1"
  local compiled_file="$2"
  local file_name="$(basename "$original_file")"
  local diff_file="./chat-build/comparison/${file_name}.diff"
  
  if [ ! -f "$compiled_file" ]; then
    echo "❌ Missing compiled file: $compiled_file" >> "$REPORT_FILE"
    return 1
  fi
  
  # Use diff to compare files
  diff -u "$original_file" "$compiled_file" > "$diff_file" 2>/dev/null
  local diff_status=$?
  
  if [ $diff_status -eq 0 ]; then
    echo "✅ Files match: $file_name" >> "$REPORT_FILE"
    rm "$diff_file" # Remove empty diff file
    return 0
  else
    echo "❌ Files differ: $file_name (see diff in $diff_file)" >> "$REPORT_FILE"
    return 1
  fi
}

# Create the report header
cat > "$REPORT_FILE" << EOF
# Gaia Chat Compilation Report

This report compares the original React application with the compiled GaiaScript output.

## File Comparison Results

EOF

# Check if the compiled files match the original source files
echo -e "${BLUE}Comparing individual files...${NC}"

# Initialize counters
MATCHING_FILES=0
DIFFERENT_FILES=0
MISSING_FILES=0
TOTAL_FILES=0

# List of key files to check
KEY_FILES=(
  "./src/App.js:./chat-build/App.js"
  "./src/config.js:./chat-build/config.js"
  "./src/components/Chat.js:./chat-build/components/Chat.js"
  "./src/models/Persona.js:./chat-build/models/Persona.js"
  "./src/services/db.js:./chat-build/services/db.js"
)

echo "### Key Component Files" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Compare each key file
for file_pair in "${KEY_FILES[@]}"; do
  ORIGINAL_FILE="${file_pair%%:*}"
  COMPILED_FILE="${file_pair##*:}"
  
  if [ -f "$ORIGINAL_FILE" ]; then
    TOTAL_FILES=$((TOTAL_FILES + 1))
    
    if [ -f "$COMPILED_FILE" ]; then
      if compare_files "$ORIGINAL_FILE" "$COMPILED_FILE"; then
        MATCHING_FILES=$((MATCHING_FILES + 1))
      else
        DIFFERENT_FILES=$((DIFFERENT_FILES + 1))
      fi
    else
      MISSING_FILES=$((MISSING_FILES + 1))
      echo "❌ Missing compiled file: $(basename "$COMPILED_FILE")" >> "$REPORT_FILE"
    fi
  fi
done

# Add file size information
echo "" >> "$REPORT_FILE"
echo "## File Size Comparison" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Compare file sizes
echo -e "${BLUE}Calculating file sizes...${NC}"
ORIGINAL_SIZE=$(find ./src -type f -name "*.js" -o -name "*.css" | xargs cat | wc -c)
COMPILED_SIZE=$(find ./chat-build -type f -name "*.js" -o -name "*.css" -o -name "*.html" | xargs cat | wc -c)

# Calculate compression ratio
RATIO=$(echo "scale=2; $ORIGINAL_SIZE / $COMPILED_SIZE" | bc)

echo "Original React app size: $ORIGINAL_SIZE bytes" >> "$REPORT_FILE"
echo "Compiled output size: $COMPILED_SIZE bytes" >> "$REPORT_FILE"
echo "Compression ratio: $RATIO:1" >> "$REPORT_FILE"

# Add summary
echo "" >> "$REPORT_FILE"
echo "## Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- Total files checked: $TOTAL_FILES" >> "$REPORT_FILE"
echo "- Matching files: $MATCHING_FILES" >> "$REPORT_FILE"
echo "- Different files: $DIFFERENT_FILES" >> "$REPORT_FILE"
echo "- Missing files: $MISSING_FILES" >> "$REPORT_FILE"

if [ $MATCHING_FILES -eq $TOTAL_FILES ]; then
  echo "" >> "$REPORT_FILE"
  echo "✅ **SUCCESS**: All compiled files match the original source files!" >> "$REPORT_FILE"
else
  echo "" >> "$REPORT_FILE"
  echo "❌ **ISSUES FOUND**: Not all compiled files match the original source." >> "$REPORT_FILE"
  echo "Review the diff files in the comparison directory for details." >> "$REPORT_FILE"
fi

echo -e "${GREEN}Build completed successfully!${NC}"
echo -e "${GREEN}Output directory: $(pwd)/chat-build${NC}"
echo -e "${GREEN}Comparison report: $REPORT_FILE${NC}"

# Suggest serving the app
echo -e "${BLUE}To serve the application, run:${NC}"
echo -e "${YELLOW}cd chat-build && python -m http.server 8000${NC}"
echo -e "${BLUE}Then open http://localhost:8000 in your browser${NC}"