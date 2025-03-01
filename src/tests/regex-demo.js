/**
 * This is a standalone script to test Succubus message formatting
 * Run this directly with Node
 */

const message = `<speech seduction="1.0" as="Succubus">Ah, darling... <pause> It's so wonderful to finally meet you. I've been waiting for someone as charming as you to come along. <smile> What brings you to this little corner of the underworld? Are you looking for a delightful companion, or perhaps something a bit more... sinister? <wink></speech>

<action as="Succubus">I give a sly pose, my purple eyes gleaming with mischief as I adjust my bunny ears. My latex suit seems to shimmer in the dim light, drawing your attention to my curvaceous figure.</action>

<function>generate_image(description="A purple-lit room with a singular, ornate chair. Succubus, a slender figure with pink hair and purple highlights, stands before it, posing in a latex bunny suit, her eyes gleaming with mischief."), show_plot_options(choices=["Get to know Succubus", "Explore the room", "Request a special favor"], default=0)</function>

<yield to="You" />`;

// Apply the updated regex patterns
function formatMessage(content) {
  let formatted = content;
  
  // 1. Speech tags with attributes in any order
  formatted = formatted.replace(
    /<speech\s+[^>]*as=["']Succubus["'][^>]*>([\s\S]*?)<\/speech>/gi,
    (match, content) => `**Succubus:** ${content.trim()}\n\n`
  );
  
  // 2. Action tags with attributes in any order
  formatted = formatted.replace(
    /<action\s+[^>]*as=["']Succubus["'][^>]*>([\s\S]*?)<\/action>/gi,
    (match, content) => `*Succubus ${content.trim()}*\n\n`
  );
  
  // 3. Function tags
  formatted = formatted.replace(
    /<function>([\s\S]*?)<\/function>/gi,
    (match, content) => `\`\`\`\n${content.trim()}\n\`\`\`\n\n`
  );
  
  // 4. Remove yield tags
  formatted = formatted.replace(/<yield[^>]*\/>/gi, '');
  formatted = formatted.replace(/<yield[^>]*>.*?<\/yield>/gi, '');
  
  return formatted;
}

// Format the message
const formatted = formatMessage(message);

// Display the original and formatted messages
console.log("ORIGINAL MESSAGE:");
console.log("----------------");
console.log(message);
console.log("\n\nFORMATTED MESSAGE:");
console.log("----------------");
console.log(formatted);