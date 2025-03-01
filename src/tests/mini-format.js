// Extremely minimal test - no imports, no dependencies
console.log("Testing basic string replacement...");

// The message we want to format
const message = '<speech seduction="1.0" as="Succubus">Hello, darling!</speech>';

console.log("Original:", message);

// Method 1: Simple string operations
const startPos = message.indexOf('<speech');
const tagEndPos = message.indexOf('>', startPos);
const contentStartPos = tagEndPos + 1;
const contentEndPos = message.indexOf('</speech>', contentStartPos);

if (startPos >= 0 && tagEndPos >= 0 && contentEndPos >= 0) {
  const content = message.substring(contentStartPos, contentEndPos);
  const formatted = `**Succubus:** ${content}`;
  console.log("Formatted (Method 1):", formatted);
} else {
  console.log("Failed to find all positions");
}

// Method 2: Hardcoded exact patterns
const patterns = [
  '<speech as="Succubus" happiness="1.0">',
  '<speech seduction="1.0" as="Succubus">',
  '<speech as="Succubus" seduction="1.0">'
];

let foundExactMatch = false;
for (const pattern of patterns) {
  if (message.includes(pattern)) {
    console.log(`Found exact pattern: "${pattern}"`);
    const startIdx = message.indexOf(pattern);
    const endTag = '</speech>';
    const endIdx = message.indexOf(endTag, startIdx);
    
    if (startIdx >= 0 && endIdx >= 0) {
      const tagContent = message.substring(startIdx + pattern.length, endIdx);
      const formatted = `**Succubus:** ${tagContent}`;
      console.log("Formatted (Method 2):", formatted);
      foundExactMatch = true;
      break;
    }
  }
}

if (!foundExactMatch) {
  console.log("No exact pattern matched");
}

console.log("Test complete!");