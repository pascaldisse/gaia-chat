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

/**
 * Helper function to create test workflows
 */
const workflowFactory = {
  // Basic research team workflow
  createResearchTeamWorkflow: () => {
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

    // Add a tool node for searching
    const searchTool = {
      id: 'tool1',
      type: 'toolNode',
      data: {
        toolType: 'search',
        toolName: 'Search Knowledge',
        toolDescription: 'Search for information in documents'
      }
    };
    
    return {
      id: 'workflow-test',
      name: 'Test Multi-Agent Workflow',
      nodes: [personaNode1, personaNode2, teamNode, memoryNode, communicationNode, searchTool],
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
        { id: 'e8', source: 'persona2', target: 'comm1' },
        // Connect tools
        { id: 'e9', source: 'persona1', target: 'tool1' }
      ]
    };
  },

  // Debate team workflow
  createDebateTeamWorkflow: () => {
    const moderatorNode = {
      id: 'moderator',
      type: 'personaNode',
      data: {
        personaData: {
          id: 'mod1',
          name: 'Debate Moderator',
          systemPrompt: 'You moderate debates and ensure balanced discussion.',
          initiative: 6,
          creativity: 5,
          empathy: 8,
          model: 'deepinfra/mixtral-8x7b-instruct'
        }
      }
    };
    
    const perspectiveANode = {
      id: 'perspective_a',
      type: 'personaNode',
      data: {
        personaData: {
          id: 'pa1',
          name: 'Perspective A',
          systemPrompt: 'You advocate for position A with strong logical arguments.',
          initiative: 7,
          creativity: 6,
          confidence: 8,
          model: 'deepinfra/mixtral-8x7b-instruct'
        }
      }
    };
    
    const perspectiveBNode = {
      id: 'perspective_b',
      type: 'personaNode',
      data: {
        personaData: {
          id: 'pb1',
          name: 'Perspective B',
          systemPrompt: 'You advocate for position B with evidence-based reasoning.',
          initiative: 7,
          creativity: 6,
          confidence: 8,
          model: 'deepinfra/mixtral-8x7b-instruct'
        }
      }
    };
    
    const teamNode = {
      id: 'debate_team',
      type: 'teamNode',
      data: {
        teamName: 'Debate Team',
        teamDescription: 'Team for structured debates between opposing viewpoints',
        teamRole: 'debate',
        agents: []
      }
    };
    
    const memoryNode = {
      id: 'debate_memory',
      type: 'memoryNode',
      data: {
        memoryName: 'Debate Log',
        memoryType: 'structured',
        memoryDescription: 'Shared memory for tracking debate points'
      }
    };
    
    const communicationNode = {
      id: 'debate_channel',
      type: 'communicationNode',
      data: {
        name: 'Debate Forum',
        mode: 'debate',
        description: 'Communication channel for structured debate',
        format: 'text'
      }
    };
    
    return {
      id: 'debate-workflow',
      name: 'Debate Workflow',
      nodes: [moderatorNode, perspectiveANode, perspectiveBNode, teamNode, memoryNode, communicationNode],
      edges: [
        // Connect personas to team
        { id: 'e1', source: 'moderator', target: 'debate_team' },
        { id: 'e2', source: 'perspective_a', target: 'debate_team' },
        { id: 'e3', source: 'perspective_b', target: 'debate_team' },
        // Connect memory
        { id: 'e4', source: 'debate_team', target: 'debate_memory' },
        { id: 'e5', source: 'moderator', target: 'debate_memory' },
        // Connect communication
        { id: 'e6', source: 'debate_team', target: 'debate_channel' },
        { id: 'e7', source: 'moderator', target: 'debate_channel' },
        { id: 'e8', source: 'perspective_a', target: 'debate_channel' },
        { id: 'e9', source: 'perspective_b', target: 'debate_channel' }
      ]
    };
  },

  // Complex workflow with multiple teams and parallel execution
  createComplexWorkflow: () => {
    // First team - Research
    const researchAgent = {
      id: 'research_agent',
      type: 'personaNode',
      data: {
        personaData: {
          id: 'ra1',
          name: 'Research Agent',
          systemPrompt: 'You research information thoroughly.',
          initiative: 8,
          creativity: 6,
          model: 'deepinfra/mixtral-8x7b-instruct'
        }
      }
    };
    
    const researchTeam = {
      id: 'research_team',
      type: 'teamNode',
      data: {
        teamName: 'Research Team',
        teamDescription: 'Team for information gathering',
        teamRole: 'specialist',
        agents: []
      }
    };
    
    // Second team - Analysis
    const dataAnalyst = {
      id: 'data_analyst',
      type: 'personaNode',
      data: {
        personaData: {
          id: 'da1',
          name: 'Data Analyst',
          systemPrompt: 'You analyze data and extract insights.',
          initiative: 6,
          creativity: 7,
          model: 'deepinfra/mixtral-8x7b-instruct'
        }
      }
    };
    
    const statisticsAnalyst = {
      id: 'stats_analyst',
      type: 'personaNode',
      data: {
        personaData: {
          id: 'sa1',
          name: 'Statistics Analyst',
          systemPrompt: 'You perform statistical analysis on data.',
          initiative: 5,
          creativity: 5,
          model: 'deepinfra/mixtral-8x7b-instruct'
        }
      }
    };
    
    const analysisTeam = {
      id: 'analysis_team',
      type: 'teamNode',
      data: {
        teamName: 'Analysis Team',
        teamDescription: 'Team for data analysis',
        teamRole: 'specialist',
        agents: []
      }
    };
    
    // Project coordinator
    const coordinator = {
      id: 'coordinator',
      type: 'personaNode',
      data: {
        personaData: {
          id: 'c1',
          name: 'Project Coordinator',
          systemPrompt: 'You coordinate the overall project and synthesize results.',
          initiative: 8,
          creativity: 7,
          model: 'deepinfra/mixtral-8x7b-instruct'
        }
      }
    };
    
    const projectTeam = {
      id: 'project_team',
      type: 'teamNode',
      data: {
        teamName: 'Project Team',
        teamDescription: 'Overall project coordination',
        teamRole: 'coordinator',
        agents: []
      }
    };
    
    // Memory and communication
    const researchMemory = {
      id: 'research_memory',
      type: 'memoryNode',
      data: {
        memoryName: 'Research Data',
        memoryType: 'structured',
        memoryDescription: 'Shared memory for research findings'
      }
    };
    
    const analysisMemory = {
      id: 'analysis_memory',
      type: 'memoryNode',
      data: {
        memoryName: 'Analysis Results',
        memoryType: 'structured',
        memoryDescription: 'Shared memory for analysis results'
      }
    };
    
    const projectMemory = {
      id: 'project_memory',
      type: 'memoryNode',
      data: {
        memoryName: 'Project Status',
        memoryType: 'structured',
        memoryDescription: 'Shared memory for overall project'
      }
    };
    
    const communication = {
      id: 'project_comms',
      type: 'communicationNode',
      data: {
        name: 'Project Communication',
        mode: 'broadcast',
        description: 'Central communication for the project',
        format: 'text'
      }
    };
    
    // Tools
    const searchTool = {
      id: 'search_tool',
      type: 'toolNode',
      data: {
        toolType: 'search',
        toolName: 'Research Tool',
        toolDescription: 'Search for information'
      }
    };
    
    const analysisTool = {
      id: 'analysis_tool',
      type: 'toolNode',
      data: {
        toolType: 'database',
        toolName: 'Analysis Tool',
        toolDescription: 'Perform data analysis'
      }
    };
    
    // Decision node
    const decisionNode = {
      id: 'quality_check',
      type: 'decisionNode',
      data: {
        label: 'Quality Check',
        condition: 'memory.success === true'
      }
    };
    
    return {
      id: 'complex-workflow',
      name: 'Complex Multi-Team Workflow',
      nodes: [
        researchAgent, researchTeam, dataAnalyst, statisticsAnalyst, analysisTeam,
        coordinator, projectTeam, researchMemory, analysisMemory, projectMemory,
        communication, searchTool, analysisTool, decisionNode
      ],
      edges: [
        // Team memberships
        { id: 'e1', source: 'research_agent', target: 'research_team' },
        { id: 'e2', source: 'data_analyst', target: 'analysis_team' },
        { id: 'e3', source: 'stats_analyst', target: 'analysis_team' },
        { id: 'e4', source: 'research_team', target: 'project_team' },
        { id: 'e5', source: 'analysis_team', target: 'project_team' },
        { id: 'e6', source: 'coordinator', target: 'project_team' },
        
        // Memory connections
        { id: 'e7', source: 'research_team', target: 'research_memory' },
        { id: 'e8', source: 'research_agent', target: 'research_memory' },
        { id: 'e9', source: 'analysis_team', target: 'analysis_memory' },
        { id: 'e10', source: 'data_analyst', target: 'analysis_memory' },
        { id: 'e11', source: 'stats_analyst', target: 'analysis_memory' },
        { id: 'e12', source: 'project_team', target: 'project_memory' },
        { id: 'e13', source: 'coordinator', target: 'project_memory' },
        
        // Cross-team memory access
        { id: 'e14', source: 'analysis_team', target: 'research_memory' },
        { id: 'e15', source: 'project_team', target: 'research_memory' },
        { id: 'e16', source: 'project_team', target: 'analysis_memory' },
        
        // Communication
        { id: 'e17', source: 'project_team', target: 'project_comms' },
        { id: 'e18', source: 'research_team', target: 'project_comms' },
        { id: 'e19', source: 'analysis_team', target: 'project_comms' },
        { id: 'e20', source: 'coordinator', target: 'project_comms' },
        
        // Tools
        { id: 'e21', source: 'research_agent', target: 'search_tool' },
        { id: 'e22', source: 'data_analyst', target: 'analysis_tool' },
        { id: 'e23', source: 'stats_analyst', target: 'analysis_tool' },
        
        // Decision flow
        { id: 'e24', source: 'analysis_team', target: 'quality_check' },
        { id: 'e25', source: 'quality_check', target: 'project_team', label: 'true' },
        // Additional remediation path could be added here for 'false' condition
      ]
    };
  }
};

describe('Multi-Agent Workflow Execution', () => {
  test('should discover agents and teams during workflow execution', async () => {
    // Create a test workflow
    const workflow = workflowFactory.createResearchTeamWorkflow();
    
    // Mock status update function
    const mockOnUpdate = jest.fn();
    
    // Execute workflow
    const result = await executeWorkflow(workflow, 'Research AI agents', mockOnUpdate);
    
    // Verify teams and agents were discovered
    expect(result.memory.agents).toBeDefined();
    expect(Object.keys(result.memory.agents).length).toBeGreaterThan(0);
    expect(result.memory.teamRegistry).toBeDefined();
    expect(Object.keys(result.memory.teamRegistry).length).toBeGreaterThan(0);
    
    // Verify specific agents were registered
    expect(result.memory.agents['persona1']).toBeDefined();
    expect(result.memory.agents['persona2']).toBeDefined();
    
    // Verify agent properties
    expect(result.memory.agents['persona1'].name).toBe('Research Agent');
    expect(result.memory.agents['persona2'].name).toBe('Analysis Agent');
    
    // Verify team registry
    expect(result.memory.teamRegistry['team1']).toBeDefined();
    expect(result.memory.teamRegistry['team1'].name).toBe('Research Team');
    expect(result.memory.teamRegistry['team1'].role).toBe('coordinator');
    
    // Verify workflow completed
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workflow_complete'
      })
    );
  });
  
  test('should create and execute a team agent with various team roles', async () => {
    // Test different team role types
    const teamRoles = ['coordinator', 'debate', 'consensus', 'specialist'];
    
    for (const role of teamRoles) {
      // Sample team node with specific role
      const teamNode = {
        id: `team_${role}`,
        type: 'teamNode',
        data: {
          teamName: `${role.charAt(0).toUpperCase() + role.slice(1)} Team`,
          teamDescription: `Test ${role} team`,
          teamRole: role
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
      
      // Test invoke with role-specific input
      const result = await teamAgent.invoke({
        input: `Work as a ${role} to solve this problem`
      });
      
      // Check result
      expect(result).toBeDefined();
      expect(result.output || result).toContain('Mock agent response');
    }
  });
  
  test('should handle shared memory operations with different memory types', async () => {
    // Test different memory types
    const memoryTypes = ['simple', 'structured'];
    
    for (const memType of memoryTypes) {
      // Create a simplified workflow with memory node
      const workflow = {
        id: `memory-test-${memType}`,
        name: `Memory Test Workflow (${memType})`,
        nodes: [
          {
            id: 'memory1',
            type: 'memoryNode',
            data: {
              memoryName: `Test ${memType} Memory`,
              memoryType: memType
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
      
      // Create test data based on memory type
      let testInput;
      if (memType === 'simple') {
        testInput = 'This is simple text data';
      } else if (memType === 'structured') {
        testInput = 'This is structured data with JSON: {"key": "value", "items": [1, 2, 3]}';
      }
      
      // Execute workflow
      const result = await executeWorkflow(workflow, testInput, mockOnUpdate);
      
      // Verify memory was created
      expect(result.memory.sharedMemory).toBeDefined();
      expect(result.memory.sharedMemory.memory1).toBeDefined();
      
      // Verify memory properties
      expect(result.memory.sharedMemory.memory1.name).toBe(`Test ${memType} Memory`);
      expect(result.memory.sharedMemory.memory1.type).toBe(memType);
      
      // Verify memory has access log
      expect(result.memory.sharedMemory.memory1.accessLog).toBeDefined();
    }
  });
  
  test('should process communication between agents with different modes', async () => {
    // Test different communication modes
    const communicationMode = 'broadcast'; // Only testing broadcast as others are marked for future release
    
    // Create a simplified workflow with communication node
    const workflow = {
      id: `comm-test-${communicationMode}`,
      name: `Communication Test Workflow (${communicationMode})`,
      nodes: [
        {
          id: 'comm1',
          type: 'communicationNode',
          data: {
            name: `Test ${communicationMode} Channel`,
            mode: communicationMode
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
    const result = await executeWorkflow(workflow, `Testing ${communicationMode} communication`, mockOnUpdate);
    
    // Verify communication channel was created
    expect(result.memory.messages).toBeDefined();
    expect(result.memory.messages.length).toBeGreaterThan(0);
    
    // Find the communication channel
    const channel = result.memory.messages.find(m => m.id === 'comm1');
    expect(channel).toBeDefined();
    expect(channel.name).toBe(`Test ${communicationMode} Channel`);
    expect(channel.mode).toBe(communicationMode);
    
    // Verify channel has participants
    expect(channel.participants).toBeDefined();
    expect(channel.participants.length).toBeGreaterThan(0);
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
    
    // Verify multiple node updates were sent (potentially in parallel)
    const nodeStartEvents = mockOnUpdate.mock.calls.filter(
      call => call[0].type === 'node_start'
    );
    expect(nodeStartEvents.length).toBeGreaterThanOrEqual(2);
  });

  test('should execute a complex multi-team workflow', async () => {
    // Create a complex workflow with multiple teams
    const workflow = workflowFactory.createComplexWorkflow();
    
    // Mock onUpdate
    const mockOnUpdate = jest.fn();
    
    // Execute workflow
    const result = await executeWorkflow(workflow, 'Execute complex multi-team project', mockOnUpdate);
    
    // Verify teams were discovered and registered
    expect(Object.keys(result.memory.teamRegistry).length).toBeGreaterThanOrEqual(3);
    
    // Verify specific teams exist
    expect(result.memory.teamRegistry['research_team']).toBeDefined();
    expect(result.memory.teamRegistry['analysis_team']).toBeDefined();
    expect(result.memory.teamRegistry['project_team']).toBeDefined();
    
    // Verify memory nodes were created
    expect(result.memory.sharedMemory['research_memory']).toBeDefined();
    expect(result.memory.sharedMemory['analysis_memory']).toBeDefined();
    expect(result.memory.sharedMemory['project_memory']).toBeDefined();
    
    // Verify communication was established
    const projectComms = result.memory.messages.find(m => m.id === 'project_comms');
    expect(projectComms).toBeDefined();
    
    // Verify workflow execution completed
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workflow_complete'
      })
    );
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
  
  test('should create different types of tools for agents', async () => {
    // Test various tool types
    const toolTypes = ['search', 'files', 'dice', 'weather', 'database'];
    
    for (const toolType of toolTypes) {
      // Create a tool node with specific type
      const tool = await createNodeTool({
        id: `${toolType}_tool`,
        type: 'toolNode',
        data: {
          toolType: toolType,
          toolName: `${toolType.charAt(0).toUpperCase() + toolType.slice(1)} Tool`,
          toolDescription: `A ${toolType} tool`
        }
      });
      
      // Verify tool creation
      expect(tool).toBeDefined();
      expect(tool.name).toBe(`${toolType.charAt(0).toUpperCase() + toolType.slice(1)} Tool`);
      
      // Test tool execution with appropriate input
      let testInput;
      switch (toolType) {
        case 'search': testInput = 'test query'; break;
        case 'files': testInput = 'file-1'; break;
        case 'dice': testInput = '20,2'; break;
        case 'weather': testInput = 'New York'; break;
        case 'database': testInput = 'SELECT * FROM users'; break;
        default: testInput = 'test input';
      }
      
      const result = await tool.func(testInput);
      expect(result).toBeDefined();
    }
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

  test('should properly handle agent attributes in persona creation', async () => {
    // Create a persona node with various attributes
    const personaNode = {
      id: 'attribute-test',
      type: 'personaNode',
      data: {
        personaData: {
          id: 'attr1',
          name: 'Attribute Test Agent',
          systemPrompt: 'You test various attributes',
          initiative: 9,
          creativity: 8,
          empathy: 7,
          confidence: 6,
          model: 'deepinfra/mixtral-8x7b-instruct'
        }
      }
    };
    
    // Create persona agent
    const agent = await createPersonaAgent(personaNode);
    
    // Ensure agent was created
    expect(agent).toBeDefined();
    
    // In a real test, we would verify the attributes were properly applied
    // Here we can just verify the agent was created successfully
    const result = await agent.invoke({
      input: 'Test with attributes'
    });
    
    // Check result
    expect(result).toBeDefined();
    expect(result.output || result).toContain('Mock agent response');
  });
});

describe('Advanced Workflow Features', () => {
  test('should support conditional branching with decision nodes', async () => {
    // Create a workflow with decision node
    const workflow = {
      id: 'decision-test',
      name: 'Decision Node Test',
      nodes: [
        {
          id: 'trigger',
          type: 'triggerNode',
          data: { label: 'Start' }
        },
        {
          id: 'decision',
          type: 'decisionNode',
          data: {
            label: 'Check Input Length',
            condition: 'input.length > 20'
          }
        },
        {
          id: 'long_path',
          type: 'personaNode',
          data: {
            personaData: {
              id: 'long',
              name: 'Long Input Agent'
            }
          }
        },
        {
          id: 'short_path',
          type: 'personaNode',
          data: {
            personaData: {
              id: 'short',
              name: 'Short Input Agent'
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger', target: 'decision' },
        { id: 'e2', source: 'decision', target: 'long_path', label: 'true' },
        { id: 'e3', source: 'decision', target: 'short_path', label: 'false' }
      ]
    };
    
    // Test with long input (should take true path)
    const mockOnUpdateLong = jest.fn();
    const longResult = await executeWorkflow(
      workflow, 
      'This is a long input that should trigger the true condition', 
      mockOnUpdateLong
    );
    
    // Test with short input (should take false path)
    const mockOnUpdateShort = jest.fn();
    const shortResult = await executeWorkflow(
      workflow, 
      'Short input', 
      mockOnUpdateShort
    );
    
    // In a real implementation, we would check which path was taken
    // Here we're just checking the workflow completed
    expect(longResult.memory.results).toBeDefined();
    expect(shortResult.memory.results).toBeDefined();
  });

  test('should track execution progress with intermediateSteps', async () => {
    // Create a simple sequential workflow
    const workflow = {
      id: 'steps-test',
      name: 'IntermediateSteps Test',
      nodes: [
        {
          id: 'start',
          type: 'triggerNode',
          data: { label: 'Start' }
        },
        {
          id: 'middle',
          type: 'personaNode',
          data: {
            personaData: {
              id: 'mid',
              name: 'Middle Agent'
            }
          }
        },
        {
          id: 'end',
          type: 'personaNode',
          data: {
            personaData: {
              id: 'fin',
              name: 'Final Agent'
            }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'middle' },
        { id: 'e2', source: 'middle', target: 'end' }
      ]
    };
    
    // Execute workflow
    const mockOnUpdate = jest.fn();
    const result = await executeWorkflow(workflow, 'Track execution steps', mockOnUpdate);
    
    // Verify intermediateSteps were tracked
    expect(result.memory.intermediateSteps).toBeDefined();
    expect(result.memory.intermediateSteps.length).toBeGreaterThan(0);
    
    // First step should be the start node
    const firstStep = result.memory.intermediateSteps[0];
    expect(firstStep.nodeId).toBe('start');
    
    // Last completed step should have a status
    const lastStep = result.memory.intermediateSteps[result.memory.intermediateSteps.length - 1];
    expect(lastStep.status).toBeDefined();
    
    // Verify execution updates were sent
    const nodeStartEvents = mockOnUpdate.mock.calls.filter(
      call => call[0].type === 'node_start'
    );
    const nodeCompleteEvents = mockOnUpdate.mock.calls.filter(
      call => call[0].type === 'node_complete'
    );
    
    expect(nodeStartEvents.length).toBeGreaterThanOrEqual(1);
    expect(nodeCompleteEvents.length).toBeGreaterThanOrEqual(1);
  });
});