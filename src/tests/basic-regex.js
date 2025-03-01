// Test basic regex for Succubus format
const text = '<speech seduction="1.0" as="Succubus">Hello, world</speech>';

console.log("Testing regex on:", text);
console.log("-----------------------------");

// Test with string match
const result = text.match(/<speech.*?as=["']Succubus["'].*?>(.*?)<\/speech>/i);
console.log("Match result:", result ? "FOUND MATCH" : "NO MATCH", result);

// Test with string replace
const replaced = text.replace(/<speech.*?as=["']Succubus["'].*?>(.*?)<\/speech>/i, 
  (match, content) => `**Succubus:** ${content}`);
console.log("Replaced result:", replaced);