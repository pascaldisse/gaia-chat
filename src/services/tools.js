import { DynamicTool } from "@langchain/core/tools";

export function createPersonaTools(chatComponent) {
  return [
    new DynamicTool({
      name: "file_search",
      description: "Search through uploaded knowledge files",
      func: async (query) => {
        // Use existing knowledgeDB from Chat.js lines 448-453
        const results = await chatComponent.knowledgeDB.searchFiles(query);
        return JSON.stringify(results);
      }
    }),
    new DynamicTool({
      name: "generate_image",
      description: "Generate an image from text description",
      func: async (prompt) => {
        // Use existing image generation from Chat.js lines 297-366
        return chatComponent.generateImage({
          prompt,
          model: chatComponent.imageModel,
          style: chatComponent.selectedStyle
        });
      }
    })
  ];
}