import React from 'react';
import '../styles/Message.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ReactMarkdown from 'react-markdown';

const Message = ({ message, onRegenerate, personas }) => {
  const persona = message.personaId ? personas.find(p => p.id === message.personaId) : null;

  const renderContent = () => {
    // Handle image content
    if (message.isCommand && message.content.includes('<img')) {
      return <div dangerouslySetInnerHTML={{ __html: message.content }} />;
    }
    
    // Handle thinking content
    if (message.content.startsWith('<think>') && message.content.endsWith('</think>')) {
      const thinkContent = message.content.slice(7, -8);
      return <ReactMarkdown>{`*${thinkContent}*`}</ReactMarkdown>;
    }
    
    // Default markdown rendering
    return <ReactMarkdown>{message.content}</ReactMarkdown>;
  };

  return (
    <div className={`message ${message.isUser ? 'user' : 'assistant'}`}>
      {persona && (
        <div className="persona-header">
          {persona.image && <img src={persona.image} alt={persona.name} className="persona-avatar" />}
          <span className="persona-name">{persona.name}</span>
        </div>
      )}
      <div className="message-content">
        {renderContent()}
      </div>
      <div className="message-actions">
        <CopyToClipboard text={message.content}>
          <button className="copy-button">Copy</button>
        </CopyToClipboard>
        {!message.isUser && !message.isCommand && (
          <button className="regenerate-button" onClick={() => onRegenerate(message)}>
            🔄 Regenerate
          </button>
        )}
      </div>
    </div>
  );
};

export default Message;
