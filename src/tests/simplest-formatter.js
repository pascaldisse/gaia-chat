/**
 * The absolute simplest formatter test
 * Just uses hardcoded string replacements to demonstrate the concept
 */

const message = '<speech seduction="1.0" as="Succubus">Hello, darling!</speech>';
console.log("Original message:", message);

// Method 1: Find tag boundaries and replace with concatenation
const startTag = '<speech seduction="1.0" as="Succubus">';
const endTag = '</speech>';

if (message.includes(startTag)) {
  console.log("Found exact start tag");
  const startIdx = message.indexOf(startTag);
  const endIdx = message.indexOf(endTag, startIdx);
  
  if (startIdx >= 0 && endIdx >= 0) {
    console.log(`Tag found at ${startIdx}, ends at ${endIdx}`);
    
    const content = message.substring(startIdx + startTag.length, endIdx);
    console.log("Content:", content);
    
    const formatted = `**Succubus:** ${content.trim()}`;
    const result = formatted;
    
    console.log("Formatted result:", result);
  }
} else {
  console.log("Exact start tag not found");
}

// Method 2: Detect any speech tag with "as" attribute
if (message.includes('<speech') && message.includes('as="Succubus"')) {
  console.log("\nGeneric detection successful");
  
  const tagStart = message.indexOf('<speech');
  const closeTag = message.indexOf('>', tagStart);
  const endTag = message.indexOf('</speech>', closeTag);
  
  if (tagStart >= 0 && closeTag >= 0 && endTag >= 0) {
    console.log("Tag detected, content between positions", closeTag + 1, "and", endTag);
    
    const content = message.substring(closeTag + 1, endTag);
    console.log("Content:", content);
    
    const formatted = `**Succubus:** ${content}`;
    console.log("Formatted result:", formatted);
  }
}