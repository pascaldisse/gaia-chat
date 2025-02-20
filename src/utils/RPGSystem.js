export class RPGSystem {
    static getModifier(score) {
      return score <= 3 ? -2 : score <= 6 ? 0 : +2;
    }
  
    static rollD20() {
      return Math.floor(Math.random() * 20) + 1;
    }
  
    static calculateOutcome(persona, context) {
      if (!persona) {
        throw new Error('No persona provided for RPG calculation');
      }
  
      const initiativeRoll = this.rollAttribute(persona, 'initiative', context);
      const rolls = {
        initiative: initiativeRoll,
        talkativeness: this.rollAttribute(persona, 'talkativeness', context),
        confidence: this.rollAttribute(persona, 'confidence', context),
        curiosity: this.rollAttribute(persona, 'curiosity', context),
        empathy: this.rollAttribute(persona, 'empathy', context),
        creativity: this.rollAttribute(persona, 'creativity', context),
        humor: this.rollAttribute(persona, 'humor', context)
      };
  
      return {
        ...rolls,
        shouldRespond: rolls.talkativeness.total >= persona.talkativeness,
        responsePriority: initiativeRoll.total,
        assertiveness: this.getAssertivenessLevel(rolls.confidence.total),
        questionDepth: this.getQuestionDepth(rolls.curiosity),
        emotionalTone: this.getEmotionalTone(rolls.empathy.total)
      };
    }
  
    static rollAttribute(persona, attribute, context) {
      const baseRoll = this.rollD20();
      const modifier = Math.floor(persona[attribute] / 4);
      let contextBonus = 0;
  
      // Context bonuses based on attribute type
      switch(attribute) {
        case 'confidence':
        case 'initiative':
          if(context.topicAlignment) contextBonus += 2;
          if(context.unfamiliarTopic) contextBonus -= 2;
          break;
        case 'curiosity':
          if(context.topicAlignment) contextBonus += 2;
          if(context.unfamiliarTopic) contextBonus += 3;
          break;
        case 'empathy':
          if(context.topicAlignment) contextBonus += 1;
          if(context.unfamiliarTopic) contextBonus -= 1;
          break;
        // Add more cases for other attributes if needed
        default:
          // Default behavior for other attributes
          if(context.topicAlignment) contextBonus += 1;
          break;
      }
  
      return {
        roll: baseRoll,
        modifier: modifier + contextBonus,
        total: baseRoll + modifier + contextBonus,
        isCritical: baseRoll === 1 || baseRoll === 20
      };
    }
  
    static getAssertivenessLevel(confidenceTotal) {
      if (confidenceTotal <= 8) return 'hesitant';
      if (confidenceTotal <= 15) return 'neutral';
      return 'assertive';
    }
  
    static getQuestionDepth(curiosityRoll) {
      if (curiosityRoll.total >= 18) return 'deep';
      if (curiosityRoll.total >= 12) return 'moderate';
      return 'shallow';
    }
  
    static getEmotionalTone(empathyTotal) {
      if (empathyTotal <= 8) return 'detached';
      if (empathyTotal <= 15) return 'neutral';
      return 'empathetic';
    }
  
    // Add other RPG methods here...
  }