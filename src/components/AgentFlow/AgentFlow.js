import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
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

// Node components
import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import DecisionNode from './nodes/DecisionNode';
import PersonaNode from './nodes/PersonaNode';
import ToolNode from './nodes/ToolNode';
import FileNode from './nodes/FileNode';

// Modal components
import PersonaSelector from './modals/PersonaSelector';
import ToolConfiguration from './modals/ToolConfiguration';
import FileSelector from './modals/FileSelector';
import WorkflowExecution from './modals/WorkflowExecution';

// Services
import { 
  saveWorkflow, 
  getAllWorkflows, 
  getWorkflow, 
  deleteWorkflow,
  executeWorkflow
} from '../../services/agentFlow/WorkflowService';

// Database services
import { personaDB, knowledgeDB } from '../../services/db';

const nodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  decisionNode: DecisionNode,
  personaNode: PersonaNode,
  toolNode: ToolNode,
  fileNode: FileNode,
};

// Initial nodes for a new workflow with personalized agents
const createInitialNodes = () => [
  {
    id: '1',
    type: 'personaNode',
    position: { x: 250, y: 50 },
    data: { 
      personaData: {},
      onEdit: () => {},
      onSettings: () => {}
    },
  },
  {
    id: '2',
    type: 'toolNode',
    position: { x: 250, y: 150 },
    data: { 
      toolType: 'search',
      toolName: 'Search Knowledge Base',
      toolDescription: 'Search through documents for information',
      toolConfig: {},
      onConfigure: () => {}
    },
  },
  {
    id: '3',
    type: 'fileNode',
    position: { x: 100, y: 150 },
    data: { 
      fileName: 'Select File',
      onSelect: () => {},
      onPreview: () => {}
    },
  },
];

const AgentFlowContent = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(createInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  
  // State for modals
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [showToolConfig, setShowToolConfig] = useState(false);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [showExecution, setShowExecution] = useState(false);
  
  // State for data handling
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState({ id: null, name: 'New Workflow' });
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [executionState, setExecutionState] = useState({
    logs: [],
    status: 'idle',
    progress: 0,
    result: null
  });
  
  // Load personas and files on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load personas
        const loadedPersonas = await personaDB.getAllPersonas();
        setPersonas(loadedPersonas);
        
        // Load knowledge files - this method doesn't exist in our db service, 
        // so we create a mock implementation for demo purposes
        const mockFiles = [
          { 
            id: 'file-1',
            name: 'example.pdf',
            type: 'application/pdf',
            size: 1024000
          },
          {
            id: 'file-2',
            name: 'data.csv',
            type: 'text/csv',
            size: 50000
          }
        ];
        setFiles(mockFiles);
        
        // Load saved workflows from localStorage
        const allItems = Object.keys(localStorage)
          .filter(key => key.startsWith('agentflow-'))
          .map(key => JSON.parse(localStorage.getItem(key)))
          .sort((a, b) => b.updatedAt - a.updatedAt);
          
        setSavedWorkflows(allItems);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);
  
  // Update node data handlers
  const updateNodeData = (nodeId, newData) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            ...newData
          }
        };
      }
      return node;
    }));
  };
  
  // Handle connection between nodes
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      id: `e${params.source}-${params.target}`,
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
  
  // Save the current workflow - using localStorage
  const saveCurrentWorkflow = async () => {
    if (reactFlowInstance) {
      try {
        // Prompt for workflow name if it's still the default
        let workflowName = currentWorkflow.name;
        if (workflowName === 'New Workflow') {
          const name = prompt('Enter a name for this workflow:', 'My Workflow');
          if (!name) return; // User cancelled
          workflowName = name;
        }
        
        // Get the current workflow state
        const flowObject = reactFlowInstance.toObject();
        
        // Create workflow object
        const workflowId = currentWorkflow.id || `workflow-${Date.now()}`;
        const workflow = {
          id: workflowId,
          name: workflowName,
          nodes: flowObject.nodes,
          edges: flowObject.edges,
          viewport: flowObject.viewport,
          createdAt: currentWorkflow.createdAt || Date.now(),
          updatedAt: Date.now()
        };
        
        // Save to localStorage
        localStorage.setItem(`agentflow-${workflowId}`, JSON.stringify(workflow));
        
        // Update current workflow
        setCurrentWorkflow(workflow);
        
        // Refresh saved workflows
        const allItems = Object.keys(localStorage)
          .filter(key => key.startsWith('agentflow-'))
          .map(key => JSON.parse(localStorage.getItem(key)))
          .sort((a, b) => b.updatedAt - a.updatedAt);
          
        setSavedWorkflows(allItems);
        
        alert('Workflow saved successfully!');
      } catch (error) {
        console.error('Error saving workflow:', error);
        alert(`Error saving workflow: ${error.message}`);
      }
    }
  };
  
  // Load a saved workflow from localStorage
  const loadSavedWorkflow = async (workflowId) => {
    try {
      const workflowJson = localStorage.getItem(`agentflow-${workflowId}`);
      if (workflowJson) {
        const workflow = JSON.parse(workflowJson);
        
        // Set nodes and edges
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);
        setCurrentWorkflow(workflow);
        
        // Reset viewport if available
        if (reactFlowInstance && workflow.viewport) {
          reactFlowInstance.setViewport(workflow.viewport);
        }
        
        alert(`Loaded workflow: ${workflow.name}`);
      } else {
        alert('No workflow found with that ID');
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
      alert(`Error loading workflow: ${error.message}`);
    }
  };
  
  // Create a new workflow
  const createNewWorkflow = () => {
    setNodes(createInitialNodes());
    setEdges([]);
    setCurrentWorkflow({ id: null, name: 'New Workflow' });
    
    // Make sure ReactFlow is re-initialized
    if (reactFlowInstance) {
      setTimeout(() => {
        reactFlowInstance.fitView();
      }, 100);
    }
  };
  
  // Execute the current workflow - simulated for demo
  const executeCurrentWorkflow = async () => {
    if (nodes.length === 0) {
      alert('Workflow is empty. Add nodes before executing.');
      return;
    }
    
    // Reset execution state
    setExecutionState({
      logs: [],
      status: 'running',
      progress: 0,
      result: null
    });
    
    // Show execution modal
    setShowExecution(true);
    
    // Simulate execution with a delay
    const simulateExecution = async () => {
      const addLog = (type, nodeId, message = null, result = null) => {
        // Update execution state with progress
        setExecutionState(prev => {
          // Add new log
          const logs = [...prev.logs, {
            type,
            nodeId,
            message,
            result,
            timestamp: Date.now()
          }];
          
          // Calculate progress
          const completedNodes = logs.filter(log => log.type === 'node_complete').length;
          const progress = Math.min(Math.round((completedNodes / nodes.length) * 100), 100);
          
          // Set status
          let status = 'running';
          if (type === 'error') {
            status = 'error';
          } else if (progress >= 100) {
            status = 'completed';
          }
          
          return {
            ...prev,
            logs,
            progress,
            status,
            result: result || prev.result
          };
        });
      };
      
      // Example user input
      const userInput = 'Process this data and create a report';
      
      // Process each node with delay
      for (const node of nodes) {
        // Add start log
        addLog('node_start', node.id);
        
        // Wait between 1-3 seconds
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Generate result based on node type
        let result = '';
        
        switch (node.type) {
          case 'personaNode':
            const personaName = node.data.personaData?.name || 'Unknown Persona';
            result = `${personaName} processed the input: "${userInput}" and generated a response.`;
            break;
            
          case 'toolNode':
            result = `Used tool "${node.data.toolName || 'Unknown Tool'}" to perform an action.`;
            break;
            
          case 'fileNode':
            result = `Read data from file "${node.data.fileName || 'Unknown File'}" for processing.`;
            break;
            
          case 'triggerNode':
            result = `Workflow triggered by event: "${node.data.label || 'Unknown Trigger'}"`;
            break;
            
          case 'actionNode':
            result = `Performed action: "${node.data.label || 'Unknown Action'}"`;
            break;
            
          case 'decisionNode':
            result = `Decision evaluation: "${node.data.label || 'Unknown Decision'}" = true`;
            break;
            
          default:
            result = `Unknown node type processed: ${node.type}`;
        }
        
        // Add complete log
        addLog('node_complete', node.id, null, result);
        
        // Randomly add info log
        if (Math.random() > 0.7) {
          await new Promise(resolve => setTimeout(resolve, 500));
          addLog('info', node.id, 'Additional information about node execution');
        }
        
        // Simulate an error randomly (10% chance)
        if (Math.random() > 0.9) {
          await new Promise(resolve => setTimeout(resolve, 500));
          addLog('error', node.id, 'An error occurred during execution');
          return; // Stop execution on error
        }
      }
      
      // Final result
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setExecutionState(prev => ({
        ...prev,
        status: 'completed',
        progress: 100,
        result: `Workflow execution completed successfully. Processed ${nodes.length} nodes.`
      }));
    };
    
    // Start simulation
    simulateExecution().catch(error => {
      console.error('Error in simulation:', error);
      
      // Update error state
      setExecutionState(prev => ({
        ...prev,
        status: 'error',
        logs: [
          ...prev.logs,
          {
            type: 'error',
            message: error.message,
            timestamp: Date.now()
          }
        ]
      }));
    });
  };
  
  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    // Store the selected node ID
    setSelectedNodeId(node.id);
    
    // Open appropriate modal based on node type
    switch (node.type) {
      case 'personaNode':
        setShowPersonaSelector(true);
        break;
      case 'toolNode':
        setShowToolConfig(true);
        break;
      case 'fileNode':
        setShowFileSelector(true);
        break;
      default:
        // No modal for other node types
        break;
    }
  }, []);
  
  // Add a new node when drag and drop from panel
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) return;
      
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      // Create appropriate data based on node type
      let nodeData = {};
      
      switch (type) {
        case 'personaNode':
          nodeData = {
            personaData: {},
            onEdit: () => setShowPersonaSelector(true),
            onSettings: (personaData) => {
              console.log('Configure persona:', personaData);
              alert(`Configure ${personaData?.name || 'persona'} settings`);
            }
          };
          break;
        case 'toolNode':
          nodeData = {
            toolType: 'generic',
            toolName: 'New Tool',
            toolDescription: 'Configure this tool',
            toolConfig: {},
            onConfigure: () => setShowToolConfig(true)
          };
          break;
        case 'fileNode':
          nodeData = {
            fileName: 'Select File',
            fileType: 'unknown',
            fileSize: '0 KB',
            onSelect: () => setShowFileSelector(true),
            onPreview: (fileId) => {
              alert(`Preview file with ID: ${fileId}`);
            }
          };
          break;
        case 'triggerNode':
          nodeData = {
            label: 'New Trigger',
            icon: 'lightning-bolt'
          };
          break;
        case 'actionNode':
          nodeData = {
            label: 'New Action',
            color: 'blue'
          };
          break;
        case 'decisionNode':
          nodeData = {
            label: 'New Decision',
            color: 'green'
          };
          break;
        default:
          nodeData = { label: `New ${type.replace('Node', '')}` };
      }
      
      const newNode = {
        id: `${Date.now()}`,
        type,
        position,
        data: nodeData,
      };
      
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );
  
  // Handle persona selection
  const handlePersonaSelect = (persona) => {
    if (selectedNodeId) {
      updateNodeData(selectedNodeId, {
        personaData: persona,
        onEdit: () => setShowPersonaSelector(true),
        onSettings: (personaData) => {
          // Handle persona settings
          console.log('Configure persona:', personaData);
        }
      });
    }
    setShowPersonaSelector(false);
  };
  
  // Handle tool configuration
  const handleToolSave = (toolData) => {
    if (selectedNodeId) {
      updateNodeData(selectedNodeId, {
        ...toolData,
        onConfigure: () => setShowToolConfig(true)
      });
    }
    setShowToolConfig(false);
  };
  
  // Handle file selection
  const handleFileSelect = (file) => {
    if (selectedNodeId) {
      updateNodeData(selectedNodeId, {
        fileId: file.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        onPreview: (fileId) => {
          // Handle file preview
          console.log('Preview file:', fileId);
        },
        onSelect: () => setShowFileSelector(true)
      });
    }
    setShowFileSelector(false);
  };
  
  // Handle file upload
  const handleFileUpload = () => {
    // Trigger file input click
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.txt,.csv,.md';
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          // Create a mock file object (since we don't have the real DB implementation)
          const fileId = `file-${Date.now()}`;
          const fileData = {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedAt: Date.now()
          };
          
          // Update files list with the new mock file
          setFiles(prev => [...prev, fileData]);
          
          // If node is selected, update it
          if (selectedNodeId) {
            updateNodeData(selectedNodeId, {
              fileId,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              onPreview: () => alert(`Preview for ${file.name}`),
              onSelect: () => setShowFileSelector(true)
            });
          }
          
          // Close the file selector
          setShowFileSelector(false);
          
          alert(`File "${file.name}" uploaded successfully!`);
        } catch (error) {
          console.error('Error uploading file:', error);
          alert(`Error uploading file: ${error.message}`);
        }
      }
    };
    
    fileInput.click();
  };
  
  // Get the appropriate data for selected node (for modal)
  const getSelectedNodeData = () => {
    if (!selectedNodeId) return null;
    
    const selectedNode = nodes.find(node => node.id === selectedNodeId);
    return selectedNode ? selectedNode.data : null;
  };
  
  return (
    <div className="agent-flow-container">
      <div className="agent-flow-header">
        <h2>Agent Workflow: {currentWorkflow.name}</h2>
        <div className="agent-flow-actions">
          <button onClick={createNewWorkflow} className="new-button">New Workflow</button>
          <button onClick={saveCurrentWorkflow} className="save-button">Save Workflow</button>
          <select 
            className="workflow-selector"
            onChange={(e) => {
              if (e.target.value) {
                loadSavedWorkflow(e.target.value);
              }
            }}
            value={currentWorkflow.id || ''}
          >
            <option value="">-- Load Workflow --</option>
            {savedWorkflows.map(workflow => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name || workflow.id}
              </option>
            ))}
          </select>
          <button 
            onClick={executeCurrentWorkflow}
            className="execute-button"
            disabled={nodes.length === 0}
          >
            ▶ Execute
          </button>
        </div>
      </div>
      
      <div className="agent-flow-tools">
        <div 
          className="agent-flow-tool"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow', 'personaNode');
          }}
        >
          <div className="tool-node persona">Persona</div>
        </div>
        <div 
          className="agent-flow-tool"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow', 'toolNode');
          }}
        >
          <div className="tool-node tool">Tool</div>
        </div>
        <div 
          className="agent-flow-tool"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow', 'fileNode');
          }}
        >
          <div className="tool-node file">File</div>
        </div>
        <div className="nodes-divider"></div>
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
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={16} size={1} color="#2f3136" />
        </ReactFlow>
      </div>
      
      {/* Modals */}
      {showPersonaSelector && (
        <PersonaSelector 
          personas={personas} 
          onSelect={handlePersonaSelect}
          onCancel={() => setShowPersonaSelector(false)}
        />
      )}
      
      {showToolConfig && (
        <ToolConfiguration 
          toolData={getSelectedNodeData()}
          onSave={handleToolSave}
          onCancel={() => setShowToolConfig(false)}
        />
      )}
      
      {showFileSelector && (
        <FileSelector 
          files={files}
          onSelect={handleFileSelect}
          onCancel={() => setShowFileSelector(false)}
          onUpload={handleFileUpload}
        />
      )}
      
      {showExecution && (
        <WorkflowExecution 
          workflow={currentWorkflow}
          nodes={nodes}
          edges={edges}
          executionState={executionState}
          onClose={() => setShowExecution(false)}
          onComplete={(result) => {
            setShowExecution(false);
            // Handle completion, e.g. save result
            console.log('Workflow execution completed:', result);
          }}
        />
      )}
    </div>
  );
};

const AgentFlow = () => {
  return (
    <ReactFlowProvider>
      <AgentFlowContent />
    </ReactFlowProvider>
  );
};

export default AgentFlow;