// Basic string formatter test
// Run with Node.js directly

console.log("Starting formatter test");

// Test case
const message = '<speech seduction="1.0" as="Succubus">Hello, darling!</speech>';
console.log("Input:", message);

// Step 1: Find the opening tag boundary
const openingTagStart = message.indexOf('<speech');
const openingTagEnd = message.indexOf('>', openingTagStart);

// Step 2: Find the content boundaries
const contentStart = openingTagEnd + 1;
const contentEnd = message.indexOf('</speech>', contentStart);

// Step 3: Extract the content
const content = message.substring(contentStart, contentEnd);
console.log("Content:", content);

// Step 4: Format the content
const formatted = `**Succubus:** ${content}`;
console.log("Formatted output:", formatted);

// Check positions
console.log(`Tag starts at ${openingTagStart}, tag ends at ${openingTagEnd}`);
console.log(`Content starts at ${contentStart}, content ends at ${contentEnd}`);

console.log("Test complete");