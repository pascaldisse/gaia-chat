import { runFormatterTests } from './FormatterTests';

// Simply run the tests
console.log("=== FORMATTER TEST SUITE ===");
console.log(runFormatterTests());

// Add a test case for the Succubus scenario 
import { applyFormatting } from '../components/MessageFormatter';

const testSuccubusScenario = () => {
  console.log("\n=== SPECIFIC SUCCUBUS SCENARIO TEST ===\n");
  
  const text = `<speech as="Succubus" happiness="1.0" sadness="0.0"> Ah, hello there, darling... *bats eyelashes* It's so lovely to finally meet you.</speech>

<action as="Succubus">I lean in, my purple eyes locked onto yours, my voice taking on a sultry tone as I wait for your response.</action>

<function>show_plot_options(choices=["Let's get to know each other", "I'm interested in BDSM"], default=0)</function>

<yield to="user" />`;

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
  
  console.log("Testing Succubus message formatting with debug output enabled...");
  const result = applyFormatting(text, formatSettings, true);
  
  console.log("\nFORMATTED RESULT:");
  console.log("=====================================");
  console.log(result);
  console.log("=====================================");
  
  // Check if the formatting worked
  const successSpeech = result.includes("**Succubus:**");
  const successAction = result.includes("*Succubus I lean in");
  const successFunction = result.includes("```\nshow_plot_options");
  
  console.log(`\nSpeech formatting successful: ${successSpeech ? 'YES' : 'NO'}`);
  console.log(`Action formatting successful: ${successAction ? 'YES' : 'NO'}`);
  console.log(`Function formatting successful: ${successFunction ? 'YES' : 'NO'}`);
  
  return "Succubus test completed";
};

// Run the specific Succubus test
console.log(testSuccubusScenario());