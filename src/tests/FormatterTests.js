import { applyFormatting } from '../components/MessageFormatter';

/**
 * Test the message formatter against a range of test cases
 * 
 * This is a comprehensive test suite for the message formatter,
 * covering all the tag types and formats we need to support.
 */
const runFormatterTests = () => {
  console.log("\n============ MESSAGE FORMATTER TESTS ============\n");
  
  // Set 1: Simple tags without attributes
  const simpleTagTests = [
    {
      name: "Simple speech tag",
      input: '<speech>Hello world</speech>',
      expected: '**Hello world**',
      settings: {
        useRoleplayMarkdown: true
      }
    },
    {
      name: "Simple action tag",
      input: '<action>waves hand</action>',
      expected: '*waves hand*',
      settings: {
        useRoleplayMarkdown: true
      }
    },
    {
      name: "Simple function tag",
      input: '<function>console.log("Hello")</function>',
      expected: '```\nconsole.log("Hello")\n```',
      settings: {
        useRoleplayMarkdown: true
      }
    }
  ];
  
  // Set 2: Complex tags with attributes
  const attributeTagTests = [
    {
      name: "Speech tag with attributes",
      input: '<speech as="Character" mood="happy">Hello world</speech>',
      expected: '**Character:** Hello world',
      settings: {
        useRoleplayMarkdown: true
      }
    },
    {
      name: "Action tag with attributes",
      input: '<action as="Character" intensity="high">waves hand</action>',
      expected: '*Character waves hand*',
      settings: {
        useRoleplayMarkdown: true
      }
    },
    {
      name: "Attributes in different order",
      input: '<speech mood="happy" as="Character">Hello world</speech>',
      expected: '**Character:** Hello world',
      settings: {
        useRoleplayMarkdown: true
      }
    },
    {
      name: "Single quotes in attributes",
      input: '<speech as=\'Character\' mood=\'happy\'>Hello world</speech>',
      expected: '**Character:** Hello world',
      settings: {
        useRoleplayMarkdown: true
      }
    }
  ];
  
  // Set 3: Real-world examples from Succubus
  const succubusTests = [
    {
      name: "Succubus speech example",
      input: '<speech as="Succubus" happiness="1.0" sadness="0.0"> Ah, hello there, darling... *bats eyelashes* It\'s so lovely to finally meet you.</speech>',
      expected: '**Succubus:** Ah, hello there, darling... *bats eyelashes* It\'s so lovely to finally meet you.',
      settings: {
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
          }
        ]
      }
    },
    {
      name: "Succubus action example",
      input: '<action as="Succubus">I lean in, my purple eyes locked onto yours, my voice taking on a sultry tone as I wait for your response.</action>',
      expected: '*Succubus I lean in, my purple eyes locked onto yours, my voice taking on a sultry tone as I wait for your response.*',
      settings: {
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
          }
        ]
      }
    },
    {
      name: "Function tag in Succubus context",
      input: '<function>show_plot_options(choices=["Let\'s get to know each other", "I\'m interested in BDSM"], default=0)</function>',
      expected: '```\nshow_plot_options(choices=["Let\'s get to know each other", "I\'m interested in BDSM"], default=0)\n```',
      settings: {
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
          }
        ]
      }
    }
  ];
  
  // Set 4: Mixed content and edge cases
  const mixedContentTests = [
    {
      name: "Message with multiple tag types",
      input: `<speech as="Wizard">I sense a disturbance.</speech>
<action as="Wizard">waves staff</action>
<function>detect_magic()</function>`,
      expected: `**Wizard:** I sense a disturbance.

*Wizard waves staff*

\`\`\`
detect_magic()
\`\`\``,
      settings: {
        useRoleplayMarkdown: true
      }
    },
    {
      name: "Markdown tag",
      input: `<markdown>
# Heading
- Bullet 1
- Bullet 2
</markdown>`,
      expected: `# Heading
- Bullet 1
- Bullet 2`,
      settings: {
        useRoleplayMarkdown: true
      }
    },
    {
      name: "Yield tag removal",
      input: `<speech as="Character">Hello</speech>
<yield to="user" />`,
      expected: `**Character:** Hello`,
      settings: {
        useRoleplayMarkdown: true
      }
    }
  ];
  
  // Run all test groups
  runTestGroup("SIMPLE TAGS", simpleTagTests);
  runTestGroup("ATTRIBUTE TAGS", attributeTagTests);
  runTestGroup("SUCCUBUS EXAMPLES", succubusTests);
  runTestGroup("MIXED CONTENT", mixedContentTests);
  
  console.log("\n============ TESTS COMPLETE ============\n");
  return "Tests completed";
};

// Helper to run a group of tests
const runTestGroup = (groupName, tests) => {
  console.log(`\n>> Testing ${groupName}\n`);
  
  let passed = 0;
  let failed = 0;
  
  tests.forEach(test => {
    console.log(`[TEST] ${test.name}`);
    const result = applyFormatting(test.input, test.settings, false);
    
    // Clean up strings for comparison (trim and normalize whitespace)
    const normalizedResult = result.trim().replace(/\s+/g, ' ');
    const normalizedExpected = test.expected.trim().replace(/\s+/g, ' ');
    
    if (normalizedResult.includes(normalizedExpected)) {
      console.log(`[✓] PASSED`);
      passed++;
    } else {
      console.log(`[✗] FAILED`);
      console.log(`Expected: ${normalizedExpected}`);
      console.log(`Actual:   ${normalizedResult}`);
      failed++;
    }
  });
  
  console.log(`\n>> ${groupName} Results: ${passed} passed, ${failed} failed\n`);
};

// Export for use in other files
export { runFormatterTests };