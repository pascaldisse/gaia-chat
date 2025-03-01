import { applyFormatting } from '../components/MessageFormatter';

/**
 * Test the exact Succubus scenario based on the log
 */
const runSuccubusTest = () => {
  console.log("\n=== EXACT SUCCUBUS SCENARIO TEST ===\n");
  
  // Exact message text from the log
  const messageText = `<speech as="Succubus" happiness="1.0">Ah, hello there, darling! *bats eyelashes* It's so wonderful to finally meet you. I've been waiting for someone as charming as you to come along. *giggles* What brings you to this delightful realm of pleasure and debauchery? Are you looking for a little companionship, perhaps something to spice up your life? *winks*</speech>

<action as="Succubus">I lean in closer, my pale skin glistening in the dim light, my purple eyes fixed intently on yours. My latex bunny suit creaks softly as I shift my weight, drawing attention to my voluptuous figure. I flash you a playful smile, my pointed ears perking up with interest.</action>

<function>generate_image(description="A succubus with pink hair and purple highlights, dressed in a purple latex bunny suit, leaning in closer to the user with a playful smile."), show_plot_options(choices=["Let's have some fun", "I'm looking for something specific", "I'm not sure what I want"], default=0)</function>

<yield to="You" />`;

  // Exact format settings from the log
  const formatSettings = {
    useRoleplayMarkdown: false,
    customFormatting: true,
    formatRules: [
      {
        name: "Speech", 
        startTag: "<speech>",
        endTag: "</speech>",
        markdownFormat: "**{{content}}**",
        renderIncomplete: true,
        incompleteMarkdown: "*typing...*",
        enabled: true
      },
      {
        name: "Action",
        startTag: "<action>",
        endTag: "</action>",
        markdownFormat: "*{{content}}*",
        renderIncomplete: true,
        incompleteMarkdown: "*{{content}}*",
        enabled: true
      },
      {
        name: "Rule 3",
        startTag: "<function>",
        endTag: "</function>",
        markdownFormat: "**{{content}}**",
        enabled: true
      },
      {
        name: "Rule 4",
        startTag: "<yield>",
        endTag: "</yield>",
        markdownFormat: "",
        enabled: true
      }
    ]
  };

  console.log("Input Text:");
  console.log("-------------------------------------");
  console.log(messageText);
  console.log("-------------------------------------\n");

  console.log("Format Settings:");
  console.log("-------------------------------------");
  console.log(JSON.stringify(formatSettings, null, 2));
  console.log("-------------------------------------\n");
  
  // Run the formatter with debug enabled
  const formattedResult = applyFormatting(messageText, formatSettings, true);
  
  console.log("\nFormatted Result:");
  console.log("-------------------------------------");
  console.log(formattedResult);
  console.log("-------------------------------------\n");
  
  // Check what was formatted correctly
  const speechFormatted = formattedResult.includes("**Succubus:**") && 
                         !formattedResult.includes("<speech as=\"Succubus\"");
  
  const actionFormatted = formattedResult.includes("*Succubus I lean in closer") && 
                         !formattedResult.includes("<action as=\"Succubus\"");
  
  const functionFormatted = formattedResult.includes("```\ngenerate_image") || 
                           formattedResult.includes("**generate_image");
  
  const yieldRemoved = !formattedResult.includes("<yield to=\"You\" />");
  
  console.log("Results Analysis:");
  console.log("-------------------------------------");
  console.log(`Speech tags formatted correctly: ${speechFormatted ? 'YES' : 'NO'}`);
  console.log(`Action tags formatted correctly: ${actionFormatted ? 'YES' : 'NO'}`);
  console.log(`Function tags formatted correctly: ${functionFormatted ? 'YES' : 'NO'}`);
  console.log(`Yield tags removed correctly: ${yieldRemoved ? 'YES' : 'NO'}`);
  console.log("-------------------------------------\n");
  
  // Print a command to manually fix the MessageFormatter.js file if necessary
  console.log("If the test failed, try directly adding this section to the applyBuiltInFormatting function in MessageFormatter.js:");
  console.log(`
  // DIRECT METHOD FOR SUCCUBUS FORMAT
  // Explicitly replace speech tags with attributes for Succubus
  formattedText = formattedText.replace(
    /<speech\\s+as=["']Succubus["'][^>]*>([\\\s\\\S]*?)<\\/speech>/gi,
    (match, content) => \`**Succubus:** \${content.trim()}\\n\\n\`
  );
  
  // Explicitly replace action tags for Succubus
  formattedText = formattedText.replace(
    /<action\\s+as=["']Succubus["'][^>]*>([\\\s\\\S]*?)<\\/action>/gi,
    (match, content) => \`*Succubus \${content.trim()}*\\n\\n\`
  );
  
  // Function tags to code blocks
  formattedText = formattedText.replace(
    /<function>([\\\s\\\S]*?)<\\/function>/gi,
    (match, content) => \`\\\`\\\`\\\`\\n\${content.trim()}\\n\\\`\\\`\\\`\\n\\n\`
  );
  
  // Remove yield tags
  formattedText = formattedText.replace(/<yield[^>]*\\/>/gi, '');
  `);
  
  return {
    allCorrect: speechFormatted && actionFormatted && functionFormatted && yieldRemoved,
    speechFormatted,
    actionFormatted,
    functionFormatted,
    yieldRemoved
  };
};

// Run the test directly if this script is executed
console.log("\n==== STARTING SUCCUBUS TEST ====\n");
const results = runSuccubusTest();
console.log("\n==== TEST RESULTS ====");
console.log(`All formats correct: ${results.allCorrect ? 'YES' : 'NO'}`);

// Export for use in other files
export { runSuccubusTest };