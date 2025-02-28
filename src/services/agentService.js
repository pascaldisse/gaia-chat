import { ChatDeepInfra } from "@langchain/community/chat_models/deepinfra";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { API_KEY } from "../config";

export class PersonaAgent {
  static async create(persona, tools, callbacks) {
    const agent = new PersonaAgent(persona, tools, callbacks);
    agent.executor = await agent.createExecutor();
    return agent;
  }

  constructor(persona, tools, callbacks) {
    this.persona = persona;
    this.tools = tools;
    this.providedCallbacks = callbacks;
    this.executor = null; // Will be set by create()
  }

  async createExecutor() {
    // Create a more explicit prompt that encourages tool usage
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `You are {persona_name}. {system_prompt}

{rpg_instructions}

You have access to the following tools that you should use whenever appropriate:
${this.tools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

IMPORTANT: When you are asked to perform a task that matches one of your tools, you must use the appropriate tool rather than simulating the result. For example:
- If asked to roll dice, use the dice_roll tool
- If asked to search files, use the file_search tool
- If asked to generate an image, use the generate_image tool

Current conversation:
{history}

{agent_scratchpad}`],
      ["human", "{input}"]
    ]);

    const chat = new ChatDeepInfra({
      apiKey: API_KEY,
      modelName: this.persona.model,
      temperature: this.persona.creativity / 10,
      maxTokens: 1000,
      streaming: true,
      callbacks: this.providedCallbacks?.handleNewToken ? [{
        handleLLMNewToken: this.providedCallbacks.handleNewToken
      }] : undefined
    });

    // Create the agent with proper configuration
    const agent = await createOpenAIFunctionsAgent({
      llm: chat,
      tools: this.tools,
      prompt: prompt,
    });

    // Return the executor with the configured agent
    return new AgentExecutor({
      agent,
      tools: this.tools,
      maxIterations: 3,
      returnIntermediateSteps: true,
      callbacks: this.providedCallbacks ? [this.providedCallbacks] : undefined
    });
  }

  async invoke(input) {
    return this.executor.invoke({
      input: input.message,
      persona_name: this.persona.name,
      system_prompt: this.persona.systemPrompt,
      rpg_instructions: this.generateRpgInstructions(input.outcome),
      history: input.history,
      agent_scratchpad: ""
    }, {
      callbacks: this.providedCallbacks?.handleNewToken ? [{
        handleLLMNewToken: this.providedCallbacks.handleNewToken
      }] : undefined
    });
  }

  generateRpgInstructions(outcome) {
    const instructions = [];
    if (outcome.assertiveness === 'hesitant') {
      instructions.push('Respond with hesitation...');
    }
    // Add other RPG instructions based on outcome
    if (outcome.emotionalTone === 'detached') {
      instructions.push('Maintain a logical, detached tone');
    } else if (outcome.emotionalTone === 'empathetic') {
      instructions.push('Respond with empathy and emotional understanding');
    }
    if (outcome.questionDepth === 'deep') {
      instructions.push('Ask a thoughtful, insightful question');
    }
    return instructions.join('\n');
  }
}