// Simple test to debug the regex patterns
// This doesn't run as a full Jest test, just a simple script

// Test the regex patterns for Succubus tags
function testSuccubusRegex() {
  console.log("Testing Succubus regex patterns...");
  
  // Sample content with different attribute orders
  const testCases = [
    '<speech as="Succubus" seduction="1.0">Hello, darling!</speech>',
    '<speech seduction="1.0" as="Succubus">Hello again!</speech>',
    '<action as="Succubus" happiness="0.5">poses dramatically</action>',
    '<action happiness="0.5" as="Succubus">smiles coyly</action>'
  ];
  
  // Test speech pattern
  const speechPattern = /<speech\s+[^>]*as=["']Succubus["'][^>]*>([\s\S]*?)<\/speech>/gi;
  
  // Test action pattern
  const actionPattern = /<action\s+[^>]*as=["']Succubus["'][^>]*>([\s\S]*?)<\/action>/gi;
  
  // Test each case
  testCases.forEach(testCase => {
    console.log("\nTest case:", testCase);
    
    // Try speech pattern
    let match = speechPattern.exec(testCase);
    if (match) {
      console.log("✅ Speech match found!");
      console.log("Content:", match[1]);
      console.log("Formatted:", `**Succubus:** ${match[1].trim()}`);
      
      // Reset regex state (important!)
      speechPattern.lastIndex = 0;
    } else {
      // Try action pattern
      match = actionPattern.exec(testCase);
      if (match) {
        console.log("✅ Action match found!");
        console.log("Content:", match[1]);
        console.log("Formatted:", `*Succubus ${match[1].trim()}*`);
        
        // Reset regex state
        actionPattern.lastIndex = 0;
      } else {
        console.log("❌ No match found!");
      }
    }
  });
}

// Run the test
testSuccubusRegex();