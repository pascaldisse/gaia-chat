export class Persona {
    constructor({ 
      name = 'Assistant',
      systemPrompt = 'You are a helpful assistant',
      model = 'llama3-70b',
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
      optimism = 5
    }) {
      this.id = Date.now().toString();
      this.name = name;
      this.systemPrompt = systemPrompt;
      this.model = model;
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
      this.lastActive = Date.now();
    }

    markActive() {
      this.lastActive = Date.now();
    }
  }