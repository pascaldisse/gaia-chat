import { DynamicTool } from "@langchain/core/tools";
// Import these in a real implementation
// import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
// import { DuckDuckGoSearchResults } from "@langchain/community/tools/ddg_search";

// Format search results for readability
function formatSearchResults(results) {
  if (!results || results.length === 0) {
    return "No results found.";
  }
  
  return results.map((result, index) => {
    return `[${index + 1}] ${result.title || 'Result'}
URL: ${result.link || result.url || 'No URL available'}
${result.snippet || result.content || 'No snippet available'}
`;
  }).join("\n---\n\n");
}

// Simulated Tavily Search API - replace with real implementation in production
async function simulateTavilySearch(query, searchType = "search") {
  console.log(`Simulating Tavily search for: "${query}" with type: ${searchType}`);
  
  // Simulate delay for API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate fake search results based on the query
  const results = [
    {
      title: `Tavily: Information about ${query}`,
      url: `https://example.com/tavily/info/${encodeURIComponent(query)}`,
      content: `This is detailed information about ${query} found by Tavily Search. This result includes comprehensive details and facts about the topic.`,
      score: 0.95
    },
    {
      title: `Tavily: ${query} - Latest News and Updates`,
      url: `https://example.com/tavily/news/${encodeURIComponent(query)}`,
      content: `The latest updates and news regarding ${query} from Tavily Search. Recent developments include new research, findings, and industry trends.`,
      score: 0.87
    },
    {
      title: `Tavily: Expert Analysis on ${query}`,
      url: `https://example.com/tavily/analysis/${encodeURIComponent(query)}`,
      content: `Expert analysis and insights about ${query} aggregated by Tavily Search. Leading experts suggest that this topic is evolving rapidly.`,
      score: 0.82
    }
  ];
  
  return {
    results,
    query,
    search_type: searchType,
    organic_results: results.length,
    max_results: 3
  };
}

// Simulated DuckDuckGo Search API - replace with real implementation in production
async function simulateDuckDuckGoSearch(query) {
  console.log(`Simulating DuckDuckGo search for: "${query}"`);
  
  // Simulate delay for API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Generate fake search results based on the query
  const results = [
    {
      title: `DuckDuckGo: ${query} Information`,
      link: `https://example.com/ddg/info/${encodeURIComponent(query)}`,
      snippet: `Information about ${query} from DuckDuckGo. This private search engine found relevant details without tracking your search history.`,
      source: "example.com"
    },
    {
      title: `DuckDuckGo: Understanding ${query}`,
      link: `https://example.com/ddg/understanding/${encodeURIComponent(query)}`,
      snippet: `A comprehensive guide to understanding ${query} from various sources. DuckDuckGo brings you privacy-focused search results.`,
      source: "example.com"
    },
    {
      title: `DuckDuckGo: ${query} Resources and References`,
      link: `https://example.com/ddg/resources/${encodeURIComponent(query)}`,
      snippet: `Find resources, references, and additional reading materials about ${query}. Privacy-respecting search results from DuckDuckGo.`,
      source: "example.com"
    }
  ];
  
  return results;
}

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
  
  // Tavily Search Tool
  if (persona.agentSettings?.toolConfig?.tavilySearch) {
    console.log(`Adding Tavily search tool for ${persona.name}`);
    tools.push(new DynamicTool({
      name: "tavily_search",
      description: "Search the web using Tavily for current information about a topic or question. Use this for comprehensive, AI-optimized search results when you need up-to-date facts or information not in your knowledge base.",
      func: async (query) => {
        console.log(`Tool used: tavily_search with query: "${query}"`);
        
        try {
          // Add message to chat before fetching
          addToolUsageMessage("Tavily Search", query, "Searching with Tavily...");
          
          // In a real implementation, use the actual Tavily API
          // const tavily = new TavilySearchResults({
          //   apiKey: process.env.TAVILY_API_KEY,
          //   maxResults: 3
          // });
          // const searchResults = await tavily.invoke(query);
          
          // Simulated search results for demonstration
          const searchResponse = await simulateTavilySearch(query);
          const searchResults = searchResponse.results;
          
          // Format results
          const formattedResults = formatSearchResults(searchResults);
          
          // Add message to chat with results
          addToolUsageMessage("Tavily Search", query, `Found ${searchResults.length} results`);
          
          return formattedResults;
        } catch (error) {
          console.error("Error in Tavily search tool:", error);
          const errorMessage = `Error searching with Tavily: ${error.message}`;
          addToolUsageMessage("Tavily Search", query, errorMessage);
          return errorMessage;
        }
      }
    }));
  }
  
  // DuckDuckGo Search Tool
  if (persona.agentSettings?.toolConfig?.duckDuckGoSearch) {
    console.log(`Adding DuckDuckGo search tool for ${persona.name}`);
    tools.push(new DynamicTool({
      name: "duckduckgo_search",
      description: "Search the web using DuckDuckGo for information about a topic or question. This is a privacy-focused search that doesn't track your queries. Use when you need basic web search results without requiring an API key.",
      func: async (query) => {
        console.log(`Tool used: duckduckgo_search with query: "${query}"`);
        
        try {
          // Add message to chat before fetching
          addToolUsageMessage("DuckDuckGo Search", query, "Searching with DuckDuckGo...");
          
          // In a real implementation, use the actual DuckDuckGo API
          // const ddg = new DuckDuckGoSearchResults();
          // const searchResults = await ddg.invoke(query);
          
          // Simulated search results for demonstration
          const searchResults = await simulateDuckDuckGoSearch(query);
          
          // Format results
          const formattedResults = formatSearchResults(searchResults);
          
          // Add message to chat with results
          addToolUsageMessage("DuckDuckGo Search", query, `Found ${searchResults.length} results`);
          
          return formattedResults;
        } catch (error) {
          console.error("Error in DuckDuckGo search tool:", error);
          const errorMessage = `Error searching with DuckDuckGo: ${error.message}`;
          addToolUsageMessage("DuckDuckGo Search", query, errorMessage);
          return errorMessage;
        }
      }
    }));
  }
  
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