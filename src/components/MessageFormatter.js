/**
 * MessageFormatter - Handles formatting for message content
 * 
 * This module handles the formatting of message content with various tag types,
 * supporting both custom rules and built-in roleplay markdown.
 */

/**
 * Apply Formatting to a message
 * @param {string} text - The text to format
 * @param {object} personaSettings - The persona's format settings
 * @param {boolean} debug - Whether to log detailed debug information
 * @returns {string} - The formatted text
 */
export const applyFormatting = (text, personaSettings, debug = false) => {
  // DEBUG helper function that only logs when debug is true
  const log = (message, data = null) => {
    if (debug) {
      if (data) {
        console.log(`MessageFormatter: ${message}`, data);
      } else {
        console.log(`MessageFormatter: ${message}`);
      }
    }
  };
  
  // WARNING function that always logs
  const warn = (message, data = null) => {
    if (data) {
      console.warn(`MessageFormatter WARNING: ${message}`, data);
    } else {
      console.warn(`MessageFormatter WARNING: ${message}`);
    }
  };
  
  log("Starting formatting...");
  log("Persona settings:", personaSettings);
  log("Original text:", text.substring(0, 100) + (text.length > 100 ? '...' : ''));
  
  // Check for inconsistent format settings
  const hasAttributeTags = /<(?:speech|action)[^>]*?as\s*=\s*["'][^"']+["'][^>]*>/i.test(text);
  
  if (hasAttributeTags && 
      personaSettings?.customFormatting === true && 
      personaSettings?.formatRules && 
      !personaSettings.formatRules.some(r => r.startTag?.includes('as="'))) {
    warn("Detected inconsistent format settings! Message contains tags with 'as' attributes, but custom format rules are designed for simple tags.");
    warn("Will attempt to apply built-in formatting after custom rules.");
  }

  // Start with the original text
  let formattedText = text;
  
  // Note if any formatting was applied
  let formattingApplied = false;
  
  // Try to apply custom formatting rules first
  if (personaSettings?.customFormatting && personaSettings?.formatRules?.length > 0) {
    log("Applying custom formatting rules");
    const { anyRulesApplied, resultText } = applyCustomRules(
      formattedText,
      personaSettings.formatRules,
      log
    );
    
    if (anyRulesApplied) {
      formattedText = resultText;
      formattingApplied = true;
      log("Custom formatting applied successfully");
    } else {
      log("No custom rules matched, will try built-in formatter");
    }
  }
  
  // Special handling for Succubus - force builtin formatting if we detect Succubus tags
  const hasSuccubusTags = /<(?:speech|action)\s+as=["']Succubus["'][^>]*>/i.test(text);
  if (hasSuccubusTags) {
    log("DETECTED SUCCUBUS TAGS - Will force built-in formatter to handle this case");
    formattingApplied = false; // Force built-in formatter to run
  }
  
  // If no custom rules applied or roleplay markdown is enabled,
  // try built-in roleplay markdown
  if (!formattingApplied || personaSettings?.useRoleplayMarkdown) {
    log("Checking for tags that need built-in roleplay formatting");
    
    // Check if there are any tags that need roleplay formatting
    // More permissive patterns that look for opening tags
    const hasAttributeTags = /<(?:speech|action)[^>]*?as\s*=\s*["'][^"']+["'][^>]*>/i.test(formattedText);
    const hasFunctionTags = /<function[^>]*>/i.test(formattedText);
    const hasMarkdownTags = /<markdown[^>]*>/i.test(formattedText);
    const hasSimpleTags = /<(?:speech|action|yield)[^>]*>/i.test(formattedText);
    
    log("Has attribute tags:", hasAttributeTags);
    log("Has function tags:", hasFunctionTags);
    log("Has markdown tags:", hasMarkdownTags);
    log("Has simple tags:", hasSimpleTags);
    
    // Apply formatting if we find any supported tags
    if (hasAttributeTags || hasFunctionTags || hasMarkdownTags || hasSimpleTags || hasSuccubusTags) {
      log("Applying built-in roleplay formatting");
      
      const { resultText } = applyBuiltInFormatting(formattedText, log);
      formattedText = resultText;
      formattingApplied = true;
    }
  }
  
  log("Formatting complete:", formattedText.substring(0, 100) + (formattedText.length > 100 ? '...' : ''));
  return formattedText;
};

/**
 * Apply custom formatting rules to text
 * @param {string} text - The text to format
 * @param {array} rules - The formatting rules to apply
 * @param {function} log - The logging function
 * @returns {object} - Object with anyRulesApplied flag and resultText
 */
const applyCustomRules = (text, rules, log) => {
  let formattedText = text;
  let anyRulesApplied = false;
  
  log("Starting custom rule application");
  
  // Apply each format rule
  (rules || []).forEach(rule => {
    if (rule.enabled) {
      log("Applying rule:", rule.name);
      
      // Create a regex that can match tags
      const startTagEscaped = rule.startTag ? rule.startTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
      const endTagEscaped = rule.endTag ? rule.endTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
      
      // Only process if we have a start tag and end tag
      if (startTagEscaped && endTagEscaped) {
        try {
          // For complete tags (start + content + end)
          const fullTagPattern = new RegExp(`${startTagEscaped}(.*?)${endTagEscaped}`, 'gs');
          
          // Use matchAll to get all matches with their positions
          const matches = Array.from(formattedText.matchAll(fullTagPattern));
          log(`Found ${matches.length} matches for rule: ${rule.name}`);
          
          if (matches && matches.length > 0) {
            anyRulesApplied = true;
            
            // Process matches in reverse order to avoid index issues
            matches.sort((a, b) => b.index - a.index);
            
            // Process each match
            for (const match of matches) {
              const fullMatch = match[0];
              const matchIndex = match.index;
              const content = match[1];
              
              log(`Processing match at position ${matchIndex}: ${fullMatch.substring(0, 40)}...`);
              
              // Replace just this specific instance (no global replace)
              const replacement = rule.markdownFormat.replace('{{content}}', content);
              const before = formattedText.substring(0, matchIndex);
              const after = formattedText.substring(matchIndex + fullMatch.length);
              formattedText = before + replacement + after;
            }
          }
        } catch (err) {
          log("Error applying rule:", err);
        }
      }
    }
  });
  
  return { anyRulesApplied, resultText: formattedText };
};

/**
 * Apply built-in formatting to text
 * @param {string} text - The text to format
 * @param {function} log - The logging function
 * @returns {object} - Object with resultText
 */
const applyBuiltInFormatting = (text, log) => {
  let formattedText = text;
  
  try {
    log("Original text for built-in formatting:", formattedText.substring(0, 100));
    
    // SUCCUBUS DIRECT FIX - Special case handling for the known Succubus format
    // This is a much simpler approach for the exact format we need to handle
    if (formattedText.includes('<speech as="Succubus"') || formattedText.includes("<speech as='Succubus'")) {
      log("SPECIAL HANDLING: Detected Succubus format");
      
      // Handle speech tags for Succubus
      formattedText = formattedText.replace(
        /<speech\s+as=["']Succubus["'][^>]*>([\s\S]*?)<\/speech>/gi,
        (match, content) => {
          log("Direct speech replacement for Succubus");
          return `**Succubus:** ${content.trim()}\n\n`;
        }
      );
      
      // Handle action tags for Succubus
      formattedText = formattedText.replace(
        /<action\s+as=["']Succubus["'][^>]*>([\s\S]*?)<\/action>/gi,
        (match, content) => {
          log("Direct action replacement for Succubus");
          return `*Succubus ${content.trim()}*\n\n`;
        }
      );
      
      // Handle function tags
      formattedText = formattedText.replace(
        /<function>([\s\S]*?)<\/function>/gi,
        (match, content) => {
          log("Direct function replacement");
          return `\`\`\`\n${content.trim()}\n\`\`\`\n\n`;
        }
      );
      
      // Remove yield tags
      formattedText = formattedText.replace(/<yield[^>]*\/>/gi, '');
      formattedText = formattedText.replace(/<yield[^>]*>.*?<\/yield>/gi, '');
      
      log("After direct Succubus formatting:", formattedText.substring(0, 100));
      return { resultText: formattedText };
    }
    
    // If not Succubus format, continue with the general approach
    // Helper function to process each type of tag
    const processTag = (regex, formatter, tagName) => {
      // Find all matches with their indexes
      const matches = Array.from(formattedText.matchAll(regex));
      log(`Found ${matches.length} ${tagName} matches`);
      
      // Sort matches by index to process in reverse order (prevents position shifting)
      matches.sort((a, b) => b.index - a.index);
      
      // Process each match
      for (const match of matches) {
        const fullMatch = match[0];
        const matchIndex = match.index;
        const character = match[1]; // might be undefined for some tags
        const content = match[2];
        
        log(`Processing ${tagName} match at position ${matchIndex}`);
        
        // Replace just this specific instance
        const replacement = formatter(character, content);
        const before = formattedText.substring(0, matchIndex);
        const after = formattedText.substring(matchIndex + fullMatch.length);
        formattedText = before + replacement + after;
      }
    };
    
    // Process speech tags with attributes
    processTag(
      /<speech\s+[^>]*?as\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/speech>/gi,
      (character, content) => `**${character}:** ${content.trim()}\n\n`,
      "speech tag with attributes"
    );
    
    // Process action tags with attributes
    processTag(
      /<action\s+[^>]*?as\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/action>/gi,
      (character, content) => `*${character} ${content.trim()}*\n\n`,
      "action tag with attributes"
    );
    
    // Process simple speech tags without attributes
    processTag(
      /<speech>([\s\S]*?)<\/speech>/gi,
      (_, content) => `**${content.trim()}**\n\n`,
      "simple speech tag"
    );
    
    // Process simple action tags without attributes
    processTag(
      /<action>([\s\S]*?)<\/action>/gi,
      (_, content) => `*${content.trim()}*\n\n`,
      "simple action tag"
    );
    
    // Process function tags
    processTag(
      /<function>([\s\S]*?)<\/function>/gi,
      (_, content) => `\`\`\`\n${content.trim()}\n\`\`\`\n\n`,
      "function tag"
    );
    
    // Process markdown tags
    processTag(
      /<markdown>([\s\S]*?)<\/markdown>/gi,
      (_, content) => content.trim() + '\n\n',
      "markdown tag"
    );
    
    // Remove yield tags
    formattedText = formattedText.replace(/<yield[^>]*\/>/gi, '');
    formattedText = formattedText.replace(/<yield[^>]*>.*?<\/yield>/gi, '');
    
    log("After built-in formatting:", formattedText.substring(0, 100));
  } catch (err) {
    log("Error in built-in formatting:", err);
  }
  
  return { resultText: formattedText };
};

// Export for testing
export const __testingOnly = {
  applyCustomRules,
  applyBuiltInFormatting
};