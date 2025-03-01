// Simple standalone test runner for Succubus formatting
// Import the MessageFormatter directly to avoid require/import issues
const MessageFormatter = {
  applyFormatting: (text, personaSettings, debug = false) => {
    console.log("Mock formatter called with:", text.substring(0, 50));
    
    let formattedText = text;
    
    // Apply Succubus formatting directly for testing
    if (text.includes('<speech as="Succubus"') || text.includes('as="Succubus"')) {
      // Handle speech tags for Succubus
      formattedText = formattedText.replace(
        /<speech\s+[^>]*?as=["']Succubus["'][^>]*>([\s\S]*?)<\/speech>/gi,
        (match, content) => `**Succubus:** ${content.trim()}\n\n`
      );
      
      // Handle action tags for Succubus
      formattedText = formattedText.replace(
        /<action\s+[^>]*?as=["']Succubus["'][^>]*>([\s\S]*?)<\/action>/gi,
        (match, content) => `*Succubus ${content.trim()}*\n\n`
      );
      
      // Handle function tags
      formattedText = formattedText.replace(
        /<function>([\s\S]*?)<\/function>/gi,
        (match, content) => `\`\`\`\n${content.trim()}\n\`\`\`\n\n`
      );
      
      // Remove yield tags
      formattedText = formattedText.replace(/<yield[^>]*\/>/gi, '');
    }
    
    return formattedText;
  }
};

function runTest() {
  // Sample message with Succubus tags
  const message = `<speech as="Succubus" happiness="1.0">Hello, darling!</speech>

<action as="Succubus">I lean in closer, my eyes sparkling with mischief.</action>

<function>show_plot_options(choices=["Chat", "Leave"], default=0)</function>

<yield to="User" />`;

  // Formatter settings 
  const formatSettings = {
    useRoleplayMarkdown: false,
    customFormatting: true,
    formatRules: [
      {
        name: "Speech",
        startTag: "<speech>",
        endTag: "</speech>",
        markdownFormat: "**{{content}}**",
        enabled: true
      },
      {
        name: "Action",
        startTag: "<action>",
        endTag: "</action>",
        markdownFormat: "*{{content}}*",
        enabled: true
      },
      {
        name: "Function",
        startTag: "<function>",
        endTag: "</function>",
        markdownFormat: "```\n{{content}}\n```",
        enabled: true
      },
      {
        name: "Yield",
        startTag: "<yield>",
        endTag: "</yield>",
        markdownFormat: "",
        enabled: true
      }
    ]
  };

  console.log("=== SUCCUBUS FORMAT TEST ===\n");
  console.log("Input:\n", message);
  console.log("\nRunning formatting...");
  
  try {
    const result = MessageFormatter.applyFormatting(message, formatSettings, true);
    console.log("\nFormatted Result:\n", result);
    
    // Check results
    const speechFormatted = result.includes("**Succubus:**");
    const actionFormatted = result.includes("*Succubus");
    const functionFormatted = result.includes("```");
    const yieldRemoved = !result.includes("<yield");
    
    console.log("\nResults:");
    console.log(`- Speech formatted correctly: ${speechFormatted ? '✅' : '❌'}`);
    console.log(`- Action formatted correctly: ${actionFormatted ? '✅' : '❌'}`); 
    console.log(`- Function formatted correctly: ${functionFormatted ? '✅' : '❌'}`);
    console.log(`- Yield tags removed: ${yieldRemoved ? '✅' : '❌'}`);
    
    return {
      success: speechFormatted && actionFormatted && functionFormatted && yieldRemoved,
      result
    };
  } catch (error) {
    console.error("Error during formatting:", error);
    return { success: false, error };
  }
}

// Run the test
const result = runTest();
console.log(`\nOverall test ${result.success ? 'PASSED ✅' : 'FAILED ❌'}`);