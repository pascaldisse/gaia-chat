// Simple standalone test for Succubus formatting

// Example message with attributes in different orders
const message = `<speech seduction="1.0" as="Succubus">Ah, darling... It's so wonderful to finally meet you.</speech>

<action as="Succubus" happiness="0.5">I give a sly pose, my eyes gleaming with mischief.</action>

<function>generate_image(description="A purple-lit room with a figure posing")</function>

<yield to="You" />`;

// Format with the new patterns
function formatSuccubusMessage(content) {
  console.log("Original message:", content);
  let formatted = content;
  
  // Format speech tags
  const speechPattern = /<speech.*?as=["']Succubus["'].*?>(.*?)<\/speech>/gis;
  formatted = formatted.replace(speechPattern, (match, content) => {
    console.log("Found speech tag:", match);
    return `**Succubus:** ${content.trim()}\n\n`;
  });
  
  // Format action tags
  const actionPattern = /<action.*?as=["']Succubus["'].*?>(.*?)<\/action>/gis;
  formatted = formatted.replace(actionPattern, (match, content) => {
    console.log("Found action tag:", match);
    return `*Succubus ${content.trim()}*\n\n`;
  });
  
  // Format function tags
  formatted = formatted.replace(
    /<function>([\s\S]*?)<\/function>/gi,
    (match, content) => {
      console.log("Found function tag:", match);
      return `\`\`\`\n${content.trim()}\n\`\`\`\n\n`;
    }
  );
  
  // Remove yield tags
  formatted = formatted.replace(/<yield[^>]*\/>/gi, '');
  formatted = formatted.replace(/<yield[^>]*>.*?<\/yield>/gi, '');
  
  console.log("\nFormatted message:", formatted);
  return formatted;
}

// Run the test
formatSuccubusMessage(message);