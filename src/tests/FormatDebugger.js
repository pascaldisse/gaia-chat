/**
 * Format Debugger - A utility to test and fix formatting issues with tags
 * 
 * This is a standalone test that we can use to debug and fix the formatting issues
 * with various types of tags like <speech> and <action>.
 */

// Test with various formats of speech and action tags
const testFormatting = () => {
  const testCases = [
    {
      name: "Simple speech tag",
      input: '<speech>Hello world</speech>',
      expected: '**Hello world**'
    },
    {
      name: "Speech tag with attributes", 
      input: '<speech as="Character" mood="happy">Hello world</speech>',
      expected: '**Character:** Hello world'
    },
    {
      name: "Speech tag with attributes in different order",
      input: '<speech mood="happy" as="Character">Hello world</speech>',
      expected: '**Character:** Hello world'
    },
    {
      name: "Action tag",
      input: '<action>waves hand</action>',
      expected: '*waves hand*'
    },
    {
      name: "Action tag with attributes",
      input: '<action as="Character" intensity="high">waves hand</action>',
      expected: '*Character waves hand*'
    },
    {
      name: "Complex Succubus example",
      input: '<speech as="Succubus" happiness="1.0" sadness="0.0"> Ah, hello there, darling... *bats eyelashes* It\'s so lovely to finally meet you.</speech>',
      expected: '**Succubus:** Ah, hello there, darling... *bats eyelashes* It\'s so lovely to finally meet you.'
    },
    {
      name: "Complex Action example",
      input: '<action as="Succubus">I lean in, my purple eyes locked onto yours, my voice taking on a sultry tone as I wait for your response.</action>',
      expected: '*Succubus I lean in, my purple eyes locked onto yours, my voice taking on a sultry tone as I wait for your response.*'
    },
    {
      name: "Function tag",
      input: '<function>show_plot_options(choices=["Option 1", "Option 2"], default=0)</function>',
      expected: '```\nshow_plot_options(choices=["Option 1", "Option 2"], default=0)\n```'
    }
  ];

  console.log("=== FORMAT DEBUGGER RESULTS ===");
  
  // We need two sets of format rules to test against
  const simpleRules = [
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
    }
  ];
  
  const personaSettings = {
    useRoleplayMarkdown: false,
    customFormatting: true,
    formatRules: simpleRules
  };

  // This is the super robust formatter we need to build
  const formatWithBuiltInRules = (text) => {
    console.log("Testing built-in formatter with:", text.substring(0, 50));
    
    // First try with attribute rules
    let formattedText = text;
    
    // Check if there are any tags like <tag as="value"> - SUPER permissive pattern
    const hasAttributeTags = /(<(?:speech|action)\s+[^>]*?as\s*=\s*["'][^"']+["'][^>]*>)/i.test(formattedText);
    console.log("Has attribute tags:", hasAttributeTags);
    
    if (hasAttributeTags) {
      // Format speech tags with attributes - very permissive pattern
      formattedText = formattedText.replace(/<speech\s+[^>]*?as\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/speech>/gi, (match, character, content) => {
        console.log("Speech match:", {character, contentStart: content.substring(0, 20)});
        return `**${character}:** ${content.trim()}\n\n`;
      });
      
      // Format action tags with attributes - very permissive pattern
      formattedText = formattedText.replace(/<action\s+[^>]*?as\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/action>/gi, (match, character, content) => {
        console.log("Action match:", {character, contentStart: content.substring(0, 20)});
        return `*${character} ${content.trim()}*\n\n`;
      });
    } else {
      // Simple tags without as attribute
      formattedText = formattedText.replace(/<speech>([\s\S]*?)<\/speech>/gi, (match, content) => {
        console.log("Simple speech match:", {contentStart: content.substring(0, 20)});
        return `**${content.trim()}**\n\n`;
      });
      
      formattedText = formattedText.replace(/<action>([\s\S]*?)<\/action>/gi, (match, content) => {
        console.log("Simple action match:", {contentStart: content.substring(0, 20)});
        return `*${content.trim()}*\n\n`;
      });
    }
    
    // Format function tags
    formattedText = formattedText.replace(/<function>([\s\S]*?)<\/function>/gi, (match, content) => {
      console.log("Function match:", {contentStart: content.substring(0, 20)});
      return `\`\`\`\n${content.trim()}\n\`\`\`\n\n`;
    });
    
    return formattedText.trim();
  };
  
  // Test the formatWithBuiltInRules function
  testCases.forEach(test => {
    console.log(`\nTesting case: ${test.name}`);
    const result = formatWithBuiltInRules(test.input);
    const success = result.includes(test.expected);
    console.log(`Input: ${test.input.substring(0, 50)}${test.input.length > 50 ? '...' : ''}`);
    console.log(`Expected: ${test.expected.substring(0, 50)}${test.expected.length > 50 ? '...' : ''}`);
    console.log(`Result: ${result.substring(0, 50)}${result.length > 50 ? '...' : ''}`);
    console.log(`Test ${success ? 'PASSED' : 'FAILED'}`);
  });

  return "Format debugging complete";
};

// Export to make available
export { testFormatting };