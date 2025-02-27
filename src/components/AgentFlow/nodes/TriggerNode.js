import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

// Icons for trigger node
const getLightningIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
    <path d="M13 3v7h5.586L11 17.586V10H5.414L13 3z" />
  </svg>
);

const getDocumentIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V4h7z" />
  </svg>
);

// Trigger node component
const TriggerNode = ({ data }) => {
  return (
    <div className="agent-flow-node trigger" title={data.label}>
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        style={{ background: '#fff' }}
      />
      <div className="node-label">{data.label}</div>
      <div className="node-icons">
        {data.icon === 'lightning-bolt' && getLightningIcon()}
        {data.secondaryIcon === 'document' && getDocumentIcon()}
      </div>
    </div>
  );
};

export default memo(TriggerNode);