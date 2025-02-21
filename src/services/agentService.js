import { ChatDeepInfra } from "@langchain/community/chat_models/deepinfra";
import { AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { API_KEY } from "../config";

export class PersonaAgent {
  constructor(persona, tools, callbacks) {
    this.persona = persona;
    this.tools = tools;
    this.providedCallbacks = callbacks;
    this.executor = this.createExecutor();
  }

  createExecutor() {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `You are {persona_name}. {system_prompt}

{rpg_instructions}

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

    return AgentExecutor.fromAgentAndTools({
      llm: chat,
      tools: this.tools,
      prompt: prompt,
      maxIterations: 3,
    });
  }

  async invoke(input) {
    return this.executor.invoke({
      persona_name: this.persona.name,
      system_prompt: this.persona.systemPrompt,
      rpg_instructions: this.generateRpgInstructions(input.outcome),
      history: input.history,
      input: input.message,
      agent_scratchpad: ""
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