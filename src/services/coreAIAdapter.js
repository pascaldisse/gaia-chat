/**
 * Adapter for connecting to Python Core AI Engine
 * This replaces the direct LangChain usage with calls to the Python API
 */

import axios from 'axios';
import { EventSource } from 'eventsource';

const CORE_AI_ENGINE_URL = process.env.CORE_AI_ENGINE_URL || 'http://localhost:8000';

class CoreAIAdapter {
  constructor(baseURL = CORE_AI_ENGINE_URL) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Check if the engine is running
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('Core AI Engine health check failed:', error);
      return false;
    }
  }

  /**
   * Simple chat without personas
   */
  async chat({ message, model, systemPrompt, history, onToken }) {
    try {
      if (onToken) {
        // Use streaming
        return this.streamChat({ message, model, systemPrompt, history, onToken });
      }

      const response = await this.client.post('/chat', {
        message,
        model,
        system_prompt: systemPrompt,
        history,
        stream: false,
      });

      return response.data.response;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  /**
   * Stream chat response
   */
  async streamChat({ message, model, systemPrompt, history, onToken }) {
    const response = await fetch(`${this.baseURL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        model,
        system_prompt: systemPrompt,
        history,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      result += chunk;
      if (onToken) {
        onToken(chunk);
      }
    }

    return result;
  }

  /**
   * Create a persona
   */
  async createPersona({ id, name, systemPrompt, model, temperature, tools, attributes }) {
    try {
      const response = await this.client.post('/personas', {
        id,
        name,
        system_prompt: systemPrompt,
        model,
        temperature,
        tools,
        attributes,
      });

      return response.data;
    } catch (error) {
      console.error('Create persona error:', error);
      throw error;
    }
  }

  /**
   * Chat with a specific persona
   */
  async chatWithPersona({ personaId, message, includeHistory = true, onToken }) {
    try {
      if (onToken) {
        // Use streaming
        return this.streamPersonaChat({ personaId, message, includeHistory, onToken });
      }

      const response = await this.client.post(`/personas/${personaId}/chat`, {
        message,
        persona_id: personaId,
        include_history: includeHistory,
        stream: false,
      });

      return response.data;
    } catch (error) {
      console.error('Persona chat error:', error);
      throw error;
    }
  }

  /**
   * Stream persona chat response
   */
  async streamPersonaChat({ personaId, message, includeHistory, onToken }) {
    const response = await fetch(`${this.baseURL}/personas/${personaId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        persona_id: personaId,
        include_history: includeHistory,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      result += chunk;
      if (onToken) {
        onToken(chunk);
      }
    }

    return result;
  }

  /**
   * Process query through hive mind
   */
  async processHiveMind({ query, attributes, summaryModel, parallel = true, onAttributeUpdate, onSummaryUpdate }) {
    try {
      const response = await this.client.post('/hive_mind', {
        query,
        attributes,
        summary_model: summaryModel,
        parallel,
        stream: false,
      });

      return response.data;
    } catch (error) {
      console.error('Hive mind error:', error);
      throw error;
    }
  }

  /**
   * Execute a tool
   */
  async executeTool(toolName, args) {
    try {
      const response = await this.client.post('/tools/execute', {
        tool_name: toolName,
        arguments: args,
      });

      return response.data.result;
    } catch (error) {
      console.error('Tool execution error:', error);
      throw error;
    }
  }

  /**
   * List available models
   */
  async listModels() {
    try {
      const response = await this.client.get('/models');
      return response.data;
    } catch (error) {
      console.error('List models error:', error);
      throw error;
    }
  }

  /**
   * List available tools
   */
  async listTools() {
    try {
      const response = await this.client.get('/tools');
      return response.data.tools;
    } catch (error) {
      console.error('List tools error:', error);
      throw error;
    }
  }

  /**
   * List personas
   */
  async listPersonas() {
    try {
      const response = await this.client.get('/personas');
      return response.data.personas;
    } catch (error) {
      console.error('List personas error:', error);
      throw error;
    }
  }

  /**
   * Create WebSocket connection for real-time chat
   */
  createWebSocketConnection(personaId, handlers) {
    const ws = new WebSocket(`${this.baseURL.replace('http', 'ws')}/ws/chat/${personaId}`);

    ws.onopen = () => {
      console.log(`WebSocket connected to persona ${personaId}`);
      if (handlers.onOpen) handlers.onOpen();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (handlers.onMessage) handlers.onMessage(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (handlers.onError) handlers.onError(error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      if (handlers.onClose) handlers.onClose();
    };

    return {
      send: (message, includeHistory = true) => {
        ws.send(JSON.stringify({ message, include_history: includeHistory }));
      },
      close: () => ws.close(),
    };
  }
}

// Export singleton instance
export const coreAI = new CoreAIAdapter();

// Export class for custom instances
export default CoreAIAdapter;