export default class Persona {
    constructor({ 
      id,
      name,
      systemPrompt,
      model,
      exampleDialogue = [],
      knowledgeFiles = [],
      image = ''
    }) {
      this.id = id || Date.now();
      this.name = name;
      this.systemPrompt = systemPrompt;
      this.model = model;
      this.exampleDialogue = exampleDialogue;
      this.knowledgeFiles = knowledgeFiles;
      this.image = image;
      this.createdAt = Date.now();
      this.updatedAt = Date.now();
    }
  }