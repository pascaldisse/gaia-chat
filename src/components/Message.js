import React from 'react';
import '../styles/Message.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ReactMarkdown from 'react-markdown';

const Message = ({ message, onRegenerate }) => {
  const renderContent = () => {
    if (message.content.startsWith('<think>') && message.content.endsWith('</think>')) {
      const thinkContent = message.content.slice(7, -8);
      return <ReactMarkdown>{`*${thinkContent}*`}</ReactMarkdown>;
    }
    return <ReactMarkdown>{message.content}</ReactMarkdown>;
  };

  return (
    <div className={`message ${message.isUser ? 'user' : 'assistant'}`}>
      <div className="message-content">
        {renderContent()}
      </div>
      <div className="message-actions">
        <CopyToClipboard text={message.content}>
          <button className="copy-button">Copy</button>
        </CopyToClipboard>
        {!message.isUser && (
          <button className="regenerate-button" onClick={() => onRegenerate(message)}>
            🔄 Regenerate
          </button>
        )}
      </div>
    </div>
  );
};

export default Message;
