export default class Persona {
    constructor({ 
      id = Date.now(),
      name,
      systemPrompt,
      model,
      exampleDialogue = [],
      knowledgeFiles = [],
      image = '',
      voiceId = null,
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
      agentSettings = null,
      category = 'general',
      isNsfw = false,
      description = '',
      creator = '',
      tags = [],
      downloads = 0,
      rating = 0,
      published = false,
      partnerCreated = false,
      formatSettings = { useRoleplayMarkdown: false }
    }) {
      this.id = id;
      this.name = name;
      this.systemPrompt = systemPrompt;
      this.model = model;
      this.exampleDialogue = exampleDialogue;
      this.knowledgeFiles = knowledgeFiles;
      this.image = image;
      this.voiceId = voiceId;     // Voice ID for TTS
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
      
      // Store attributes
      this.category = category;   // Category in the store
      this.isNsfw = isNsfw;       // Flag for NSFW content
      this.description = description; // Longer description for store listing
      this.creator = creator;     // Creator name or username
      this.tags = tags;           // Array of tags for searching
      this.downloads = downloads; // Number of downloads/uses
      this.rating = rating;       // Average rating (0-5)
      this.published = published; // Whether published to store
      this.partnerCreated = partnerCreated; // Whether created by partner
      this.formatSettings = formatSettings; // Format settings for message rendering

      // Initialize agent settings if provided
      if (agentSettings) {
        this.agentSettings = agentSettings;
      }
    }
  }