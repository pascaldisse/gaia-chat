/**
 * Utility functions for tool detection and processing
 */

/**
 * Checks if a message contains a dice roll command
 * @param {string} message - The message to check
 * @returns {boolean} - True if the message is a dice roll command
 */
export const isDiceRollCommand = (message) => {
  if (!message || typeof message !== 'string') return false;
  
  // Common dice roll patterns
  const dicePatterns = [
    /roll\s+(?:a|an)?\s*(\d+)?d(\d+)/i,      // "roll a d20" or "roll 3d6"
    /roll\s+(?:a|an)?\s*(\d+)\s*sided\s*dice/i, // "roll a 20 sided dice"
    /roll\s+dice/i,                           // "roll dice"
    /\b(\d+)?d(\d+)\b/i                       // Just "d20" or "3d6"
  ];
  
  return dicePatterns.some(pattern => message.match(pattern));
};

/**
 * Extracts dice parameters (sides and count) from a message
 * @param {string} message - The message containing dice command
 * @returns {Object} - Object with sides and count properties
 */
export const extractDiceParams = (message) => {
  if (!message || typeof message !== 'string') {
    return { sides: 20, count: 1 }; // Default
  }
  
  // Try to find dice notation like d20, 3d6, etc.
  const diceMatch = message.match(/\b(\d+)?d(\d+)\b/i);
  if (diceMatch) {
    const sides = parseInt(diceMatch[2]);
    const count = diceMatch[1] ? parseInt(diceMatch[1]) : 1;
    return { sides, count };
  }
  
  // Try to find "roll a 20 sided dice" pattern
  const sidedMatch = message.match(/(\d+)\s*sided/i);
  if (sidedMatch) {
    return { sides: parseInt(sidedMatch[1]), count: 1 };
  }
  
  // Default to d20 if just "roll dice"
  return { sides: 20, count: 1 };
};

/**
 * Creates a dice notation string from sides and count
 * @param {number} sides - Number of sides on the dice
 * @param {number} count - Number of dice to roll
 * @returns {string} - Dice notation (e.g. "2d6")
 */
export const formatDiceNotation = (sides, count) => {
  return `${count}d${sides}`;
};