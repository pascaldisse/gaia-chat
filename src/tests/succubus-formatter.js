/**
 * Succubus Format Tester
 * This is a standalone script that tests different formatting techniques
 * Run with: node src/tests/succubus-formatter.js
 */

const fs = require('fs');
const path = require('path');

// Sample message with different format tags
const sampleMessage = `<speech seduction="1.0" as="Succubus">Ah, darling... <pause> It's so wonderful to finally meet you. I've been waiting for someone as charming as you to come along. <smile> What brings you to this little corner of the underworld? Are you looking for a delightful companion, or perhaps something a bit more... sinister? <wink></speech>

<action as="Succubus">I give a sly pose, my purple eyes gleaming with mischief as I adjust my bunny ears. My latex suit seems to shimmer in the dim light, drawing your attention to my curvaceous figure.</action>

<function>generate_image(description="A purple-lit room with a singular, ornate chair. Succubus, a slender figure with pink hair and purple highlights, stands before it, posing in a latex bunny suit, her eyes gleaming with mischief."), show_plot_options(choices=["Get to know Succubus", "Explore the room", "Request a special favor"], default=0)</function>

<yield to="You" />`;

// Additional test messages with variations in format
const testCases = [
  // Original speech first
  {
    name: "Standard order - speech first",
    message: '<speech as="Succubus" seduction="1.0">Hello, darling!</speech>'
  },
  // Reversed attribute order
  {
    name: "Reversed attribute order - speech",
    message: '<speech seduction="1.0" as="Succubus">Hello, darling!</speech>'
  },
  // Action tags
  {
    name: "Standard order - action",
    message: '<action as="Succubus" happiness="0.5">poses dramatically</action>'
  },
  // Reversed action attributes
  {
    name: "Reversed attribute order - action",
    message: '<action happiness="0.5" as="Succubus">poses dramatically</action>'
  },
  // Mixed whitespace
  {
    name: "Mixed whitespace",
    message: '<speech   seduction="1.0"    as="Succubus">Hello, darling!</speech>'
  },
  // Different attribute values
  {
    name: "Single quotes",
    message: "<speech as='Succubus' seduction='0.7'>Hello, darling!</speech>"
  },
  // Full complex message
  {
    name: "Complex message with multiple tags",
    message: sampleMessage
  }
];

// Different formatting approaches to test
const formattingApproaches = [
  {
    name: "Original regex pattern",
    speechPattern: /<speech\s+as=["']Succubus["'][^>]*>([\s\S]*?)<\/speech>/gi,
    actionPattern: /<action\s+as=["']Succubus["'][^>]*>([\s\S]*?)<\/action>/gi,
    format: function(message) {
      let formatted = message;
      // Speech tags
      formatted = formatted.replace(this.speechPattern, 
        (match, content) => `**Succubus:** ${content.trim()}\n\n`);
      // Action tags
      formatted = formatted.replace(this.actionPattern, 
        (match, content) => `*Succubus ${content.trim()}*\n\n`);
      // Function tags
      formatted = formatted.replace(
        /<function>([\s\S]*?)<\/function>/gi,
        (match, content) => `\`\`\`\n${content.trim()}\n\`\`\`\n\n`
      );
      // Remove yield tags
      formatted = formatted.replace(/<yield[^>]*\/>/gi, '');
      formatted = formatted.replace(/<yield[^>]*>.*?<\/yield>/gi, '');
      return formatted;
    }
  },
  {
    name: "Improved regex pattern",
    speechPattern: /<speech\s+[^>]*as=["']Succubus["'][^>]*>([\s\S]*?)<\/speech>/gi,
    actionPattern: /<action\s+[^>]*as=["']Succubus["'][^>]*>([\s\S]*?)<\/action>/gi,
    format: function(message) {
      let formatted = message;
      // Speech tags
      formatted = formatted.replace(this.speechPattern, 
        (match, content) => `**Succubus:** ${content.trim()}\n\n`);
      // Action tags
      formatted = formatted.replace(this.actionPattern, 
        (match, content) => `*Succubus ${content.trim()}*\n\n`);
      // Function tags
      formatted = formatted.replace(
        /<function>([\s\S]*?)<\/function>/gi,
        (match, content) => `\`\`\`\n${content.trim()}\n\`\`\`\n\n`
      );
      // Remove yield tags
      formatted = formatted.replace(/<yield[^>]*\/>/gi, '');
      formatted = formatted.replace(/<yield[^>]*>.*?<\/yield>/gi, '');
      return formatted;
    }
  },
  {
    name: "Simpler dot-star pattern",
    speechPattern: /<speech.*?as=["']Succubus["'].*?>(.*?)<\/speech>/gis,
    actionPattern: /<action.*?as=["']Succubus["'].*?>(.*?)<\/action>/gis,
    format: function(message) {
      let formatted = message;
      // Speech tags
      formatted = formatted.replace(this.speechPattern, 
        (match, content) => `**Succubus:** ${content.trim()}\n\n`);
      // Action tags
      formatted = formatted.replace(this.actionPattern, 
        (match, content) => `*Succubus ${content.trim()}*\n\n`);
      // Function tags
      formatted = formatted.replace(
        /<function>([\s\S]*?)<\/function>/gi,
        (match, content) => `\`\`\`\n${content.trim()}\n\`\`\`\n\n`
      );
      // Remove yield tags
      formatted = formatted.replace(/<yield[^>]*\/>/gi, '');
      formatted = formatted.replace(/<yield[^>]*>.*?<\/yield>/gi, '');
      return formatted;
    }
  },
  {
    name: "Direct string manipulation",
    format: function(message) {
      let formatted = message;
      
      // Check for speech tags
      if (formatted.includes('<speech') && formatted.includes('as="Succubus"')) {
        // Try exact match first
        let startPattern = '<speech seduction="1.0" as="Succubus">';
        let endPattern = '</speech>';
        
        if (formatted.includes(startPattern)) {
          const startIdx = formatted.indexOf(startPattern) + startPattern.length;
          const endIdx = formatted.indexOf(endPattern, startIdx);
          
          if (startIdx >= 0 && endIdx >= 0) {
            const content = formatted.substring(startIdx, endIdx);
            formatted = formatted.replace(
              startPattern + content + endPattern,
              `**Succubus:** ${content.trim()}\n\n`
            );
          }
        }
        
        // Fallback to regex
        formatted = formatted.replace(
          /<speech[^>]*as=["']Succubus["'][^>]*>([\s\S]*?)<\/speech>/gi,
          (match, content) => `**Succubus:** ${content.trim()}\n\n`
        );
      }
      
      // Check for action tags
      if (formatted.includes('<action') && formatted.includes('as="Succubus"')) {
        // Try exact match first
        let startPattern = '<action as="Succubus">';
        let endPattern = '</action>';
        
        if (formatted.includes(startPattern)) {
          const startIdx = formatted.indexOf(startPattern) + startPattern.length;
          const endIdx = formatted.indexOf(endPattern, startIdx);
          
          if (startIdx >= 0 && endIdx >= 0) {
            const content = formatted.substring(startIdx, endIdx);
            formatted = formatted.replace(
              startPattern + content + endPattern,
              `*Succubus ${content.trim()}*\n\n`
            );
          }
        }
        
        // Fallback to regex
        formatted = formatted.replace(
          /<action[^>]*as=["']Succubus["'][^>]*>([\s\S]*?)<\/action>/gi,
          (match, content) => `*Succubus ${content.trim()}*\n\n`
        );
      }
      
      // Function tags
      formatted = formatted.replace(
        /<function>([\s\S]*?)<\/function>/gi,
        (match, content) => `\`\`\`\n${content.trim()}\n\`\`\`\n\n`
      );
      
      // Remove yield tags
      formatted = formatted.replace(/<yield[^>]*\/>/gi, '');
      formatted = formatted.replace(/<yield[^>]*>.*?<\/yield>/gi, '');
      
      return formatted;
    }
  },
  {
    name: "Final hybrid approach",
    format: function(message) {
      let formatted = message;
      
      // First pass: direct string manipulation for common patterns
      if (formatted.includes('<speech') && formatted.includes('as="Succubus"')) {
        // Check for common variations
        const variations = [
          '<speech seduction="1.0" as="Succubus">',
          '<speech as="Succubus" seduction="1.0">',
          "<speech seduction='1.0' as='Succubus'>",
          "<speech as='Succubus' seduction='1.0'>"
        ];
        
        for (const startTag of variations) {
          if (formatted.includes(startTag)) {
            const endTag = '</speech>';
            const startIdx = formatted.indexOf(startTag) + startTag.length;
            const endIdx = formatted.indexOf(endTag, startIdx);
            
            if (startIdx >= 0 && endIdx >= 0) {
              const content = formatted.substring(startIdx, endIdx);
              formatted = formatted.replace(
                startTag + content + endTag,
                `**Succubus:** ${content.trim()}\n\n`
              );
            }
          }
        }
      }
      
      // Same for action tags
      if (formatted.includes('<action') && formatted.includes('as="Succubus"')) {
        const variations = [
          '<action as="Succubus">',
          '<action as="Succubus" happiness="0.5">',
          '<action happiness="0.5" as="Succubus">',
          "<action as='Succubus'>",
          "<action happiness='0.5' as='Succubus'>"
        ];
        
        for (const startTag of variations) {
          if (formatted.includes(startTag)) {
            const endTag = '</action>';
            const startIdx = formatted.indexOf(startTag) + startTag.length;
            const endIdx = formatted.indexOf(endTag, startIdx);
            
            if (startIdx >= 0 && endIdx >= 0) {
              const content = formatted.substring(startIdx, endIdx);
              formatted = formatted.replace(
                startTag + content + endTag,
                `*Succubus ${content.trim()}*\n\n`
              );
            }
          }
        }
      }
      
      // Second pass: regex fallback for other patterns
      formatted = formatted.replace(
        /<speech[^>]*as=["']Succubus["'][^>]*>([\s\S]*?)<\/speech>/gi,
        (match, content) => `**Succubus:** ${content.trim()}\n\n`
      );
      
      formatted = formatted.replace(
        /<action[^>]*as=["']Succubus["'][^>]*>([\s\S]*?)<\/action>/gi,
        (match, content) => `*Succubus ${content.trim()}*\n\n`
      );
      
      // Function tags
      formatted = formatted.replace(
        /<function>([\s\S]*?)<\/function>/gi,
        (match, content) => `\`\`\`\n${content.trim()}\n\`\`\`\n\n`
      );
      
      // Remove yield tags
      formatted = formatted.replace(/<yield[^>]*\/>/gi, '');
      formatted = formatted.replace(/<yield[^>]*>.*?<\/yield>/gi, '');
      
      return formatted;
    }
  }
];

// Run the tests and log results
function runTests() {
  let logOutput = "# Succubus Formatter Tests\n\n";
  logOutput += `Test run at: ${new Date().toISOString()}\n\n`;
  
  let summaryResults = {};
  
  // Test each approach against each test case
  formattingApproaches.forEach(approach => {
    logOutput += `## Testing: ${approach.name}\n\n`;
    let passed = 0;
    let total = testCases.length;
    
    testCases.forEach(testCase => {
      logOutput += `### Test Case: ${testCase.name}\n\n`;
      logOutput += "**Input:**\n```\n" + testCase.message + "\n```\n\n";
      
      try {
        const result = approach.format(testCase.message);
        logOutput += "**Output:**\n```\n" + result + "\n```\n\n";
        
        // Basic validation - check if formatting was applied
        const expectedSpeechFormat = "**Succubus:**";
        const expectedActionFormat = "*Succubus";
        
        // Success if it contains any of the expected formats
        const success = (
          testCase.message.includes("<speech") && result.includes(expectedSpeechFormat)
        ) || (
          testCase.message.includes("<action") && result.includes(expectedActionFormat)
        );
        
        if (success) {
          logOutput += "**Result:** ✅ PASS\n\n";
          passed++;
        } else {
          logOutput += "**Result:** ❌ FAIL - Expected formatting not found\n\n";
        }
      } catch (error) {
        logOutput += `**Error:** ${error.message}\n\n`;
        logOutput += "**Result:** ❌ FAIL - Error occurred\n\n";
      }
    });
    
    // Add summary for this approach
    const successRate = Math.round((passed / total) * 100);
    logOutput += `### Summary: ${passed}/${total} tests passed (${successRate}%)\n\n`;
    summaryResults[approach.name] = { passed, total, successRate };
  });
  
  // Overall summary
  logOutput += "## Overall Results\n\n";
  logOutput += "| Approach | Pass Rate | Result |\n";
  logOutput += "|----------|-----------|--------|\n";
  
  Object.entries(summaryResults).forEach(([name, { passed, total, successRate }]) => {
    const icon = successRate === 100 ? "✅" : "❌";
    logOutput += `| ${name} | ${passed}/${total} (${successRate}%) | ${icon} |\n`;
  });
  
  // Recommend the best approach
  const bestApproach = Object.entries(summaryResults)
    .sort((a, b) => b[1].successRate - a[1].successRate)
    [0];
    
  logOutput += `\n## Recommendation\n\nThe **${bestApproach[0]}** approach performed best with a ${bestApproach[1].successRate}% success rate.\n`;
  
  // Write to log file
  try {
    fs.writeFileSync('succubus-formatter-results.log', logOutput);
    console.log('Tests completed. Results written to succubus-formatter-results.log');
  } catch (err) {
    console.error('Failed to write log file:', err);
  }
  
  // Also print to console
  console.log(logOutput);
}

// Run the tests
console.log('Running Succubus formatter tests...');
runTests();