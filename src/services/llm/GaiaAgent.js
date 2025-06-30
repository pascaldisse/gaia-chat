/**
 * GaiaAgent - LangChain Agent for GaiaScript Development
 * Implements agent pattern with tools for GaiaScript code generation
 */

import { AgentExecutor, createReactAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { Tool } from "@langchain/core/tools";
import { GaiaScriptLLM } from "./GaiaEngine.js";
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Tool for generating GaiaScript functions
 */
export class GaiaScriptFunctionTool extends Tool {
    constructor() {
        super();
        this.name = "gaiascript_function";
        this.description = "Generate a GaiaScript function with mathematical symbols. Input should be: {name: 'functionName', description: 'what the function does', params: ['param1', 'param2']}";
    }

    async _call(input) {
        try {
            const spec = typeof input === 'string' ? JSON.parse(input) : input;
            const { name, description, params = [] } = spec;
            
            // Create GaiaScript function template
            const paramStr = params.length > 0 ? `, ${params.join(', ')}` : '';
            const prompt = `Create a GaiaScript function named "${name}" that ${description}. Parameters: ${params.join(', ')}`;
            
            // Use the Python service to generate
            const result = await this.callGaiaScriptService(prompt);
            return result;
        } catch (error) {
            return `Error generating function: ${error.message}`;
        }
    }

    async callGaiaScriptService(prompt) {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(path.dirname(import.meta.url.replace('file://', '')), 'gaiascript_service.py');
            const pythonProcess = spawn('python3', [scriptPath, '--prompt', prompt, '--json']);

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
                        const result = JSON.parse(output);
                        resolve(result.generated_code || result.response || 'Generated code');
                    } catch (e) {
                        resolve(output.trim());
                    }
                } else {
                    reject(new Error(`Service failed: ${errorOutput}`));
                }
            });

            pythonProcess.on('error', (error) => {
                reject(error);
            });
        });
    }
}

/**
 * Tool for generating GaiaScript UI components
 */
export class GaiaScriptComponentTool extends Tool {
    constructor() {
        super();
        this.name = "gaiascript_component";
        this.description = "Generate a GaiaScript UI component with styling. Input should be: {name: 'ComponentName', description: 'what the component does', props: ['prop1', 'prop2']}";
    }

    async _call(input) {
        try {
            const spec = typeof input === 'string' ? JSON.parse(input) : input;
            const { name, description, props = [] } = spec;
            
            const prompt = `Create a GaiaScript UI component named "${name}" that ${description}. Use Ω⟨✱⟩ for main interface and Φ{} for styling. Props: ${props.join(', ')}`;
            
            const result = await this.callGaiaScriptService(prompt);
            return result;
        } catch (error) {
            return `Error generating component: ${error.message}`;
        }
    }

    async callGaiaScriptService(prompt) {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(path.dirname(import.meta.url.replace('file://', '')), 'gaiascript_service.py');
            const pythonProcess = spawn('python3', [scriptPath, '--prompt', prompt, '--json']);

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
                        const result = JSON.parse(output);
                        resolve(result.generated_code || result.response || 'Generated component');
                    } catch (e) {
                        resolve(output.trim());
                    }
                } else {
                    reject(new Error(`Service failed: ${errorOutput}`));
                }
            });

            pythonProcess.on('error', (error) => {
                reject(error);
            });
        });
    }
}

/**
 * Tool for compiling GaiaScript to JavaScript
 */
export class GaiaScriptCompilerTool extends Tool {
    constructor() {
        super();
        this.name = "gaiascript_compile";
        this.description = "Compile GaiaScript code to JavaScript. Input should be GaiaScript source code.";
    }

    async _call(input) {
        try {
            // Write GaiaScript to temporary file
            const tempFile = `/tmp/temp_${Date.now()}.gaia`;
            fs.writeFileSync(tempFile, input);

            // Use the restart.sh script to compile
            return new Promise((resolve, reject) => {
                const compileProcess = spawn('bash', ['../../../restart.sh'], {
                    cwd: path.dirname(tempFile)
                });

                let output = '';
                let errorOutput = '';

                compileProcess.stdout.on('data', (data) => {
                    output += data.toString();
                });

                compileProcess.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                compileProcess.on('close', (code) => {
                    // Clean up temp file
                    try {
                        fs.unlinkSync(tempFile);
                    } catch (e) {
                        // Ignore cleanup errors
                    }

                    if (code === 0) {
                        resolve(`Compilation successful: ${output}`);
                    } else {
                        resolve(`Compilation failed: ${errorOutput}`);
                    }
                });

                compileProcess.on('error', (error) => {
                    reject(error);
                });
            });
        } catch (error) {
            return `Error compiling GaiaScript: ${error.message}`;
        }
    }
}

/**
 * Tool for GaiaScript symbol reference
 */
export class GaiaScriptReferenceTool extends Tool {
    constructor() {
        super();
        this.name = "gaiascript_reference";
        this.description = "Get GaiaScript symbol reference and syntax help. Input should be the symbol or concept you need help with.";
    }

    async _call(input) {
        const reference = {
            "functions": "λ⟨name, param1, param2⟩ body ⟨/λ⟩",
            "state": "Σ⟨variable: value, another: value⟩",
            "components": "Ω⟨✱⟩ content ⟨/Ω⟩",
            "styling": "Φ{property: value; another: value}⟦content⟧",
            "numbers": "⊗∅=0, ⊗α=1, ⊗β=2, ⊗γ=3, ⊗δ=4, ⊗ε=5, ⊗ζ=6, ⊗η=7, ⊗θ=8, ⊗ι=9",
            "symbols": "◐=center, ☰=flex, ⬛=solid, ⚡=pointer",
            "types": "𝕊⟨string⟩, 𝔹⟨boolean⟩, 𝔸⟨array⟩, ℕ⟨number⟩",
            "operators": "+, -, ×, ÷, ^, √, →, ⇒, ⊳, ⟿",
            "conditionals": "∇ (condition) → true_value ⊘ false_value",
            "imports": "導⟨module1, module2⟩",
            "documentation": "檔⟨description⟩"
        };

        const query = input.toLowerCase();
        let result = "GaiaScript Reference:\n\n";

        if (query.includes("all") || query.includes("complete")) {
            for (const [key, value] of Object.entries(reference)) {
                result += `${key}: ${value}\n`;
            }
        } else {
            const matches = Object.entries(reference).filter(([key, value]) => 
                key.includes(query) || value.includes(query) || query.includes(key)
            );

            if (matches.length > 0) {
                matches.forEach(([key, value]) => {
                    result += `${key}: ${value}\n`;
                });
            } else {
                result += "No matches found. Available categories:\n";
                result += Object.keys(reference).join(", ");
            }
        }

        return result;
    }
}

/**
 * Main GaiaAgent class - LangChain agent for GaiaScript development
 */
export class GaiaAgent {
    constructor(options = {}) {
        this.llm = new GaiaScriptLLM(options.llmOptions || {});
        this.tools = [
            new GaiaScriptFunctionTool(),
            new GaiaScriptComponentTool(),
            new GaiaScriptCompilerTool(),
            new GaiaScriptReferenceTool()
        ];
        this.agent = null;
        this.agentExecutor = null;
        this.setupAgent();
    }

    async setupAgent() {
        try {
            // Get the prompt template for React agent
            const prompt = await pull("hwchase17/react");

            // Create the React agent
            this.agent = await createReactAgent({
                llm: this.llm,
                tools: this.tools,
                prompt: prompt,
            });

            // Create the agent executor
            this.agentExecutor = new AgentExecutor({
                agent: this.agent,
                tools: this.tools,
                verbose: true,
                maxIterations: 5,
                returnIntermediateSteps: true,
            });

            console.log("GaiaAgent initialized successfully");
        } catch (error) {
            console.error("Error setting up GaiaAgent:", error);
            // Create a fallback simple agent
            this.setupFallbackAgent();
        }
    }

    setupFallbackAgent() {
        console.log("Setting up fallback agent without LangChain hub");
        // Create a simple agent executor without the hub prompt
        this.agentExecutor = new AgentExecutor({
            agent: this.agent,
            tools: this.tools,
            verbose: true,
            maxIterations: 3,
        });
    }

    /**
     * Execute a task using the agent
     * @param {string} input - Task description
     * @returns {Promise<Object>} Agent response
     */
    async execute(input) {
        try {
            if (!this.agentExecutor) {
                await this.setupAgent();
            }

            const result = await this.agentExecutor.invoke({
                input: input
            });

            return {
                success: true,
                output: result.output,
                intermediateSteps: result.intermediateSteps || [],
                metadata: {
                    timestamp: new Date().toISOString(),
                    agent: "GaiaAgent",
                    tools_used: this.extractToolsUsed(result.intermediateSteps || [])
                }
            };
        } catch (error) {
            console.error("GaiaAgent execution error:", error);
            return {
                success: false,
                error: error.message,
                output: "I encountered an error while processing your request."
            };
        }
    }

    /**
     * Chat with the agent (alias for execute)
     * @param {string} message - User message
     * @returns {Promise<Object>} Agent response
     */
    async chat(message) {
        return await this.execute(message);
    }

    /**
     * Generate GaiaScript code with specific type
     * @param {string} type - Type of code (function, component, etc.)
     * @param {Object} spec - Specification
     * @returns {Promise<Object>} Generated code
     */
    async generateCode(type, spec) {
        const prompt = `Generate a GaiaScript ${type} with these specifications: ${JSON.stringify(spec)}`;
        return await this.execute(prompt);
    }

    extractToolsUsed(intermediateSteps) {
        return intermediateSteps.map(step => ({
            tool: step.action?.tool || 'unknown',
            input: step.action?.toolInput || 'unknown',
            output: step.observation || 'unknown'
        }));
    }

    /**
     * Get available tools
     * @returns {Array} List of available tools
     */
    getTools() {
        return this.tools.map(tool => ({
            name: tool.name,
            description: tool.description
        }));
    }

    /**
     * Get agent information
     * @returns {Object} Agent information
     */
    getInfo() {
        return {
            type: 'GaiaAgent',
            llm: this.llm.getModelInfo ? this.llm.getModelInfo() : 'GaiaScript MLX LLM',
            tools: this.getTools(),
            framework: 'LangChain + MLX',
            capabilities: [
                'GaiaScript code generation',
                'UI component creation',
                'Function development',
                'Code compilation',
                'Symbol reference',
                'Agent-based task execution'
            ]
        };
    }
}

export default GaiaAgent;