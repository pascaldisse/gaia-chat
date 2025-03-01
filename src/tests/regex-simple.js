// Minimal test script to debug regex issues

// Test string with attribute order reversed
const str = '<speech seduction="1.0" as="Succubus">Hello</speech>';

// Original regex pattern (requires as to be first attribute)
const originalPattern = new RegExp('<speech\\s+as=["\'"]Succubus["\'"](.*?)>(.*?)<\\/speech>', 'i');

// New pattern (allows as to appear anywhere in attributes)
const newPattern = new RegExp('<speech\\s+.*?as=["\'"]Succubus["\'"](.*?)>(.*?)<\\/speech>', 'i');

// Test both patterns
console.log("Original pattern match:", originalPattern.test(str));
console.log("New pattern match:", newPattern.test(str));

// For string replacement
console.log("\nReplacement test:");
const replaced = str.replace(
  /<speech\s+.*?as=["']Succubus["'].*?>(.*?)<\/speech>/i,
  (match, content) => `**Succubus:** ${content}`
);
console.log("Original:", str);
console.log("Replaced:", replaced);