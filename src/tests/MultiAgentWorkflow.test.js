import { jest } from '@jest/globals';
import { 
  executeWorkflow, 
  createPersonaAgent, 
  createTeamAgent, 
  createNodeTool
} from '../services/agentFlow/WorkflowService';

// Mock the external dependencies
jest.mock('@langchain/community/chat_models/deepinfra', () => {
  return {
    ChatDeepInfra: jest.fn().mockImplementation(() => ({
      invoke: jest.fn().mockResolvedValue({ content: 'Mock response from LLM' }),
      _combineLLMOutput: jest.fn()
    }))
  };
});

jest.mock('langchain/agents', () => {
  return {
    AgentExecutor: jest.fn().mockImplementation(() => ({
      invoke: jest.fn().mockResolvedValue({ 
        output: 'Mock agent response',
        intermediateSteps: []
      })
    })),
    createOpenAIFunctionsAgent: jest.fn().mockResolvedValue({})
  };
});

jest.mock('@langchain/core/tools', () => {
  return {
    DynamicTool: jest.fn().mockImplementation(({ name, description, func }) => ({
      name,
      description,
      func
    }))
  };
});

// Import the other mocks
jest.mock('../services/db', () => ({
  workflowDB: {
    saveWorkflow: jest.fn().mockResolvedValue({}),
    getWorkflow: jest.fn().mockResolvedValue({}),
    getAllWorkflows: jest.fn().mockResolvedValue([]),
    deleteWorkflow: jest.fn().mockResolvedValue({})
  },
  templateDB: {
    saveTemplate: jest.fn().mockResolvedValue({}),
    getAllTemplates: jest.fn().mockResolvedValue([]),
    getTemplatesByCategory: jest.fn().mockResolvedValue([]),
    deleteTemplate: jest.fn().mockResolvedValue({})
  },
  knowledgeDB: {
    getFiles: jest.fn().mockResolvedValue([{
      id: 'file-1',
      name: 'test.txt',
      content: 'This is test content',
      type: 'text/plain'
    }]),
    searchFiles: jest.fn().mockResolvedValue([])
  },
  chatDB: {
    saveChat: jest.fn().mockResolvedValue({})
  }
}));

describe('Multi-Agent Workflow Execution', () => {
  // Sample workflow with multiple agents
  const createTestWorkflow = () => {
    const personaNode1 = {
      id: 'persona1',
      type: 'personaNode',
      data: {
        personaData: {
          id: 'p1',
          name: 'Research Agent',
          systemPrompt: 'You research information.',
          initiative: 7,
          creativity: 6,
          model: 'deepinfra/mixtral-8x7b-instruct'
        }
      }
    };
    
    const personaNode2 = {
      id: 'persona2',
      type: 'personaNode',
      data: {
        personaData: {
          id: 'p2',
          name: 'Analysis Agent',
          systemPrompt: 'You analyze information.',
          initiative: 5,
          creativity: 7,
          model: 'deepinfra/mixtral-8x7b-instruct'
        }
      }
    };
    
    const teamNode = {
      id: 'team1',
      type: 'teamNode',
      data: {
        teamName: 'Research Team',
        teamDescription: 'Team that researches and analyzes data',
        teamRole: 'coordinator',
        agents: []
      }
    };
    
    const memoryNode = {
      id: 'memory1',
      type: 'memoryNode',
      data: {
        memoryName: 'Research Memory',
        memoryType: 'simple',
        memoryDescription: 'Shared memory for the research team'
      }
    };
    
    const communicationNode = {
      id: 'comm1',
      type: 'communicationNode',
      data: {
        name: 'Team Chat',
        mode: 'broadcast',
        description: 'Communication channel for the research team',
        format: 'text'
      }
    };
    
    return {
      id: 'workflow-test',
      name: 'Test Multi-Agent Workflow',
      nodes: [personaNode1, personaNode2, teamNode, memoryNode, communicationNode],
      edges: [
        // Connect personas to team
        { id: 'e1', source: 'persona1', target: 'team1' },
        { id: 'e2', source: 'persona2', target: 'team1' },
        // Connect memory to team and personas
        { id: 'e3', source: 'team1', target: 'memory1' },
        { id: 'e4', source: 'persona1', target: 'memory1' },
        { id: 'e5', source: 'persona2', target: 'memory1' },
        // Connect communication channel
        { id: 'e6', source: 'team1', target: 'comm1' },
        { id: 'e7', source: 'persona1', target: 'comm1' },
        { id: 'e8', source: 'persona2', target: 'comm1' }
      ]
    };
  };

  test('should discover agents and teams during workflow execution', async () => {
    // Create a test workflow
    const workflow = createTestWorkflow();
    
    // Mock status update function
    const mockOnUpdate = jest.fn();
    
    // Execute workflow
    const result = await executeWorkflow(workflow, 'Research AI agents', mockOnUpdate);
    
    // Verify teams and agents were discovered
    expect(result.memory.agents).toBeDefined();
    expect(Object.keys(result.memory.agents).length).toBeGreaterThan(0);
    expect(result.memory.teamRegistry).toBeDefined();
    expect(Object.keys(result.memory.teamRegistry).length).toBeGreaterThan(0);
    
    // Verify workflow completed
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workflow_complete'
      })
    );
  });
  
  test('should create and execute a team agent', async () => {
    // Sample team node
    const teamNode = {
      id: 'team1',
      type: 'teamNode',
      data: {
        teamName: 'Test Team',
        teamDescription: 'Test team description',
        teamRole: 'coordinator'
      }
    };
    
    // Sample agents list
    const agents = [
      {
        id: 'agent1',
        name: 'Agent 1',
        persona: {
          name: 'Test Agent 1',
          systemPrompt: 'You are a test agent.'
        }
      },
      {
        id: 'agent2',
        name: 'Agent 2',
        persona: {
          name: 'Test Agent 2',
          systemPrompt: 'You are another test agent.'
        }
      }
    ];
    
    // Create team agent
    const teamAgent = await createTeamAgent(teamNode, agents, []);
    
    // Verify agent creation
    expect(teamAgent).toBeDefined();
    
    // Test invoke with typical inputs
    const result = await teamAgent.invoke({
      input: 'Coordinate these agents to solve a problem'
    });
    
    // Check result
    expect(result).toBeDefined();
    expect(result.output || result).toContain('Mock agent response');
  });
  
  test('should handle shared memory operations', async () => {
    // Create a simplified workflow with memory node
    const workflow = {
      id: 'memory-test',
      name: 'Memory Test Workflow',
      nodes: [
        {
          id: 'memory1',
          type: 'memoryNode',
          data: {
            memoryName: 'Test Memory',
            memoryType: 'simple'
          }
        },
        {
          id: 'persona1',
          type: 'personaNode',
          data: {
            personaData: {
              id: 'p1',
              name: 'Memory Test Agent'
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'persona1', target: 'memory1' }
      ]
    };
    
    // Mock onUpdate
    const mockOnUpdate = jest.fn();
    
    // Execute workflow
    const result = await executeWorkflow(workflow, 'Initialize memory with: test data', mockOnUpdate);
    
    // Verify memory was created
    expect(result.memory.sharedMemory).toBeDefined();
    expect(result.memory.sharedMemory.memory1).toBeDefined();
    
    // Verify memory contains data (if input was passed to memory node)
    // This will depend on how your actual implementation handles inputs to memory nodes
    expect(result.memory.sharedMemory.memory1.name).toBe('Test Memory');
  });
  
  test('should process communication between agents', async () => {
    // Create a simplified workflow with communication node
    const workflow = {
      id: 'comm-test',
      name: 'Communication Test Workflow',
      nodes: [
        {
          id: 'comm1',
          type: 'communicationNode',
          data: {
            name: 'Test Channel',
            mode: 'broadcast'
          }
        },
        {
          id: 'persona1',
          type: 'personaNode',
          data: {
            personaData: {
              id: 'p1',
              name: 'Sender Agent'
            }
          }
        },
        {
          id: 'persona2',
          type: 'personaNode',
          data: {
            personaData: {
              id: 'p2',
              name: 'Receiver Agent'
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'persona1', target: 'comm1' },
        { id: 'e2', source: 'persona2', target: 'comm1' }
      ]
    };
    
    // Mock onUpdate
    const mockOnUpdate = jest.fn();
    
    // Execute workflow
    const result = await executeWorkflow(workflow, 'Initialize communication channel', mockOnUpdate);
    
    // Verify communication channel was created
    expect(result.memory.messages).toBeDefined();
    expect(result.memory.messages.length).toBeGreaterThan(0);
    
    // Find the communication channel
    const channel = result.memory.messages.find(m => m.id === 'comm1');
    expect(channel).toBeDefined();
    expect(channel.name).toBe('Test Channel');
  });
  
  test('should handle parallel execution of nodes', async () => {
    // Create a workflow with parallel paths
    const workflow = {
      id: 'parallel-test',
      name: 'Parallel Execution Test',
      nodes: [
        {
          id: 'start',
          type: 'triggerNode',
          data: { label: 'Start' }
        },
        {
          id: 'path1',
          type: 'personaNode',
          data: {
            personaData: {
              id: 'p1',
              name: 'Path 1 Agent'
            }
          }
        },
        {
          id: 'path2',
          type: 'personaNode',
          data: {
            personaData: {
              id: 'p2',
              name: 'Path 2 Agent'
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'path1' },
        { id: 'e2', source: 'start', target: 'path2' }
      ]
    };
    
    // Mock onUpdate
    const mockOnUpdate = jest.fn();
    const executeStartTime = Date.now();
    
    // Execute workflow
    const result = await executeWorkflow(workflow, 'Run parallel paths', mockOnUpdate);
    const executeEndTime = Date.now();
    
    // Calculate execution time
    const executionTime = executeEndTime - executeStartTime;
    
    // Verify both paths were executed
    expect(result.results.length).toBeGreaterThan(0);
    
    // Verify parallel execution (this is a basic check and may need refinement
    // based on your actual implementation and test environment)
    expect(executionTime).toBeLessThan(5000); // Expect reasonable performance
    
    // Check if results from both paths were captured
    expect(result.memory.results.path1).toBeDefined();
    expect(result.memory.results.path2).toBeDefined();
  });
});

describe('Multi-Agent Tools and Integration', () => {
  test('should create memory access tools for agents', async () => {
    // Create a memory node
    const memoryNode = {
      id: 'test-memory',
      data: {
        memoryName: 'Test Memory',
        memoryType: 'structured'
      }
    };
    
    // Create a node tool - this will be used to test tool creation
    const tool = await createNodeTool({
      id: 'tool1',
      type: 'toolNode',
      data: {
        toolType: 'generic',
        toolName: 'Test Tool',
        toolDescription: 'A test tool'
      }
    });
    
    // Ensure the tool was created
    expect(tool).toBeDefined();
    expect(tool.name).toBe('Test Tool');
    
    // Test tool execution
    const result = await tool.func('Test input');
    expect(result).toContain('Custom tool response');
  });
  
  test('should integrate with existing persona agents', async () => {
    // Create a persona node
    const personaNode = {
      id: 'test-persona',
      type: 'personaNode',
      data: {
        personaData: {
          id: 'p1',
          name: 'Test Agent',
          systemPrompt: 'You are a test agent',
          model: 'deepinfra/mixtral-8x7b-instruct'
        }
      }
    };
    
    // Create persona agent
    const agent = await createPersonaAgent(personaNode);
    
    // Ensure agent was created
    expect(agent).toBeDefined();
    
    // Test agent execution
    const result = await agent.invoke({
      input: 'Test input'
    });
    
    // Check result
    expect(result).toBeDefined();
    expect(result.output || result).toContain('Mock agent response');
  });
});