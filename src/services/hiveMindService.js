import { coreAI } from './coreAIAdapter';

// Service for Gaia Hive Mind attribute agents
export class AttributeAgent {
  constructor(attributeName, attributeValue, attributeDescription, model) {
    this.attribute = {
      name: attributeName,
      value: attributeValue,
      description: attributeDescription
    };
    this.modelId = model;
    this.history = [];
  }

  // Generate a response based on the attribute's perspective with streaming
  async generateResponse(query, conversationHistory = [], onUpdate = null) {
    // This is now handled by the Core AI Engine's hive mind system
    // We'll create a temporary hive mind with just this attribute
    try {
      const attributes = [{
        name: this.attribute.name,
        value: this.attribute.value,
        description: this.attribute.description,
        model: this.modelId
      }];

      const result = await coreAI.processHiveMind({
        query,
        attributes,
        summaryModel: this.modelId,
        parallel: false,
        onAttributeUpdate: (response) => {
          if (onUpdate && response.agent === this.attribute.name.toLowerCase()) {
            onUpdate(response);
          }
        }
      });

      // Extract this attribute's response
      const attrResponse = result.attributes.find(
        r => r.agent === this.attribute.name.toLowerCase()
      );

      if (attrResponse) {
        // Add to history
        this.history.push({ role: "human", content: query });
        this.history.push({ role: "assistant", content: attrResponse.message });
        return attrResponse;
      }

      throw new Error("No response from attribute agent");
    } catch (error) {
      console.error(`Error generating response for ${this.attribute.name}:`, error);
      const errorResponse = {
        agent: this.attribute.name.toLowerCase(),
        agentName: this.attribute.name,
        message: `Error: Unable to generate a response from the ${this.attribute.name} perspective.`,
        model: this.modelId,
        value: this.attribute.value
      };
      
      if (onUpdate) {
        onUpdate(errorResponse);
      }
      
      return errorResponse;
    }
  }
}

// Service for generating a summary response from all attribute agents
export class HiveMindSummary {
  constructor(attributes = {}) {
    this.attributes = attributes;
  }

  // Generate a summary based on individual attribute responses with streaming
  async generateSummary(query, attributeResponses, summaryModel, onUpdate = null) {
    // Convert responses to attributes format for Core AI Engine
    const attributes = attributeResponses.map(resp => ({
      name: resp.agentName,
      value: resp.value,
      description: `${resp.agentName} perspective`,
      model: resp.model || summaryModel
    }));

    try {
      const result = await coreAI.processHiveMind({
        query,
        attributes,
        summaryModel,
        parallel: true,
        onSummaryUpdate: onUpdate
      });

      return result.summary;
    } catch (error) {
      console.error("Error generating Hive Mind summary:", error);
      const errorMessage = "Error: Unable to generate a summary response from the Hive Mind.";
      
      if (onUpdate) {
        onUpdate(errorMessage);
      }
      
      return errorMessage;
    }
  }
}