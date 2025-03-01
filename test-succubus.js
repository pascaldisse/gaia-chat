// Basic test for Succubus formatting
console.log("=== TESTING SUCCUBUS FORMAT REGEX ===");

// Test message with Succubus tags
const message = `<speech as="Succubus" happiness="1.0">Hello, darling!</speech>

<action as="Succubus">I lean in closer, my eyes sparkling with mischief.</action>

<function>show_plot_options(choices=["Chat", "Leave"], default=0)</function>

<yield to="User" />`;

console.log("Original message:");
console.log(message);
console.log("\n");

// Test the speech pattern
const speechPattern = /<speech\s+[^>]*?as=["']Succubus["'][^>]*>([\s\S]*?)<\/speech>/gi;
const speechMatches = message.match(speechPattern);
console.log("Speech pattern matches:", speechMatches);

// Test the action pattern
const actionPattern = /<action\s+[^>]*?as=["']Succubus["'][^>]*>([\s\S]*?)<\/action>/gi;
const actionMatches = message.match(actionPattern);
console.log("Action pattern matches:", actionMatches);

// Test the function pattern
const functionPattern = /<function>([\s\S]*?)<\/function>/gi;
const functionMatches = message.match(functionPattern);
console.log("Function pattern matches:", functionMatches);

// Test the yield pattern
const yieldPattern = /<yield[^>]*\/>/gi;
const yieldMatches = message.match(yieldPattern);
console.log("Yield pattern matches:", yieldMatches);

// Apply the formatting
let formatted = message;

// Replace speech tags
formatted = formatted.replace(
  speechPattern,
  (match, content) => `**Succubus:** ${content.trim()}\n\n`
);

// Replace action tags
formatted = formatted.replace(
  actionPattern,
  (match, content) => `*Succubus ${content.trim()}*\n\n`
);

// Replace function tags
formatted = formatted.replace(
  functionPattern,
  (match, content) => `\`\`\`\n${content.trim()}\n\`\`\`\n\n`
);

// Remove yield tags
formatted = formatted.replace(yieldPattern, '');

console.log("\nFormatted message:");
console.log(formatted);

// Check if formatting was successful
console.log("\nFormatting results:");
console.log(`- Speech formatted: ${formatted.includes("**Succubus:**") ? '✅' : '❌'}`);
console.log(`- Action formatted: ${formatted.includes("*Succubus") ? '✅' : '❌'}`);
console.log(`- Function formatted: ${formatted.includes("```") ? '✅' : '❌'}`);
console.log(`- Yield removed: ${!formatted.includes("<yield") ? '✅' : '❌'}`);