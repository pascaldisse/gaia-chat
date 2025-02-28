import { DynamicTool } from "@langchain/core/tools";

export function createPersonaTools(chatComponent, persona) {
  const tools = [];
  
  console.log(`Creating tools for persona: ${persona.name}`, persona.agentSettings?.toolConfig);
  
  // Helper function to add a tool usage message to chat
  const addToolUsageMessage = (toolName, input, result) => {
    if (chatComponent.setCurrentChat) {
      const timestamp = new Date().toISOString();
      
      // Log detailed info about the tool usage
      console.log(`Tool execution: ${toolName}`, {
        timestamp,
        toolName,
        input,
        result,
        persona: persona.name
      });
      
      chatComponent.setCurrentChat(prev => [...prev, {
        id: Date.now(),
        content: `**Tool Used**: ${toolName}\n**Input**: ${input}\n**Result**: ${result}`,
        isUser: false,
        isCommand: true,
        isToolUsage: true,
        toolName: toolName,
        toolData: { // Store tool data for debugging and advanced display
          toolName,
          input,
          result,
          timestamp,
          persona: persona.name
        }
      }]);
    }
  };
  
  // Always include file search
  tools.push(new DynamicTool({
    name: "file_search",
    description: "Search through uploaded knowledge files",
    func: async (query) => {
      console.log(`Tool used: file_search with query: "${query}"`);
      
      const results = await chatComponent.knowledgeDB.searchFiles(query);
      const resultString = JSON.stringify(results);
      
      // Add message to chat
      addToolUsageMessage("File Search", query, `Found ${results.length} results`);
      
      return resultString;
    }
  }));
  
  if (persona.agentSettings?.toolConfig?.imageGeneration) {
    console.log(`Adding image generation tool for ${persona.name}`);
    tools.push(new DynamicTool({
      name: "generate_image",
      description: "Generate an image from text description",
      func: async (prompt) => {
        console.log(`Tool used: generate_image with prompt: "${prompt}"`);
        
        // Add message to chat before generating
        addToolUsageMessage("Image Generation", prompt, "Generating image...");
        
        const result = await chatComponent.generateImage({
          prompt,
          model: chatComponent.imageModel,
          style: chatComponent.selectedStyle
        });
        
        return result;
      }
    }));
  }
  
  if (persona.agentSettings?.toolConfig?.diceRoll) {
    console.log(`Adding dice roll tool for ${persona.name}`);
    tools.push(new DynamicTool({
      name: "dice_roll",
      description: "Roll polyhedral dice. Input can be in 'd' notation (e.g. '2d6' for two 6-sided dice) or as 'typeOfDice,numberOfDice'.",
      func: async (input) => {
        console.log(`Tool used: dice_roll with input: "${input}"`);
        
        let typeOfDice, numberOfDice;
        
        // First try to parse in d notation (e.g. 2d20, d6, 3d10)
        const dNotation = input.toLowerCase().trim().match(/^(\d+)?d(\d+)$/);
        if (dNotation) {
          numberOfDice = dNotation[1] ? parseInt(dNotation[1]) : 1;
          typeOfDice = parseInt(dNotation[2]);
        } else {
          // Try the comma format (e.g. 20,2 for 2d20)
          const parts = input.split(',').map(p => p.trim());
          typeOfDice = parseInt(parts[0]);
          numberOfDice = parts.length > 1 ? parseInt(parts[1]) : 1;
        }
        
        // Validate the parsed values
        if (isNaN(typeOfDice) || isNaN(numberOfDice) || typeOfDice < 1 || numberOfDice < 1) {
          const errorMessage = "Invalid dice format. Use 'd' notation (e.g. '2d6') or 'diceType,number' format.";
          addToolUsageMessage("Dice Roll", input, errorMessage);
          return errorMessage;
        }
        
        // Roll the dice
        const results = Array.from({length: numberOfDice}, () => 
          Math.floor(Math.random() * typeOfDice) + 1
        );
        
        const total = results.reduce((a,b) => a + b, 0);
        const notation = `${numberOfDice}d${typeOfDice}`;
        const resultString = `🎲 Rolling ${notation}: [${results.join(', ')}] = ${total}`;
        
        // Add message to chat
        addToolUsageMessage("Dice Roll", notation, resultString);
        
        return resultString;
      }
    }));
  }

  console.log(`Created ${tools.length} tools for ${persona.name}`);
  return tools;
}