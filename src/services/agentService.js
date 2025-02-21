import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export class PersonaAgent {
  constructor(persona, tools, callbacks) {
    this.persona = persona;
    this.tools = tools;
    this.providedCallbacks = callbacks;
    this.executor = this.createExecutor();
  }

  createExecutor() {
    const prompt = ChatPromptTemplate.fromTemplate(`
      You are {personaName}. {personaPrompt}
      {rpgInstructions}
      
      Current conversation:
      {history}
      
      Respond naturally to the most recent message. Use tools when appropriate.
      {agent_scratchpad}
    `);

    const llm = new ChatOpenAI({
      modelName: this.persona.model,
      temperature: this.persona.creativity / 10,
      maxTokens: 1000,
      streaming: true,
    });

    const agent = createToolCallingAgent({
      llm,
      tools: this.tools,
      prompt,
    });

    const agentExecutorCallbacks = {
        handleLLMNewToken: (token) => {
          if (this.providedCallbacks?.handleNewToken) {
            this.providedCallbacks.handleNewToken(token);
          }
        },
    };

    return AgentExecutor.fromAgentAndTools({
      agent,
      tools: this.tools,
      maxIterations: 3,
      callbacks: agentExecutorCallbacks,
    });
  }

  async invoke(input) {
    return this.executor.invoke({
      personaName: this.persona.name,
      personaPrompt: this.persona.systemPrompt,
      rpgInstructions: this.generateRpgInstructions(input.outcome),
      history: input.history,
      input: input.message,
      agent_scratchpad: ""
    }, { callbacks: this.providedCallbacks?.handleLLMNewToken ? {handleLLMNewToken: this.providedCallbacks.handleLLMNewToken} : undefined });
  }

  generateRpgInstructions(outcome) {
    const instructions = [];
    if (outcome.assertiveness === 'hesitant') {
      instructions.push('Respond with hesitation...');
    }
    return instructions.join('\n');
  }
}