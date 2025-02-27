import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './AgentFlow.css';

import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import DecisionNode from './nodes/DecisionNode';

const nodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  decisionNode: DecisionNode,
};

// Initial nodes and edges for the workflow
const initialNodes = [
  {
    id: '1',
    type: 'triggerNode',
    position: { x: 250, y: 50 },
    data: { 
      label: 'On "Create User" form submission',
      icon: 'lightning-bolt',
      secondaryIcon: 'document',
    },
  },
  {
    id: '2',
    type: 'actionNode',
    position: { x: 250, y: 150 },
    data: { 
      label: 'Create user in Google Workspace',
      icon: 'google',
      color: 'blue',
    },
  },
  {
    id: '3',
    type: 'decisionNode',
    position: { x: 250, y: 250 },
    data: { 
      label: 'Is Manager?', 
      color: 'green',
    },
  },
  {
    id: '4',
    type: 'actionNode',
    position: { x: 100, y: 350 },
    data: { 
      label: 'Create Jira Admin',
      icon: 'jira',
      color: 'blue',
    },
  },
  {
    id: '5',
    type: 'actionNode',
    position: { x: 400, y: 350 },
    data: { 
      label: 'Create Jira Member',
      icon: 'jira',
      color: 'blue',
    },
  },
  {
    id: '6',
    type: 'actionNode',
    position: { x: 250, y: 450 },
    data: { 
      label: 'Create Slack user',
      icon: 'slack',
      color: 'teal',
    },
  },
  {
    id: '7',
    type: 'actionNode',
    position: { x: 250, y: 550 },
    data: { 
      label: 'Update Slack profile',
      icon: 'slack',
      color: 'teal',
    },
  },
];

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
    style: { stroke: '#888' },
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#888',
    },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    animated: true,
    style: { stroke: '#888' },
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#888',
    },
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    animated: true,
    label: 'true',
    labelStyle: { fill: '#666', fontWeight: 600 },
    style: { stroke: '#888' },
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#888',
    },
  },
  {
    id: 'e3-5',
    source: '3',
    target: '5',
    animated: true,
    label: 'false',
    labelStyle: { fill: '#666', fontWeight: 600 },
    style: { stroke: '#888' },
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#888',
    },
  },
  {
    id: 'e4-6',
    source: '4',
    target: '6',
    animated: true,
    style: { stroke: '#888' },
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#888',
    },
  },
  {
    id: 'e5-6',
    source: '5',
    target: '6',
    animated: true,
    style: { stroke: '#888' },
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#888',
    },
  },
  {
    id: 'e6-7',
    source: '6',
    target: '7',
    animated: true,
    style: { stroke: '#888' },
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#888',
    },
  },
];

const AgentFlow = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Handle connection between nodes
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#888' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#888',
      },
    }, eds)),
    [setEdges]
  );

  // Save the workflow as JSON
  const saveWorkflow = () => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      localStorage.setItem('agentflow', JSON.stringify(flow));
      alert('Workflow saved!');
    }
  };

  // Load a saved workflow
  const loadSavedWorkflow = () => {
    const savedFlow = localStorage.getItem('agentflow');
    if (savedFlow) {
      const flow = JSON.parse(savedFlow);
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
      alert('Workflow loaded!');
    } else {
      alert('No saved workflow found.');
    }
  };

  // Add a new node when drag and drop from panel
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${Date.now()}`,
        type,
        position,
        data: { label: `New ${type.replace('Node', '')}` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div className="agent-flow-container">
      <div className="agent-flow-header">
        <h2>Agent Workflow</h2>
        <div className="agent-flow-actions">
          <button onClick={saveWorkflow} className="save-button">Save Workflow</button>
          <button onClick={loadSavedWorkflow} className="load-button">Load Workflow</button>
        </div>
      </div>
      
      <div className="agent-flow-tools">
        <div 
          className="agent-flow-tool"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow', 'triggerNode');
          }}
        >
          <div className="tool-node trigger">Trigger</div>
        </div>
        <div 
          className="agent-flow-tool"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow', 'actionNode');
          }}
        >
          <div className="tool-node action">Action</div>
        </div>
        <div 
          className="agent-flow-tool"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow', 'decisionNode');
          }}
        >
          <div className="tool-node decision">Decision</div>
        </div>
      </div>
      
      <div className="agent-flow-canvas" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} color="#cccccc" />
        </ReactFlow>
      </div>
    </div>
  );
};

export default AgentFlow;