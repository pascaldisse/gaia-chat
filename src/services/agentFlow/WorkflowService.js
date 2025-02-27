import { ChatDeepInfra } from "@langchain/community/chat_models/deepinfra";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { SequentialChain, SimpleSequentialChain } from "langchain/chains";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { DynamicTool } from "@langchain/core/tools";
import { RPGSystem } from "../../utils/RPGSystem";
import { API_KEY } from "../../config";

// Workflow database service for saving/loading workflows
export const saveWorkflow = async (workflow, db) => {
  // Generate unique ID if it doesn't exist
  if (!workflow.id) {
    workflow.id = `workflow-${Date.now()}`;
  }
  
  // Add metadata
  workflow.updatedAt = Date.now();
  if (!workflow.createdAt) {
    workflow.createdAt = Date.now();
  }
  
  try {
    // Save workflow to IndexedDB
    const workflowDB = db || window.indexedDB;
    // For simplicity, we'll use localStorage in this example
    localStorage.setItem(`workflow-${workflow.id}`, JSON.stringify(workflow));
    return workflow.id;
  } catch (error) {
    console.error("Error saving workflow:", error);
    throw new Error("Failed to save workflow");
  }
};

export const getWorkflow = async (id, db) => {
  try {
    // Get workflow from IndexedDB
    const workflowDB = db || window.indexedDB;
    // For simplicity, we'll use localStorage in this example
    const workflow = localStorage.getItem(`workflow-${id}`);
    return workflow ? JSON.parse(workflow) : null;
  } catch (error) {
    console.error("Error retrieving workflow:", error);
    throw new Error("Failed to retrieve workflow");
  }
};

export const getAllWorkflows = async (db) => {
  try {
    // Get all workflows from IndexedDB
    const workflowDB = db || window.indexedDB;
    // For simplicity, we'll use localStorage in this example
    const workflows = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('workflow-')) {
        const workflow = JSON.parse(localStorage.getItem(key));
        workflows.push(workflow);
      }
    }
    
    return workflows.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error("Error retrieving workflows:", error);
    throw new Error("Failed to retrieve workflows");
  }
};

export const deleteWorkflow = async (id, db) => {
  try {
    // Delete workflow from IndexedDB
    const workflowDB = db || window.indexedDB;
    // For simplicity, we'll use localStorage in this example
    localStorage.removeItem(`workflow-${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting workflow:", error);
    throw new Error("Failed to delete workflow");
  }
};

// Create a LangChain agent from a persona node
export const createPersonaAgent = async (personaNode, tools = []) => {
  const personaData = personaNode.data.personaData;
  
  // Skip if persona data is missing
  if (!personaData || !personaData.id) {
    throw new Error("Invalid persona data in node");
  }
  
  // Create a prompt template for the agent
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are ${personaData.name}. ${personaData.systemPrompt || 'Help users complete tasks.'}
    
Current attributes:
- Initiative: ${personaData.initiative || 5}/10
- Creativity: ${personaData.creativity || 5}/10
- Empathy: ${personaData.empathy || 5}/10
- Confidence: ${personaData.confidence || 5}/10

You have access to the following tools:
{tools}

{agent_scratchpad}
`],
    ["human", "{input}"]
  ]);
  
  // Create LLM instance
  const llm = new ChatDeepInfra({
    apiKey: API_KEY,
    modelName: personaData.model,
    temperature: (personaData.creativity || 5) / 10,
    maxTokens: 1000,
    streaming: true,
  });
  
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
};

// Create a LangChain tool from a tool node
export const createNodeTool = (toolNode) => {
  const { toolType, toolName, toolDescription, toolConfig } = toolNode.data;
  
  // Create appropriate tool based on type
  switch (toolType) {
    case 'search':
      return new DynamicTool({
        name: toolName || "search",
        description: toolDescription || "Search for information in documents",
        func: async (query) => {
          // Implement search functionality
          return `Search results for: ${query}`;
        }
      });
      
    case 'files':
      return new DynamicTool({
        name: toolName || "read_file",
        description: toolDescription || "Read content from files",
        func: async (fileId) => {
          // Implement file reading functionality
          return `Content of file with ID: ${fileId}`;
        }
      });
      
    case 'image':
      return new DynamicTool({
        name: toolName || "generate_image",
        description: toolDescription || "Generate an image from text description",
        func: async (prompt) => {
          // Implement image generation
          return `Generated image from prompt: ${prompt}`;
        }
      });
      
    case 'dice':
      return new DynamicTool({
        name: toolName || "roll_dice",
        description: toolDescription || "Roll dice with specified number of sides",
        func: async (input) => {
          const [sides = 20, count = 1] = input.split(',').map(n => parseInt(n.trim()));
          const results = Array.from({length: count}, () => Math.floor(Math.random() * sides) + 1);
          const total = results.reduce((sum, roll) => sum + roll, 0);
          return `Rolled ${count}d${sides}: [${results.join(', ')}] = ${total}`;
        }
      });
      
    default:
      return new DynamicTool({
        name: toolName || "generic_tool",
        description: toolDescription || "A generic tool",
        func: async (input) => {
          return `Generic tool response to: ${input}`;
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
    
    // Execute flow starting from each starting node
    const results = [];
    
    // For simplicity, we'll just use the first starting node
    const executionResult = await executeNode(
      startingNodeIds[0], 
      nodesMap, 
      edges, 
      input, 
      {}, // empty memory to start
      onUpdate
    );
    
    results.push(executionResult);
    
    return results;
  } catch (error) {
    console.error("Error executing workflow:", error);
    throw new Error(`Workflow execution failed: ${error.message}`);
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
    timestamp: Date.now()
  });
  
  let result;
  
  // Process node based on type
  switch (node.type) {
    case 'personaNode':
      // Get connected tool nodes
      const toolNodeIds = edges
        .filter(edge => edge.source === nodeId && nodesMap.get(edge.target)?.type === 'toolNode')
        .map(edge => edge.target);
        
      const tools = toolNodeIds.map(id => createNodeTool(nodesMap.get(id)));
      
      // Create and run agent
      const agent = await createPersonaAgent(node, tools);
      result = await agent.invoke({ input, memory });
      break;
      
    case 'toolNode':
      // Create and use tool directly
      const tool = createNodeTool(node);
      result = await tool.func(input);
      break;
      
    case 'fileNode':
      // Process file node
      const fileId = node.data.fileId;
      // In a real implementation, fetch and process the file
      result = `Processed file with ID: ${fileId}`;
      break;
      
    case 'decisionNode':
      // Process decision and follow appropriate edge
      const condition = evaluateDecision(node, input, memory);
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
  
  // Update status
  onUpdate && onUpdate({
    type: 'node_complete',
    nodeId,
    result,
    timestamp: Date.now()
  });
  
  // Find next nodes
  const nextNodeIds = edges
    .filter(edge => edge.source === nodeId && edge.type !== 'decision')
    .map(edge => edge.target);
    
  // Process next nodes in sequence
  let finalResult = result;
  for (const nextNodeId of nextNodeIds) {
    finalResult = await executeNode(
      nextNodeId, 
      nodesMap, 
      edges, 
      result, // Use the result of the current node as input to the next
      { ...memory, [nodeId]: result }, // Update memory with current result
      onUpdate
    );
  }
  
  return finalResult;
};

// Helper function to evaluate decision nodes
const evaluateDecision = (node, input, memory) => {
  // In a real implementation, this would evaluate the condition
  // For now, return a simple boolean based on input length
  return typeof input === 'string' && input.length > 20;
};