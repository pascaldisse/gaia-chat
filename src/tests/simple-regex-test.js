// Super simple test script for regex

// Test if the regex patterns match different cases
const messageContent = '<speech seduction="1.0" as="Succubus">Hello, darling!</speech>';

// Original pattern - requires 'as' to be first attribute
const originalPattern = /<speech\s+as=["']Succubus["'][^>]*>([\s\S]*?)<\/speech>/gi;

// New pattern - allows 'as' to be anywhere in attributes
const newPattern = /<speech\s+[^>]*as=["']Succubus["'][^>]*>([\s\S]*?)<\/speech>/gi;

// Test original pattern
const originalMatch = messageContent.match(originalPattern);
console.log("Original pattern matches:", originalMatch);

// Test new pattern
const newMatch = messageContent.match(newPattern);
console.log("New pattern matches:", newMatch);

// Format using both patterns
let formattedWithOriginal = messageContent.replace(originalPattern, 
  (match, content) => `**Succubus:** ${content}`);
console.log("\nFormatted with original pattern:", formattedWithOriginal);

let formattedWithNew = messageContent.replace(newPattern, 
  (match, content) => `**Succubus:** ${content}`);
console.log("Formatted with new pattern:", formattedWithNew);