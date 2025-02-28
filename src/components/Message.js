import React from 'react';
import '../styles/Message.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ReactMarkdown from 'react-markdown';

const Message = ({ message, onRegenerate, personas }) => {
  const persona = message.personaId ? personas.find(p => p.id === message.personaId) : null;
  const [showToolDetails, setShowToolDetails] = React.useState(false);

  const renderContent = () => {
    // Handle file content display
    if (message.fileData?.parsedText) {
      return (
        <div className="file-content-preview">
          <div className="file-meta">{message.content}</div>
          <div className="parsed-text">
            {message.fileData.parsedText.substring(0, 500)}...
          </div>
        </div>
      );
    }
    
    // Handle image content
    if (message.isCommand && message.content.includes('<img')) {
      return <div dangerouslySetInnerHTML={{ __html: message.content }} />;
    }
    
    // Handle tool usage display
    if (message.isToolUsage) {
      
      // Parse the content for detailed display
      let toolInput = '';
      let toolResult = '';
      let toolSummary = '';
      
      try {
        // Extract input and result from the content
        const inputMatch = message.content.match(/\*\*Input\*\*: (.*?)(?=\n\*\*Result\*\*|$)/s);
        const resultMatch = message.content.match(/\*\*Result\*\*: (.*)/s);
        
        if (inputMatch && inputMatch[1]) {
          toolInput = inputMatch[1].trim();
        }
        
        if (resultMatch && resultMatch[1]) {
          toolResult = resultMatch[1].trim();
          
          // For dice rolls, extract just the roll result as summary
          if (message.toolName === "Dice Roll" && toolResult.includes('Rolling')) {
            const diceMatch = toolResult.match(/Rolling (.*?):/);
            const resultMatch = toolResult.match(/\[(.*?)\] = (\d+)/);
            
            if (diceMatch && resultMatch) {
              toolSummary = `${diceMatch[1]}: ${resultMatch[2]}`;
            } else {
              toolSummary = toolResult;
            }
          } else {
            // For other tools, just use a generic summary
            toolSummary = `Result: ${toolResult.substring(0, 50)}${toolResult.length > 50 ? '...' : ''}`;
          }
        }
      } catch (error) {
        console.error('Error parsing tool content:', error);
        // Fall back to showing the original content
        toolInput = 'Error parsing input';
        toolResult = message.content;
      }
      
      // Log tool usage in console
      console.log(`Tool used: ${message.toolName}`, {
        input: toolInput,
        result: toolResult,
        message: message
      });
      
      // Special styling for dice rolls
      if (message.toolName === "Dice Roll") {
        return (
          <div className="tool-usage dice-roll">
            <div className="tool-header">
              <div className="tool-header-left">
                <span className="tool-icon">🎲</span>
                <span className="tool-name">{message.toolName}</span>
              </div>
              <button 
                className="tool-toggle" 
                onClick={() => setShowToolDetails(!showToolDetails)}
                aria-label={showToolDetails ? "Hide details" : "Show details"}
              >
                {showToolDetails ? '−' : '+'}
              </button>
            </div>
            {showToolDetails ? (
              <div className="tool-details">
                <strong>Input:</strong> {toolInput}
                <br/>
                <strong>Result:</strong> {toolResult}
              </div>
            ) : (
              <div className="tool-summary">
                {toolSummary || 'Dice rolled'}
              </div>
            )}
          </div>
        );
      }
      
      // Default tool display
      return (
        <div className="tool-usage">
          <div className="tool-header">
            <div className="tool-header-left">
              <span className="tool-icon">🛠️</span>
              <span className="tool-name">{message.toolName}</span>
            </div>
            <button 
              className="tool-toggle" 
              onClick={() => setShowToolDetails(!showToolDetails)}
              aria-label={showToolDetails ? "Hide details" : "Show details"}
            >
              {showToolDetails ? '−' : '+'}
            </button>
          </div>
          {showToolDetails ? (
            <div className="tool-details">
              <strong>Input:</strong> {toolInput}
              <br/>
              <strong>Result:</strong> {toolResult}
            </div>
          ) : (
            <div className="tool-summary">
              {toolSummary || 'Tool used'}
            </div>
          )}
        </div>
      );
    }
    
    // Handle thinking content
    if (message.content.startsWith('<think>') && message.content.endsWith('</think>')) {
      const thinkContent = message.content.slice(7, -8);
      return <ReactMarkdown>{`*${thinkContent}*`}</ReactMarkdown>;
    }
    
    // Default markdown rendering
    return <ReactMarkdown>{message.content}</ReactMarkdown>;
  };

  // Show which tools are available for this persona (for debugging)
  const renderToolInfo = () => {
    if (!persona || !persona.agentSettings?.toolConfig) return null;
    
    const toolConfig = persona.agentSettings.toolConfig;
    const enabledTools = Object.entries(toolConfig)
      .filter(([name, enabled]) => enabled)
      .map(([name]) => name);
    
    if (enabledTools.length === 0) return null;
    
    return (
      <div className="tool-debug-info">
        <span className="tools-label">🛠️ Tools:</span>
        {enabledTools.map(tool => (
          <span key={tool} className="tool-badge">{tool}</span>
        ))}
      </div>
    );
  };

  return (
    <div className={`message ${message.isUser ? 'user' : 'assistant'}`}>
      {persona && (
        <div className="persona-header">
          {persona.image && <img src={persona.image} alt={persona.name} className="persona-avatar" />}
          <span className="persona-name">{persona.name}</span>
          {process.env.NODE_ENV === 'development' && renderToolInfo()}
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
