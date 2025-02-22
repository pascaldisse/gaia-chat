import { DynamicTool } from "@langchain/core/tools";

export function createPersonaTools(chatComponent, persona) {
  const tools = [];
  
  // Always include file search
  tools.push(new DynamicTool({
    name: "file_search",
    description: "Search through uploaded knowledge files",
    func: async (query) => {
      const results = await chatComponent.knowledgeDB.searchFiles(query);
      return JSON.stringify(results);
    }
  }));
  
  if (persona.agentSettings.toolConfig.imageGeneration) {
    tools.push(new DynamicTool({
      name: "generate_image",
      description: "Generate an image from text description",
      func: async (prompt) => {
        return chatComponent.generateImage({
          prompt,
          model: chatComponent.imageModel,
          style: chatComponent.selectedStyle
        });
      }
    }));
  }
  
  if (persona.agentSettings.toolConfig.diceRoll) {
    tools.push(new DynamicTool({
      name: "dice_roll",
      description: "Roll polyhedral dice. Input format: 'typeOfDice,numberOfDice'",
      func: async (input) => {
        const [typeOfDice, numberOfDice] = input.split(',').map(Number);
        if (isNaN(typeOfDice) || isNaN(numberOfDice)) {
          return "Invalid input format. Use 'typeOfDice,numberOfDice'";
        }
        
        const results = Array.from({length: numberOfDice}, () => 
          Math.floor(Math.random() * typeOfDice) + 1
        );
        
        return `Dice results: ${results.join(', ')} (Total: ${results.reduce((a,b) => a + b, 0)})`;
      }
    }));
  }

  return tools;
}