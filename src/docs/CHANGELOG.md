# Changelog - Multi-Agent Workflow System

## Version 1.0.0 (2025-03-06)

### Added
- Multi-agent support with team-based collaboration
- New node types:
  - **TeamNode**: Coordinate and manage multiple agents
  - **MemoryNode**: Shared state between agents
  - **CommunicationNode**: Message passing between agents
- Parallel execution of compatible workflow paths
- Enhanced agent discovery and registration
- Memory management with multiple storage types:
  - Simple (key-value)
  - Structured (JSON)
  - Vector (embedding-based)
  - Persistent (cross-execution)
- Communication modes:
  - Broadcast
  - Peer-to-peer
  - Round-robin
  - Debate-style
- Team configurations:
  - Coordinator teams
  - Debate teams
  - Consensus teams
  - Specialist teams
- Unit tests for multi-agent functionality
- Comprehensive documentation of the multi-agent workflow system

### Enhanced
- Improved execution model with parallelization
- Enhanced agent tools for inter-agent communication
- Added memory access tools for agents
- Updated UI to support new node types
- Added CSS styling for new node types
- Increased logging for workflow execution

### Technical Details
- Implemented the agent discovery phase during workflow execution
- Added shared memory system for cross-agent state
- Created team agent coordination functionality
- Updated node execution to handle new node types
- Enhanced the AgentFlow UI component to support new nodes
- Implemented message passing between agents