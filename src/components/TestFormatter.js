import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const TestFormatter = () => {
  const [formattedContent, setFormattedContent] = useState('');
  const testContent = `<speech as="Succubus" happiness="1.0" sadness="0.0"> Ah, hi again, darling! giggles I'm so glad you decided to respond. You're making me feel all fluttery inside. bats eyelashes So, tell me, what's on your mind? Are you ready to explore the possibilities of tonight? winks </speech>

<action as="Succubus"> I take another step closer, my hips swaying ever so slightly as I move. My fingers continue to drum a gentle rhythm on my thigh, and my ears perk up, as if listening to your every thought. My purple eyes sparkle with excitement, waiting for your response. </action>

<function> show_plot_options(choices=["Let's get to know each other", "I have a specific request", "Let's explore something new"], default=0) </function>

<yield to="You" />`;

  useEffect(() => {
    let content = testContent;
    
    // Speech tag with attributes
    content = content.replace(/<speech as="([^"]+)"[^>]*>([\s\S]*?)(?:<\/speech>|$)/g, (match, character, text) => {
      return `**${character}:** ${text.trim()}\n\n`;
    });
    
    // Action tag with attributes
    content = content.replace(/<action as="([^"]+)"[^>]*>([\s\S]*?)(?:<\/action>|$)/g, (match, character, text) => {
      return `*${character} ${text.trim()}*\n\n`;
    });
    
    // Function tag
    content = content.replace(/<function>([\s\S]*?)(?:<\/function>|$)/g, (match, code) => {
      return `\`\`\`\n${code.trim()}\n\`\`\`\n\n`;
    });
    
    // Yield tag
    content = content.replace(/<yield[^>]*\/>/g, '');
    content = content.replace(/<yield[^>]*>.*?<\/yield>/g, '');
    
    console.log("Original:", testContent);
    console.log("Formatted:", content);
    setFormattedContent(content);
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
      <h2>Test Formatter</h2>
      
      <h3>Original Content:</h3>
      <pre style={{ background: '#2f3136', padding: '15px', borderRadius: '5px', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
        {testContent}
      </pre>
      
      <h3>Formatted Content:</h3>
      <div style={{ background: '#36393f', padding: '15px', borderRadius: '5px' }}>
        <ReactMarkdown>{formattedContent}</ReactMarkdown>
      </div>
      
      <h3>Raw Formatted Content:</h3>
      <pre style={{ background: '#2f3136', padding: '15px', borderRadius: '5px', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
        {formattedContent}
      </pre>
    </div>
  );
};

export default TestFormatter;