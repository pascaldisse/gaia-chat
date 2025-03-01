import React, { useState, useEffect, useRef } from 'react';
import '../styles/Message.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ReactMarkdown from 'react-markdown';
import { generateSpeech } from '../services/voiceService';

const Message = ({ message, onRegenerate, personas }) => {
  const persona = message.personaId ? personas.find(p => p.id === message.personaId) : null;
  const [showToolDetails, setShowToolDetails] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Function to generate and play TTS audio
  const handlePlayAudio = async () => {
    // If already playing, pause
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    
    // If we have already generated the audio
    if (audioUrl) {
      console.log("Using cached audio URL:", audioUrl);
      try {
        await audioRef.current.play();
        console.log("Audio playback started");
        setIsPlaying(true);
      } catch (err) {
        console.error("Error playing cached audio:", err);
        setIsPlaying(false);
        // Clear cached URL to try regenerating
        setAudioUrl(null);
        // Try again with fresh audio
        handlePlayAudio();
      }
      return;
    }
    
    // Otherwise, generate new audio
    // Use the correct Zonos TTS voice IDs
    // Default to random voice if none is set
    let voiceToUse = "random";
    
    // In production, this would use the persona's configured voice:
    // const voiceToUse = persona?.voiceId || "random";
    
    // For demonstration, assign specific voices based on persona name
    if (persona) {
      if (persona.name === "GAIA") {
        voiceToUse = "american_female"; // American female voice for GAIA
      } else if (persona.name.includes("Science")) {
        voiceToUse = "british_male"; // British male voice for Science personas
      } else if (persona.name.includes("Art")) {
        voiceToUse = "british_female"; // British female voice for Art personas
      } else if (persona.name.includes("Business")) {
        voiceToUse = "american_male"; // American male voice for Business personas
      }
    }
    
    console.log("Generating new audio for message from persona:", persona?.name || "Unknown", "using voiceId:", voiceToUse);
    
    setIsLoadingAudio(true);
    try {
      // Get plain text content without markdown for better speech
      let textContent = message.content;
      
      // Remove markdown artifacts
      textContent = textContent.replace(/\*\*/g, ''); // Remove bold markers
      textContent = textContent.replace(/\n/g, ' '); // Replace newlines with spaces
      textContent = textContent.replace(/```[^`]*```/g, ''); // Remove code blocks
      textContent = textContent.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Replace markdown links with just text
      
      console.log("Sending text to TTS:", textContent.substring(0, 50) + "...");
      
      // Generate speech using the Zonos TTS voice ID
      const url = await generateSpeech(textContent, voiceToUse);
      console.log("Generated audio URL:", url ? (typeof url === 'string' ? url.substring(0, 50) + "..." : "[blob URL]") : "null");
      
      if (url) {
        setAudioUrl(url);
        
        // Play the audio after a short delay to ensure it's loaded
        setTimeout(() => {
          if (audioRef.current) {
            console.log("Playing generated audio");
            audioRef.current.play()
              .then(() => {
                console.log("Audio playback started successfully");
                setIsPlaying(true);
              })
              .catch(err => {
                console.error("Error playing generated audio:", err);
                setIsPlaying(false);
                setIsLoadingAudio(false);
              });
          }
        }, 500); // Increased delay for better loading
      } else {
        console.warn("No audio URL returned from speech generation");
        setIsLoadingAudio(false);
      }
    } catch (error) {
      console.error("Error in audio processing:", error);
      setIsLoadingAudio(false);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Handle audio playback events
  useEffect(() => {
    const audio = audioRef.current;
    
    const handleEnded = () => {
      setIsPlaying(false);
    };
    
    if (audio) {
      audio.addEventListener('ended', handleEnded);
      return () => {
        audio.removeEventListener('ended', handleEnded);
        // Cleanup audio URL when component unmounts
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
      };
    }
  }, [audioUrl]);

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

  // Hidden audio element for TTS playback
  const renderAudio = () => {
    return (
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        onEnded={() => setIsPlaying(false)}
        onError={(e) => {
          console.error("Audio playback error:", e);
          setIsPlaying(false);
          // Clear the URL on error to force regeneration next time
          setAudioUrl(null);
          
          // For demo, show an error message
          console.warn("Failed to play audio - likely a CORS issue with the fallback service");
        }}
        crossOrigin="anonymous" // Add CORS support for external URLs
      />
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
        {renderAudio()}
      </div>
      <div className="message-actions">
        <CopyToClipboard text={message.content}>
          <button className="copy-button">Copy</button>
        </CopyToClipboard>
        {!message.isUser && !message.isCommand && !message.isToolUsage && (
          <>
            <button className="regenerate-button" onClick={() => onRegenerate(message)}>
              🔄 Regenerate
            </button>
            {/* Always show the play button for assistant messages, regardless of voice setting */}
            <button 
              className={`voice-button ${isPlaying ? 'playing' : ''} ${isLoadingAudio ? 'loading' : ''}`}
              onClick={handlePlayAudio}
              disabled={isLoadingAudio}
              aria-label={isPlaying ? "Pause voice" : "Play voice"}
            >
              {isLoadingAudio ? (
                <span className="loading-indicator">⏳</span>
              ) : isPlaying ? (
                <span>⏸️ Pause</span>
              ) : (
                <span>🔊 Play</span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Message;
