/**
 * Format Test - Directly tests the formatting logic
 */

// Define test messages with different variants
const testMessages = [
  {
    name: "Standard attribute order",
    input: '<speech as="Succubus" happiness="1.0">Hello, darling!</speech>',
    expected: "**Succubus:** Hello, darling!"
  },
  {
    name: "Reversed attribute order",
    input: '<speech seduction="1.0" as="Succubus">Hello, darling!</speech>',
    expected: "**Succubus:** Hello, darling!"
  },
  {
    name: "Action tag",
    input: '<action as="Succubus">poses dramatically</action>',
    expected: "*Succubus poses dramatically*"
  },
  {
    name: "Complex message",
    input: `<speech seduction="1.0" as="Succubus">Ah, darling... It's wonderful to meet you.</speech>
<action as="Succubus">I give a sly pose</action>`,
    expected: "**Succubus:** Ah, darling... It's wonderful to meet you.\n\n*Succubus I give a sly pose*"
  }
];

// This simulates the extraction function
function processContent(input) {
  console.log("Processing content:", input);
  let result = input;
  
  // List of common patterns to try (taken from our latest Message.js)
  const speechPatterns = [
    '<speech as="Succubus" happiness="1.0">',
    '<speech seduction="1.0" as="Succubus">',
    '<speech as="Succubus" seduction="1.0">'
  ];
  
  const actionPatterns = [
    '<action as="Succubus">',
    '<action as="Succubus" happiness="0.5">',
    '<action seduction="1.0" as="Succubus">'
  ];
  
  // First try exact patterns for speech tags
  for (const pattern of speechPatterns) {
    if (result.includes(pattern)) {
      console.log(`Found speech pattern: "${pattern}"`);
      const startIdx = result.indexOf(pattern);
      const endTag = '</speech>';
      const endTagIdx = result.indexOf(endTag, startIdx);
      
      if (startIdx >= 0 && endTagIdx >= 0) {
        console.log(`Tag found at ${startIdx}, ends at ${endTagIdx}`);
        const fullTag = result.substring(startIdx, endTagIdx + endTag.length);
        const content = result.substring(startIdx + pattern.length, endTagIdx);
        const formatted = `**Succubus:** ${content.trim()}\n\n`;
        
        console.log(`Replacing "${fullTag.substring(0, 30)}..." with "${formatted.substring(0, 30)}..."`);
        result = result.replace(fullTag, formatted);
      }
    }
  }
  
  // Then try action patterns
  for (const pattern of actionPatterns) {
    if (result.includes(pattern)) {
      console.log(`Found action pattern: "${pattern}"`);
      const startIdx = result.indexOf(pattern);
      const endTag = '</action>';
      const endTagIdx = result.indexOf(endTag, startIdx);
      
      if (startIdx >= 0 && endTagIdx >= 0) {
        console.log(`Tag found at ${startIdx}, ends at ${endTagIdx}`);
        const fullTag = result.substring(startIdx, endTagIdx + endTag.length);
        const content = result.substring(startIdx + pattern.length, endTagIdx);
        const formatted = `*Succubus ${content.trim()}*\n\n`;
        
        console.log(`Replacing "${fullTag.substring(0, 30)}..." with "${formatted.substring(0, 30)}..."`);
        result = result.replace(fullTag, formatted);
      }
    }
  }
  
  // Fallback for speech tags with any attribution
  if (result.includes('<speech') && result.includes('as="Succubus"')) {
    console.log("Using fallback for speech tags");
    const tagStart = result.indexOf('<speech');
    if (tagStart >= 0) {
      const tagEnd = result.indexOf('>', tagStart);
      if (tagEnd >= 0) {
        const contentStart = tagEnd + 1;
        const contentEnd = result.indexOf('</speech>', contentStart);
        if (contentEnd >= 0) {
          const content = result.substring(contentStart, contentEnd);
          const fullTag = result.substring(tagStart, contentEnd + 9);
          const formatted = `**Succubus:** ${content.trim()}\n\n`;
          
          console.log(`Fallback replacing "${fullTag.substring(0, 30)}..." with "${formatted.substring(0, 30)}..."`);
          result = result.replace(fullTag, formatted);
        }
      }
    }
  }
  
  // Fallback for action tags with any attribution
  if (result.includes('<action') && result.includes('as="Succubus"')) {
    console.log("Using fallback for action tags");
    const tagStart = result.indexOf('<action');
    if (tagStart >= 0) {
      const tagEnd = result.indexOf('>', tagStart);
      if (tagEnd >= 0) {
        const contentStart = tagEnd + 1;
        const contentEnd = result.indexOf('</action>', contentStart);
        if (contentEnd >= 0) {
          const content = result.substring(contentStart, contentEnd);
          const fullTag = result.substring(tagStart, contentEnd + 9);
          const formatted = `*Succubus ${content.trim()}*\n\n`;
          
          console.log(`Fallback replacing "${fullTag.substring(0, 30)}..." with "${formatted.substring(0, 30)}..."`);
          result = result.replace(fullTag, formatted);
        }
      }
    }
  }
  
  return result.trim();
}

// Run the tests
console.log("\n=== TESTING DIRECT FORMATTER ===\n");

testMessages.forEach((test, index) => {
  console.log(`\n--- TEST CASE ${index + 1}: ${test.name} ---`);
  console.log("Input:", test.input);
  
  const result = processContent(test.input);
  console.log("Output:", result);
  
  const success = result.includes(test.expected);
  console.log("Success:", success ? "✅ PASS" : "❌ FAIL");
  
  if (!success) {
    console.log("Expected:", test.expected);
    console.log("Got:", result);
  }
});

console.log("\n=== ALL TESTS COMPLETE ===");