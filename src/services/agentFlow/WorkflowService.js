import { ChatDeepInfra } from "@langchain/community/chat_models/deepinfra";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { SequentialChain, SimpleSequentialChain } from "langchain/chains";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { DynamicTool } from "@langchain/core/tools";
import { RPGSystem } from "../../utils/RPGSystem";
import { API_KEY } from "../../config";

import { workflowDB, templateDB } from '../db';

// Workflow database service - now using IndexedDB
export const saveWorkflow = async (workflow) => {
  try {
    return await workflowDB.saveWorkflow(workflow);
  } catch (error) {
    console.error("Error saving workflow:", error);
    throw new Error("Failed to save workflow");
  }
};

export const getWorkflow = async (id) => {
  try {
    return await workflowDB.getWorkflow(id);
  } catch (error) {
    console.error("Error retrieving workflow:", error);
    throw new Error("Failed to retrieve workflow");
  }
};

export const getAllWorkflows = async () => {
  try {
    return await workflowDB.getAllWorkflows();
  } catch (error) {
    console.error("Error retrieving workflows:", error);
    throw new Error("Failed to retrieve workflows");
  }
};

export const deleteWorkflow = async (id) => {
  try {
    return await workflowDB.deleteWorkflow(id);
  } catch (error) {
    console.error("Error deleting workflow:", error);
    throw new Error("Failed to delete workflow");
  }
};

// Template management
export const saveTemplate = async (template) => {
  try {
    // Set template flag to distinguish from regular workflows
    template.isTemplate = true;
    
    // Add category if not present
    if (!template.category) {
      template.category = 'general';
    }
    
    return await templateDB.saveTemplate(template);
  } catch (error) {
    console.error("Error saving template:", error);
    throw new Error("Failed to save template");
  }
};

export const getAllTemplates = async () => {
  try {
    return await templateDB.getAllTemplates();
  } catch (error) {
    console.error("Error retrieving templates:", error);
    throw new Error("Failed to retrieve templates");
  }
};

export const getTemplatesByCategory = async (category) => {
  try {
    return await templateDB.getTemplatesByCategory(category);
  } catch (error) {
    console.error("Error retrieving templates by category:", error);
    throw new Error("Failed to retrieve templates");
  }
};

export const deleteTemplate = async (id) => {
  try {
    return await templateDB.deleteTemplate(id);
  } catch (error) {
    console.error("Error deleting template:", error);
    throw new Error("Failed to delete template");
  }
};

// Creating a new workflow from a template
export const createWorkflowFromTemplate = async (templateId) => {
  try {
    const template = await templateDB.getTemplate(templateId);
    if (!template) {
      throw new Error("Template not found");
    }
    
    // Create a new workflow based on the template
    const workflow = {
      ...template,
      id: null, // Reset ID to generate a new one
      name: `${template.name} - Copy`,
      isTemplate: false,
      createdAt: null, // Reset dates
      updatedAt: null
    };
    
    return await workflowDB.saveWorkflow(workflow);
  } catch (error) {
    console.error("Error creating workflow from template:", error);
    throw new Error("Failed to create workflow from template");
  }
};

// Create a LangChain agent from a persona node
export const createPersonaAgent = async (personaNode, tools = []) => {
  const personaData = personaNode.data.personaData;
  
  // Skip if persona data is missing
  if (!personaData || !personaData.id) {
    throw new Error("Invalid persona data in node");
  }
  
  // Handle empty tools array
  if (!tools || tools.length === 0) {
    // Create a dummy tool so the agent creation doesn't fail
    tools = [
      new DynamicTool({
        name: "default_tool",
        description: "A default tool that doesn't do anything",
        func: async (input) => {
          return "This is a placeholder tool. Connect this persona to tools or files to enhance its capabilities.";
        }
      })
    ];
  }
  
  // Format tools for prompt template
  const toolStrings = tools.map(tool => 
    `- ${tool.name}: ${tool.description || "No description"}`
  ).join("\n");
  
  // Create a prompt template for the agent
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are ${personaData.name}. ${personaData.systemPrompt || 'Help users complete tasks.'}
    
Current attributes:
- Initiative: ${personaData.initiative || 5}/10
- Creativity: ${personaData.creativity || 5}/10
- Empathy: ${personaData.empathy || 5}/10
- Confidence: ${personaData.confidence || 5}/10

You have access to the following tools:
${toolStrings}

{agent_scratchpad}
`],
    ["human", "{input}"]
  ]);
  
  // Create LLM instance with fallback to a default model if not specified
  const llm = new ChatDeepInfra({
    apiKey: API_KEY,
    modelName: personaData.model || "deepinfra/mixtral-8x7b-instruct",
    temperature: (personaData.creativity || 5) / 10,
    maxTokens: 1000,
    streaming: true,
  });
  
  try {
    // Create the agent
    const agent = await createOpenAIFunctionsAgent({
      llm,
      tools,
      prompt,
    });
    
    // Create and return the agent executor
    return new AgentExecutor({
      agent,
      tools,
      maxIterations: 3,
      returnIntermediateSteps: true,
    });
  } catch (error) {
    console.error("Error creating agent:", error);
    throw new Error(`Failed to create agent: ${error.message}`);
  }
};

// Create a LangChain tool from a tool node
export const createNodeTool = async (toolNode) => {
  const { toolType, toolName, toolDescription, toolConfig } = toolNode.data;
  
  // Create appropriate tool based on type
  switch (toolType) {
    case 'search':
      return new DynamicTool({
        name: toolName || "search",
        description: toolDescription || "Search for information in documents",
        func: async (query) => {
          try {
            console.log(`ToolNode executing search with query: "${query}"`);
            
            // Validate input
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
              return "Please provide a valid search query with at least one keyword.";
            }
            
            // Real implementation using knowledgeDB
            const { knowledgeDB } = await import('../db');
            const results = await knowledgeDB.searchFiles(query);
            
            if (results.length === 0) {
              console.log(`No documents matched the search query: "${query}"`);
              // Provide more helpful error message with suggestions
              return `No matching documents found for "${query}". 
Try using:
- Simpler keywords
- Different terms for the same concept
- Check for typos
- Use more general terms`;
            }
            
            // Format search results
            const formattedResults = results.map(file => {
              try {
                console.log(`Processing match in file: ${file.name}, match type: ${file.matchType || 'unknown'}`);
                
                // Use parsedContent if available (for PDFs and other binary files)
                const content = file.parsedContent || file.content || '';
                
                // Only try to extract snippet if content is a string
                if (typeof content === 'string') {
                  // Try to find the exact query first
                  let matchIndex = content.toLowerCase().indexOf(query.toLowerCase());
                  
                  // If no exact match but we got a fuzzy/partial match, find the first matching word
                  if (matchIndex < 0 && (file.matchType === 'fuzzy' || file.matchType === 'partial')) {
                    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
                    for (const word of queryWords) {
                      const wordIndex = content.toLowerCase().indexOf(word);
                      if (wordIndex >= 0) {
                        matchIndex = wordIndex;
                        break;
                      }
                    }
                  }
                  
                  if (matchIndex >= 0) {
                    // Extract a larger context window for better understanding
                    const snippetStart = Math.max(0, matchIndex - 200);
                    const snippetEnd = Math.min(content.length, matchIndex + 200);
                    let snippet = content.substring(snippetStart, snippetEnd);
                    
                    // Add ellipsis if we're not at the beginning/end
                    if (snippetStart > 0) snippet = "..." + snippet;
                    if (snippetEnd < content.length) snippet = snippet + "...";
                    
                    return `[${file.name}${file.matchType ? ` - ${file.matchType} match` : ''}]: "${snippet}"`;
                  }
                }
                
                // Fallback if no exact match or content isn't a string
                return `[${file.name}]: File matched query but no exact text location found`;
                
              } catch (err) {
                console.error("Error processing file content:", err);
                return `[${file.name}]: Error extracting snippet - ${err.message}`;
              }
            }).join('\n\n');
            
            return `Found ${results.length} document(s) matching "${query}":\n\n${formattedResults}`;
          } catch (error) {
            console.error("Error in search tool:", error);
            return `Error searching for "${query}": ${error.message}`;
          }
        }
      });
      
    case 'files':
      return new DynamicTool({
        name: toolName || "read_file",
        description: toolDescription || "Read content from files",
        func: async (fileId) => {
          try {
            // Real implementation using knowledgeDB
            const { knowledgeDB } = await import('../db');
            const files = await knowledgeDB.getFiles([fileId]);
            
            if (files.length === 0) {
              return `File with ID ${fileId} not found.`;
            }
            
            const file = files[0];
            
            // Handle different content types safely
            let contentStr = "No content available";
            
            if (typeof file.content === 'string') {
              contentStr = file.content;
            } else if (file.content instanceof ArrayBuffer) {
              contentStr = "Binary content (ArrayBuffer) - cannot display as text";
            } else if (file.content && typeof file.content === 'object') {
              try {
                contentStr = JSON.stringify(file.content, null, 2);
              } catch (err) {
                contentStr = "Object content - cannot display as text";
              }
            } else if (file.content !== null && file.content !== undefined) {
              try {
                contentStr = String(file.content);
              } catch (err) {
                contentStr = "Content cannot be converted to string";
              }
            }
            
            return `Content of file "${file.name}":\n\n${contentStr}`;
          } catch (error) {
            console.error("Error in file reading tool:", error);
            return `Error reading file ${fileId}: ${error.message}`;
          }
        }
      });
      
    case 'image':
      return new DynamicTool({
        name: toolName || "generate_image",
        description: toolDescription || "Generate an image from text description",
        func: async (prompt) => {
          try {
            // Implement real image generation if you have the API
            // For now, return a placeholder
            const imageGeneration = toolConfig.model || 'FLUX Schnell';
            return `[Image generated using ${imageGeneration}]\nPrompt: "${prompt}"\nImage URL: https://example.com/image.png`;
          } catch (error) {
            console.error("Error in image generation tool:", error);
            return `Error generating image: ${error.message}`;
          }
        }
      });
      
    case 'dice':
      return new DynamicTool({
        name: toolName || "roll_dice",
        description: toolDescription || "Roll dice with specified number of sides",
        func: async (input) => {
          try {
            // Parse input for dice rolling
            const [sides = 20, count = 1] = input.split(',').map(n => parseInt(n.trim()));
            
            // Validate inputs
            if (isNaN(sides) || isNaN(count) || sides < 1 || count < 1) {
              return "Invalid dice parameters. Format should be: sides,count (e.g., '20,2' for 2d20)";
            }
            
            // Implement the RPG system's dice rolling
            const RPGSystem = (await import('../../utils/RPGSystem')).RPGSystem;
            const roll = RPGSystem.rollDice(sides, count);
            
            return `Rolled ${count}d${sides}: [${roll.rolls.join(', ')}] = ${roll.total}`;
          } catch (error) {
            console.error("Error in dice rolling tool:", error);
            return `Error rolling dice: ${error.message}`;
          }
        }
      });
    
    case 'weather':
      return new DynamicTool({
        name: toolName || "get_weather",
        description: toolDescription || "Get current weather for a location",
        func: async (location) => {
          try {
            // This would call a weather API in a real implementation
            // For demo purposes, generate random weather
            const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Partly Cloudy'];
            const temperature = Math.floor(Math.random() * 35) + 40; // 40-75°F
            const condition = conditions[Math.floor(Math.random() * conditions.length)];
            
            return `Weather for ${location}: ${condition}, ${temperature}°F`;
          } catch (error) {
            console.error("Error in weather tool:", error);
            return `Error getting weather for ${location}: ${error.message}`;
          }
        }
      });
    
    case 'database':
      return new DynamicTool({
        name: toolName || "query_database",
        description: toolDescription || "Query a database for information",
        func: async (query) => {
          try {
            // This would connect to a database in a real implementation
            // For demo purposes, return mock data
            if (query.toLowerCase().includes('user')) {
              return JSON.stringify([
                { id: 1, name: "Alice", role: "Admin" },
                { id: 2, name: "Bob", role: "User" },
                { id: 3, name: "Charlie", role: "Moderator" }
              ], null, 2);
            } else if (query.toLowerCase().includes('product')) {
              return JSON.stringify([
                { id: 101, name: "Laptop", price: 999.99 },
                { id: 102, name: "Phone", price: 699.99 },
                { id: 103, name: "Tablet", price: 499.99 }
              ], null, 2);
            } else {
              return "No data found for query: " + query;
            }
          } catch (error) {
            console.error("Error in database tool:", error);
            return `Error querying database: ${error.message}`;
          }
        }
      });
      
    default:
      // Handle custom tools based on configuration
      return new DynamicTool({
        name: toolName || "custom_tool",
        description: toolDescription || "A custom tool",
        func: async (input) => {
          try {
            // Use the custom implementation if defined in toolConfig
            if (toolConfig && toolConfig.implementation) {
              // In a real app, you might use Function constructor to create a function from string
              // But this is a security risk, so we'd use a safer approach
              return `Custom tool [${toolName}] response to: ${input}`;
            }
            
            return `Custom tool response to: ${input}`;
          } catch (error) {
            console.error("Error in custom tool:", error);
            return `Error in custom tool: ${error.message}`;
          }
        }
      });
  }
};

// Execute a workflow with support for multi-agent interactions
export const executeWorkflow = async (workflow, input, onUpdate) => {
  try {
    console.log("Starting workflow execution with multi-agent support");
    
    // Extract nodes and edges from workflow
    const { nodes, edges } = workflow;
    
    // Map nodes by ID for easier reference
    const nodesMap = new Map(nodes.map(node => [node.id, node]));
    
    // Find starting nodes (those with no incoming edges)
    const startingNodeIds = nodes
      .filter(node => !edges.some(edge => edge.target === node.id))
      .map(node => node.id);
      
    if (startingNodeIds.length === 0) {
      throw new Error("No starting node found in workflow");
    }
    
    // Initialize session memory
    const sessionMemory = {
      input: input,
      startTime: Date.now(),
      results: {},
      intermediateSteps: [],
      sharedMemory: {}, // New: global memory accessible by all nodes
      agents: {},       // New: agent registry for multi-agent communication
      messages: [],     // New: message queue for agent communication
      teamRegistry: {}, // New: teams of agents working together
    };
    
    // Send initial status update
    onUpdate && onUpdate({
      type: 'workflow_start',
      timestamp: Date.now(),
      workflow: workflow.name,
      input
    });
    
    // Perform agent and team discovery before execution
    // This step identifies and registers all agents and teams in the workflow
    await discoverAgentsAndTeams(nodes, nodesMap, sessionMemory);
    
    // Execute flow starting from each starting node
    const results = [];
    
    // Identify parallelizable paths
    const parallelPaths = getParallelExecutionPaths(startingNodeIds, edges, nodesMap);
    
    // For multi-path workflows, execute parallel paths concurrently
    const executionPromises = parallelPaths.map(async (nodeId) => {
      const executionResult = await executeNode(
        nodeId, 
        nodesMap, 
        edges, 
        input, 
        sessionMemory, 
        onUpdate
      );
      
      return executionResult;
    });
    
    // Wait for all parallel paths to complete
    const pathResults = await Promise.all(executionPromises);
    results.push(...pathResults);
    
    // Final result
    const finalResult = {
      results,
      memory: sessionMemory,
      executionTime: Date.now() - sessionMemory.startTime
    };
    
    // Send completion status update
    onUpdate && onUpdate({
      type: 'workflow_complete',
      timestamp: Date.now(),
      workflow: workflow.name,
      results: finalResult,
      executionTime: finalResult.executionTime
    });
    
    // Log execution to chat if chat integration is enabled
    if (workflow.chatIntegration) {
      try {
        await logExecutionToChat(workflow.id, finalResult);
      } catch (error) {
        console.error("Error logging workflow execution to chat:", error);
      }
    }
    
    return finalResult;
  } catch (error) {
    console.error("Error executing workflow:", error);
    
    // Send error status update
    onUpdate && onUpdate({
      type: 'workflow_error',
      timestamp: Date.now(),
      error: error.message
    });
    
    throw new Error(`Workflow execution failed: ${error.message}`);
  }
};

// New: Discover and register agents and teams in the workflow
const discoverAgentsAndTeams = async (nodes, nodesMap, memory) => {
  console.log("Discovering agents and teams in workflow");
  
  // Find all persona nodes
  const personaNodes = nodes.filter(node => node.type === 'personaNode');
  
  // Find all team nodes
  const teamNodes = nodes.filter(node => node.type === 'teamNode');
  
  // Find all memory nodes
  const memoryNodes = nodes.filter(node => node.type === 'memoryNode');
  
  // Find all communication nodes
  const communicationNodes = nodes.filter(node => node.type === 'communicationNode');
  
  // Register all personas as individual agents
  for (const node of personaNodes) {
    const agentId = node.id;
    const personaData = node.data.personaData || {};
    
    memory.agents[agentId] = {
      id: agentId,
      name: personaData.name || 'Unnamed Agent',
      role: 'individual',
      persona: personaData,
      messages: [],
      memory: {},
      teamIds: []
    };
    
    console.log(`Registered individual agent: ${memory.agents[agentId].name}`);
  }
  
  // Register all teams
  for (const node of teamNodes) {
    const teamId = node.id;
    const teamData = node.data || {};
    
    memory.teamRegistry[teamId] = {
      id: teamId,
      name: teamData.teamName || 'Unnamed Team',
      description: teamData.teamDescription || '',
      role: teamData.teamRole || 'coordinator',
      members: teamData.agents || [],
      sharedMemory: {},
      messages: []
    };
    
    // If the team has members, update the agent registry to know which teams they belong to
    for (const member of teamData.agents || []) {
      if (memory.agents[member.id]) {
        memory.agents[member.id].teamIds.push(teamId);
      }
    }
    
    console.log(`Registered team: ${memory.teamRegistry[teamId].name}`);
  }
  
  // Initialize shared memory from memory nodes
  for (const node of memoryNodes) {
    const memoryId = node.id;
    const memoryData = node.data || {};
    
    memory.sharedMemory[memoryId] = {
      id: memoryId,
      name: memoryData.memoryName || 'Unnamed Memory',
      type: memoryData.memoryType || 'simple',
      data: {},
      timestamp: Date.now(),
      accessLog: []
    };
    
    console.log(`Initialized shared memory: ${memory.sharedMemory[memoryId].name}`);
  }
  
  // Initialize communication channels
  for (const node of communicationNodes) {
    const channelId = node.id;
    const channelData = node.data || {};
    
    // Add to memory
    memory.messages.push({
      id: channelId,
      name: channelData.name || 'Default Channel',
      mode: channelData.mode || 'broadcast',
      format: channelData.format || 'text',
      messages: [],
      participants: []
    });
    
    console.log(`Initialized communication channel: ${channelData.name || 'Default Channel'}`);
  }
  
  return memory;
};

// New: Identify paths that can be executed in parallel
const getParallelExecutionPaths = (startingNodeIds, edges, nodesMap) => {
  // For now, we'll just return the starting nodes as parallel paths
  // But in a more sophisticated implementation, we'd analyze the workflow
  // to find truly independent execution paths
  return startingNodeIds;
};

// Log workflow execution to chat
const logExecutionToChat = async (workflowId, results) => {
  try {
    const { chatDB } = await import('../db');
    
    // Create a chat message containing the workflow results
    const chatMessage = {
      id: `wf-exec-${Date.now()}`,
      timestamp: Date.now(),
      title: `Workflow Execution: ${workflowId}`,
      messages: [
        {
          role: 'system',
          content: `Workflow execution completed in ${results.executionTime}ms.`
        },
        {
          role: 'assistant',
          content: Array.isArray(results.results) ? results.results.join('\n\n') : JSON.stringify(results.results)
        }
      ]
    };
    
    // Save the chat
    await chatDB.saveChat(chatMessage);
    return chatMessage.id;
  } catch (error) {
    console.error("Error creating chat from workflow:", error);
    throw error;
  }
};

// Create a team agent
export const createTeamAgent = async (teamNode, agents = [], tools = []) => {
  const teamData = teamNode.data;
  
  // Skip if team data is missing
  if (!teamData) {
    throw new Error("Invalid team data in node");
  }
  
  // Create a system prompt for the team coordinator
  const teamMemberDescriptions = agents.map(agent => 
    `- ${agent.persona.name}: ${agent.persona.systemPrompt || 'No description'}`
  ).join('\n');
  
  // Format tools for prompt template
  const toolStrings = tools.map(tool => 
    `- ${tool.name}: ${tool.description || "No description"}`
  ).join("\n");
  
  const teamRole = teamData.teamRole || 'coordinator';
  let systemPrompt = '';
  
  // Role-specific prompts
  switch(teamRole) {
    case 'coordinator':
      systemPrompt = `You are a coordination agent for a team. Your role is to distribute tasks, 
      manage communication, and ensure the team works effectively together.
      You will coordinate the following team members:
      ${teamMemberDescriptions}`;
      break;
    case 'debate':
      systemPrompt = `You are a debate facilitator. Your role is to present different perspectives, 
      encourage structured argumentation, and help the team arrive at a reasoned conclusion.
      The debate participants are:
      ${teamMemberDescriptions}`;
      break;
    case 'consensus':
      systemPrompt = `You are a consensus-building agent. Your role is to identify common ground,
      highlight areas of agreement, and help the team reach shared understanding and decisions.
      The team members are:
      ${teamMemberDescriptions}`;
      break;
    case 'specialist':
      systemPrompt = `You are a specialist team coordinator. Your role is to integrate specialized 
      expertise from each team member to solve complex problems.
      The specialists in your team are:
      ${teamMemberDescriptions}`;
      break;
    default:
      systemPrompt = `You are a team agent named "${teamData.teamName || 'Team Agent'}". 
      You coordinate the following team members:
      ${teamMemberDescriptions}`;
  }
  
  // Add tools to the system prompt
  if (tools.length > 0) {
    systemPrompt += `\n\nYou have access to the following tools:
    ${toolStrings}`;
  }
  
  // Create LLM with team-appropriate settings
  const llm = new ChatDeepInfra({
    apiKey: API_KEY,
    modelName: "deepinfra/mixtral-8x7b-instruct",
    temperature: 0.7,
    maxTokens: 1500,
    streaming: true,
  });
  
  // Create a prompt template for the team agent
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt + "\n\n{agent_scratchpad}"],
    ["human", "{input}"]
  ]);
  
  try {
    // Create the agent
    const agent = await createOpenAIFunctionsAgent({
      llm,
      tools,
      prompt,
    });
    
    // Create and return the agent executor
    return new AgentExecutor({
      agent,
      tools,
      maxIterations: 5,
      returnIntermediateSteps: true,
    });
  } catch (error) {
    console.error("Error creating team agent:", error);
    throw new Error(`Failed to create team agent: ${error.message}`);
  }
};

// Enhanced recursively execute nodes in the workflow with team and multi-agent support
const executeNode = async (nodeId, nodesMap, edges, input, memory = {}, onUpdate) => {
  const node = nodesMap.get(nodeId);
  
  if (!node) {
    throw new Error(`Node with ID ${nodeId} not found`);
  }
  
  // Update status
  onUpdate && onUpdate({
    type: 'node_start',
    nodeId,
    nodeName: node.data.label || node.type,
    timestamp: Date.now()
  });
  
  let result;
  let startTime = Date.now();
  
  try {
    // Track node in memory
    if (!memory.intermediateSteps) {
      memory.intermediateSteps = [];
    }
    
    memory.intermediateSteps.push({
      nodeId,
      nodeType: node.type,
      startTime,
      status: 'running'
    });
    
    // Process node based on type
    switch (node.type) {
      case 'personaNode':
        // Gather all data from connected nodes first before executing the persona
        const connectedFilesData = [];
        
        // Collect data from nodes connected to this persona first
        const incomingNodeIds = edges
          .filter(edge => edge.target === nodeId)
          .map(edge => edge.source);
        
        // Process file nodes first to get their content before running the agent
        for (const connectedId of incomingNodeIds) {
          const connectedNode = nodesMap.get(connectedId);
          if (!connectedNode) continue;
          
          // Process file nodes first to get their content
          if (connectedNode.type === 'fileNode') {
            try {
              // Execute the file node to get its content if not already processed
              if (!memory.results || !memory.results[connectedId]) {
                // Execute the file node first
                const fileResult = await executeNode(
                  connectedId,
                  nodesMap,
                  edges,
                  input,
                  memory,
                  onUpdate
                );
                
                // Store this result
                connectedFilesData.push(fileResult);
              } else {
                // Already processed, just get the result
                connectedFilesData.push(memory.results[connectedId]);
              }
            } catch (error) {
              console.error(`Error processing connected file node ${connectedId}:`, error);
              connectedFilesData.push(`Error processing file: ${error.message}`);
            }
          }
          
          // NEW: Process memory nodes to get shared memory
          if (connectedNode.type === 'memoryNode') {
            try {
              const memoryId = connectedNode.id;
              
              // Check if this memory exists in shared memory
              if (memory.sharedMemory && memory.sharedMemory[memoryId]) {
                // Record memory access
                memory.sharedMemory[memoryId].accessLog.push({
                  nodeId,
                  operation: 'read',
                  timestamp: Date.now()
                });
                
                // Get memory data
                const memoryData = memory.sharedMemory[memoryId].data;
                
                // Format for the agent
                const memoryContent = typeof memoryData === 'object' 
                  ? JSON.stringify(memoryData, null, 2)
                  : String(memoryData);
                
                connectedFilesData.push(`Shared Memory (${memory.sharedMemory[memoryId].name}):\n\n${memoryContent || "Empty"}`);
              }
            } catch (error) {
              console.error(`Error processing memory node ${connectedId}:`, error);
              connectedFilesData.push(`Error accessing shared memory: ${error.message}`);
            }
          }
          
          // NEW: Process communication nodes to get messages
          if (connectedNode.type === 'communicationNode') {
            try {
              const channelId = connectedNode.id;
              
              // Find this channel in messages
              const channel = memory.messages.find(ch => ch.id === channelId);
              
              if (channel) {
                // Register this agent as a participant if not already
                if (!channel.participants.includes(nodeId)) {
                  channel.participants.push(nodeId);
                }
                
                // Get the last 10 messages or fewer
                const recentMessages = channel.messages.slice(-10);
                
                if (recentMessages.length > 0) {
                  const messageContent = recentMessages.map(msg => 
                    `${msg.sender} (${new Date(msg.timestamp).toLocaleTimeString()}): ${msg.content}`
                  ).join('\n');
                  
                  connectedFilesData.push(`Messages from ${channel.name}:\n\n${messageContent}`);
                } else {
                  connectedFilesData.push(`No messages in channel: ${channel.name}`);
                }
              }
            } catch (error) {
              console.error(`Error processing communication node ${connectedId}:`, error);
              connectedFilesData.push(`Error accessing messages: ${error.message}`);
            }
          }
        }
        
        // Get outgoing tool nodes that this persona can use
        const toolNodeIds = edges
          .filter(edge => edge.source === nodeId && nodesMap.get(edge.target)?.type === 'toolNode')
          .map(edge => edge.target);
          
        const fileNodeIds = edges
          .filter(edge => edge.source === nodeId && nodesMap.get(edge.target)?.type === 'fileNode')
          .map(edge => edge.target);
        
        // NEW: Get outgoing memory nodes that this persona can write to
        const memoryNodeIds = edges
          .filter(edge => edge.source === nodeId && nodesMap.get(edge.target)?.type === 'memoryNode')
          .map(edge => edge.target);
          
        // NEW: Get outgoing communication nodes that this persona can send messages to
        const communicationNodeIds = edges
          .filter(edge => edge.source === nodeId && nodesMap.get(edge.target)?.type === 'communicationNode')
          .map(edge => edge.target);
        
        // Create tools from tool nodes
        const tools = await Promise.all(toolNodeIds.map(async id => {
          return await createNodeTool(nodesMap.get(id));
        }));
        
        // Add file access tools for connected file nodes
        if (fileNodeIds.length > 0) {
          const fileNodes = fileNodeIds.map(id => nodesMap.get(id));
          
          // Create a dynamic file access tool using connected files
          const fileAccessTool = new DynamicTool({
            name: "access_attached_files",
            description: "Access content from files attached to this workflow",
            func: async (fileQuery) => {
              try {
                const { knowledgeDB } = await import('../db');
                
                // Get all file IDs from the connected file nodes
                const fileIds = fileNodes
                  .filter(node => node && node.data && node.data.fileId)
                  .map(node => node.data.fileId);
                
                if (fileIds.length === 0) {
                  return "No files are attached to this workflow.";
                }
                
                // Get the files
                const files = await knowledgeDB.getFiles(fileIds);
                
                if (files.length === 0) {
                  return "Files are attached but could not be accessed.";
                }
                
                // If a specific file is requested, try to find it
                if (fileQuery) {
                  const matchingFiles = files.filter(f => 
                    f.name.toLowerCase().includes(fileQuery.toLowerCase())
                  );
                  
                  if (matchingFiles.length === 0) {
                    return `No file matching "${fileQuery}" found. Available files: ${files.map(f => f.name).join(', ')}`;
                  }
                  
                  // Parse the file content if needed
                  const { parseFileContent } = await import('../../utils/FileParser');
                  let content = matchingFiles[0].content;
                  if (content && typeof content !== 'string') {
                    try {
                      content = await parseFileContent(
                        content,
                        matchingFiles[0].type,
                        matchingFiles[0].name
                      );
                    } catch (error) {
                      console.error("Error parsing file content:", error);
                      content = "Error parsing file content";
                    }
                  }
                  
                  return `Content of "${matchingFiles[0].name}":\n\n${content || "No content available"}`;
                }
                
                // Otherwise, list available files
                return `Available files: ${files.map(f => f.name).join(', ')}`;
              } catch (error) {
                console.error("Error in file access tool:", error);
                return `Error accessing files: ${error.message}`;
              }
            }
          });
          
          tools.push(fileAccessTool);
        }
        
        // NEW: Add memory access tools for connected memory nodes
        if (memoryNodeIds.length > 0) {
          const memoryNodes = memoryNodeIds.map(id => nodesMap.get(id));
          
          // Create a dynamic memory read/write tool
          const memoryTool = new DynamicTool({
            name: "shared_memory",
            description: "Read from or write to shared memory. Format: '[read|write]:memory_name:data' - For read, data can be empty.",
            func: async (memoryCommand) => {
              try {
                // Parse the command format: operation:memory_name:data
                const [operation, memoryName, ...dataParts] = memoryCommand.split(':');
                const data = dataParts.join(':'); // Rejoin in case the data itself contained colons
                
                if (!operation || !memoryName) {
                  return "Invalid memory command. Format should be: [read|write]:memory_name:data";
                }
                
                // Find the matching memory node
                const memoryNode = memoryNodes.find(
                  node => node.data.memoryName.toLowerCase() === memoryName.toLowerCase()
                );
                
                // If no exact match, try a partial match
                const partialMatchNode = !memoryNode ? memoryNodes.find(
                  node => node.data.memoryName.toLowerCase().includes(memoryName.toLowerCase())
                ) : null;
                
                const targetNode = memoryNode || partialMatchNode;
                
                if (!targetNode) {
                  return `No memory with name '${memoryName}' found. Available memories: ${memoryNodes.map(n => n.data.memoryName).join(', ')}`;
                }
                
                const memoryId = targetNode.id;
                
                // Ensure the memory exists in shared memory
                if (!memory.sharedMemory[memoryId]) {
                  memory.sharedMemory[memoryId] = {
                    id: memoryId,
                    name: targetNode.data.memoryName,
                    type: targetNode.data.memoryType || 'simple',
                    data: {},
                    timestamp: Date.now(),
                    accessLog: []
                  };
                }
                
                // Execute operation
                switch(operation.toLowerCase()) {
                  case 'read':
                    // Record memory access
                    memory.sharedMemory[memoryId].accessLog.push({
                      nodeId,
                      operation: 'read',
                      timestamp: Date.now()
                    });
                    
                    // Get memory data
                    const readData = memory.sharedMemory[memoryId].data;
                    
                    // Format based on memory type
                    if (typeof readData === 'object') {
                      return JSON.stringify(readData, null, 2);
                    } else {
                      return String(readData || "Memory is empty");
                    }
                    
                  case 'write':
                    if (!data) {
                      return "No data provided for write operation.";
                    }
                    
                    // Record memory access
                    memory.sharedMemory[memoryId].accessLog.push({
                      nodeId,
                      operation: 'write',
                      timestamp: Date.now()
                    });
                    
                    // Update memory data based on memory type
                    if (targetNode.data.memoryType === 'structured') {
                      try {
                        // Try to parse as JSON
                        memory.sharedMemory[memoryId].data = JSON.parse(data);
                      } catch (e) {
                        // Fallback to string if not valid JSON
                        memory.sharedMemory[memoryId].data = data;
                      }
                    } else {
                      memory.sharedMemory[memoryId].data = data;
                    }
                    
                    memory.sharedMemory[memoryId].timestamp = Date.now();
                    
                    return `Successfully wrote to memory '${targetNode.data.memoryName}'.`;
                    
                  default:
                    return `Unknown operation: ${operation}. Use 'read' or 'write'.`;
                }
              } catch (error) {
                console.error("Error in memory tool:", error);
                return `Error accessing memory: ${error.message}`;
              }
            }
          });
          
          tools.push(memoryTool);
        }
        
        // NEW: Add communication tools for connected communication nodes
        if (communicationNodeIds.length > 0) {
          const communicationNodes = communicationNodeIds.map(id => nodesMap.get(id));
          
          // Create a dynamic message sending tool
          const messageTool = new DynamicTool({
            name: "send_message",
            description: "Send a message to a communication channel. Format: 'channel_name:message'",
            func: async (messageCommand) => {
              try {
                // Parse the command format: channel_name:message
                const colonIndex = messageCommand.indexOf(':');
                
                if (colonIndex < 0) {
                  return "Invalid message format. Use 'channel_name:message'";
                }
                
                const channelName = messageCommand.substring(0, colonIndex).trim();
                const messageContent = messageCommand.substring(colonIndex + 1).trim();
                
                if (!channelName || !messageContent) {
                  return "Both channel name and message content are required.";
                }
                
                // Find the matching communication node
                const commNode = communicationNodes.find(
                  node => node.data.name.toLowerCase() === channelName.toLowerCase()
                );
                
                // If no exact match, try a partial match
                const partialMatchNode = !commNode ? communicationNodes.find(
                  node => node.data.name.toLowerCase().includes(channelName.toLowerCase())
                ) : null;
                
                const targetNode = commNode || partialMatchNode;
                
                if (!targetNode) {
                  return `No channel named '${channelName}' found. Available channels: ${communicationNodes.map(n => n.data.name).join(', ')}`;
                }
                
                const channelId = targetNode.id;
                
                // Find this channel in messages
                let channel = memory.messages.find(ch => ch.id === channelId);
                
                if (!channel) {
                  // Create the channel if it doesn't exist
                  channel = {
                    id: channelId,
                    name: targetNode.data.name,
                    mode: targetNode.data.mode || 'broadcast',
                    format: targetNode.data.format || 'text',
                    messages: [],
                    participants: [nodeId]
                  };
                  memory.messages.push(channel);
                } else if (!channel.participants.includes(nodeId)) {
                  // Add this agent as a participant
                  channel.participants.push(nodeId);
                }
                
                // Get agent name from registry
                const agentName = memory.agents[nodeId]?.name || 'Unknown Agent';
                
                // Add message to the channel
                const message = {
                  id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  sender: agentName,
                  senderId: nodeId,
                  content: messageContent,
                  timestamp: Date.now()
                };
                
                channel.messages.push(message);
                
                return `Message sent to channel '${targetNode.data.name}'.`;
              } catch (error) {
                console.error("Error in communication tool:", error);
                return `Error sending message: ${error.message}`;
              }
            }
          });
          
          tools.push(messageTool);
        }
        
        // Create and run agent
        const agent = await createPersonaAgent(node, tools);
        
        // Add node-specific memory
        const nodeMemory = {
          ...memory,
          currentNode: nodeId,
          agentId: nodeId,
          tools: toolNodeIds.length,
          files: fileNodeIds.length
        };
        
        // Enhance the input with file content and other data if available
        let enhancedInput = input;
        if (connectedFilesData.length > 0) {
          enhancedInput = `${input}\n\nAVAILABLE CONTEXT:\n\n${connectedFilesData.join('\n\n')}`;
        }
        
        // Track progress in the execution
        const agentResult = await agent.invoke({ 
          input: enhancedInput,
          memory: nodeMemory
        });
        
        // Store agent's output in registry for potential team use
        if (memory.agents[nodeId]) {
          memory.agents[nodeId].lastOutput = agentResult.output || agentResult;
        }
        
        // Store full agent result in memory
        if (!memory.results) memory.results = {};
        memory.results[nodeId] = agentResult;
        
        // For the workflow, we return just the output
        result = agentResult.output || agentResult;
        break;
        
      case 'teamNode':
        // NEW: Process team node - orchestrate multiple agents
        console.log(`Executing team node: ${nodeId}`);
        
        // Get the team data
        const teamData = node.data;
        
        // Check for connected agents (persona nodes)
        const connectedAgentIds = edges
          .filter(edge => edge.target === nodeId && nodesMap.get(edge.source)?.type === 'personaNode')
          .map(edge => edge.source);
        
        if (connectedAgentIds.length === 0) {
          result = "No agents connected to this team. Connect persona nodes to the team.";
          break;
        }
        
        // Gather all agents
        const teamAgents = [];
        
        for (const agentId of connectedAgentIds) {
          // Register the agent if not already in memory
          if (!memory.agents[agentId]) {
            const agentNode = nodesMap.get(agentId);
            if (!agentNode) continue;
            
            const personaData = agentNode.data.personaData || {};
            
            memory.agents[agentId] = {
              id: agentId,
              name: personaData.name || 'Unnamed Agent',
              role: 'individual',
              persona: personaData,
              messages: [],
              memory: {},
              teamIds: [nodeId]
            };
          } else if (!memory.agents[agentId].teamIds.includes(nodeId)) {
            // Add this team to the agent's team list
            memory.agents[agentId].teamIds.push(nodeId);
          }
          
          teamAgents.push(memory.agents[agentId]);
        }
        
        // Update team registry
        memory.teamRegistry[nodeId] = {
          id: nodeId,
          name: teamData.teamName || 'Unnamed Team',
          description: teamData.teamDescription || '',
          role: teamData.teamRole || 'coordinator',
          members: teamAgents.map(a => ({ id: a.id, name: a.name })),
          sharedMemory: {},
          messages: []
        };
        
        // Process incoming data similar to persona node
        const teamContext = [];
        
        // Collect data from nodes connected to this team
        const incomingTeamNodeIds = edges
          .filter(edge => edge.target === nodeId && !connectedAgentIds.includes(edge.source))
          .map(edge => edge.source);
          
        for (const connectedId of incomingTeamNodeIds) {
          const connectedNode = nodesMap.get(connectedId);
          if (!connectedNode) continue;
          
          // Process various input node types
          if (connectedNode.type === 'fileNode') {
            try {
              if (!memory.results || !memory.results[connectedId]) {
                const fileResult = await executeNode(
                  connectedId, nodesMap, edges, input, memory, onUpdate
                );
                teamContext.push(fileResult);
              } else {
                teamContext.push(memory.results[connectedId]);
              }
            } catch (error) {
              console.error(`Error processing file for team ${nodeId}:`, error);
              teamContext.push(`Error processing file: ${error.message}`);
            }
          } else if (connectedNode.type === 'memoryNode') {
            try {
              const memoryId = connectedNode.id;
              if (memory.sharedMemory && memory.sharedMemory[memoryId]) {
                const memoryData = memory.sharedMemory[memoryId].data;
                const memoryContent = typeof memoryData === 'object' 
                  ? JSON.stringify(memoryData, null, 2)
                  : String(memoryData);
                teamContext.push(`Shared Memory (${memory.sharedMemory[memoryId].name}):\n\n${memoryContent || "Empty"}`);
              }
            } catch (error) {
              console.error(`Error processing memory for team ${nodeId}:`, error);
              teamContext.push(`Error accessing memory: ${error.message}`);
            }
          } else if (memory.results && memory.results[connectedId]) {
            // Use any other node's result as context
            teamContext.push(memory.results[connectedId]);
          }
        }
        
        // Get outgoing tool nodes that this team can use
        const teamToolNodeIds = edges
          .filter(edge => edge.source === nodeId && nodesMap.get(edge.target)?.type === 'toolNode')
          .map(edge => edge.target);
          
        // Create tools from tool nodes
        const teamTools = await Promise.all(teamToolNodeIds.map(async id => {
          return await createNodeTool(nodesMap.get(id));
        }));
        
        // Create a team agent
        const teamAgent = await createTeamAgent(node, teamAgents, teamTools);
        
        // Enhance the input with context
        let teamInput = input;
        if (teamContext.length > 0) {
          teamInput = `${input}\n\nTEAM CONTEXT:\n\n${teamContext.join('\n\n')}`;
        }
        
        // Add information about which agents are on the team
        teamInput += `\n\nTEAM COMPOSITION:\n${teamAgents.map(a => 
          `- ${a.name}: ${a.persona.systemPrompt?.substring(0, 100) || 'No description'}...`
        ).join('\n')}`;
        
        // Execute the team agent
        const teamResult = await teamAgent.invoke({
          input: teamInput,
          memory: { ...memory, currentNode: nodeId, teamId: nodeId }
        });
        
        // Store results
        if (!memory.results) memory.results = {};
        memory.results[nodeId] = teamResult;
        
        result = teamResult.output || teamResult;
        break;
        
      case 'memoryNode':
        // NEW: Process memory node
        console.log(`Executing memory node: ${nodeId}`);
        
        // Get memory data
        const memoryData = node.data;
        
        // Initialize this memory if it doesn't exist
        if (!memory.sharedMemory[nodeId]) {
          memory.sharedMemory[nodeId] = {
            id: nodeId,
            name: memoryData.memoryName || 'Unnamed Memory',
            type: memoryData.memoryType || 'simple',
            data: {},
            timestamp: Date.now(),
            accessLog: []
          };
        }
        
        // If there's a direct input, store it in memory
        if (input && typeof input === 'string' && input.trim().length > 0) {
          if (memoryData.memoryType === 'structured') {
            try {
              // Try to parse as JSON
              memory.sharedMemory[nodeId].data = JSON.parse(input);
            } catch (e) {
              // Fallback to string
              memory.sharedMemory[nodeId].data = input;
            }
          } else {
            memory.sharedMemory[nodeId].data = input;
          }
          
          memory.sharedMemory[nodeId].timestamp = Date.now();
          memory.sharedMemory[nodeId].accessLog.push({
            operation: 'write',
            source: 'workflow',
            timestamp: Date.now()
          });
        }
        
        // Format memory content for output
        const memoryContent = memory.sharedMemory[nodeId].data;
        if (typeof memoryContent === 'object') {
          result = `Memory (${memoryData.memoryName}):\n${JSON.stringify(memoryContent, null, 2)}`;
        } else {
          result = `Memory (${memoryData.memoryName}):\n${memoryContent || "Empty"}`;
        }
        
        break;
        
      case 'communicationNode':
        // NEW: Process communication node
        console.log(`Executing communication node: ${nodeId}`);
        
        // Get channel data
        const channelData = node.data;
        
        // Find this channel in messages
        let channel = memory.messages.find(ch => ch.id === nodeId);
        
        if (!channel) {
          // Create the channel if it doesn't exist
          channel = {
            id: nodeId,
            name: channelData.name || 'Default Channel',
            mode: channelData.mode || 'broadcast',
            format: channelData.format || 'text',
            messages: [],
            participants: []
          };
          memory.messages.push(channel);
        }
        
        // If there's a direct input, add it as a system message
        if (input && typeof input === 'string' && input.trim().length > 0) {
          const message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            sender: 'System',
            senderId: 'system',
            content: input,
            timestamp: Date.now()
          };
          
          channel.messages.push(message);
        }
        
        // Format messages for output
        if (channel.messages.length > 0) {
          const messageContent = channel.messages.map(msg => 
            `${msg.sender} (${new Date(msg.timestamp).toLocaleTimeString()}): ${msg.content}`
          ).join('\n');
          
          result = `Channel (${channelData.name}):\n\n${messageContent}`;
        } else {
          result = `Channel (${channelData.name}):\nNo messages`;
        }
        
        break;
        
      case 'toolNode':
        // Create and use tool directly
        const tool = await createNodeTool(node);
        result = await tool.func(input);
        break;
        
      case 'fileNode':
        // Process file node - read the file content
        const fileId = node.data.fileId;
        if (!fileId) {
          result = "No file selected for this node.";
          break;
        }
        
        try {
          const { knowledgeDB } = await import('../db');
          const files = await knowledgeDB.getFiles([fileId]);
          
          if (files.length === 0) {
            result = `File with ID ${fileId} not found.`;
          } else {
            const file = files[0];
            
            // Parse file content using the existing FileParser utility
            try {
              // Helper to format file size
              const formatFileSize = (bytes) => {
                if (!bytes || isNaN(bytes)) return 'unknown';
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                if (bytes === 0) return '0 Bytes';
                const i = Math.floor(Math.log(bytes) / Math.log(1024));
                return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[Math.min(i, sizes.length - 1)]}`;
              };
            
              const { parseFileContent } = await import('../../utils/FileParser');
              const parsedContent = await parseFileContent(
                file.content,
                file.type,
                file.name
              );
              
              // Get the file size from file node data if available, otherwise use the size from the file
              let fileSize = 'unknown';
              const fileNodeData = node.data;
              if (fileNodeData && fileNodeData.fileSize) {
                fileSize = formatFileSize(fileNodeData.fileSize);
              } else if (file.size) {
                fileSize = formatFileSize(file.size);
              }
              
              // Add file size to the file object for future use
              file.size = file.size || node.data.fileSize;
              
              result = `File: ${file.name}\nSize: ${fileSize}\nType: ${file.type || 'unknown'}\n\nContent:\n${parsedContent}`;
            } catch (parseError) {
              console.error("Error parsing file content:", parseError);
              
              // Fallback to basic content handling if parsing fails
              let contentStr = "No content available";
              
              // Helper to format file size
              const formatFileSize = (bytes) => {
                if (!bytes || isNaN(bytes)) return 'unknown';
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                if (bytes === 0) return '0 Bytes';
                const i = Math.floor(Math.log(bytes) / Math.log(1024));
                return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[Math.min(i, sizes.length - 1)]}`;
              };
              
              // Get the file size from file node data if available, otherwise use the size from the file
              let fileSize = 'unknown';
              const fileNodeData = node.data;
              if (fileNodeData && fileNodeData.fileSize) {
                fileSize = formatFileSize(fileNodeData.fileSize);
              } else if (file.size) {
                fileSize = formatFileSize(file.size);
              }
              
              // Add file size to the file object for future use
              file.size = file.size || node.data.fileSize;
              
              if (typeof file.content === 'string') {
                contentStr = file.content;
              } else if (file.content instanceof ArrayBuffer) {
                contentStr = "Binary content (ArrayBuffer) - cannot display as text";
              } else if (file.content && typeof file.content === 'object') {
                try {
                  contentStr = JSON.stringify(file.content, null, 2);
                } catch (err) {
                  contentStr = "Object content - cannot display as text";
                }
              } else if (file.content !== null && file.content !== undefined) {
                try {
                  contentStr = String(file.content);
                } catch (err) {
                  contentStr = "Content cannot be converted to string";
                }
              }
              
              result = `File: ${file.name}\nSize: ${fileSize}\nType: ${file.type || 'unknown'}\n\nContent:\n${contentStr}\n\n(Error parsing file content: ${parseError.message})`;
            }
          }
        } catch (error) {
          console.error("Error reading file in file node:", error);
          result = `Error reading file: ${error.message}`;
        }
        break;
        
      case 'triggerNode':
        // Process trigger node
        result = `Workflow triggered: ${node.data.label || "Unnamed Trigger"}`;
        break;
        
      case 'actionNode':
        // Process action node
        result = `Action executed: ${node.data.label || "Unnamed Action"}`;
        break;
        
      case 'decisionNode':
        // Process decision and follow appropriate edge
        const condition = await evaluateDecision(node, input, memory);
        const nextEdges = edges.filter(edge => 
          edge.source === nodeId && 
          (edge.label === condition.toString() || !edge.label)
        );
        
        if (nextEdges.length === 0) {
          result = `Decision: ${condition}, but no matching path found`;
        } else {
          // Follow the matching edge
          result = await executeNode(
            nextEdges[0].target, 
            nodesMap, 
            edges, 
            input, 
            { ...memory, decisionResult: condition },
            onUpdate
          );
        }
        break;
        
      default:
        result = `Unknown node type: ${node.type}`;
    }
    
    // Update memory with result of this node
    if (!memory.results) memory.results = {};
    memory.results[nodeId] = result;
    
    // Update node status in memory
    const lastStep = memory.intermediateSteps[memory.intermediateSteps.length - 1];
    if (lastStep && lastStep.nodeId === nodeId) {
      lastStep.endTime = Date.now();
      lastStep.duration = lastStep.endTime - lastStep.startTime;
      lastStep.status = 'completed';
      lastStep.result = result;
    }
    
    // Update status
    onUpdate && onUpdate({
      type: 'node_complete',
      nodeId,
      nodeName: node.data.label || node.type,
      result,
      timestamp: Date.now(),
      duration: Date.now() - startTime
    });
    
    // Find next nodes (excluding decision paths which are handled separately)
    const nextNodeIds = edges
      .filter(edge => 
        edge.source === nodeId && 
        !edge.label && // Skip conditional edges from decision nodes
        node.type !== 'decisionNode' // Decision nodes follow special logic above
      )
      .map(edge => edge.target);
      
    // Check if we can process any of these nodes in parallel
    if (nextNodeIds.length > 1) {
      // For now, simple parallel execution of all next nodes
      const nextResults = await Promise.all(nextNodeIds.map(async (nextNodeId) => {
        return executeNode(
          nextNodeId,
          nodesMap,
          edges,
          result, // Use the result of the current node as input
          memory,  // Pass the updated memory
          onUpdate
        );
      }));
      
      // For simplicity, we'll just return the last result
      return nextResults[nextResults.length - 1];
    } else if (nextNodeIds.length === 1) {
      // Process single next node
      return executeNode(
        nextNodeIds[0], 
        nodesMap, 
        edges, 
        result, // Use the result of the current node as input
        memory,  // Pass the updated memory
        onUpdate
      );
    }
    
    return result;
  }
  catch (error) {
    console.error(`Error executing node ${nodeId}:`, error);
    
    // Update node status in memory
    const lastStep = memory.intermediateSteps[memory.intermediateSteps.length - 1];
    if (lastStep && lastStep.nodeId === nodeId) {
      lastStep.endTime = Date.now();
      lastStep.duration = lastStep.endTime - lastStep.startTime;
      lastStep.status = 'error';
      lastStep.error = error.message;
    }
    
    // Update status
    onUpdate && onUpdate({
      type: 'node_error',
      nodeId,
      nodeName: node.data.label || node.type,
      error: error.message,
      timestamp: Date.now(),
      duration: Date.now() - startTime
    });
    
    throw error;
  }
};

// Helper function to evaluate decision nodes
const evaluateDecision = async (node, input, memory) => {
  // Get the decision condition from node data
  const condition = node.data.condition || "input.length > 20";
  
  try {
    // For security, instead of using eval, we'll use a set of predefined conditions
    switch (condition) {
      case "input.length > 20":
        return typeof input === 'string' && input.length > 20;
      
      case "input.includes('yes')":
        return typeof input === 'string' && input.toLowerCase().includes('yes');
      
      case "input.includes('no')":
        return typeof input === 'string' && input.toLowerCase().includes('no');
      
      case "memory.success === true":
        return memory.success === true;
      
      case "memory.success === false":
        return memory.success === false;
        
      default:
        // For more complex conditions, we could use a safer evaluation approach
        console.warn(`Unknown decision condition: ${condition}, defaulting to false`);
        return false;
    }
  } catch (error) {
    console.error(`Error evaluating decision condition: ${condition}`, error);
    return false;
  }
};