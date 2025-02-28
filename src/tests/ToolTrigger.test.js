import { isDiceRollCommand, extractDiceParams } from '../utils/ToolUtilities';
import { createPersonaTools } from '../services/tools';
import Persona from '../models/Persona';

// Mock console.log to track calls
const originalConsoleLog = console.log;
let consoleOutput = [];
console.log = (...args) => {
  consoleOutput.push(args.join(' '));
  originalConsoleLog(...args);
};

// Mock component reference
const mockComponentRef = {
  knowledgeDB: {
    searchFiles: jest.fn().mockResolvedValue([])
  },
  generateImage: jest.fn().mockResolvedValue('image-generated'),
  imageModel: 'test-model',
  selectedStyle: 'test-style',
  setCurrentChat: jest.fn()
};

describe('Tool triggering in chat', () => {
  let persona;
  let diceRollTool;
  
  beforeEach(() => {
    // Reset tracking variables
    consoleOutput = [];
    jest.clearAllMocks();
    
    // Create a persona with dice roll enabled
    persona = new Persona({
      id: 'test-persona-123',
      name: 'Test Persona',
      systemPrompt: 'You are a test persona',
      model: 'test-model',
      agentSettings: {
        maxIterations: 3,
        toolConfig: {
          fileSearch: true,
          imageGeneration: true,
          diceRoll: true
        }
      }
    });
    
    // Create tools for the persona and extract the dice roll tool
    const tools = createPersonaTools(mockComponentRef, persona);
    diceRollTool = tools.find(tool => tool.name === 'dice_roll');
  });
  
  afterAll(() => {
    // Restore console.log
    console.log = originalConsoleLog;
  });
  
  test('isDiceRollCommand correctly identifies dice roll requests', () => {
    expect(isDiceRollCommand('roll a d20')).toBe(true);
    expect(isDiceRollCommand('Roll 3d6 for me')).toBe(true);
    expect(isDiceRollCommand('d10')).toBe(true);
    expect(isDiceRollCommand('Can you roll some dice?')).toBe(true);
    
    // Negative test cases
    expect(isDiceRollCommand('hello')).toBe(false);
    expect(isDiceRollCommand('what is the weather?')).toBe(false);
  });
  
  test('extractDiceParams correctly parses different dice notations', () => {
    expect(extractDiceParams('roll a d20')).toEqual({ sides: 20, count: 1 });
    expect(extractDiceParams('3d6')).toEqual({ sides: 6, count: 3 });
    expect(extractDiceParams('roll 2d10')).toEqual({ sides: 10, count: 2 });
    expect(extractDiceParams('roll a 20 sided dice')).toEqual({ sides: 20, count: 1 });
    
    // Default case
    expect(extractDiceParams('roll dice')).toEqual({ sides: 20, count: 1 });
  });
  
  test('dice_roll tool can be invoked directly', async () => {
    // Test tool functionality
    const result = await diceRollTool.func('d20');
    
    // Verify the tool was called
    expect(result).toContain('Rolling 1d20');
    expect(result).toMatch(/\[\d+\] = \d+/);
    
    // Check that we logged the tool usage
    const toolUsageLogs = consoleOutput.filter(log => 
      log.includes('Tool execution:') && log.includes('Dice Roll')
    );
    expect(toolUsageLogs.length).toBeGreaterThan(0);
    
    // Verify the UI was updated
    expect(mockComponentRef.setCurrentChat).toHaveBeenCalled();
  });
  
  test('dice_roll tool handles multiple dice', async () => {
    const result = await diceRollTool.func('3d6');
    
    // Should show 3 dice being rolled
    expect(result).toContain('Rolling 3d6');
    
    // Should contain 3 numbers in the result array
    const resultMatch = result.match(/\[(.*?)\]/);
    expect(resultMatch).toBeTruthy();
    
    const diceResults = resultMatch[1].split(', ');
    expect(diceResults.length).toBe(3);
    
    // Verify each result is a number between 1 and 6
    diceResults.forEach(dice => {
      const diceValue = parseInt(dice);
      expect(diceValue).toBeGreaterThanOrEqual(1);
      expect(diceValue).toBeLessThanOrEqual(6);
    });
  });
  
  // Mock the direct tool trigger function from Chat.js
  test('direct tool trigger works for dice roll commands', async () => {
    // Create a simple mock of the direct trigger function
    const mockDirectTrigger = async (message, persona, tools) => {
      if (isDiceRollCommand(message)) {
        const diceRollTool = tools.find(tool => tool.name === 'dice_roll');
        if (diceRollTool && persona.agentSettings?.toolConfig?.diceRoll) {
          const { sides, count } = extractDiceParams(message);
          const notation = `${count}d${sides}`;
          return await diceRollTool.func(notation);
        }
      }
      return null;
    };
    
    // Test the direct trigger
    const message = 'roll a d20';
    const tools = createPersonaTools(mockComponentRef, persona);
    const result = await mockDirectTrigger(message, persona, tools);
    
    // Verify result
    expect(result).toBeTruthy();
    expect(result).toContain('Rolling 1d20');
    
    // Check UI updates
    expect(mockComponentRef.setCurrentChat).toHaveBeenCalled();
  });
});