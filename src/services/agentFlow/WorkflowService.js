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

// Execute a workflow
export const executeWorkflow = async (workflow, input, onUpdate) => {
  try {
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
      intermediateSteps: []
    };
    
    // Send initial status update
    onUpdate && onUpdate({
      type: 'workflow_start',
      timestamp: Date.now(),
      workflow: workflow.name,
      input
    });
    
    // Execute flow starting from each starting node
    const results = [];
    
    // For multi-path workflows, we can execute all starting nodes in parallel
    // For now, we'll process them sequentially
    for (const startNodeId of startingNodeIds) {
      const executionResult = await executeNode(
        startNodeId, 
        nodesMap, 
        edges, 
        input, 
        sessionMemory, 
        onUpdate
      );
      
      results.push(executionResult);
    }
    
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

// Recursively execute nodes in the workflow
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
        }
        
        // Get outgoing tool nodes that this persona can use
        const toolNodeIds = edges
          .filter(edge => edge.source === nodeId && nodesMap.get(edge.target)?.type === 'toolNode')
          .map(edge => edge.target);
          
        const fileNodeIds = edges
          .filter(edge => edge.source === nodeId && nodesMap.get(edge.target)?.type === 'fileNode')
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
        
        // Create and run agent
        const agent = await createPersonaAgent(node, tools);
        
        // Add node-specific memory
        const nodeMemory = {
          ...memory,
          currentNode: nodeId,
          tools: toolNodeIds.length,
          files: fileNodeIds.length
        };
        
        // Enhance the input with file content if available
        let enhancedInput = input;
        if (connectedFilesData.length > 0) {
          enhancedInput = `${input}\n\nHere are the files for you to process:\n\n${connectedFilesData.join('\n\n')}`;
        }
        
        // Track progress in the execution
        const agentResult = await agent.invoke({ 
          input: enhancedInput,
          memory: nodeMemory
        });
        
        // Store full agent result in memory
        if (!memory.results) memory.results = {};
        memory.results[nodeId] = agentResult;
        
        // For the workflow, we return just the output
        result = agentResult.output || agentResult;
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
      
    // Process next nodes in sequence
    let finalResult = result;
    for (const nextNodeId of nextNodeIds) {
      finalResult = await executeNode(
        nextNodeId, 
        nodesMap, 
        edges, 
        result, // Use the result of the current node as input to the next
        memory, // Pass the updated memory
        onUpdate
      );
    }
    
    return finalResult;
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