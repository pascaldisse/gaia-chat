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

describe('Message Component Formatting', () => {
  // Test basic message rendering
  test('renders a message correctly', () => {
    const message = {
      content: 'Hello, world!',
      isUser: false,
      personaId: 'persona1'
    };
    
    const personas = [
      { id: 'persona1', name: 'Test Persona', formatSettings: { useRoleplayMarkdown: true } }
    ];
    
    const { container } = render(
      <Message message={message} personas={personas} onRegenerate={() => {}} />
    );
    
    expect(screen.getByText('Test Persona')).toBeInTheDocument();
    expect(container.querySelector('.message-content')).toHaveTextContent('Hello, world!');
  });

  // Test <speech> tag formatting
  test('formats <speech> tags correctly', async () => {
    const speechContent = '<speech as="Succubus" seduction="0.5" happiness="0.5">Hello, darling!</speech>';
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
    expect(markdownContent).toHaveTextContent('**Succubus:** Hello, darling!');
  });

  // Test <action> tag formatting
  test('formats <action> tags correctly', async () => {
    const actionContent = '<action as="Demon" anger="0.8" power="1.0">slams fist on table</action>';
    const message = {
      content: actionContent,
      isUser: false,
      personaId: 'persona2'
    };
    
    const personas = [
      { 
        id: 'persona2', 
        name: 'Demon', 
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
    expect(markdownContent).toHaveTextContent('*Demon slams fist on table*');
  });

  // Test multiple mixed tags
  test('formats mixed tags correctly', async () => {
    const mixedContent = `
      <speech as="Wizard" wisdom="0.9">I sense a disturbance in the magical field.</speech>
      <action as="Wizard" concentration="1.0">waves staff in circular motion</action>
      <function>detectMagicalAnomaly(location);</function>
    `;
    
    const message = {
      content: mixedContent,
      isUser: false,
      personaId: 'persona3'
    };
    
    const personas = [
      { 
        id: 'persona3', 
        name: 'Wizard', 
        formatSettings: { useRoleplayMarkdown: true }
      }
    ];
    
    const { container } = render(
      <Message message={message} personas={personas} onRegenerate={() => {}} />
    );
    
    // Click the format button
    await clickFormatButton(container);
    
    // Check that all content types were formatted correctly
    const markdownContent = container.querySelector('[data-testid="markdown-content"]');
    const content = markdownContent.textContent;
    
    expect(content).toContain('**Wizard:** I sense a disturbance in the magical field.');
    expect(content).toContain('*Wizard waves staff in circular motion*');
    expect(content).toContain('detectMagicalAnomaly(location);');
  });

  // Test with different attribute positions
  test('formats tags with different attribute positions correctly', async () => {
    const content = `
      <speech seduction="0.7" as="Succubus" happiness="0.3">Come closer, my dear...</speech>
      <action energy="high" as="Warrior" confidence="1.0">draws sword dramatically</action>
    `;
    
    const message = {
      content,
      isUser: false,
      personaId: 'persona4'
    };
    
    const personas = [
      { 
        id: 'persona4', 
        name: 'MultiPersona', 
        formatSettings: { useRoleplayMarkdown: true }
      }
    ];
    
    const { container } = render(
      <Message message={message} personas={personas} onRegenerate={() => {}} />
    );
    
    // Click the format button
    await clickFormatButton(container);
    
    // Check that the content was formatted correctly regardless of attribute position
    const markdownContent = container.querySelector('[data-testid="markdown-content"]');
    const renderedContent = markdownContent.textContent;
    
    expect(renderedContent).toContain('**Succubus:** Come closer, my dear...');
    expect(renderedContent).toContain('*Warrior draws sword dramatically*');
  });

  // Test with single quotes in attributes
  test('formats tags with single quotes in attributes correctly', async () => {
    const content = `
      <speech as='Dragon' mood='angry'>You dare disturb my slumber?</speech>
      <action as='Dragon' intensity='high'>breathes fire menacingly</action>
    `;
    
    const message = {
      content,
      isUser: false,
      personaId: 'persona5'
    };
    
    const personas = [
      { 
        id: 'persona5', 
        name: 'Dragon', 
        formatSettings: { useRoleplayMarkdown: true }
      }
    ];
    
    const { container } = render(
      <Message message={message} personas={personas} onRegenerate={() => {}} />
    );
    
    // Click the format button
    await clickFormatButton(container);
    
    // Check that the content was formatted correctly with single quotes
    const markdownContent = container.querySelector('[data-testid="markdown-content"]');
    const renderedContent = markdownContent.textContent;
    
    expect(renderedContent).toContain('**Dragon:** You dare disturb my slumber?');
    expect(renderedContent).toContain('*Dragon breathes fire menacingly*');
  });

  // Test with custom formatting rules
  test('applies custom formatting rules when enabled', async () => {
    const content = `<custom>This is custom formatted content</custom>`;
    
    const message = {
      content,
      isUser: false,
      personaId: 'persona6'
    };
    
    const customFormatRule = {
      name: 'Custom Format',
      enabled: true,
      startTag: '<custom>',
      endTag: '</custom>',
      markdownFormat: '✨ {{content}} ✨'
    };
    
    const personas = [
      { 
        id: 'persona6', 
        name: 'CustomFormatter', 
        formatSettings: { 
          useRoleplayMarkdown: true,
          customFormatting: true,
          formatRules: [customFormatRule]
        }
      }
    ];
    
    const { container } = render(
      <Message message={message} personas={personas} onRegenerate={() => {}} />
    );
    
    // Click the format button
    await clickFormatButton(container);
    
    // Check that the custom format rule was applied
    const markdownContent = container.querySelector('[data-testid="markdown-content"]');
    expect(markdownContent).toHaveTextContent('✨ This is custom formatted content ✨');
  });

  // Test with persona that has formatting disabled
  test('does not format content when formatting is disabled', async () => {
    const content = `<speech as="Character">This should not be formatted</speech>`;
    
    const message = {
      content,
      isUser: false,
      personaId: 'persona7'
    };
    
    const personas = [
      { 
        id: 'persona7', 
        name: 'NoFormat', 
        formatSettings: { 
          useRoleplayMarkdown: false,
          customFormatting: false
        }
      }
    ];
    
    const { container } = render(
      <Message message={message} personas={personas} onRegenerate={() => {}} />
    );
    
    // Click the format button
    await clickFormatButton(container);
    
    // The content should remain unchanged
    const markdownContent = container.querySelector('[data-testid="markdown-content"]');
    expect(markdownContent).toHaveTextContent('<speech as="Character">This should not be formatted</speech>');
  });

  // Test with deeply nested tags and complex content
  test('formats complex nested content correctly', async () => {
    const complexContent = `
      <speech as="Narrator" tone="formal">
        Welcome to the story. Today we'll follow the adventures of our heroes.
        <yield type="thinking" />
        Let's begin with their introduction.
      </speech>
      
      <action as="Knight" boldness="0.8">stands tall with sword drawn</action>
      
      <speech as="Knight" confidence="1.0" heroism="0.9">
        I am Sir Galahad, protector of the realm and servant to the crown.
        <function>
          displayHeroStats('Knight', {
            strength: 18,
            dexterity: 14,
            constitution: 16
          });
        </function>
        Now, let us proceed on our quest!
      </speech>
    `;
    
    const message = {
      content: complexContent,
      isUser: false,
      personaId: 'persona8'
    };
    
    const personas = [
      { 
        id: 'persona8', 
        name: 'ComplexNarrator', 
        formatSettings: { useRoleplayMarkdown: true }
      }
    ];
    
    const { container } = render(
      <Message message={message} personas={personas} onRegenerate={() => {}} />
    );
    
    // Click the format button
    await clickFormatButton(container);
    
    // Check that the complex content was formatted correctly
    const markdownContent = container.querySelector('[data-testid="markdown-content"]');
    const content = markdownContent.textContent;
    
    expect(content).toContain('**Narrator:** Welcome to the story.');
    expect(content).toContain('*Knight stands tall with sword drawn*');
    expect(content).toContain('**Knight:** I am Sir Galahad');
    expect(content).toContain('displayHeroStats');
    // Yield tags should be removed
    expect(content).not.toContain('<yield');
  });
});