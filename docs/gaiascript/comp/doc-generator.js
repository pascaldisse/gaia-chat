/**
 * GaiaScript Documentation Generator
 * Extracts documentation from main.gaia and formats it as Markdown
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DOC_FILE = path.join(__dirname, '..', 'main', 'main.gaia');
const OUTPUT_FILE = path.join(__dirname, '..', 'docs', 'GAIASCRIPT_REFERENCE.md');

// Regular expression patterns for extracting documentation
const TAG_PATTERN = /⛯⟪([^⟫]+)⟫([\s\S]*?)⛯⟪\/\1⟫/g;
const ANNOTATION_PATTERN = /⌰⟪([^⟫]+)⟫([\s\S]*?)⌰⟪\/\1⟫/g;
const METHOD_PATTERN = /⚙⟪([^⟫]+)⟫([\s\S]*?)⚙⟪\/\1⟫/g;
const CATEGORY_PATTERN = /⚑⟪([^⟫]+)⟫([\s\S]*?)⚑⟪\/\1⟫/g;
const SUBCATEGORY_PATTERN = /⦾([^⦾]+)⦾/g;
const PARAM_PATTERN = /◉([^◉]+)◉/g;
const RETURN_PATTERN = /⚐([^⚐]+)⚐/g;
const EXAMPLE_PATTERN = /⚛([\s\S]*?)⚛/g;
const WARNING_PATTERN = /⚠([^⚠]+)⚠/g;

/**
 * Extracts documentation elements from the doc file
 * @returns {Object} Extracted documentation
 */
function extractDocumentation() {
  const content = fs.readFileSync(DOC_FILE, 'utf8');
  
  const documentation = {
    overview: [],
    concepts: [],
    components: [],
    methods: []
  };
  
  // Extract overview
  let match;
  while ((match = TAG_PATTERN.exec(content)) !== null) {
    const [_, tag, body] = match;
    
    if (tag === 'OVERVIEW') {
      documentation.overview.push({
        title: 'Overview',
        content: body.trim()
      });
    } else if (tag === 'CONCEPTS') {
      documentation.concepts.push({
        title: 'Core Concepts',
        content: body.trim()
      });
    }
  }
  
  // Reset regex lastIndex
  TAG_PATTERN.lastIndex = 0;
  
  // Extract component documentation
  while ((match = ANNOTATION_PATTERN.exec(content)) !== null) {
    const [_, tag, body] = match;
    
    if (tag === 'UI-COMPONENTS') {
      // Parse subcategories
      const subcategories = [];
      let subcatMatch;
      let lastIndex = 0;
      
      while ((subcatMatch = SUBCATEGORY_PATTERN.exec(body)) !== null) {
        const startIndex = body.indexOf(subcatMatch[0]);
        if (startIndex > lastIndex) {
          // Add any content before this subcategory
          if (subcategories.length > 0) {
            subcategories[subcategories.length - 1].content += body.substring(lastIndex, startIndex).trim();
          }
        }
        
        subcategories.push({
          name: subcatMatch[1].trim(),
          content: ''
        });
        
        lastIndex = startIndex + subcatMatch[0].length;
      }
      
      // Add the remaining content to the last subcategory
      if (subcategories.length > 0 && lastIndex < body.length) {
        subcategories[subcategories.length - 1].content += body.substring(lastIndex).trim();
      }
      
      documentation.components.push({
        title: 'UI Components',
        subcategories
      });
    }
  }
  
  // Reset regex lastIndex
  ANNOTATION_PATTERN.lastIndex = 0;
  
  // Extract method documentation
  while ((match = METHOD_PATTERN.exec(content)) !== null) {
    const [_, name, body] = match;
    
    // Extract parts
    const params = [];
    let paramMatch;
    while ((paramMatch = PARAM_PATTERN.exec(body)) !== null) {
      const [param, desc] = paramMatch[1].split(':');
      params.push({ name: param.trim(), type: desc.trim() });
    }
    
    let returnValue = '';
    const returnMatch = RETURN_PATTERN.exec(body);
    if (returnMatch) {
      const [ret, desc] = returnMatch[1].split(':');
      returnValue = { name: ret.trim(), type: desc.trim() };
    }
    RETURN_PATTERN.lastIndex = 0;
    
    let example = '';
    const exampleMatch = EXAMPLE_PATTERN.exec(body);
    if (exampleMatch) {
      example = exampleMatch[1].trim();
    }
    EXAMPLE_PATTERN.lastIndex = 0;
    
    let warning = '';
    const warningMatch = WARNING_PATTERN.exec(body);
    if (warningMatch) {
      warning = warningMatch[1].trim();
    }
    WARNING_PATTERN.lastIndex = 0;
    
    documentation.methods.push({
      name,
      params,
      returnValue,
      example,
      warning
    });
  }
  
  return documentation;
}

/**
 * Generates Markdown documentation from the extracted documentation
 * @param {Object} docs - The extracted documentation
 * @returns {string} - Markdown formatted documentation
 */
function generateMarkdown(docs) {
  let markdown = '# GaiaScript Language Reference\n\n';
  
  // Add overview section
  docs.overview.forEach(section => {
    markdown += `## ${section.title}\n\n${section.content}\n\n`;
  });
  
  // Add concepts section
  docs.concepts.forEach(section => {
    markdown += `## ${section.title}\n\n${section.content}\n\n`;
  });
  
  // Add components section
  docs.components.forEach(component => {
    markdown += `## ${component.title}\n\n`;
    
    component.subcategories.forEach(subcat => {
      markdown += `### ${subcat.name}\n\n`;
      
      // Format the component list
      const lines = subcat.content.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        const cleanLine = line.replace('→', '').trim();
        markdown += `- ${cleanLine}\n`;
      });
      
      markdown += '\n';
    });
  });
  
  // Add API reference section
  markdown += '## API Reference\n\n';
  
  docs.methods.forEach(method => {
    markdown += `### ${method.name}()\n\n`;
    
    // Parameters
    markdown += '**Parameters:**\n\n';
    if (method.params.length > 0) {
      method.params.forEach(param => {
        markdown += `- \`${param.name}\` (${param.type})\n`;
      });
    } else {
      markdown += 'None\n';
    }
    markdown += '\n';
    
    // Return value
    markdown += '**Returns:**\n\n';
    if (method.returnValue) {
      markdown += `- \`${method.returnValue.name}\` (${method.returnValue.type})\n\n`;
    } else {
      markdown += 'None\n\n';
    }
    
    // Example
    if (method.example) {
      markdown += '**Example:**\n\n```javascript\n' + method.example + '\n```\n\n';
    }
    
    // Warning
    if (method.warning) {
      markdown += '> **⚠️ Warning:** ' + method.warning + '\n\n';
    }
  });
  
  return markdown;
}

/**
 * Main function to generate documentation
 */
function main() {
  try {
    // Check if doc file exists
    if (!fs.existsSync(DOC_FILE)) {
      console.error(`Documentation file not found: ${DOC_FILE}`);
      process.exit(1);
    }
    
    // Extract documentation
    const docs = extractDocumentation();
    
    // Generate markdown
    const markdown = generateMarkdown(docs);
    
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write output file
    fs.writeFileSync(OUTPUT_FILE, markdown);
    
    console.log(`Documentation generated successfully: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error generating documentation:', error);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  extractDocumentation,
  generateMarkdown
};
