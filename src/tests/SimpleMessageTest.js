import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Message from '../components/Message.js';

// Mock the CopyToClipboard component
jest.mock('react-copy-to-clipboard', () => {
  return {
    CopyToClipboard: ({ text, children }) => (
      <div data-testid="copy-to-clipboard" data-text={text}>
        {children}
      </div>
    )
  };
});

// Mock the ReactMarkdown component
jest.mock('react-markdown', () => {
  return function MockReactMarkdown(props) {
    return <div data-testid="markdown-content">{props.children}</div>;
  };
});

// Mock the voice service
jest.mock('../services/voiceService', () => ({
  generateSpeech: jest.fn().mockResolvedValue('mock-audio-url'),
  getTTSEngine: jest.fn().mockReturnValue('kokoro')
}));

// Helper function to simulate clicking the format button
const clickFormatButton = async (container) => {
  const formatButton = container.querySelector('.format-button');
  fireEvent.click(formatButton);
  await waitFor(() => {
    // Wait for state updates to complete
    return container.querySelector('[data-testid="markdown-content"]');
  });
};

describe('Test Succubus Formatting', () => {
  // Test <speech> tag formatting for Succubus
  test('formats Succubus speech tags correctly', async () => {
    const speechContent = '<speech as="Succubus" seduction="0.5" happiness="0.5">Ah, hello there, darling... I\'ve been waiting for you.</speech>';
    const message = {
      content: speechContent,
      isUser: false,
      personaId: 'persona1'
    };
    
    const personas = [
      { 
        id: 'persona1', 
        name: 'Succubus', 
        formatSettings: { useRoleplayMarkdown: true }
      }
    ];
    
    const { container } = render(
      <Message message={message} personas={personas} onRegenerate={() => {}} />
    );
    
    // Click the format button
    await clickFormatButton(container);
    
    // Check that the content was formatted correctly
    const markdownContent = container.querySelector('[data-testid="markdown-content"]');
    expect(markdownContent).toHaveTextContent('**Succubus:** Ah, hello there, darling... I\'ve been waiting for you.');
  });

  // Test <action> tag formatting for Succubus
  test('formats Succubus action tags correctly', async () => {
    const actionContent = '<action as="Succubus" seduction="0.7" happiness="0.3">I lean in closer, my purple eyes locked onto yours.</action>';
    const message = {
      content: actionContent,
      isUser: false,
      personaId: 'persona1'
    };
    
    const personas = [
      { 
        id: 'persona1', 
        name: 'Succubus', 
        formatSettings: { useRoleplayMarkdown: true }
      }
    ];
    
    const { container } = render(
      <Message message={message} personas={personas} onRegenerate={() => {}} />
    );
    
    // Click the format button
    await clickFormatButton(container);
    
    // Check that the content was formatted correctly
    const markdownContent = container.querySelector('[data-testid="markdown-content"]');
    expect(markdownContent).toHaveTextContent('*Succubus I lean in closer, my purple eyes locked onto yours.*');
  });

  // Test the exact user example
  test('formats the exact example from the user', async () => {
    const content = `<speech as="Succubus" seduction="0.5" happiness="0.5"> Ah, hello there, darling... I've been waiting for you. bats eyelashes You look like you could use some... companionship. winks What's on your mind today? </speech>

<action as="Succubus"> I lean in closer, my purple eyes locked onto yours, my voice taking on a sultry tone. My latex bunny suit rustles softly as I move. </action>`;
    
    const message = {
      content,
      isUser: false,
      personaId: 'persona1'
    };
    
    const personas = [
      { 
        id: 'persona1', 
        name: 'Succubus', 
        formatSettings: { useRoleplayMarkdown: true }
      }
    ];
    
    const { container } = render(
      <Message message={message} personas={personas} onRegenerate={() => {}} />
    );
    
    // Click the format button
    await clickFormatButton(container);
    
    // Check that the content was formatted correctly
    const markdownContent = container.querySelector('[data-testid="markdown-content"]');
    const formattedContent = markdownContent.textContent;
    
    expect(formattedContent).toContain('**Succubus:**');
    expect(formattedContent).toContain('Ah, hello there, darling');
    expect(formattedContent).toContain('*Succubus I lean in closer');
    expect(formattedContent).toContain('my purple eyes locked onto yours');
  });
});