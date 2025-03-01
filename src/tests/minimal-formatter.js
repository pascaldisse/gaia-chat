// Most minimal test possible to check formatting
console.log("Testing Succubus formatting");

// Test message with reversed attributes
const message = '<speech seduction="1.0" as="Succubus">Hello, darling!</speech>';
console.log("Original:", message);

// Test direct string extraction 
function extractAndFormat(input) {
  console.log("Starting extraction...");
  
  // Check for tag presence
  if (input.includes('<speech') && input.includes('as="Succubus"')) {
    console.log("Found speech tag with Succubus");
    
    // Find tag boundaries
    const endTag = '</speech>';
    const tagStart = input.indexOf('<speech');
    const contentStart = input.indexOf('>', tagStart) + 1;
    const contentEnd = input.indexOf(endTag, contentStart);
    
    if (contentStart > 0 && contentEnd > 0) {
      // Extract content
      const content = input.substring(contentStart, contentEnd);
      console.log("Extracted content:", content);
      
      // Format using direct replacement
      return `**Succubus:** ${content}`;
    } else {
      console.log("Could not find content boundaries");
      return input;
    }
  } else {
    console.log("No matching tags found");
    return input;
  }
}

// Test the simplest approach
const simpleResult = extractAndFormat(message);
console.log("Formatted:", simpleResult);

// Test basic regex approach
const regexResult = message.replace(
  /<speech[^>]*as=["']Succubus["'][^>]*>(.*?)<\/speech>/i,
  (match, content) => `**Succubus:** ${content}`
);
console.log("Regex formatted:", regexResult);