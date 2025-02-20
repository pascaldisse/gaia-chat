export default class Persona {
    constructor({ 
      id,
      name,
      systemPrompt,
      model,
      exampleDialogue = [],
      knowledgeFiles = []
    }) {
      this.id = id || Date.now();
      this.name = name;
      this.systemPrompt = systemPrompt;
      this.model = model;
      this.exampleDialogue = exampleDialogue;
      this.knowledgeFiles = knowledgeFiles;
      this.createdAt = Date.now();
      this.updatedAt = Date.now();
    }
  }