# Multi-Agent Workflow Guide

This guide will help you create and configure collaborative multi-agent workflows in Gaia. Multi-agent workflows enable AI agents to work together, share information, and solve complex problems more effectively than individual agents.

## Getting Started

### Creating Your First Team Workflow

1. Open the Agent Workflow editor from the main navigation menu.
2. Drag persona nodes onto the canvas for each individual agent you want.
3. Configure each persona by clicking on it and selecting appropriate personas.
4. Drag a team node onto the canvas.
5. Connect your persona nodes to the team node.
6. Click on the team node to configure the team settings.
7. Add any required memory or communication nodes.
8. Connect everything and save your workflow.

### Step-by-Step Tutorial: Research Team

Let's create a simple research team workflow:

1. **Create Individual Agents**:
   - Add a "Research Agent" persona node (configure with high initiative and curiosity)
   - Add an "Analysis Agent" persona node (configure with high logical thinking)
   - Add a "Summary Agent" persona node (configure with high conciseness and clarity)

2. **Create Team Structure**:
   - Add a "Research Team" team node
   - Configure as "coordinator" type
   - Connect all three persona nodes to the team node

3. **Add Shared Memory**:
   - Add a "Research Data" memory node (configure as "structured" type)
   - Connect both the Research Agent and Analysis Agent to the memory node

4. **Add Communication**:
   - Add a "Team Chat" communication node (configure as "broadcast" mode)
   - Connect all agents and the team node to the communication channel

5. **Save and Test**: Run the workflow with an initial research question

### Team Configuration

When configuring a team, you'll need to:
- Set a descriptive team name
- Choose a team role/type (coordinator, debate, consensus, specialist)
- Select which agents should be part of the team
- Optionally provide a detailed description of the team's purpose

#### Choosing the Right Team Type

| Team Type | Best For | Example Use Case |
|-----------|----------|------------------|
| Coordinator | Task distribution | Research project with multiple sub-tasks |
| Debate | Exploring opposing views | Policy analysis with pros and cons |
| Consensus | Finding agreement | Requirements gathering with stakeholders |
| Specialist | Complex problem-solving | Technical issue requiring multiple experts |

## Using Memory and Communication

### Shared Memory

Memory nodes allow agents to share information and persist state throughout the workflow:

1. Drag a memory node onto the canvas.
2. Connect it to the agents or teams that should access the memory.
3. Configure the memory type based on your needs:
   - Simple: Basic key-value storage
   - Structured: JSON-based storage for complex data
   - Vector: For semantic information and embeddings
   - Persistent: For data that persists between workflow runs

#### Memory Access Patterns

For optimal workflow performance, consider these memory access patterns:

- **Read-Write**: Connect agents to memory with bidirectional connections for full access
- **Read-Only**: Connect agents to memory with incoming connections only
- **Write-Only**: Connect agents to memory with outgoing connections only

### Communication Channels

Communication nodes enable structured message passing between agents:

1. Drag a communication node onto the canvas.
2. Connect it to the agents or teams that should communicate through it.
3. Choose a communication mode:
   - Broadcast: Messages sent to all participants
   - Peer-to-peer: Direct communication between agents
   - Round-robin: Sequential communication in turns
   - Debate-style: Structured back-and-forth exchange

#### Communication Best Practices

- **Clear Channel Naming**: Use descriptive names like "research-coordination" or "design-feedback"
- **Focused Channels**: Create separate channels for different topics or teams
- **Structured Messages**: Encourage agents to use consistent message formats

## Advanced Team Configurations

### Coordinator Teams

Best for task distribution and management:
- Connect specialist agents to a coordinator team
- Use memory nodes to share task results
- Connect communication nodes for status updates

**Example Implementation**:
```javascript
// Team coordinator prompt
const coordinatorPrompt = `You are a coordinator for a team of specialists. 
Your role is to break down problems, assign tasks, and synthesize results.

Current team members:
${teamMemberDescriptions}

Follow this process:
1. Analyze the input problem
2. Break it down into specific tasks
3. Assign tasks to appropriate specialists
4. Collect and integrate results
5. Provide a comprehensive answer`;
```

### Debate Teams

Ideal for exploring multiple perspectives:
- Connect agents with contrasting viewpoints to a debate team
- Use a communication node with 'debate' mode
- Add a memory node to store key points and decisions

**Example Implementation**:
```javascript
// Debate team prompt
const debatePrompt = `You are moderating a debate between different perspectives.
Your role is to ensure fair representation of all viewpoints and guide toward reasoned conclusions.

Debate participants:
${teamMemberDescriptions}

Follow this process:
1. Present the topic to be debated
2. Ask each participant for their initial position
3. Facilitate structured back-and-forth discussion
4. Identify key agreements and disagreements
5. Guide toward synthesis or reasoned conclusion`;
```

### Consensus Teams

Perfect for collaborative decision making:
- Connect stakeholder agents to a consensus team
- Use memory nodes to store agreements
- Use communication nodes to facilitate discussion

**Example Implementation**:
```javascript
// Consensus team prompt
const consensusPrompt = `You are building consensus among multiple stakeholders.
Your role is to identify common ground and help the team reach shared understanding.

Team members:
${teamMemberDescriptions}

Follow this process:
1. Clarify the issue requiring consensus
2. Gather input from all stakeholders
3. Identify areas of agreement and disagreement
4. Facilitate discussion to bridge differences
5. Document and confirm the consensus position`;
```

### Specialist Teams

Great for complex problem-solving:
- Connect domain expert agents to a specialist team
- Use memory nodes to share specialized knowledge
- Connect appropriate tools to each specialist agent

**Example Implementation**:
```javascript
// Specialist team prompt
const specialistPrompt = `You are coordinating a team of specialists with different expertise.
Your role is to integrate specialized knowledge to solve complex problems.

Team specialists:
${teamMemberDescriptions}

Follow this process:
1. Analyze the problem requiring multiple domains of expertise
2. Identify which aspects require which specialist
3. Collect specialized analysis from each team member
4. Integrate the specialized insights
5. Present a comprehensive solution`;
```

## Tools for Multi-Agent Workflows

### Memory Tools

Multi-agent workflows provide specialized memory tools for agents to share information:

```javascript
// Read from memory example
await memoryTool.func('read:research_data:');

// Write to memory example
await memoryTool.func('write:research_data:{"findings":["X causes Y","Y affects Z"]}');
```

### Communication Tools

Agents can communicate with each other using communication tools:

```javascript
// Send message to team example
await messageTool.func('team_channel:I've discovered an important correlation between X and Y');

// Read recent messages
const recentMessages = channel.messages.slice(-5);
```

### File Access Tools

Teams can collaboratively work with shared files:

```javascript
// Access shared files
await fileAccessTool.func('research_report.txt');
```

## Best Practices

1. **Clear Agent Roles**: Give each agent a specific and well-defined role.
   - Example: "Research Agent focuses on finding information, not analyzing it"

2. **Streamlined Communication**: Only connect necessary communication channels.
   - Good: One channel for team coordination, one for data sharing
   - Bad: Every agent connected to every channel

3. **Efficient Memory Usage**: Be selective about what data is stored in memory.
   - Store processed/summarized data rather than raw dumps
   - Clean up unused data from memory

4. **Appropriate Team Type**: Choose the team type that best matches your workflow's goal.
   - Use coordinator teams for complex multi-stage tasks
   - Use debate teams for evaluating options

5. **Tool Selection**: Provide each agent with only the tools they need.
   - Research agents need search tools
   - Analysis agents need data processing tools
   - Don't overwhelm agents with irrelevant tools

6. **Testing**: Start with simple workflows and gradually add complexity.
   - Test with 2-3 agents before scaling to larger teams
   - Verify communication and memory sharing work as expected

7. **Execution Monitoring**: Monitor workflow execution to identify bottlenecks or issues.
   - Watch for agents that take too long to respond
   - Check if memory is being utilized appropriately

## Troubleshooting

### Common Issues

- **Agents not collaborating**: Ensure the team node is properly configured and all agents are connected.
  - Solution: Check team configuration and verify all connections

- **Memory access problems**: Check that memory nodes are connected to both reading and writing agents.
  - Solution: Verify bidirectional connections for agents that need to read and write

- **Communication failures**: Verify communication node connections and mode settings.
  - Solution: Check that all intended participants are connected to the channel

- **Execution errors**: Check the workflow logs for specific node failures.
  - Solution: Look for error messages in the node execution steps

### Performance Optimization

- Limit the number of agents in a single workflow (3-5 agents is optimal for most use cases).
- Use structured data in memory nodes to reduce parsing overhead.
- Configure appropriate communication modes to reduce unnecessary message passing.
- For complex workflows, break them into separate sub-workflows when possible.

## Example Workflows

### Research Assistant Team

```
Workflow: Research Assistant Team
├── Research Agent (PersonaNode)
│   └── Web Search Tool (ToolNode)
├── Analysis Agent (PersonaNode)
│   └── Data Analysis Tool (ToolNode)
├── Summary Agent (PersonaNode)
├── Research Team (TeamNode)
├── Research Memory (MemoryNode)
└── Team Chat (CommunicationNode)
```

**Execution Flow**:
1. User submits research question
2. Research Agent searches for information
3. Research Agent writes findings to shared memory
4. Analysis Agent reads memory and performs analysis
5. Analysis Agent writes analysis to memory
6. Summary Agent reads memory and creates summary
7. Research Team coordinates and delivers final report

### Debate Analysis

```
Workflow: Debate Analysis
├── Perspective A Agent (PersonaNode)
├── Perspective B Agent (PersonaNode)
├── Moderator Agent (PersonaNode)
├── Debate Team (TeamNode)
├── Arguments Memory (MemoryNode)
├── Debate Channel (CommunicationNode)
└── Decision Node (DecisionNode)
```

**Execution Flow**:
1. User submits topic for debate
2. Moderator introduces topic in debate channel
3. Perspective agents present initial positions
4. Moderator facilitates back-and-forth exchange
5. Key points are stored in arguments memory
6. Decision node evaluates if consensus is possible
7. Debate Team delivers final analysis with key perspectives

### Data Processing Pipeline

```
Workflow: Data Processing Pipeline
├── Data Preparation Agent (PersonaNode)
│   └── Data Cleaning Tool (ToolNode)
├── Analysis Agent (PersonaNode)
│   └── Statistical Analysis Tool (ToolNode)
├── Visualization Agent (PersonaNode)
│   └── Chart Generation Tool (ToolNode)
├── Pipeline Team (TeamNode)
├── Raw Data (FileNode)
├── Processed Data Memory (MemoryNode)
└── Pipeline Communication (CommunicationNode)
```

**Execution Flow**:
1. User provides data input
2. Data Preparation Agent cleans and preprocesses data
3. Prepared data stored in memory
4. Analysis Agent performs statistical analysis
5. Analysis results stored in memory
6. Visualization Agent creates charts and visualizations
7. Pipeline Team coordinates and delivers final report

## Advanced Features

### Parallel Execution

Multi-agent workflows support parallel execution of compatible paths, allowing multiple agents to work simultaneously on different tasks.

**Implementation Example**:
```
Workflow with parallel paths:
├── Starting Node
│   ├── Path A (executed in parallel)
│   │   ├── Agent A1
│   │   └── Agent A2
│   └── Path B (executed in parallel)
│       ├── Agent B1
│       └── Agent B2
└── Final Synthesis Node
```

### Conditional Flows

Use decision nodes to create branching logic based on agent outputs or memory states.

**Implementation Example**:
```
Workflow with conditional paths:
├── Starting Node
├── Initial Analysis Agent
├── Decision Node (condition: analysis.confidence > 0.8)
│   ├── High Confidence Path (if true)
│   │   └── Finalization Agent
│   └── Low Confidence Path (if false)
│       ├── Additional Research Agent
│       └── Verification Agent
└── Final Output Node
```

### Dynamic Team Composition

Teams can be reconfigured during workflow execution based on the complexity and requirements of the task.

**Coming in Future Releases**:
- Dynamic agent recruitment based on task needs
- Adaptive team structures
- Self-organizing agent teams

## Tutorial: Building an AI Research Team

Here's a complete example for building a research team workflow:

1. **Create the base workflow**
   - Add a trigger node as the starting point
   - Add three persona nodes for different research functions
   - Add a team node to coordinate them

2. **Configure the personas**
   - Research Agent: High initiative, curious, focused on information gathering
   - Analysis Agent: Logical, analytical, focused on data processing
   - Summary Agent: Clear communication, concise, focused on reporting

3. **Configure the team**
   - Set team type to "Coordinator"
   - Set team name to "Research Team"
   - Connect all persona nodes to the team node

4. **Add memory and communication**
   - Add a "Research Data" memory node (structured type)
   - Add a "Team Communication" channel (broadcast mode)
   - Connect all nodes appropriately

5. **Add tools**
   - Add search tool for the Research Agent
   - Add analysis tools for the Analysis Agent
   - Connect tools to the appropriate agents

6. **Test the workflow**
   - Start with a simple research question
   - Monitor execution and agent interactions
   - Review the final output

---

For more detailed technical information, please refer to the [Multi-Agent Workflow System](MULTI_AGENT_WORKFLOW.md) documentation.