import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

// Decision node component
const DecisionNode = ({ data }) => {
  return (
    <div className="agent-flow-node decision" title={data.label}>
      <Handle
        type="target"
        position={Position.Top}
        id="a"
        style={{ background: '#fff', transform: 'rotate(45deg)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="b"
        style={{ background: '#fff', transform: 'rotate(45deg)' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="c"
        style={{ background: '#fff', transform: 'rotate(45deg)' }}
      />
      <div className="node-label">{data.label}</div>
    </div>
  );
};

export default memo(DecisionNode);