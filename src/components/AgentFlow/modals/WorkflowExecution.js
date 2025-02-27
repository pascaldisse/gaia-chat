import React, { useState, useEffect, useRef } from 'react';
import './Modal.css';

const WorkflowExecution = ({ 
  workflow, 
  nodes, 
  edges, 
  onClose, 
  onComplete, 
  executionState = {} 
}) => {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('running'); // running, completed, error
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom whenever logs update
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Update based on execution state
  useEffect(() => {
    if (executionState) {
      if (executionState.logs) {
        setLogs(executionState.logs);
      }
      
      if (executionState.status) {
        setStatus(executionState.status);
      }
      
      if (executionState.progress !== undefined) {
        setProgress(executionState.progress);
      }
      
      if (executionState.result) {
        setResult(executionState.result);
      }
    }
  }, [executionState]);

  // Get node name by ID
  const getNodeName = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return `Node ${nodeId}`;
    
    switch (node.type) {
      case 'personaNode':
        return node.data.personaData?.name || 'Persona';
      case 'toolNode':
        return node.data.toolName || 'Tool';
      case 'fileNode':
        return node.data.fileName || 'File';
      case 'decisionNode':
        return 'Decision';
      default:
        return `Node ${nodeId}`;
    }
  };

  // Render log message
  const renderLogMessage = (log) => {
    switch (log.type) {
      case 'node_start':
        return (
          <div className="execution-log start">
            <span className="timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className="node-name">{getNodeName(log.nodeId)}</span>
            <span className="status">Starting execution...</span>
          </div>
        );
        
      case 'node_complete':
        return (
          <div className="execution-log complete">
            <span className="timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className="node-name">{getNodeName(log.nodeId)}</span>
            <span className="status">Completed</span>
            {log.result && (
              <div className="result">
                <pre>{typeof log.result === 'string' ? log.result : JSON.stringify(log.result, null, 2)}</pre>
              </div>
            )}
          </div>
        );
        
      case 'error':
        return (
          <div className="execution-log error">
            <span className="timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className="status">Error:</span>
            <div className="error-message">{log.message}</div>
          </div>
        );
        
      case 'info':
        return (
          <div className="execution-log info">
            <span className="timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className="status">Info:</span>
            <div className="info-message">{log.message}</div>
          </div>
        );
        
      default:
        return (
          <div className="execution-log">
            <span className="timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className="message">{JSON.stringify(log)}</span>
          </div>
        );
    }
  };

  return (
    <div className="agent-modal-backdrop">
      <div className="agent-modal execution-modal">
        <div className="agent-modal-header">
          <h3>
            Workflow Execution
            {status === 'running' && <span className="running-indicator">Running...</span>}
            {status === 'completed' && <span className="completed-indicator">Completed</span>}
            {status === 'error' && <span className="error-indicator">Failed</span>}
          </h3>
          <button 
            className="agent-modal-close" 
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        
        <div className="execution-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">{progress}% Complete</div>
        </div>
        
        <div className="agent-modal-content execution-logs">
          {logs.length === 0 ? (
            <div className="no-logs">Waiting for execution to start...</div>
          ) : (
            <>
              {logs.map((log, index) => (
                <div key={index} className="log-entry">
                  {renderLogMessage(log)}
                </div>
              ))}
              <div ref={logsEndRef} />
            </>
          )}
        </div>
        
        {status === 'completed' && result && (
          <div className="execution-result">
            <h4>Final Result</h4>
            <pre>{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
        
        <div className="agent-modal-footer">
          {status === 'completed' && (
            <button 
              className="agent-modal-button save"
              onClick={() => onComplete && onComplete(result)}
            >
              Save Result
            </button>
          )}
          <button 
            className="agent-modal-button cancel" 
            onClick={onClose}
          >
            {status === 'running' ? 'Cancel' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowExecution;