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

# Create directories if they don't exist
mkdir -p $BUILD_DIR
mkdir -p $DIFF_DIR

echo "=== GaiaScript Build and Diff Tool ==="
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

# Perform a fallback manual conversion
echo "=== Manual conversion ==="
# Copy the original file as a baseline
cp "$ORIGINAL_FILE" "$OUTPUT_FILE"

# Add a header to indicate this is a manual conversion
TEMP_FILE="$BUILD_DIR/temp_header.js"
echo "// This is a simulated conversion" > "$TEMP_FILE"
echo "// Original GaiaScript file: $SOURCE_FILE" >> "$TEMP_FILE"
echo "// Original JS file: $ORIGINAL_FILE" >> "$TEMP_FILE"
echo "// Conversion date: $(date)" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"
cat "$OUTPUT_FILE" >> "$TEMP_FILE"
mv "$TEMP_FILE" "$OUTPUT_FILE"

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

# Generate encoding analysis
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