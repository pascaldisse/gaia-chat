// This is a standalone script to test regex patterns
// It doesn't require any React or Jest dependencies

// Test regexes for Succubus messages
console.log("====== TESTING SUCCUBUS REGEX PATTERNS ======");

// Test cases with different attribute orders
const testCases = [
  '<speech as="Succubus" seduction="1.0">Hello, darling!</speech>',
  '<speech seduction="1.0" as="Succubus">Hello again!</speech>',
  '<action as="Succubus" happiness="0.5">poses dramatically</action>',
  '<action happiness="0.5" as="Succubus">smiles coyly</action>'
];

// Original regex patterns (with 'as' required as first attribute)
console.log("\n----- TESTING ORIGINAL PATTERNS -----");
const originalSpeechPattern = /<speech\s+as=["']Succubus["'][^>]*>([\s\S]*?)<\/speech>/gi;
const originalActionPattern = /<action\s+as=["']Succubus["'][^>]*>([\s\S]*?)<\/action>/gi;

// New regex patterns (with 'as' allowed anywhere in the tag)
console.log("\n----- TESTING NEW PATTERNS -----");
const newSpeechPattern = /<speech\s+[^>]*as=["']Succubus["'][^>]*>([\s\S]*?)<\/speech>/gi;
const newActionPattern = /<action\s+[^>]*as=["']Succubus["'][^>]*>([\s\S]*?)<\/action>/gi;

// Test each case with original patterns
testCases.forEach(testCase => {
  console.log("\nTest case:", testCase);
  
  // Create a new regex object for each test to reset state
  const speechPattern = new RegExp(originalSpeechPattern);
  const actionPattern = new RegExp(originalActionPattern);
  
  let matched = false;
  
  // Try speech pattern
  let match = speechPattern.exec(testCase);
  if (match) {
    console.log("Original - ✅ Speech match! Content:", match[1]);
    matched = true;
  }
  
  // Try action pattern
  match = actionPattern.exec(testCase);
  if (match) {
    console.log("Original - ✅ Action match! Content:", match[1]);
    matched = true;
  }
  
  if (!matched) {
    console.log("Original - ❌ No match found!");
  }
  
  // Create new regex objects for the new patterns
  const newSpeechPatternObj = new RegExp(newSpeechPattern);
  const newActionPatternObj = new RegExp(newActionPattern);
  
  matched = false;
  
  // Try new speech pattern
  match = newSpeechPatternObj.exec(testCase);
  if (match) {
    console.log("New - ✅ Speech match! Content:", match[1]);
    matched = true;
  }
  
  // Try new action pattern
  match = newActionPatternObj.exec(testCase);
  if (match) {
    console.log("New - ✅ Action match! Content:", match[1]);
    matched = true;
  }
  
  if (!matched) {
    console.log("New - ❌ No match found!");
  }
});

// Test raw regex substitution on a message
console.log("\n\n----- TESTING FORMATTED OUTPUT -----");

const messageContent = '<speech seduction="1.0" as="Succubus">Hello, darling!</speech>\n\n<action seduction="1.0" as="Succubus">poses seductively</action>';

// Test with original patterns
console.log("=== Original Patterns Result ===");
let formattedWithOriginal = messageContent
  .replace(originalSpeechPattern, (match, content) => `**Succubus:** ${content.trim()}\n\n`)
  .replace(originalActionPattern, (match, content) => `*Succubus ${content.trim()}*\n\n`);

console.log(formattedWithOriginal);

// Test with new patterns
console.log("\n=== New Patterns Result ===");
let formattedWithNew = messageContent
  .replace(newSpeechPattern, (match, content) => `**Succubus:** ${content.trim()}\n\n`)
  .replace(newActionPattern, (match, content) => `*Succubus ${content.trim()}*\n\n`);

console.log(formattedWithNew);