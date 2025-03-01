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
  
  log("Starting formatting...");
  log("Persona settings:", personaSettings);
  log("Original text:", text.substring(0, 100) + (text.length > 100 ? '...' : ''));

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
  
  // If no custom rules applied or roleplay markdown is enabled,
  // try built-in roleplay markdown
  if (!formattingApplied || personaSettings?.useRoleplayMarkdown) {
    log("Checking for tags that need built-in roleplay formatting");
    
    // Check if there are any tags that need roleplay formatting
    const hasAttributeTags = /(<(?:speech|action)\s+[^>]*?as\s*=\s*["'][^"']+["'][^>]*>)/i.test(formattedText);
    const hasSimpleTags = /(<(?:speech|action|function|yield|markdown)(?:\s+[^>]*)?>[^<]*<\/(?:speech|action|function|yield|markdown)>)/i.test(formattedText);
    
    log("Has attribute tags:", hasAttributeTags);
    log("Has simple tags:", hasSimpleTags);
    
    if (hasAttributeTags || hasSimpleTags) {
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
          const matches = formattedText.match(fullTagPattern);
          log(`Matches for pattern ${fullTagPattern}:`, matches);
          
          if (matches && matches.length > 0) {
            anyRulesApplied = true;
            
            // Replace complete tags
            formattedText = formattedText.replace(fullTagPattern, (match, content) => {
              log("Replacing match:", {
                match: match.substring(0, 40) + (match.length > 40 ? '...' : ''),
                with: rule.markdownFormat.replace('{{content}}', content.substring(0, 20) + (content.length > 20 ? '...' : ''))
              });
              return rule.markdownFormat.replace('{{content}}', content);
            });
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
    // Format speech tags with attributes - handles any order of attributes
    formattedText = formattedText.replace(/<speech\s+[^>]*?as\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/speech>/gi, (match, character, content) => {
      log("Speech match with attributes:", {
        character,
        content: content.substring(0, 30) + (content.length > 30 ? '...' : '')
      });
      return `**${character}:** ${content.trim()}\n\n`;
    });
    
    // Format action tags with attributes - handles any order of attributes
    formattedText = formattedText.replace(/<action\s+[^>]*?as\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/action>/gi, (match, character, content) => {
      log("Action match with attributes:", {
        character,
        content: content.substring(0, 30) + (content.length > 30 ? '...' : '')
      });
      return `*${character} ${content.trim()}*\n\n`;
    });
    
    // Simple tags without as attribute
    formattedText = formattedText.replace(/<speech>([\s\S]*?)<\/speech>/gi, (match, content) => {
      log("Simple speech match");
      return `**${content.trim()}**\n\n`;
    });
    
    formattedText = formattedText.replace(/<action>([\s\S]*?)<\/action>/gi, (match, content) => {
      log("Simple action match");
      return `*${content.trim()}*\n\n`;
    });
    
    // Format function tags
    formattedText = formattedText.replace(/<function>([\s\S]*?)<\/function>/gi, (match, content) => {
      log("Function match");
      return `\`\`\`\n${content.trim()}\n\`\`\`\n\n`;
    });
    
    // Format markdown tags
    formattedText = formattedText.replace(/<markdown>([\s\S]*?)<\/markdown>/gi, (match, content) => {
      log("Markdown match");
      return content.trim() + '\n\n';
    });
    
    // Remove yield tags
    formattedText = formattedText.replace(/<yield[^>]*\/>/gi, '');
    formattedText = formattedText.replace(/<yield[^>]*>.*?<\/yield>/gi, '');
    
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