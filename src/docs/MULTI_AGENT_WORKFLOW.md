# Multi-Agent Workflow System

This document describes the multi-agent workflow system within Gaia, which allows multiple AI agents to collaborate, share information, and work together to accomplish tasks.

## Overview

The multi-agent workflow extends Gaia's existing agent workflow capabilities by enabling:

1. **Team-based collaboration** - Multiple agents working together in defined team structures
2. **Shared memory** - Persistent state that multiple agents can read and write to
3. **Communication channels** - Structured messaging between agents
4. **Parallel execution** - Concurrent processing of compatible workflow paths

## Core Components

### Agent Types

- **Individual Agents (PersonaNode)**: Single agents with specific personas, capabilities, and tools
- **Team Agents (TeamNode)**: Coordinating agents that manage multiple individual agents
  - Role types: coordinator, debate, consensus, specialist

### Memory & State

- **Memory Nodes**: Shared state containers that agents can read from and write to
  - Types: simple, structured, vector, persistent
  - Allows agents to share context, exchange information, and maintain conversation history

### Communication

- **Communication Nodes**: Message passing infrastructure
  - Modes: broadcast, peer-to-peer, round-robin, debate-style
  - Messages are persisted throughout the workflow execution
  - Enables conversational multi-agent scenarios

## Team Configurations

### Coordinator Teams

A coordinator team manages task delegation and collaboration between agents. Useful for:
- Breaking down complex tasks that require multiple experts
- Project management workflows
- Orchestrating complex multi-step processes

Example setup:
```
Coordinator Agent
├── Research Agent
├── Analysis Agent
└── Reporting Agent
```

### Debate Teams

Debate teams present multiple perspectives and arguments, helping reach reasoned conclusions. Useful for:
- Decision making processes
- Evaluating pros and cons
- Challenging assumptions

Example setup:
```
Debate Facilitator
├── Position A Agent
└── Position B Agent
```

### Consensus Teams

Consensus teams identify common ground and work toward mutual agreement. Useful for:
- Requirements gathering
- Policy development
- Conflict resolution

Example setup:
```
Consensus Builder
├── Stakeholder Agent 1
├── Stakeholder Agent 2
└── Stakeholder Agent 3
```

### Specialist Teams

Specialist teams integrate different domains of expertise. Useful for:
- Multi-disciplinary problem solving
- Complex data analysis
- Creative collaboration

Example setup:
```
Specialist Coordinator
├── Technical Expert
├── Design Expert
└── Business Expert
```

## Memory Types

### Simple Memory

Basic key-value storage for simple data sharing between agents.

### Structured Memory

JSON-based storage for complex data structures, allowing agents to share structured information.

### Vector Memory

Specialized memory for storing embeddings and semantic information, useful for agents working with semantic reasoning.

### Persistent Memory

Long-term storage that persists between workflow executions, enabling continuity across multiple runs.

## Communication Modes

### Broadcast

Messages sent to all agents in the channel. Useful for announcements and shared information.

### Peer-to-Peer (P2P)

Direct communication between two agents. Useful for specialized exchanges.

### Round Robin

Sequential communication where each agent takes turns responding. Useful for gathering input from every team member.

### Debate Style

Structured back-and-forth between agents with opposing views. Useful for exploring different perspectives.

## Building Multi-Agent Workflows

### Basic Team Workflow

1. Add PersonaNodes for individual agents
2. Add a TeamNode to coordinate them
3. Connect PersonaNodes to the TeamNode
4. Add MemoryNode for shared state
5. Add CommunicationNode for agent messaging
6. Connect the nodes as needed
7. Execute the workflow

### Advanced Multi-Team Setup

For complex scenarios, you can create multiple teams that interact:

1. Create Team A and Team B with their respective agents
2. Add shared MemoryNodes for cross-team data
3. Create CommunicationNodes for inter-team communication
4. Connect teams, memory, and communication nodes
5. Define the execution flow between teams

## Best Practices

1. **Clear Role Definition**: Ensure each agent has a well-defined role and purpose
2. **Thoughtful Team Structure**: Choose the appropriate team type based on the task
3. **Minimal Memory Scope**: Share only necessary information in memory nodes
4. **Communication Protocol**: Establish clear communication patterns between agents
5. **Tool Access**: Provide appropriate tools to each agent based on their responsibilities
6. **Error Handling**: Implement proper error handling and recovery mechanisms
7. **Monitoring**: Use the execution view to monitor agent interactions and diagnose issues

## Examples

### Research and Summarization Team

```
Research Coordinator (TeamNode)
├── Web Research Agent (PersonaNode)
├── Data Analysis Agent (PersonaNode)
└── Summary Writer Agent (PersonaNode)
├── Research Memory (MemoryNode)
└── Team Chat (CommunicationNode)
```

### Debate and Decision Team

```
Debate Moderator (TeamNode)
├── Pro Perspective Agent (PersonaNode)
├── Con Perspective Agent (PersonaNode)
├── Decision Maker Agent (PersonaNode)
├── Debate Log (MemoryNode)
└── Debate Channel (CommunicationNode)
```

## Implementation Details

The multi-agent workflow system is built on top of LangChain's agent framework with custom extensions for:
- Team coordination
- Memory management
- Message passing
- Parallel execution

The system handles agent discovery, registration, and coordination behind the scenes, enabling seamless execution of complex multi-agent workflows.

## Limitations and Future Work

Current limitations:
- Limited reasoning about complex team dynamics
- No built-in conflict resolution mechanisms
- Basic parallel execution support
- Limited long-term memory persistence

Future enhancements:
- Advanced team reasoning
- Improved parallel execution with dependency analysis
- Enhanced multi-modal agent communication
- Vector memory with retrieval capabilities
- Learning from past workflow executions