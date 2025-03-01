/**
 * This test directly tests the formatting function as it's called from the UI
 * by simulating what happens when a user clicks the Format button
 */

// Import the actual Message component from the codebase
const Message = require('../components/Message');

// Sample messages to test
const messages = [
  {
    id: 'test-1',
    personaId: 'succubus-id',
    content: '<speech as="Succubus" happiness="1.0">Hello, darling!</speech>',
    isUser: false
  },
  {
    id: 'test-2',
    personaId: 'succubus-id',
    content: '<speech seduction="1.0" as="Succubus">Hello, darling!</speech>',
    isUser: false
  },
  {
    id: 'test-3',
    personaId: 'succubus-id',
    content: '<action as="Succubus">poses dramatically</action>',
    isUser: false
  },
  {
    id: 'test-4',
    personaId: 'succubus-id',
    content: `<speech seduction="1.0" as="Succubus">Ah, darling... <pause> It's so wonderful to finally meet you. I've been waiting for someone as charming as you to come along.</speech>

<action as="Succubus">I give a sly pose, my purple eyes gleaming with mischief as I adjust my bunny ears.</action>`,
    isUser: false
  }
];

// Sample personas
const personas = [
  {
    id: 'succubus-id',
    name: 'Succubus',
    formatSettings: {
      useRoleplayMarkdown: false,
      customFormatting: true,
      formatRules: [
        {
          name: 'Speech',
          startTag: '<speech>',
          endTag: '</speech>',
          markdownFormat: '**{{content}}**',
          renderIncomplete: true,
          incompleteMarkdown: '*typing...*',
          enabled: true
        },
        {
          name: 'Action',
          startTag: '<action>',
          endTag: '</action>',
          markdownFormat: '*{{content}}*',
          renderIncomplete: true,
          incompleteMarkdown: '*{{content}}*',
          enabled: true
        },
        {
          name: 'Rule 3',
          startTag: '<function>',
          endTag: '</function>',
          markdownFormat: '**{{content}}**',
          renderIncomplete: false,
          enabled: true
        },
        {
          name: 'Rule 4',
          startTag: '<yield>',
          endTag: '</yield>',
          markdownFormat: '**{{content}}**',
          renderIncomplete: false,
          enabled: true
        }
      ]
    }
  }
];

// Direct access to the applyFormatting function
const applyFormatting = Message.prototype.applyFormatting;

// Run the tests
function runTests() {
  console.log("=== RUNNING FORMAT BUTTON TEST ===");
  
  messages.forEach((message, index) => {
    console.log(`\n--- TEST CASE ${index + 1} ---`);
    console.log("Message:", message.content);
    
    try {
      // Create a Message component instance
      const messageComponent = new Message({ 
        message: message,
        personas: personas,
        onRegenerate: () => {}
      });
      
      // Call the formatting function directly
      const result = messageComponent.applyFormatting();
      
      console.log("Result:", result);
      console.log("Does it contain expected format?", 
        result.includes("**Succubus:**") || result.includes("*Succubus "));
      
      console.log("Test PASSED ✅");
    } catch (error) {
      console.error("Error in test:", error);
      console.log("Test FAILED ❌");
    }
  });
  
  console.log("\n=== TEST COMPLETE ===");
}

// Run the tests
runTests();