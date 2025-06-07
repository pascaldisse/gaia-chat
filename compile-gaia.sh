#!/bin/bash

# Configuration
SOURCE_FILE="chat.gaia"
BUILD_DIR="build"
OUTPUT_FILE="$BUILD_DIR/chat.js"
ORIGINAL_FILE="src/chat.js"
DIFF_DIR="diff"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DIFF_FILE="$DIFF_DIR/chat_diff_${TIMESTAMP}.diff"
STATS_FILE="$DIFF_DIR/stats_${TIMESTAMP}.txt"
ENCODING_FILE="$DIFF_DIR/encoding_analysis.md"
TEMP_FILE="$BUILD_DIR/temp.js"

# Create directories if they don't exist
mkdir -p $BUILD_DIR
mkdir -p $DIFF_DIR

echo "=== GaiaScript Shell Compiler ==="
echo "Source file: $SOURCE_FILE"
echo "Output file: $OUTPUT_FILE"
echo "Original file: $ORIGINAL_FILE"

# Check if source files exist
if [ ! -f "$SOURCE_FILE" ]; then
    echo "Error: Source file not found: $SOURCE_FILE"
    exit 1
fi

if [ ! -f "$ORIGINAL_FILE" ]; then
    echo "Error: Original file not found: $ORIGINAL_FILE"
    exit 1
fi

echo "=== Compiling GaiaScript using shell patterns ==="

# Create header for the output file
cat > "$OUTPUT_FILE" << EOF
// Generated from GaiaScript using shell-based converter
// Original file: $SOURCE_FILE
// Converted on: $(date)
// This is a simulated conversion that demonstrates the GaiaScript to JavaScript/React transformation

import React, { useState, useEffect, useRef } from 'react';

EOF

# Basic pattern replacements to convert GaiaScript to JavaScript/React
echo "Applying transformations..."

# Extract content between code markers for JavaScript sections
cat "$SOURCE_FILE" | grep -o 'l₀⟨.*⟩' | sed 's/l₀⟨\(.*\)⟩/\1/g' >> "$TEMP_FILE"

# If no JavaScript sections found, do basic conversions
if [ ! -s "$TEMP_FILE" ]; then
    echo "No direct JavaScript sections found, applying symbol conversions..."
    
    # Copy source file to temp for transformations
    cp "$SOURCE_FILE" "$TEMP_FILE"
    
    # Replace import statements: N⟨...⟩ -> import { ... } from 'react';
    sed -i.bak 's/N⟨\([^⟩]*\)⟩/import { \1 } from "react";/g' "$TEMP_FILE"
    
    # Replace state declarations: S⟨...⟩ -> const [...] = useState();
    sed -i.bak 's/S⟨\([^⟩]*\)⟩/const [\1] = useState();/g' "$TEMP_FILE"
    
    # Replace function definitions: F⟨name,params⟩...⟨/F⟩ -> function name(params) {...}
    sed -i.bak 's/F⟨\([^,]*\),\([^⟩]*\)⟩/function \1(\2) {/g' "$TEMP_FILE"
    sed -i.bak 's/⟨\/F⟩/}/g' "$TEMP_FILE"
    
    # Replace component definitions: C⟨name⟩...⟨/C⟩ -> const name = () => {...};
    sed -i.bak 's/C⟨\([^,]*\),\([^⟩]*\)⟩/const \1 = ({ \2 }) => {/g' "$TEMP_FILE"
    sed -i.bak 's/C⟨\([^,⟩]*\)⟩/const \1 = () => {/g' "$TEMP_FILE"
    sed -i.bak 's/⟨\/C⟩/};/g' "$TEMP_FILE"
    
    # Replace UI declarations: UI⟨✱⟩...⟨/UI⟩ -> return (...);
    sed -i.bak 's/UI⟨✱⟩/return (/g' "$TEMP_FILE"
    sed -i.bak 's/⟨\/UI⟩/);/g' "$TEMP_FILE"
    
    # Replace styled elements: □{styles}⟦Content⟧ -> <div style={styles}>Content</div>
    sed -i.bak 's/□{\([^}]*\)}⟦\([^⟧]*\)⟧/<div style={\1}>\2<\/div>/g' "$TEMP_FILE"
    
    # Replace text values: T⟨...⟩ -> "..."
    sed -i.bak 's/T⟨\([^⟩]*\)⟩/"\1"/g' "$TEMP_FILE"
    
    # Replace lists: L⟨...⟩ -> [...]
    sed -i.bak 's/L⟨\([^⟩]*\)⟩/[\1]/g' "$TEMP_FILE"
    
    # Replace objects: O⟨...⟩ -> {...}
    sed -i.bak 's/O⟨\([^⟩]*\)⟩/{\1}/g' "$TEMP_FILE"
    
    # Replace documentation: D⟨...⟩ -> /**\n * ...\n */
    sed -i.bak 's/D⟨\([^⟩]*\)⟩/\/\*\*\n \* \1\n \*\//g' "$TEMP_FILE"
fi

# Clean up non-translatable content to create valid JavaScript
echo "Cleaning up remaining GaiaScript symbols..."

# Replace Chinese characters with English equivalents for common terms
sed -i.bak 's/從/from/g' "$TEMP_FILE"
sed -i.bak 's/導出/export/g' "$TEMP_FILE"
sed -i.bak 's/返回/return/g' "$TEMP_FILE"
sed -i.bak 's/如果/if/g' "$TEMP_FILE"
sed -i.bak 's/否則/else/g' "$TEMP_FILE"
sed -i.bak 's/常量/const/g' "$TEMP_FILE"
sed -i.bak 's/變量/let/g' "$TEMP_FILE"
sed -i.bak 's/函數/function/g' "$TEMP_FILE"
sed -i.bak 's/類/class/g' "$TEMP_FILE"
sed -i.bak 's/構造器/constructor/g' "$TEMP_FILE"
sed -i.bak 's/異步/async/g' "$TEMP_FILE"
sed -i.bak 's/等待/await/g' "$TEMP_FILE"
sed -i.bak 's/嘗試/try/g' "$TEMP_FILE"
sed -i.bak 's/捕獲/catch/g' "$TEMP_FILE"
sed -i.bak 's/引用/ref/g' "$TEMP_FILE"
sed -i.bak 's/效果/effect/g' "$TEMP_FILE"
sed -i.bak 's/狀態/state/g' "$TEMP_FILE"

# Append the transformed content to the output file
cat "$TEMP_FILE" >> "$OUTPUT_FILE"

# Cleanup
rm -f "$TEMP_FILE" "$TEMP_FILE.bak"

echo "=== Basic compilation complete ==="

# Generate diff between compiled output and original source
echo "=== Generating diff ==="
diff -u "$ORIGINAL_FILE" "$OUTPUT_FILE" > "$DIFF_FILE"

# Check if diff was successful
if [ $? -eq 0 ]; then
    echo "No differences found between compiled output and original source."
else
    echo "Differences found and saved to $DIFF_FILE"
fi

# Generate statistics
echo "=== Generating statistics ==="
echo "File comparison statistics" > "$STATS_FILE"
echo "Generated on: $(date)" >> "$STATS_FILE"
echo "------------------------" >> "$STATS_FILE"
echo "Original file ($ORIGINAL_FILE):" >> "$STATS_FILE"
wc -l "$ORIGINAL_FILE" >> "$STATS_FILE"
echo "Output file ($OUTPUT_FILE):" >> "$STATS_FILE"
wc -l "$OUTPUT_FILE" >> "$STATS_FILE"
echo "------------------------" >> "$STATS_FILE"
ORIG_LINES=$(wc -l < "$ORIGINAL_FILE")
OUTPUT_LINES=$(wc -l < "$OUTPUT_FILE")
ORIG_CHARS=$(wc -c < "$ORIGINAL_FILE")
OUTPUT_CHARS=$(wc -c < "$OUTPUT_FILE")
echo "Line difference: $(( OUTPUT_LINES - ORIG_LINES ))" >> "$STATS_FILE"
echo "Char difference: $(( OUTPUT_CHARS - ORIG_CHARS ))" >> "$STATS_FILE"

# All analysis from previous script
echo "=== Analyzing encoding patterns ==="
echo "# Encoding Analysis" > "$ENCODING_FILE"
echo "Generated on: $(date)" >> "$ENCODING_FILE"
echo "" >> "$ENCODING_FILE"
echo "## GaiaScript Symbols Found" >> "$ENCODING_FILE"
echo "" >> "$ENCODING_FILE"
if grep -q "⟨" "$SOURCE_FILE" 2>/dev/null; then
    grep -o "⟨[^⟩]*⟩" "$SOURCE_FILE" 2>/dev/null | sort | uniq -c | sort -nr >> "$ENCODING_FILE"
else
    echo "No GaiaScript symbols found" >> "$ENCODING_FILE"
fi
echo "" >> "$ENCODING_FILE"
echo "## Word Encodings Found" >> "$ENCODING_FILE"
echo "" >> "$ENCODING_FILE"
if grep -q "w[₀₁₂₃₄₅₆₇₈₉]" "$SOURCE_FILE" 2>/dev/null; then
    grep -o "w[₀₁₂₃₄₅₆₇₈₉]\+" "$SOURCE_FILE" 2>/dev/null | sort | uniq -c | sort -nr >> "$ENCODING_FILE"
else
    echo "No word encodings found" >> "$ENCODING_FILE"
fi

# Add language tags found
echo "" >> "$ENCODING_FILE"
echo "## Language Tags Found" >> "$ENCODING_FILE"
echo "" >> "$ENCODING_FILE"
if grep -q "l[₀₁₂₃₄₅₆₇]" "$SOURCE_FILE" 2>/dev/null; then
    grep -o "l[₀₁₂₃₄₅₆₇]" "$SOURCE_FILE" 2>/dev/null | sort | uniq -c | sort -nr >> "$ENCODING_FILE"
    echo "" >> "$ENCODING_FILE"
    echo "Language mapping:" >> "$ENCODING_FILE"
    echo "- l₀: JavaScript" >> "$ENCODING_FILE"
    echo "- l₁: Swift" >> "$ENCODING_FILE"
    echo "- l₂: Python" >> "$ENCODING_FILE"
    echo "- l₃: GaiaScript" >> "$ENCODING_FILE"
    echo "- l₄: Rust" >> "$ENCODING_FILE"
    echo "- l₅: C#" >> "$ENCODING_FILE"
    echo "- l₆: C" >> "$ENCODING_FILE"
    echo "- l₇: Kotlin" >> "$ENCODING_FILE"
else
    echo "No language tags found" >> "$ENCODING_FILE"
fi

# Add Chinese characters analysis
echo "" >> "$ENCODING_FILE"
echo "## Chinese Characters Used" >> "$ENCODING_FILE"
echo "" >> "$ENCODING_FILE"
if grep -q "[一-龥]" "$SOURCE_FILE" 2>/dev/null; then
    grep -o "[一-龥]" "$SOURCE_FILE" 2>/dev/null | sort | uniq -c | sort -nr >> "$ENCODING_FILE"
else
    echo "No Chinese characters found" >> "$ENCODING_FILE"
fi

# Add GaiaScript encoding reference from CLAUDE.md
echo "" >> "$ENCODING_FILE"
echo "## GaiaScript Syntax Reference" >> "$ENCODING_FILE"
echo "" >> "$ENCODING_FILE"
cat << 'EOF' >> "$ENCODING_FILE"
```
Format                             Purpose
T⟨...⟩                             Text values
L⟨...⟩                             Lists
O⟨name:value, name:value⟩          Objects
D⟨...⟩                             Documentation
N⟨UI, Utils, JsSystem⟩             Namespace imports
S⟨var1: val1, var2: val2⟩          State declaration
F⟨functionName, param1⟩...⟨/F⟩     Function definition
C⟨componentName⟩⟨...⟩⟨/C⟩          Component definition
UI⟨✱⟩...⟨/UI⟩                      Main UI application
□{styles}⟦Content⟧                 Styled UI elements
```
EOF

echo "=== Done ==="
echo "Statistics saved to $STATS_FILE"
echo "Encoding analysis saved to $ENCODING_FILE"
echo "Diff saved to $DIFF_FILE"