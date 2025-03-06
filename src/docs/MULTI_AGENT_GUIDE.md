# Multi-Agent Workflow Guide

This guide will help you create and configure collaborative multi-agent workflows in Gaia.

## Getting Started

### Creating Your First Team Workflow

1. Open the Agent Workflow editor from the main navigation menu.
2. Drag persona nodes onto the canvas for each individual agent you want.
3. Configure each persona by clicking on it and selecting appropriate personas.
4. Drag a team node onto the canvas.
5. Connect your persona nodes to the team node.
6. Click on the team node to configure the team settings.

### Team Configuration

When configuring a team, you'll need to:
- Set a descriptive team name
- Choose a team role/type (coordinator, debate, consensus, specialist)
- Select which agents should be part of the team
- Optionally provide a detailed description of the team's purpose

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

### Communication Channels

Communication nodes enable structured message passing between agents:

1. Drag a communication node onto the canvas.
2. Connect it to the agents or teams that should communicate through it.
3. Choose a communication mode:
   - Broadcast: Messages sent to all participants
   - Peer-to-peer: Direct communication between agents
   - Round-robin: Sequential communication in turns
   - Debate-style: Structured back-and-forth exchange

## Advanced Team Configurations

### Coordinator Teams

Best for task distribution and management:
- Connect specialist agents to a coordinator team
- Use memory nodes to share task results
- Connect communication nodes for status updates

### Debate Teams

Ideal for exploring multiple perspectives:
- Connect agents with contrasting viewpoints to a debate team
- Use a communication node with 'debate' mode
- Add a memory node to store key points and decisions

### Consensus Teams

Perfect for collaborative decision making:
- Connect stakeholder agents to a consensus team
- Use memory nodes to store agreements
- Use communication nodes to facilitate discussion

### Specialist Teams

Great for complex problem-solving:
- Connect domain expert agents to a specialist team
- Use memory nodes to share specialized knowledge
- Connect appropriate tools to each specialist agent

## Best Practices

1. **Clear Agent Roles**: Give each agent a specific and well-defined role.
2. **Streamlined Communication**: Only connect necessary communication channels.
3. **Efficient Memory Usage**: Be selective about what data is stored in memory.
4. **Appropriate Team Type**: Choose the team type that best matches your workflow's goal.
5. **Tool Selection**: Provide each agent with only the tools they need.
6. **Testing**: Start with simple workflows and gradually add complexity.

## Troubleshooting

### Common Issues

- **Agents not collaborating**: Ensure the team node is properly configured and all agents are connected.
- **Memory access problems**: Check that memory nodes are connected to both reading and writing agents.
- **Communication failures**: Verify communication node connections and mode settings.
- **Execution errors**: Check the workflow logs for specific node failures.

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
├── Analysis Agent (PersonaNode)
├── Summary Agent (PersonaNode)
├── Research Team (TeamNode)
├── Research Memory (MemoryNode)
└── Team Chat (CommunicationNode)
```

### Debate Analysis

```
Workflow: Debate Analysis
├── Perspective A Agent (PersonaNode)
├── Perspective B Agent (PersonaNode)
├── Moderator Agent (PersonaNode)
├── Debate Team (TeamNode)
├── Arguments Memory (MemoryNode)
└── Debate Channel (CommunicationNode)
```

### Data Processing Pipeline

```
Workflow: Data Processing Pipeline
├── Data Preparation Agent (PersonaNode)
├── Analysis Agent (PersonaNode)
├── Visualization Agent (PersonaNode)
├── Pipeline Team (TeamNode)
├── Data Memory (MemoryNode)
└── Pipeline Communication (CommunicationNode)
```

## Advanced Features

### Parallel Execution

Multi-agent workflows support parallel execution of compatible paths, allowing multiple agents to work simultaneously on different tasks.

### Conditional Flows

Use decision nodes to create branching logic based on agent outputs or memory states.

### Dynamic Team Composition

Teams can be reconfigured during workflow execution based on the complexity and requirements of the task.

---

For more detailed technical information, please refer to the [Multi-Agent Workflow System](MULTI_AGENT_WORKFLOW.md) documentation.