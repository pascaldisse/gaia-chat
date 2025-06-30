/**
 * GaiaEngine - LangChain Integration for GaiaScript LLM
 * Integrates fine-tuned MLX Llama 3.2-3B model with LangChain
 */

import { LLM } from "@langchain/core/language_models/llms";
import { spawn } from 'child_process';
import path from 'path';

/**
 * Custom LangChain LLM wrapper for MLX-based GaiaScript model
 */
export class GaiaScriptLLM extends LLM {
    constructor(options = {}) {
        super(options);
        this.modelPath = options.modelPath || "mlx-community/Llama-3.2-3B-Instruct-4bit";
        this.adapterPath = options.adapterPath || "../../../axlearn-gaiascript-training/adapters/gaiascript";
        this.maxTokens = options.maxTokens || 200;
        this.temperature = options.temperature || 0.7;
        this.pythonScript = options.pythonScript || "../../../axlearn-gaiascript-training/gaiascript_generator.py";
    }

    get _llmType() {
        return "gaiascript-mlx";
    }

    /**
     * Generate GaiaScript code using the fine-tuned MLX model
     * @param {string} prompt - The prompt for code generation
     * @param {Object} options - Generation options
     * @returns {Promise<string>} Generated GaiaScript code
     */
    async _call(prompt, options = {}) {
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn('python3', [
                this.pythonScript,
                '--prompt', prompt,
                '--max-tokens', this.maxTokens.toString(),
                '--temperature', this.temperature.toString()
            ]);

            let output = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        // Parse the JSON response from Python script
                        const result = JSON.parse(output);
                        resolve(result.generated_code || result.response || output);
                    } catch (e) {
                        // If not JSON, return raw output
                        resolve(output.trim());
                    }
                } else {
                    reject(new Error(`Python process failed with code ${code}: ${errorOutput}`));
                }
            });

            pythonProcess.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });
    }

    /**
     * Generate function code in GaiaScript
     * @param {string} functionName - Name of the function
     * @param {string} description - Description of what the function should do
     * @returns {Promise<string>} Generated GaiaScript function
     */
    async generateFunction(functionName, description) {
        const prompt = `Create a GaiaScript function named "${functionName}" that ${description}. Use GaiaScript mathematical symbols and proper λ⟨⟩ syntax.`;
        return await this._call(prompt);
    }

    /**
     * Generate component code in GaiaScript
     * @param {string} componentName - Name of the component
     * @param {string} description - Description of the component
     * @returns {Promise<string>} Generated GaiaScript component
     */
    async generateComponent(componentName, description) {
        const prompt = `Create a GaiaScript UI component named "${componentName}" that ${description}. Use Ω⟨✱⟩ for main interface, Φ{} for styling, and mathematical symbols.`;
        return await this._call(prompt);
    }

    /**
     * Generate state declaration in GaiaScript
     * @param {Object} stateSpec - State specification
     * @returns {Promise<string>} Generated GaiaScript state
     */
    async generateState(stateSpec) {
        const prompt = `Create a GaiaScript state declaration with these properties: ${JSON.stringify(stateSpec)}. Use Σ⟨⟩ syntax and mathematical symbols for numbers.`;
        return await this._call(prompt);
    }
}

/**
 * Main GaiaEngine class - orchestrates LLM operations
 */
export class GaiaEngine {
    constructor(options = {}) {
        this.llm = new GaiaScriptLLM(options.llmOptions || {});
        this.conversationHistory = [];
        this.systemPrompt = options.systemPrompt || `You are a GaiaScript programming assistant. Generate code using GaiaScript's mathematical symbol syntax:
- Functions: λ⟨name, params⟩ body ⟨/λ⟩
- State: Σ⟨var: value⟩
- Components: Ω⟨✱⟩ content ⟨/Ω⟩
- Styling: Φ{styles}
- Numbers: ⊗∅=0, ⊗α=1, ⊗β=2, etc.
- Symbols: ◐=center, ☰=flex, ⬛=solid`;
    }

    /**
     * Chat with the GaiaScript LLM
     * @param {string} message - User message
     * @param {Object} options - Chat options
     * @returns {Promise<Object>} Chat response with generated code
     */
    async chat(message, options = {}) {
        try {
            // Add system prompt to conversation if first message
            if (this.conversationHistory.length === 0) {
                this.conversationHistory.push({
                    role: 'system',
                    content: this.systemPrompt
                });
            }

            // Add user message to history
            this.conversationHistory.push({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });

            // Create full prompt with context
            const fullPrompt = this.buildPrompt(message, options);

            // Generate response using LLM
            const response = await this.llm._call(fullPrompt, options);

            // Add assistant response to history
            this.conversationHistory.push({
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                response: response,
                conversationId: this.conversationHistory.length,
                metadata: {
                    model: this.llm.modelPath,
                    timestamp: new Date().toISOString(),
                    tokens: response.length
                }
            };

        } catch (error) {
            console.error('GaiaEngine chat error:', error);
            return {
                success: false,
                error: error.message,
                response: "Sorry, I encountered an error generating GaiaScript code."
            };
        }
    }

    /**
     * Generate specific GaiaScript code types
     * @param {string} type - Type of code (function, component, state, etc.)
     * @param {Object} spec - Specification for the code
     * @returns {Promise<Object>} Generated code response
     */
    async generateCode(type, spec) {
        try {
            let generatedCode;

            switch (type.toLowerCase()) {
                case 'function':
                    generatedCode = await this.llm.generateFunction(spec.name, spec.description);
                    break;
                case 'component':
                    generatedCode = await this.llm.generateComponent(spec.name, spec.description);
                    break;
                case 'state':
                    generatedCode = await this.llm.generateState(spec);
                    break;
                default:
                    generatedCode = await this.llm._call(`Create a GaiaScript ${type}: ${JSON.stringify(spec)}`);
            }

            return {
                success: true,
                code: generatedCode,
                type: type,
                spec: spec,
                metadata: {
                    timestamp: new Date().toISOString(),
                    model: this.llm.modelPath
                }
            };

        } catch (error) {
            console.error('GaiaEngine code generation error:', error);
            return {
                success: false,
                error: error.message,
                type: type,
                spec: spec
            };
        }
    }

    /**
     * Build full prompt with conversation context
     * @param {string} currentMessage - Current user message
     * @param {Object} options - Prompt options
     * @returns {string} Full prompt with context
     */
    buildPrompt(currentMessage, options = {}) {
        let prompt = this.systemPrompt + "\n\n";

        // Add recent conversation history (last 5 exchanges)
        const recentHistory = this.conversationHistory.slice(-10);
        for (const message of recentHistory) {
            if (message.role !== 'system') {
                prompt += `${message.role}: ${message.content}\n`;
            }
        }

        prompt += `user: ${currentMessage}\nassistant:`;
        return prompt;
    }

    /**
     * Clear conversation history
     */
    clearHistory() {
        this.conversationHistory = [];
    }

    /**
     * Get conversation history
     * @returns {Array} Conversation history
     */
    getHistory() {
        return this.conversationHistory;
    }

    /**
     * Set system prompt
     * @param {string} prompt - New system prompt
     */
    setSystemPrompt(prompt) {
        this.systemPrompt = prompt;
        this.clearHistory(); // Clear history when changing system prompt
    }

    /**
     * Get model information
     * @returns {Object} Model information
     */
    getModelInfo() {
        return {
            type: 'GaiaScript MLX LLM',
            model: this.llm.modelPath,
            adapter: this.llm.adapterPath,
            framework: 'MLX + LangChain',
            capabilities: [
                'GaiaScript code generation',
                'Mathematical symbol syntax',
                'UI component creation',
                'Function generation',
                'State management'
            ]
        };
    }
}

// Export default instance
export default GaiaEngine;