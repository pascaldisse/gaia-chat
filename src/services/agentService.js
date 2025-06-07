import { coreAI } from './coreAIAdapter';

export class PersonaAgent {
  static async create(persona, tools, callbacks) {
    // Create persona in Core AI Engine
    await coreAI.createPersona({
      id: persona.id,
      name: persona.name,
      systemPrompt: persona.systemPrompt,
      model: persona.model,
      temperature: persona.creativity / 10,
      tools: tools.map(t => t.name),
      attributes: {
        intelligence: persona.intelligence,
        wisdom: persona.wisdom,
        charisma: persona.charisma,
        empathy: persona.empathy,
        humor: persona.humor
      }
    });

    const agent = new PersonaAgent(persona, tools, callbacks);
    return agent;
  }

  constructor(persona, tools, callbacks) {
    this.persona = persona;
    this.tools = tools;
    this.providedCallbacks = callbacks;
  }

  async invoke(input) {
    // Use Core AI Engine for chat
    const result = await coreAI.chatWithPersona({
      personaId: this.persona.id,
      message: input.message,
      includeHistory: true,
      onToken: this.providedCallbacks?.handleNewToken
    });

    // Format response to match expected structure
    return {
      output: result.content,
      intermediateSteps: result.tools_used?.map(tool => ({
        action: { tool: tool.tool, toolInput: tool.input },
        observation: tool.output
      })) || []
    };
  }

  generateRpgInstructions(outcome) {
    // This is now handled by the Core AI Engine based on persona attributes
    return '';
  }
}