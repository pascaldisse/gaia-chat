import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
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
import TeamNode from './nodes/TeamNode';
import MemoryNode from './nodes/MemoryNode';
import CommunicationNode from './nodes/CommunicationNode';

// Modal components
import PersonaSelector from './modals/PersonaSelector';
import ToolConfiguration from './modals/ToolConfiguration';
import FileSelector from './modals/FileSelector';
import TeamSelector from './modals/TeamSelector';
import WorkflowExecution from './modals/WorkflowExecution';

// Services
import { 
  saveWorkflow, 
  getAllWorkflows, 
  getWorkflow, 
  deleteWorkflow,
  executeWorkflow,
  saveTemplate,
  getAllTemplates,
  getTemplatesByCategory,
  createWorkflowFromTemplate
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
  teamNode: TeamNode,
  memoryNode: MemoryNode,
  communicationNode: CommunicationNode,
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
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [showExecution, setShowExecution] = useState(false);
  
  // State for data handling
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState({ id: null, name: 'New Workflow' });
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [workflowTemplates, setWorkflowTemplates] = useState([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showTemplateSave, setShowTemplateSave] = useState(false);
  const [executionState, setExecutionState] = useState({
    logs: [],
    status: 'idle',
    progress: 0,
    result: null
  });
  const [chatIntegration, setChatIntegration] = useState(false);
  
  // Load personas and files on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load personas
        const loadedPersonas = await personaDB.getAllPersonas();
        setPersonas(loadedPersonas);
        
        // Load knowledge files from the database
        try {
          const allFiles = await knowledgeDB.getAllFiles();
          setFiles(allFiles);
        } catch (error) {
          console.error('Error loading knowledge files:', error);
          // Fallback to mock data if needed
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
        }
        
        // Load saved workflows from the database
        try {
          const workflows = await getAllWorkflows();
          setSavedWorkflows(workflows);
        } catch (error) {
          console.error('Error loading workflows:', error);
        }
        
        // Load workflow templates
        try {
          const templates = await getAllTemplates();
          setWorkflowTemplates(templates);
        } catch (error) {
          console.error('Error loading workflow templates:', error);
        }
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
  
  // Save the current workflow - now using IndexedDB
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
          chatIntegration: chatIntegration,
          createdAt: currentWorkflow.createdAt || Date.now(),
          updatedAt: Date.now()
        };
        
        // Save to database
        await saveWorkflow(workflow);
        
        // Update current workflow
        setCurrentWorkflow(workflow);
        
        // Refresh saved workflows
        const workflows = await getAllWorkflows();
        setSavedWorkflows(workflows);
        
        alert('Workflow saved successfully!');
      } catch (error) {
        console.error('Error saving workflow:', error);
        alert(`Error saving workflow: ${error.message}`);
      }
    }
  };
  
  // Save the current workflow as a template
  const saveCurrentWorkflowAsTemplate = async () => {
    if (reactFlowInstance) {
      try {
        // Prompt for template name and category
        const templateName = prompt('Enter a name for this template:', currentWorkflow.name);
        if (!templateName) return; // User cancelled
        
        const templateCategory = prompt('Enter a category for this template (e.g., "data-analysis", "chatbot"):', 'general');
        if (!templateCategory) return; // User cancelled
        
        // Get the current workflow state
        const flowObject = reactFlowInstance.toObject();
        
        // Create template object
        const templateId = `template-${Date.now()}`;
        const template = {
          id: templateId,
          name: templateName,
          category: templateCategory,
          nodes: flowObject.nodes,
          edges: flowObject.edges,
          viewport: flowObject.viewport,
          isTemplate: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        // Save to database
        await saveTemplate(template);
        
        // Refresh templates
        const templates = await getAllTemplates();
        setWorkflowTemplates(templates);
        
        alert('Template saved successfully!');
      } catch (error) {
        console.error('Error saving template:', error);
        alert(`Error saving template: ${error.message}`);
      }
    }
  };
  
  // Load a saved workflow from database
  const loadSavedWorkflow = async (workflowId) => {
    try {
      const workflow = await getWorkflow(workflowId);
      
      if (workflow) {
        // Set nodes and edges
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);
        setCurrentWorkflow(workflow);
        
        // Set chat integration flag
        setChatIntegration(workflow.chatIntegration || false);
        
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
  
  // Load a workflow template
  const loadWorkflowTemplate = async (templateId) => {
    try {
      // Create a new workflow from the template
      const newWorkflowId = await createWorkflowFromTemplate(templateId);
      
      if (newWorkflowId) {
        // Load the newly created workflow
        await loadSavedWorkflow(newWorkflowId);
      } else {
        alert('Failed to create workflow from template');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert(`Error loading template: ${error.message}`);
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
  
  // State for workflow prompt input
  const [workflowInput, setWorkflowInput] = useState('Process this data and create a report');
  const [showPromptModal, setShowPromptModal] = useState(false);
  
  // Execute the current workflow - real implementation
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
    
    // Show prompt input modal
    setShowPromptModal(true);
  };
  
  // Handle prompt submission
  const handlePromptSubmit = () => {
    setShowPromptModal(false);
    
    // Show execution modal
    setShowExecution(true);
    
    if (!workflowInput.trim()) {
      // Empty input
      setExecutionState(prev => ({
        ...prev,
        status: 'cancelled',
        logs: [
          ...prev.logs,
          {
            type: 'info',
            message: 'Execution cancelled: empty input',
            timestamp: Date.now()
          }
        ]
      }));
      return;
    }
    
    // Continue with workflow execution with the input
    continueWorkflowExecution(workflowInput);
  };
  
  // Function to continue execution with the input
  const continueWorkflowExecution = async (userInput) => {
    
    try {
      // Execute the workflow with real implementation
      await executeWorkflow(
        {
          id: currentWorkflow.id || 'temp-workflow',
          name: currentWorkflow.name,
          nodes,
          edges,
          chatIntegration
        },
        userInput,
        (update) => {
          // Handle execution updates
          setExecutionState(prev => {
            // Add new log
            const logs = [...prev.logs, {
              ...update,
              timestamp: update.timestamp || Date.now()
            }];
            
            // Calculate progress
            const totalNodes = nodes.length;
            const completedNodes = logs.filter(log => 
              log.type === 'node_complete'
            ).length;
            
            const progress = Math.min(Math.round((completedNodes / totalNodes) * 100), 100);
            
            // Set status based on update type
            let status = prev.status;
            let result = prev.result;
            
            if (update.type === 'workflow_complete') {
              status = 'completed';
              result = update.results;
            } else if (update.type === 'workflow_error') {
              status = 'error';
            } else if (update.type === 'node_error') {
              status = 'error';
            }
            
            return {
              logs,
              status,
              progress,
              result: result || prev.result
            };
          });
        }
      );
    } catch (error) {
      console.error('Error executing workflow:', error);
      
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
    }
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
      case 'teamNode':
        setShowTeamSelector(true);
        break;
      case 'memoryNode':
        // Will need to implement MemoryConfiguration modal
        alert('Memory configuration dialog will be implemented here');
        break;
      case 'communicationNode':
        // Will need to implement CommunicationConfiguration modal
        alert('Communication configuration dialog will be implemented here');
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
        case 'teamNode':
          nodeData = {
            teamName: 'Agent Team',
            teamDescription: 'A team of collaborative agents',
            agents: [],
            teamRole: 'coordinator',
            onEdit: () => setShowTeamSelector(true),
            onSettings: () => {
              // Additional team settings if needed
              console.log('Team settings button clicked');
            }
          };
          break;
        case 'communicationNode':
          nodeData = {
            name: 'Communication Channel',
            mode: 'broadcast',
            description: 'Communication channel for agents',
            format: 'text',
            onEdit: () => {
              alert('Communication channel configuration dialog will appear here');
            },
            onView: () => {
              alert('Message history will appear here');
            }
          };
          break;
        case 'memoryNode':
          nodeData = {
            memoryName: 'Shared Memory',
            memoryType: 'simple',
            memoryDescription: 'Shared memory for agent collaboration',
            memorySize: 0,
            onEdit: () => {
              alert('Memory configuration dialog will appear here');
            },
            onView: () => {
              alert('Memory contents will appear here');
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
  
  // Handle team configuration
  const handleTeamSave = (teamData) => {
    if (selectedNodeId) {
      updateNodeData(selectedNodeId, {
        ...teamData,
        onEdit: () => setShowTeamSelector(true),
        onSettings: () => {
          console.log('Team settings:', teamData);
        }
      });
    }
    setShowTeamSelector(false);
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
    <div className="agent-flow-container" role="application" aria-label="Agent Workflow Editor">
      <div className="agent-flow-header">
        <h2 id="workflow-title">Agent Workflow: {currentWorkflow.name}</h2>
        <div className="agent-flow-actions" role="toolbar" aria-label="Workflow actions">
          <button 
            onClick={createNewWorkflow} 
            className="new-button"
            aria-label="Create new workflow"
          >
            New Workflow
          </button>
          <button 
            onClick={saveCurrentWorkflow} 
            className="save-button"
            aria-label="Save current workflow"
          >
            Save Workflow
          </button>
          <button 
            onClick={saveCurrentWorkflowAsTemplate} 
            className="template-button"
            aria-label="Save as workflow template"
          >
            Save as Template
          </button>
          
          <select 
            className="workflow-selector"
            onChange={(e) => {
              if (e.target.value) {
                loadSavedWorkflow(e.target.value);
              }
            }}
            value={currentWorkflow.id || ''}
            aria-label="Select saved workflow to load"
          >
            <option value="">-- Load Workflow --</option>
            {savedWorkflows.map(workflow => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name || workflow.id}
              </option>
            ))}
          </select>
          
          <select 
            className="template-selector"
            onChange={(e) => {
              if (e.target.value) {
                loadWorkflowTemplate(e.target.value);
              }
            }}
            value=""
            aria-label="Select workflow template to use"
          >
            <option value="">-- Use Template --</option>
            {workflowTemplates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name || template.id}
              </option>
            ))}
          </select>
          
          <div className="chat-integration">
            <label htmlFor="chat-integration-checkbox">
              <input 
                id="chat-integration-checkbox"
                type="checkbox" 
                checked={chatIntegration} 
                onChange={(e) => setChatIntegration(e.target.checked)}
                aria-label="Enable chat integration" 
              />
              Chat Integration
            </label>
          </div>
          
          <button 
            onClick={executeCurrentWorkflow}
            className="execute-button"
            disabled={nodes.length === 0}
            aria-label="Execute current workflow"
          >
            <span aria-hidden="true">▶</span> Execute
          </button>
        </div>
      </div>
      
      <div 
        className="agent-flow-tools" 
        role="toolbar" 
        aria-label="Available node types"
      >
        <div 
          className="agent-flow-tool"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow', 'personaNode');
          }}
          role="button"
          aria-label="Drag to add Persona node"
          tabIndex="0"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              // Create a persona node at a default position
              const newNode = {
                id: `${Date.now()}`,
                type: 'personaNode',
                position: { x: 250, y: 150 },
                data: {
                  personaData: {},
                  onEdit: () => setShowPersonaSelector(true),
                  onSettings: () => {}
                }
              };
              setNodes((nds) => nds.concat(newNode));
            }
          }}
        >
          <div className="tool-node persona">Persona</div>
        </div>
        <div 
          className="agent-flow-tool"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow', 'teamNode');
          }}
        >
          <div className="tool-node team">Team</div>
        </div>
        <div 
          className="agent-flow-tool"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow', 'toolNode');
          }}
          role="button"
          aria-label="Drag to add Tool node"
          tabIndex="0"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              // Create a tool node at a default position
              const newNode = {
                id: `${Date.now()}`,
                type: 'toolNode',
                position: { x: 250, y: 200 },
                data: {
                  toolType: 'generic',
                  toolName: 'New Tool',
                  toolDescription: 'Configure this tool',
                  toolConfig: {},
                  onConfigure: () => setShowToolConfig(true)
                }
              };
              setNodes((nds) => nds.concat(newNode));
            }
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
          role="button"
          aria-label="Drag to add File node"
          tabIndex="0"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              // Create a file node at a default position
              const newNode = {
                id: `${Date.now()}`,
                type: 'fileNode',
                position: { x: 250, y: 250 },
                data: {
                  fileName: 'Select File',
                  fileType: 'unknown',
                  fileSize: '0 KB',
                  onSelect: () => setShowFileSelector(true),
                  onPreview: () => {}
                }
              };
              setNodes((nds) => nds.concat(newNode));
            }
          }}
        >
          <div className="tool-node file">File</div>
        </div>
        <div className="nodes-divider" aria-hidden="true"></div>
        <div 
          className="agent-flow-tool"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow', 'communicationNode');
          }}
        >
          <div className="tool-node communication">Communication</div>
        </div>
        <div 
          className="agent-flow-tool"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow', 'memoryNode');
          }}
        >
          <div className="tool-node memory">Memory</div>
        </div>
        <div className="nodes-divider"></div>
        <div 
          className="agent-flow-tool"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/reactflow', 'triggerNode');
          }}
          role="button"
          aria-label="Drag to add Trigger node"
          tabIndex="0"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              // Create a trigger node at a default position
              const newNode = {
                id: `${Date.now()}`,
                type: 'triggerNode',
                position: { x: 250, y: 300 },
                data: {
                  label: 'New Trigger',
                  icon: 'lightning-bolt'
                }
              };
              setNodes((nds) => nds.concat(newNode));
            }
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
          role="button"
          aria-label="Drag to add Action node"
          tabIndex="0"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              // Create an action node at a default position
              const newNode = {
                id: `${Date.now()}`,
                type: 'actionNode',
                position: { x: 250, y: 350 },
                data: {
                  label: 'New Action',
                  color: 'blue'
                }
              };
              setNodes((nds) => nds.concat(newNode));
            }
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
          role="button"
          aria-label="Drag to add Decision node"
          tabIndex="0"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              // Create a decision node at a default position
              const newNode = {
                id: `${Date.now()}`,
                type: 'decisionNode',
                position: { x: 250, y: 400 },
                data: {
                  label: 'New Decision',
                  color: 'green'
                }
              };
              setNodes((nds) => nds.concat(newNode));
            }
          }}
        >
          <div className="tool-node decision">Decision</div>
        </div>
      </div>
      
      <div 
        className="agent-flow-canvas" 
        ref={reactFlowWrapper}
        role="region"
        aria-label="Workflow canvas"
      >
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
          aria-label="Interactive workflow diagram"
          ariaLiveMessage={`Workflow contains ${nodes.length} nodes and ${edges.length} connections`}
        >
          <Controls 
            showZoom={true}
            showFitView={true}
            showInteractive={false}
            position="bottom-right"
          />
          <Background variant="dots" gap={16} size={1} color="#2f3136" />
        </ReactFlow>
      </div>
      
      {/* Modals */}
      {showPromptModal && (
        <div className="agent-modal-backdrop">
          <div className="agent-modal">
            <div className="agent-modal-header">
              <h3>Enter input for this workflow</h3>
              <button 
                className="agent-modal-close" 
                onClick={() => setShowPromptModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="agent-modal-content">
              <textarea
                placeholder="Enter your prompt here..."
                rows={5}
                style={{ width: '100%' }}
                value={workflowInput}
                onChange={(e) => setWorkflowInput(e.target.value)}
              />
            </div>
            <div className="agent-modal-footer">
              <button 
                className="agent-modal-button save"
                onClick={handlePromptSubmit}
              >
                Submit Prompt
              </button>
              <button 
                className="agent-modal-button cancel"
                onClick={() => setShowPromptModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showPersonaSelector && (
        <PersonaSelector 
          personas={personas} 
          onSelect={handlePersonaSelect}
          onCancel={() => setShowPersonaSelector(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="persona-selector-title"
        />
      )}
      
      {showToolConfig && (
        <ToolConfiguration 
          toolData={getSelectedNodeData()}
          onSave={handleToolSave}
          onCancel={() => setShowToolConfig(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tool-config-title"
        />
      )}
      
      {showFileSelector && (
        <FileSelector 
          files={files}
          onSelect={handleFileSelect}
          onCancel={() => setShowFileSelector(false)}
          onUpload={handleFileUpload}
          role="dialog"
          aria-modal="true"
          aria-labelledby="file-selector-title"
        />
      )}
      
      {showTeamSelector && (
        <TeamSelector
          teamData={getSelectedNodeData()}
          agents={nodes
            .filter(node => node.type === 'personaNode' && node.data.personaData?.id)
            .map(node => ({
              id: node.id,
              name: node.data.personaData?.name || 'Unnamed Agent',
              persona: node.data.personaData
            }))
          }
          onSave={handleTeamSave}
          onCancel={() => setShowTeamSelector(false)}
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
          role="dialog"
          aria-modal="true"
          aria-labelledby="execution-title"
          aria-live="polite"
        />
      )}
    </div>
  );
};

const AgentFlow = ({ reducedMotion = false, isApplePlatform = false }) => {
  return (
    <ReactFlowProvider>
      <div className={`${reducedMotion ? 'reduced-motion' : ''} ${isApplePlatform ? 'apple-platform' : ''}`}>
        <AgentFlowContent />
      </div>
    </ReactFlowProvider>
  );
};

export default AgentFlow;