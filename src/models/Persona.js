export default class Persona {
    constructor({ 
      id = Date.now(),
      name,
      systemPrompt,
      model,
      exampleDialogue = [],
      knowledgeFiles = [],
      image = '',
      initiative = 5,
      talkativeness = 5,
      confidence = 5,
      curiosity = 5,
      empathy = 5,
      creativity = 5,
      humor = 5,
      adaptability = 5,
      patience = 5,
      skepticism = 5,
      optimism = 5,
      activeInChats = [],
      isDefault = false,
      isSystem = false,
      userId = null,
      agentSettings = null
    }) {
      this.id = id;
      this.name = name;
      this.systemPrompt = systemPrompt;
      this.model = model;
      this.exampleDialogue = exampleDialogue;
      this.knowledgeFiles = knowledgeFiles;
      this.image = image;
      this.createdAt = Date.now();
      this.updatedAt = Date.now();
      this.initiative = initiative;
      this.talkativeness = talkativeness;
      this.confidence = confidence;
      this.curiosity = curiosity;
      this.empathy = empathy;
      this.creativity = creativity;
      this.humor = humor;
      this.adaptability = adaptability;
      this.patience = patience;
      this.skepticism = skepticism;
      this.optimism = optimism;
      this.activeInChats = activeInChats;
      this.isDefault = isDefault; // Marks as default persona like GAIA
      this.isSystem = isSystem;   // Marks as system-wide, not tied to user
      this.userId = userId;       // Links to user if user-created
      
      // Initialize agent settings if provided
      if (agentSettings) {
        this.agentSettings = agentSettings;
      }
    }
  }