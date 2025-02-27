import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

// Icons for action node
const getGoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="white" />
  </svg>
);

const getSlackIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="white" />
  </svg>
);

const getJiraIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path d="M11.571 11.513H0a5.98 5.98 0 0 0 5.984 5.984h5.594v-5.984zm5.987-5.983H11.57v5.983h5.987A5.98 5.98 0 0 0 23.545 5.53zm0 11.966h-5.987v5.984h5.987A5.98 5.98 0 0 0 23.545 17.496z" fill="white" />
  </svg>
);

const getPlusIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

// Action node component
const ActionNode = ({ data }) => {
  const nodeColorClass = data.color || '';
  
  const getNodeIcon = () => {
    switch (data.icon) {
      case 'google':
        return getGoogleIcon();
      case 'slack':
        return getSlackIcon();
      case 'jira':
        return getJiraIcon();
      default:
        return null;
    }
  };

  return (
    <div 
      className={`agent-flow-node action ${nodeColorClass}`}
      title={data.label}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="a"
        style={{ background: '#fff' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        style={{ background: '#fff' }}
      />
      <div className="node-label">{data.label}</div>
      <div className="node-icons">
        {getNodeIcon()}
      </div>
      <div className="node-add-icon" title="Add action">
        {getPlusIcon()}
      </div>
    </div>
  );
};

export default memo(ActionNode);