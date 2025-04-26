#!/bin/bash

# Script to compare original React source with GaiaScript compiled output
# Focusing on the removal of sidebar overlay

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================================"
echo "GaiaScript Build Comparison Tool"
echo "========================================================"

# Step 1: Extract original React source from the specified commit
COMMIT="4f89c99917300e01f7441bccb534c3529853af18"
REPO_PATH="$(pwd)"
TEMP_DIR="$(pwd)/temp_src_comparison"
ORIGINAL_SRC="$TEMP_DIR/original_src"
COMPILED_OUTPUT="$TEMP_DIR/compiled_output"

# Create temporary directories
mkdir -p "$ORIGINAL_SRC"
mkdir -p "$COMPILED_OUTPUT"

echo -e "${YELLOW}Step 1: Examining original source from commit:${NC} $COMMIT"

# Get commit information
git show --name-only $COMMIT > "$TEMP_DIR/commit_info.txt"
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to get information for commit $COMMIT${NC}"
    exit 1
fi

# Check if the commit contains React source files
REACT_FILES=$(git show --name-only $COMMIT | grep -E '\.jsx?

# Step 2: Run the GaiaScript compiler
echo -e "\n${YELLOW}Step 2: Running the GaiaScript compiler...${NC}"

# Find main.gaia
MAIN_GAIA_PATH=""
for p in "main.gaia" "src/main.gaia" "docs/gaiascript/main/main.gaia"; do
    if [ -f "$p" ]; then
        MAIN_GAIA_PATH="$p"
        break
    fi
done

if [ -z "$MAIN_GAIA_PATH" ]; then
    echo -e "${RED}Error: Could not find main.gaia file${NC}"
    exit 1
fi

# Run GaiaScript compiler
echo "Using main.gaia found at: $MAIN_GAIA_PATH"

# Check if compiler exists
COMPILER_PATH="docs/gaiascript/comp/gaia-ui-compiler.js"
if [ ! -f "$COMPILER_PATH" ]; then
    echo -e "${RED}Error: Compiler not found at $COMPILER_PATH${NC}"
    exit 1
fi

# Create build directory if it doesn't exist
mkdir -p build

# Run the compiler
node $COMPILER_PATH "$MAIN_GAIA_PATH" "build/"
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to compile main.gaia${NC}"
    exit 1
fi

# Copy build files to our comparison directory
cp -r build/* "$COMPILED_OUTPUT/"
echo -e "${GREEN}Successfully compiled GaiaScript to:${NC} $COMPILED_OUTPUT"

# Step 3: Compare for sidebar overlay issues
echo -e "\n${YELLOW}Step 3: Checking for sidebar overlay references...${NC}"

# Function to check files for sidebar overlay
check_sidebar_overlay() {
    local dir=$1
    local overlay_found=false
    
    # Check CSS files
    for file in $(find "$dir" -name "*.css" 2>/dev/null); do
        if grep -q "sidebarOverlay\|sidebar-overlay" "$file"; then
            echo -e "${RED}Found sidebar overlay reference in CSS:${NC} $file"
            grep -n "sidebarOverlay\|sidebar-overlay" "$file"
            overlay_found=true
        fi
    done
    
    # Check JS files
    for file in $(find "$dir" -name "*.js" 2>/dev/null); do
        if grep -q "sidebarOverlay\|sidebar-overlay" "$file"; then
            echo -e "${RED}Found sidebar overlay reference in JS:${NC} $file"
            grep -n "sidebarOverlay\|sidebar-overlay" "$file"
            overlay_found=true
        fi
    done
    
    # Check JSX files if in original source
    for file in $(find "$dir" -name "*.jsx" 2>/dev/null); do
        if grep -q "sidebarOverlay\|sidebar-overlay" "$file"; then
            echo -e "${RED}Found sidebar overlay reference in JSX:${NC} $file"
            grep -n "sidebarOverlay\|sidebar-overlay" "$file"
            overlay_found=true
        fi
    done
    
    # Check HTML files
    for file in $(find "$dir" -name "*.html" 2>/dev/null); do
        if grep -q "sidebarOverlay\|sidebar-overlay" "$file"; then
            echo -e "${RED}Found sidebar overlay reference in HTML:${NC} $file"
            grep -n "sidebarOverlay\|sidebar-overlay" "$file"
            overlay_found=true
        fi
    done
    
    return $([ "$overlay_found" = true ] && echo 1 || echo 0)
}

# Check original source
echo "Checking original source files..."
original_has_overlay=false
if check_sidebar_overlay "$ORIGINAL_SRC"; then
    original_has_overlay=true
fi

# Check compiled output
echo "Checking compiled output files..."
compiled_has_overlay=false
if check_sidebar_overlay "$COMPILED_OUTPUT"; then
    compiled_has_overlay=true
fi

# Step 4: Verify main.gaia does not have sidebar overlay
echo -e "\n${YELLOW}Step 4: Checking main.gaia for sidebar overlay references...${NC}"
if grep -q "sidebarOverlay\|sidebar-overlay" "$MAIN_GAIA_PATH"; then
    echo -e "${RED}Found sidebar overlay reference in main.gaia:${NC}"
    grep -n "sidebarOverlay\|sidebar-overlay" "$MAIN_GAIA_PATH"
    gaia_has_overlay=true
else
    echo -e "${GREEN}No sidebar overlay references found in main.gaia${NC}"
    gaia_has_overlay=false
fi

# Step 5: Final assessment
echo -e "\n${YELLOW}Step 5: Final assessment${NC}"

if [ "$original_has_overlay" = true ] && [ "$compiled_has_overlay" = false ] && [ "$gaia_has_overlay" = false ]; then
    echo -e "${GREEN}SUCCESS: Sidebar overlay has been successfully removed from main.gaia and compiled output!${NC}"
    echo -e "Original source had sidebar overlay, but it has been removed in your implementation."
    exit 0
elif [ "$original_has_overlay" = false ] && [ "$compiled_has_overlay" = false ] && [ "$gaia_has_overlay" = false ]; then
    echo -e "${GREEN}SUCCESS: No sidebar overlay found in any files!${NC}"
    echo "Note: Original source didn't have sidebar overlay either."
    exit 0
else
    echo -e "${RED}FAILURE: Sidebar overlay still exists in some files.${NC}"
    
    if [ "$gaia_has_overlay" = true ]; then
        echo -e "You need to update main.gaia to remove all sidebar overlay references."
    fi
    
    if [ "$compiled_has_overlay" = true ]; then
        echo -e "Compiled output still contains sidebar overlay references."
        echo -e "This might be due to the compiler logic or because main.gaia still has these references."
    fi
    
    echo -e "\nPlease make the necessary updates to main.gaia and run this script again."
    exit 1
fi
)
if [ -z "$REACT_FILES" ]; then
    echo -e "${YELLOW}Warning: No React files found in the specified commit${NC}"
    echo -e "${YELLOW}Will check if 'sidebar-overlay' exists in any files from the commit${NC}"
    
    # Get all files from the commit
    FILES_IN_COMMIT=$(git show --name-only $COMMIT | grep -v '^commit' | grep -v '^Author:' | grep -v '^Date:' | grep -v '^

# Step 2: Run the GaiaScript compiler
echo -e "\n${YELLOW}Step 2: Running the GaiaScript compiler...${NC}"

# Find main.gaia
MAIN_GAIA_PATH=""
for p in "main.gaia" "src/main.gaia" "docs/gaiascript/main/main.gaia"; do
    if [ -f "$p" ]; then
        MAIN_GAIA_PATH="$p"
        break
    fi
done

if [ -z "$MAIN_GAIA_PATH" ]; then
    echo -e "${RED}Error: Could not find main.gaia file${NC}"
    exit 1
fi

# Run GaiaScript compiler
echo "Using main.gaia found at: $MAIN_GAIA_PATH"

# Check if compiler exists
COMPILER_PATH="docs/gaiascript/comp/gaia-ui-compiler.js"
if [ ! -f "$COMPILER_PATH" ]; then
    echo -e "${RED}Error: Compiler not found at $COMPILER_PATH${NC}"
    exit 1
fi

# Create build directory if it doesn't exist
mkdir -p build

# Run the compiler
node $COMPILER_PATH "$MAIN_GAIA_PATH" "build/"
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to compile main.gaia${NC}"
    exit 1
fi

# Copy build files to our comparison directory
cp -r build/* "$COMPILED_OUTPUT/"
echo -e "${GREEN}Successfully compiled GaiaScript to:${NC} $COMPILED_OUTPUT"

# Step 3: Compare for sidebar overlay issues
echo -e "\n${YELLOW}Step 3: Checking for sidebar overlay references...${NC}"

# Function to check files for sidebar overlay
check_sidebar_overlay() {
    local dir=$1
    local overlay_found=false
    
    # Check CSS files
    for file in $(find "$dir" -name "*.css" 2>/dev/null); do
        if grep -q "sidebarOverlay\|sidebar-overlay" "$file"; then
            echo -e "${RED}Found sidebar overlay reference in CSS:${NC} $file"
            grep -n "sidebarOverlay\|sidebar-overlay" "$file"
            overlay_found=true
        fi
    done
    
    # Check JS files
    for file in $(find "$dir" -name "*.js" 2>/dev/null); do
        if grep -q "sidebarOverlay\|sidebar-overlay" "$file"; then
            echo -e "${RED}Found sidebar overlay reference in JS:${NC} $file"
            grep -n "sidebarOverlay\|sidebar-overlay" "$file"
            overlay_found=true
        fi
    done
    
    # Check JSX files if in original source
    for file in $(find "$dir" -name "*.jsx" 2>/dev/null); do
        if grep -q "sidebarOverlay\|sidebar-overlay" "$file"; then
            echo -e "${RED}Found sidebar overlay reference in JSX:${NC} $file"
            grep -n "sidebarOverlay\|sidebar-overlay" "$file"
            overlay_found=true
        fi
    done
    
    # Check HTML files
    for file in $(find "$dir" -name "*.html" 2>/dev/null); do
        if grep -q "sidebarOverlay\|sidebar-overlay" "$file"; then
            echo -e "${RED}Found sidebar overlay reference in HTML:${NC} $file"
            grep -n "sidebarOverlay\|sidebar-overlay" "$file"
            overlay_found=true
        fi
    done
    
    return $([ "$overlay_found" = true ] && echo 1 || echo 0)
}

# Check original source
echo "Checking original source files..."
original_has_overlay=false
if check_sidebar_overlay "$ORIGINAL_SRC"; then
    original_has_overlay=true
fi

# Check compiled output
echo "Checking compiled output files..."
compiled_has_overlay=false
if check_sidebar_overlay "$COMPILED_OUTPUT"; then
    compiled_has_overlay=true
fi

# Step 4: Verify main.gaia does not have sidebar overlay
echo -e "\n${YELLOW}Step 4: Checking main.gaia for sidebar overlay references...${NC}"
if grep -q "sidebarOverlay\|sidebar-overlay" "$MAIN_GAIA_PATH"; then
    echo -e "${RED}Found sidebar overlay reference in main.gaia:${NC}"
    grep -n "sidebarOverlay\|sidebar-overlay" "$MAIN_GAIA_PATH"
    gaia_has_overlay=true
else
    echo -e "${GREEN}No sidebar overlay references found in main.gaia${NC}"
    gaia_has_overlay=false
fi

# Step 5: Final assessment
echo -e "\n${YELLOW}Step 5: Final assessment${NC}"

if [ "$original_has_overlay" = true ] && [ "$compiled_has_overlay" = false ] && [ "$gaia_has_overlay" = false ]; then
    echo -e "${GREEN}SUCCESS: Sidebar overlay has been successfully removed from main.gaia and compiled output!${NC}"
    echo -e "Original source had sidebar overlay, but it has been removed in your implementation."
    exit 0
elif [ "$original_has_overlay" = false ] && [ "$compiled_has_overlay" = false ] && [ "$gaia_has_overlay" = false ]; then
    echo -e "${GREEN}SUCCESS: No sidebar overlay found in any files!${NC}"
    echo "Note: Original source didn't have sidebar overlay either."
    exit 0
else
    echo -e "${RED}FAILURE: Sidebar overlay still exists in some files.${NC}"
    
    if [ "$gaia_has_overlay" = true ]; then
        echo -e "You need to update main.gaia to remove all sidebar overlay references."
    fi
    
    if [ "$compiled_has_overlay" = true ]; then
        echo -e "Compiled output still contains sidebar overlay references."
        echo -e "This might be due to the compiler logic or because main.gaia still has these references."
    fi
    
    echo -e "\nPlease make the necessary updates to main.gaia and run this script again."
    exit 1
fi
 | grep -v '^\s*

# Step 2: Run the GaiaScript compiler
echo -e "\n${YELLOW}Step 2: Running the GaiaScript compiler...${NC}"

# Find main.gaia
MAIN_GAIA_PATH=""
for p in "main.gaia" "src/main.gaia" "docs/gaiascript/main/main.gaia"; do
    if [ -f "$p" ]; then
        MAIN_GAIA_PATH="$p"
        break
    fi
done

if [ -z "$MAIN_GAIA_PATH" ]; then
    echo -e "${RED}Error: Could not find main.gaia file${NC}"
    exit 1
fi

# Run GaiaScript compiler
echo "Using main.gaia found at: $MAIN_GAIA_PATH"

# Check if compiler exists
COMPILER_PATH="docs/gaiascript/comp/gaia-ui-compiler.js"
if [ ! -f "$COMPILER_PATH" ]; then
    echo -e "${RED}Error: Compiler not found at $COMPILER_PATH${NC}"
    exit 1
fi

# Create build directory if it doesn't exist
mkdir -p build

# Run the compiler
node $COMPILER_PATH "$MAIN_GAIA_PATH" "build/"
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to compile main.gaia${NC}"
    exit 1
fi

# Copy build files to our comparison directory
cp -r build/* "$COMPILED_OUTPUT/"
echo -e "${GREEN}Successfully compiled GaiaScript to:${NC} $COMPILED_OUTPUT"

# Step 3: Compare for sidebar overlay issues
echo -e "\n${YELLOW}Step 3: Checking for sidebar overlay references...${NC}"

# Function to check files for sidebar overlay
check_sidebar_overlay() {
    local dir=$1
    local overlay_found=false
    
    # Check CSS files
    for file in $(find "$dir" -name "*.css" 2>/dev/null); do
        if grep -q "sidebarOverlay\|sidebar-overlay" "$file"; then
            echo -e "${RED}Found sidebar overlay reference in CSS:${NC} $file"
            grep -n "sidebarOverlay\|sidebar-overlay" "$file"
            overlay_found=true
        fi
    done
    
    # Check JS files
    for file in $(find "$dir" -name "*.js" 2>/dev/null); do
        if grep -q "sidebarOverlay\|sidebar-overlay" "$file"; then
            echo -e "${RED}Found sidebar overlay reference in JS:${NC} $file"
            grep -n "sidebarOverlay\|sidebar-overlay" "$file"
            overlay_found=true
        fi
    done
    
    # Check JSX files if in original source
    for file in $(find "$dir" -name "*.jsx" 2>/dev/null); do
        if grep -q "sidebarOverlay\|sidebar-overlay" "$file"; then
            echo -e "${RED}Found sidebar overlay reference in JSX:${NC} $file"
            grep -n "sidebarOverlay\|sidebar-overlay" "$file"
            overlay_found=true
        fi
    done
    
    # Check HTML files
    for file in $(find "$dir" -name "*.html" 2>/dev/null); do
        if grep -q "sidebarOverlay\|sidebar-overlay" "$file"; then
            echo -e "${RED}Found sidebar overlay reference in HTML:${NC} $file"
            grep -n "sidebarOverlay\|sidebar-overlay" "$file"
            overlay_found=true
        fi
    done
    
    return $([ "$overlay_found" = true ] && echo 1 || echo 0)
}

# Check original source
echo "Checking original source files..."
original_has_overlay=false
if check_sidebar_overlay "$ORIGINAL_SRC"; then
    original_has_overlay=true
fi

# Check compiled output
echo "Checking compiled output files..."
compiled_has_overlay=false
if check_sidebar_overlay "$COMPILED_OUTPUT"; then
    compiled_has_overlay=true
fi

# Step 4: Verify main.gaia does not have sidebar overlay
echo -e "\n${YELLOW}Step 4: Checking main.gaia for sidebar overlay references...${NC}"
if grep -q "sidebarOverlay\|sidebar-overlay" "$MAIN_GAIA_PATH"; then
    echo -e "${RED}Found sidebar overlay reference in main.gaia:${NC}"
    grep -n "sidebarOverlay\|sidebar-overlay" "$MAIN_GAIA_PATH"
    gaia_has_overlay=true
else
    echo -e "${GREEN}No sidebar overlay references found in main.gaia${NC}"
    gaia_has_overlay=false
fi

# Step 5: Final assessment
echo -e "\n${YELLOW}Step 5: Final assessment${NC}"

if [ "$original_has_overlay" = true ] && [ "$compiled_has_overlay" = false ] && [ "$gaia_has_overlay" = false ]; then
    echo -e "${GREEN}SUCCESS: Sidebar overlay has been successfully removed from main.gaia and compiled output!${NC}"
    echo -e "Original source had sidebar overlay, but it has been removed in your implementation."
    exit 0
elif [ "$original_has_overlay" = false ] && [ "$compiled_has_overlay" = false ] && [ "$gaia_has_overlay" = false ]; then
    echo -e "${GREEN}SUCCESS: No sidebar overlay found in any files!${NC}"
    echo "Note: Original source didn't have sidebar overlay either."
    exit 0
else
    echo -e "${RED}FAILURE: Sidebar overlay still exists in some files.${NC}"
    
    if [ "$gaia_has_overlay" = true ]; then
        echo -e "You need to update main.gaia to remove all sidebar overlay references."
    fi
    
    if [ "$compiled_has_overlay" = true ]; then
        echo -e "Compiled output still contains sidebar overlay references."
        echo -e "This might be due to the compiler logic or because main.gaia still has these references."
    fi
    
    echo -e "\nPlease make the necessary updates to main.gaia and run this script again."
    exit 1
fi
)
    
    # Save the files to our temp directory
    for file in $FILES_IN_COMMIT; do
        if [ -f "$file" ]; then
            DIR=$(dirname "$ORIGINAL_SRC/$file")
            mkdir -p "$DIR"
            git show "$COMMIT:$file" > "$ORIGINAL_SRC/$file" 2>/dev/null
        fi
    done
fi

echo -e "${GREEN}Successfully extracted original source files to:${NC} $ORIGINAL_SRC"

# Step 2: Run the GaiaScript compiler
echo -e "\n${YELLOW}Step 2: Running the GaiaScript compiler...${NC}"

# Find main.gaia
MAIN_GAIA_PATH=""
for p in "main.gaia" "src/main.gaia" "docs/gaiascript/main/main.gaia"; do
    if [ -f "$p" ]; then
        MAIN_GAIA_PATH="$p"
        break
    fi
done

if [ -z "$MAIN_GAIA_PATH" ]; then
    echo -e "${RED}Error: Could not find main.gaia file${NC}"
    exit 1
fi

# Run GaiaScript compiler
echo "Using main.gaia found at: $MAIN_GAIA_PATH"

# Check if compiler exists
COMPILER_PATH="docs/gaiascript/comp/gaia-ui-compiler.js"
if [ ! -f "$COMPILER_PATH" ]; then
    echo -e "${RED}Error: Compiler not found at $COMPILER_PATH${NC}"
    exit 1
fi

# Create build directory if it doesn't exist
mkdir -p build

# Run the compiler
node $COMPILER_PATH "$MAIN_GAIA_PATH" "build/"
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to compile main.gaia${NC}"
    exit 1
fi

# Copy build files to our comparison directory
cp -r build/* "$COMPILED_OUTPUT/"
echo -e "${GREEN}Successfully compiled GaiaScript to:${NC} $COMPILED_OUTPUT"

# Step 3: Compare for sidebar overlay issues
echo -e "\n${YELLOW}Step 3: Checking for sidebar overlay references...${NC}"

# Function to check files for sidebar overlay
check_sidebar_overlay() {
    local dir=$1
    local overlay_found=false
    
    # Check CSS files
    for file in $(find "$dir" -name "*.css" 2>/dev/null); do
        if grep -q "sidebarOverlay\|sidebar-overlay" "$file"; then
            echo -e "${RED}Found sidebar overlay reference in CSS:${NC} $file"
            grep -n "sidebarOverlay\|sidebar-overlay" "$file"
            overlay_found=true
        fi
    done
    
    # Check JS files
    for file in $(find "$dir" -name "*.js" 2>/dev/null); do
        if grep -q "sidebarOverlay\|sidebar-overlay" "$file"; then
            echo -e "${RED}Found sidebar overlay reference in JS:${NC} $file"
            grep -n "sidebarOverlay\|sidebar-overlay" "$file"
            overlay_found=true
        fi
    done
    
    # Check JSX files if in original source
    for file in $(find "$dir" -name "*.jsx" 2>/dev/null); do
        if grep -q "sidebarOverlay\|sidebar-overlay" "$file"; then
            echo -e "${RED}Found sidebar overlay reference in JSX:${NC} $file"
            grep -n "sidebarOverlay\|sidebar-overlay" "$file"
            overlay_found=true
        fi
    done
    
    # Check HTML files
    for file in $(find "$dir" -name "*.html" 2>/dev/null); do
        if grep -q "sidebarOverlay\|sidebar-overlay" "$file"; then
            echo -e "${RED}Found sidebar overlay reference in HTML:${NC} $file"
            grep -n "sidebarOverlay\|sidebar-overlay" "$file"
            overlay_found=true
        fi
    done
    
    return $([ "$overlay_found" = true ] && echo 1 || echo 0)
}

# Check original source
echo "Checking original source files..."
original_has_overlay=false
if check_sidebar_overlay "$ORIGINAL_SRC"; then
    original_has_overlay=true
fi

# Check compiled output
echo "Checking compiled output files..."
compiled_has_overlay=false
if check_sidebar_overlay "$COMPILED_OUTPUT"; then
    compiled_has_overlay=true
fi

# Step 4: Verify main.gaia does not have sidebar overlay
echo -e "\n${YELLOW}Step 4: Checking main.gaia for sidebar overlay references...${NC}"
if grep -q "sidebarOverlay\|sidebar-overlay" "$MAIN_GAIA_PATH"; then
    echo -e "${RED}Found sidebar overlay reference in main.gaia:${NC}"
    grep -n "sidebarOverlay\|sidebar-overlay" "$MAIN_GAIA_PATH"
    gaia_has_overlay=true
else
    echo -e "${GREEN}No sidebar overlay references found in main.gaia${NC}"
    gaia_has_overlay=false
fi

# Step 5: Final assessment
echo -e "\n${YELLOW}Step 5: Final assessment${NC}"

if [ "$original_has_overlay" = true ] && [ "$compiled_has_overlay" = false ] && [ "$gaia_has_overlay" = false ]; then
    echo -e "${GREEN}SUCCESS: Sidebar overlay has been successfully removed from main.gaia and compiled output!${NC}"
    echo -e "Original source had sidebar overlay, but it has been removed in your implementation."
    exit 0
elif [ "$original_has_overlay" = false ] && [ "$compiled_has_overlay" = false ] && [ "$gaia_has_overlay" = false ]; then
    echo -e "${GREEN}SUCCESS: No sidebar overlay found in any files!${NC}"
    echo "Note: Original source didn't have sidebar overlay either."
    exit 0
else
    echo -e "${RED}FAILURE: Sidebar overlay still exists in some files.${NC}"
    
    if [ "$gaia_has_overlay" = true ]; then
        echo -e "You need to update main.gaia to remove all sidebar overlay references."
    fi
    
    if [ "$compiled_has_overlay" = true ]; then
        echo -e "Compiled output still contains sidebar overlay references."
        echo -e "This might be due to the compiler logic or because main.gaia still has these references."
    fi
    
    echo -e "\nPlease make the necessary updates to main.gaia and run this script again."
    exit 1
fi
