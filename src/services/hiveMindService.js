import { ChatDeepInfra } from "@langchain/community/chat_models/deepinfra";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { API_KEY } from "../config";

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

  // Generate a response based on the attribute's perspective
  async generateResponse(query, conversationHistory = []) {
    try {
      // Create the chat model
      const chat = new ChatDeepInfra({
        apiKey: API_KEY,
        modelName: this.modelId,
        temperature: 0.7,
        maxTokens: 500
      });

      // Build a prompt template for this attribute agent
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", `You are an AI assistant that embodies the attribute of ${this.attribute.name.toUpperCase()}.

Your attribute value is ${this.attribute.value}/5, which means you strongly prioritize: ${this.attribute.description}

Your task is to respond to the user's query from the perspective of this attribute. 
Highlight how this attribute influences your thinking and approach to the situation.
Keep your response concise (2-4 sentences) and focused on your attribute's perspective.

For example, if you represent "Compassion" and the query is about solving a technical problem,
focus on how compassion might lead you to consider how the solution affects users emotionally.`],
        ...conversationHistory.map(message => [message.role, message.content]),
        ["human", query]
      ]);

      // Generate the completion
      const response = await prompt.pipe(chat).invoke({});

      // Add to this agent's history
      this.history.push({ role: "human", content: query });
      this.history.push({ role: "assistant", content: response.content });

      return {
        agent: this.attribute.name.toLowerCase(),
        agentName: this.attribute.name,
        message: response.content,
        model: this.modelId,
        value: this.attribute.value
      };
    } catch (error) {
      console.error(`Error generating response for ${this.attribute.name}:`, error);
      return {
        agent: this.attribute.name.toLowerCase(),
        agentName: this.attribute.name,
        message: `Error: Unable to generate a response from the ${this.attribute.name} perspective.`,
        model: this.modelId,
        value: this.attribute.value
      };
    }
  }
}

// Service for generating a summary response from all attribute agents
export class HiveMindSummary {
  constructor(attributes = {}) {
    this.attributes = attributes;
  }

  // Generate a summary based on individual attribute responses
  async generateSummary(query, attributeResponses, summaryModel) {
    try {
      // Create the chat model for summary
      const chat = new ChatDeepInfra({
        apiKey: API_KEY,
        modelName: summaryModel,
        temperature: 0.7,
        maxTokens: 800
      });

      // Format the attribute responses for the summary prompt
      const formattedResponses = attributeResponses
        .map(resp => `${resp.agentName} (Value: ${resp.value}/5): "${resp.message}"`)
        .join("\n\n");

      // Build a prompt template for the summary
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", `You are the Gaia Hive Mind, an AI system that integrates multiple attribute perspectives to provide balanced responses.

You have received input from several attribute agents, each representing a different value or ethical consideration.
Your task is to synthesize these perspectives into a coherent response that addresses the query.

Consider the value ratings of each attribute (1-5 scale) when weighing different perspectives.
Higher-rated attributes should have more influence on your final response.

Create a comprehensive response that shows how you've considered multiple perspectives.`],
        ["human", `Query: ${query}

Attribute Perspectives:
${formattedResponses}

Please provide a balanced response that integrates these perspectives, giving appropriate weight to each attribute.`]
      ]);

      // Generate the summary
      const response = await prompt.pipe(chat).invoke({});

      return response.content;
    } catch (error) {
      console.error("Error generating Hive Mind summary:", error);
      return "Error: Unable to generate a summary response from the Hive Mind.";
    }
  }
}