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

## Technical Architecture

The multi-agent workflow system is built on a modular architecture:

### Workflow Execution Engine

The core execution engine (`executeWorkflow` function) is responsible for:

1. Analyzing workflow structure to identify starting nodes
2. Mapping dependencies between nodes
3. Registering agents, teams, memory, and communication channels
4. Executing nodes in the appropriate order (sequential or parallel)
5. Managing execution state and memory
6. Providing execution updates via callback mechanism

### Agent Discovery and Registration

Before workflow execution begins, the system:

1. Discovers all persona nodes in the workflow
2. Discovers all team nodes and their compositions
3. Registers agents in a central registry
4. Establishes team memberships
5. Initializes shared memory
6. Sets up communication channels

### Node Execution Process

Each node type follows a specific execution pattern:

#### Persona Nodes
1. Process incoming data from connected nodes
2. Load or create associated tools
3. Create LangChain agent with appropriate persona attributes
4. Execute agent with enhanced input and context
5. Store output in execution memory

#### Team Nodes
1. Register connected persona nodes as team members
2. Process incoming context data
3. Create a team coordinator agent with appropriate role
4. Execute team coordination with context
5. Store team output in execution memory

#### Memory Nodes
1. Initialize structured memory based on type
2. Process incoming write operations
3. Handle read operations from connected agents
4. Track access patterns for debugging

#### Communication Nodes
1. Set up communication channel with specified mode
2. Register participants from connected nodes
3. Process incoming messages
4. Deliver messages according to channel mode
5. Maintain message history throughout execution

### Memory System

The memory system provides:

1. **Session Memory**: Tracks the entire workflow execution state
   - `results`: Outputs from each node execution
   - `intermediateSteps`: Detailed execution steps for debugging
   - `sharedMemory`: Global memory accessible by all nodes

2. **Agent Registry**: Maps agent IDs to their state information
   - `name`: Agent display name
   - `role`: Individual or team member
   - `persona`: Associated persona data
   - `teamIds`: Teams this agent belongs to
   - `messages`: Personal message history
   - `memory`: Agent-specific memory

3. **Team Registry**: Maps team IDs to team information
   - `name`: Team name
   - `role`: Team type (coordinator, debate, etc.)
   - `members`: List of member agents
   - `sharedMemory`: Team-specific shared memory
   - `messages`: Team message history

4. **Message Queue**: Inter-agent communication infrastructure
   - Tracks channels, participants, and message history
   - Supports different communication modes

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

**Implementation:** Stores data as plain strings. Useful for short context sharing.

**Example Usage:**
```javascript
// Write to memory
await memoryTool.func('write:project_status:In progress');

// Read from memory
const status = await memoryTool.func('read:project_status:');
```

### Structured Memory

JSON-based storage for complex data structures, allowing agents to share structured information.

**Implementation:** Attempts to parse data as JSON, falling back to string if parsing fails.

**Example Usage:**
```javascript
// Write structured data
await memoryTool.func('write:research_data:{"findings": ["A", "B"], "confidence": 0.8}');

// Read structured data
const data = await memoryTool.func('read:research_data:');
```

### Vector Memory

Specialized memory for storing embeddings and semantic information, useful for agents working with semantic reasoning.

**Implementation:** Stores vector embeddings for semantic search capabilities.

**Example Usage:**
```javascript
// Coming in future release
```

### Persistent Memory

Long-term storage that persists between workflow executions, enabling continuity across multiple runs.

**Implementation:** Saved to database between workflow runs.

**Example Usage:**
```javascript
// Coming in future release
```

## Communication Modes

### Broadcast

Messages sent to all agents in the channel. Useful for announcements and shared information.

**Implementation:** Messages are stored in channel and available to all participants.

**Example Usage:**
```javascript
await messageTool.func('team_channel:Update - I have completed the research phase');
```

### Peer-to-Peer (P2P)

Direct communication between two agents. Useful for specialized exchanges.

**Implementation:** Messages are targeted to specific agents.

**Example Usage:**
```javascript
// Coming in future release
```

### Round Robin

Sequential communication where each agent takes turns responding. Useful for gathering input from every team member.

**Implementation:** Tracks turn order and indicates which agent should respond next.

**Example Usage:**
```javascript
// Coming in future release
```

### Debate Style

Structured back-and-forth between agents with opposing views. Useful for exploring different perspectives.

**Implementation:** Alternates between specified debating agents with optional moderator.

**Example Usage:**
```javascript
// Coming in future release
```

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

### Key Components

1. **WorkflowService.js**: Core implementation of workflow execution and agent management
2. **AgentFlow Component**: React UI for building and configuring workflows
3. **Node Types**: PersonaNode, TeamNode, MemoryNode, CommunicationNode, etc.
4. **Tool Integration**: Seamless integration with existing agent tools

## Limitations and Future Work

Current limitations:
- Limited reasoning about complex team dynamics
- No built-in conflict resolution mechanisms
- Basic parallel execution support
- Limited long-term memory persistence

Future enhancements:
- Advanced team reasoning with specialized prompting
- Improved parallel execution with dependency analysis
- Enhanced multi-modal agent communication
- Vector memory with retrieval capabilities
- Learning from past workflow executions
- Team-level and workflow-level reporting