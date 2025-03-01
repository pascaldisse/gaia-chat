// Simple test for Succubus tag formatting
// =============================

// Simple text with Succubus format tags
const textSample = `<speech as="Succubus" happiness="1.0">Hello, darling!</speech>

<action as="Succubus">I lean in closer, my eyes sparkling with mischief.</action>

<function>show_plot_options(choices=["Chat", "Leave"], default=0)</function>

<yield to="User" />`;

console.log("=== SUCCUBUS FORMAT TEST ===\n");
console.log("Original Text:\n", textSample);

// Regex patterns for different elements
const speechPattern = /<speech\s+[^>]*?as=["']Succubus["'][^>]*>([\s\S]*?)<\/speech>/gi;
const actionPattern = /<action\s+[^>]*?as=["']Succubus["'][^>]*>([\s\S]*?)<\/action>/gi;
const functionPattern = /<function>([\s\S]*?)<\/function>/gi;
const yieldPattern = /<yield[^>]*\/>/gi;

// Apply the formatting
let formattedText = textSample;

// Replace speech tags
formattedText = formattedText.replace(
  speechPattern,
  (match, content) => `**Succubus:** ${content.trim()}\n\n`
);

// Replace action tags
formattedText = formattedText.replace(
  actionPattern,
  (match, content) => `*Succubus ${content.trim()}*\n\n`
);

// Replace function tags
formattedText = formattedText.replace(
  functionPattern,
  (match, content) => `\`\`\`\n${content.trim()}\n\`\`\`\n\n`
);

// Remove yield tags
formattedText = formattedText.replace(yieldPattern, '');

console.log("\nFormatted Text:\n", formattedText);

// Check results
const speechFormatted = formattedText.includes("**Succubus:**");
const actionFormatted = formattedText.includes("*Succubus");
const functionFormatted = formattedText.includes("```");
const yieldRemoved = !formattedText.includes("<yield");

console.log("\nResults:");
console.log(`- Speech formatted correctly: ${speechFormatted ? '✅' : '❌'}`);
console.log(`- Action formatted correctly: ${actionFormatted ? '✅' : '❌'}`); 
console.log(`- Function formatted correctly: ${functionFormatted ? '✅' : '❌'}`);
console.log(`- Yield tags removed: ${yieldRemoved ? '✅' : '❌'}`);

console.log(`\nOverall test ${speechFormatted && actionFormatted && functionFormatted && yieldRemoved ? 'PASSED ✅' : 'FAILED ❌'}`);