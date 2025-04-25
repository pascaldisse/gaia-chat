/**
 * GaiaUI Extended Compiler
 * Advanced compiler for GaiaScript to JavaScript, HTML, and CSS
 */

/**
 * Main function to compile GaiaScript to web components
 * @param {string} source - The GaiaScript source code
 * @returns {Object} - Object containing compiled HTML, CSS, and JS
 */
function compileGaiaScript(source) {
  // Parse the source code into AST
  const ast = parseGaiaScript(source);
  
  // Generate code from AST for different targets
  return {
    web: {
      html: generateHTML(ast),
      css: generateCSS(ast),
      js: generateJS(ast)
    },
    ios: {
      swift: generateSwift(ast),
      js: generateIOSBridgeJS(ast)
    },
    win: {
      csharp: generateCSharp(ast)
    }
  };
}

/**
 * Parse GaiaScript code into an AST structure
 * @param {string} source - The GaiaScript source code
 * @returns {Object} - The AST structure
 */
function parseGaiaScript(source) {
  const ast = {
    documentation: extractDocumentation(source),
    components: {},
    ui: null
  };
  
  // Extract component definitions
  const componentRegex = /C〈([^〉]+)〉([^:]+)[:](⟨\{[\s\S]*?\}⟩)/g;
  let match;
  
  while ((match = componentRegex.exec(source)) !== null) {
    const [_, id, name, body] = match;
    
    // Parse component body
    const component = parseComponentBody(body);
    
    // Store component in AST
    ast.components[name.trim()] = {
      id: id.trim(),
      name: name.trim(),
      ...component
    };
  }
  
  // Extract UI framework definition
  const uiRegex = /UI〈([^〉]+)〉([\s\S]*?)(?=C〈|⚙⟪|$)/;
  const uiMatch = source.match(uiRegex);
  
  if (uiMatch) {
    const [_, uiDeclaration, uiBody] = uiMatch;
    
    // Parse UI framework declaration
    const uiParts = uiDeclaration.split('⊕');
    
    if (uiParts.length >= 3) {
      const [stateSymbol, uiSymbol, appSymbol] = uiParts;
      
      // Parse state management
      const stateRegex = new RegExp(`${stateSymbol}[:](.*?)(?=${uiSymbol}|$)`, 's');
      const stateMatch = uiBody.match(stateRegex);
      
      // Parse UI components
      const uiComponentsRegex = new RegExp(`${uiSymbol}[:](⟨\\{[\\s\\S]*?\\}⟩)`, 's');
      const uiComponentsMatch = uiBody.match(uiComponentsRegex);
      
      // Parse app definition
      const appRegex = new RegExp(`${appSymbol}[:](⟨\\{[\\s\\S]*?\\}⟩)`, 's');
      const appMatch = uiBody.match(appRegex);
      
      // Build UI framework AST
      ast.ui = {
        state: stateMatch ? parseStateManagement(stateMatch[1]) : null,
        components: uiComponentsMatch ? parseUIComponents(uiComponentsMatch[1]) : {},
        app: appMatch ? parseAppDefinition(appMatch[1]) : null
      };
    }
  }
  
  // Extract API documentation
  const apiDocRegex = /⚙⟪([^⟪]+)⟫([\s\S]*?)⚙⟪\/\1⟫/g;
  ast.api = {};
  
  while ((match = apiDocRegex.exec(source)) !== null) {
    const [_, name, body] = match;
    ast.api[name] = parseApiDoc(body);
  }
  
  return ast;
}

/**
 * Extract top-level documentation from GaiaScript
 */
function extractDocumentation(source) {
  const docInfo = {
    title: '',
    overview: '',
    concepts: []
  };
  
  // Extract title
  const titleRegex = /⊛⟪DOC⟫(.*?)⊛⟪\/DOC⟫/;
  const titleMatch = source.match(titleRegex);
  if (titleMatch) {
    docInfo.title = titleMatch[1].trim();
  }
  
  // Extract overview
  const overviewRegex = /⛯⟪OVERVIEW⟫([\s\S]*?)⛯⟪\/OVERVIEW⟫/;
  const overviewMatch = source.match(overviewRegex);
  if (overviewMatch) {
    docInfo.overview = overviewMatch[1].trim();
  }
  
  // Extract concepts
  const conceptsRegex = /⛯⟪CONCEPTS⟫([\s\S]*?)⛯⟪\/CONCEPTS⟫/;
  const conceptsMatch = source.match(conceptsRegex);
  if (conceptsMatch) {
    docInfo.concepts = conceptsMatch[1].trim()
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim());
  }
  
  return docInfo;
}

/**
 * Parse a component body into its sections
 */
function parseComponentBody(body) {
  const component = {
    props: {},
    state: {},
    style: {},
    methods: {},
    render: null,
    init: null
  };
  
  // Remove outer brackets
  const content = body.substring(2, body.length - 2);
  
  // Extract props section
  const propsRegex = /props[:](⟨[\s\S]*?⟩)/;
  const propsMatch = content.match(propsRegex);
  if (propsMatch) {
    component.props = parseObjectLiteral(propsMatch[1]);
  }
  
  // Extract state section
  const stateRegex = /state[:](⟨[\s\S]*?⟩)/;
  const stateMatch = content.match(stateRegex);
  if (stateMatch) {
    component.state = parseObjectLiteral(stateMatch[1]);
  }
  
  // Extract style section
  const styleRegex = /style[:](⟨[\s\S]*?⟩)/;
  const styleMatch = content.match(styleRegex);
  if (styleMatch) {
    component.style = parseObjectLiteral(styleMatch[1]);
  }
  
  // Extract render section
  const renderRegex = /render[:](⟨[\s\S]*?⟩)/;
  const renderMatch = content.match(renderRegex);
  if (renderMatch) {
    component.render = parseRenderFunction(renderMatch[1]);
  }
  
  // Extract init method (if present)
  const initRegex = /init[:]\(\)⟨([\s\S]*?)⟩/;
  const initMatch = content.match(initRegex);
  if (initMatch) {
    component.init = initMatch[1].trim();
  }
  
  // Extract methods section
  const methodsRegex = /methods[:](⟨[\s\S]*?⟩)/;
  const methodsMatch = content.match(methodsRegex);
  if (methodsMatch) {
    component.methods = parseMethodsObject(methodsMatch[1]);
  }
  
  return component;
}

/**
 * Parse state management definition
 */
function parseStateManagement(stateBody) {
  // For simplicity, just return the raw state definition
  return stateBody.trim();
}

/**
 * Parse UI components declaration
 */
function parseUIComponents(uiComponentsBody) {
  // Parse the components and theme
  const componentsRegex = /components[:]\{([\s\S]*?)\}/;
  const themeRegex = /theme[:]\{([\s\S]*?)\}/;
  
  const components = {};
  const theme = {};
  
  // Extract components
  const componentsMatch = uiComponentsBody.match(componentsRegex);
  if (componentsMatch) {
    const componentsList = componentsMatch[1].split(',').map(c => c.trim());
    componentsList.forEach(component => {
      if (component) {
        components[component] = component;
      }
    });
  }
  
  // Extract theme
  const themeMatch = uiComponentsBody.match(themeRegex);
  if (themeMatch) {
    const themeBody = themeMatch[1];
    
    // Parse theme properties
    const themeProps = themeBody.split(',').map(prop => prop.trim());
    themeProps.forEach(prop => {
      if (prop && prop.includes(':')) {
        const [key, value] = prop.split(':').map(p => p.trim());
        theme[key] = value;
      }
    });
  }
  
  return {
    components,
    theme
  };
}

/**
 * Parse application definition
 */
function parseAppDefinition(appBody) {
  const app = {
    state: {},
    init: null,
    actions: {},
    render: null
  };
  
  // Remove outer brackets
  const content = appBody.substring(2, appBody.length - 2);
  
  // Extract state section
  const stateRegex = /state[:](⟨[\s\S]*?⟩)/;
  const stateMatch = content.match(stateRegex);
  if (stateMatch) {
    app.state = parseObjectLiteral(stateMatch[1]);
  }
  
  // Extract init method (if present)
  const initRegex = /init[:]\(\)⟨([\s\S]*?)⟩/;
  const initMatch = content.match(initRegex);
  if (initMatch) {
    app.init = initMatch[1].trim();
  }
  
  // Extract actions section
  const actionsRegex = /actions[:](⟨[\s\S]*?⟩)/;
  const actionsMatch = content.match(actionsRegex);
  if (actionsMatch) {
    app.actions = parseMethodsObject(actionsMatch[1]);
  }
  
  // Extract render section
  const renderRegex = /render[:](⟨[\s\S]*?⟩)/;
  const renderMatch = content.match(renderRegex);
  if (renderMatch) {
    app.render = parseRenderFunction(renderMatch[1]);
  }
  
  return app;
}

/**
 * Parse API documentation
 */
function parseApiDoc(body) {
  const api = {
    description: '',
    params: [],
    returns: null,
    example: '',
    warnings: []
  };
  
  // Extract parameters
  const paramRegex = /◉([^◉]+)◉/g;
  let paramMatch;
  
  while ((paramMatch = paramRegex.exec(body)) !== null) {
    const [_, paramDef] = paramMatch;
    const [name, type] = paramDef.split(':').map(p => p.trim());
    
    api.params.push({
      name,
      type
    });
  }
  
  // Extract return value
  const returnRegex = /⚐([^⚐]+)⚐/;
  const returnMatch = body.match(returnRegex);
  if (returnMatch) {
    const [_, returnDef] = returnMatch;
    const [name, type] = returnDef.split(':').map(p => p.trim());
    
    api.returns = {
      name,
      type
    };
  }
  
  // Extract example
  const exampleRegex = /⚛([\s\S]*?)⚛/;
  const exampleMatch = body.match(exampleRegex);
  if (exampleMatch) {
    api.example = exampleMatch[1].trim();
  }
  
  // Extract warnings
  const warningRegex = /⚠([^⚠]+)⚠/g;
  let warningMatch;
  
  while ((warningMatch = warningRegex.exec(body)) !== null) {
    api.warnings.push(warningMatch[1].trim());
  }
  
  return api;
}

/**
 * Parse object literal in GaiaScript syntax
 */
function parseObjectLiteral(objLiteral) {
  // Remove brackets
  const content = objLiteral.substring(1, objLiteral.length - 1);
  
  // Split by commas, but not within nested structures
  const properties = splitTopLevelCommas(content);
  
  const result = {};
  
  // Parse each property
  properties.forEach(prop => {
    if (prop.includes(':')) {
      const [key, value] = prop.split(':').map(p => p.trim());
      
      // Handle nested objects
      if (value.startsWith('⟨') && value.endsWith('⟩')) {
        result[key] = parseObjectLiteral(value);
      } 
      // Handle arrays
      else if (value.startsWith('[') && value.endsWith(']')) {
        result[key] = parseArray(value);
      }
      // Handle functions
      else if (value.includes('⟨')) {
        result[key] = value;
      }
      // Handle primitives
      else {
        result[key] = parseValue(value);
      }
    }
  });
  
  return result;
}

/**
 * Parse methods object
 */
function parseMethodsObject(methodsObj) {
  // Remove brackets
  const content = methodsObj.substring(1, methodsObj.length - 1);
  
  // Split by method definitions
  const methodRegex = /([^:]+)[:]\(([^)]*)\)⟨([\s\S]*?)⟩(?=,|\s*$)/g;
  const methods = {};
  
  let methodMatch;
  while ((methodMatch = methodRegex.exec(content)) !== null) {
    const [_, name, params, body] = methodMatch;
    
    methods[name.trim()] = {
      params: params.split(',').map(p => p.trim()),
      body: body.trim()
    };
  }
  
  return methods;
}

/**
 * Parse render function
 */
function parseRenderFunction(renderFn) {
  // Remove brackets
  const content = renderFn.substring(1, renderFn.length - 1);
  
  // For simplicity, just return the raw render function content
  return content.trim();
}

/**
 * Parse array in GaiaScript syntax
 */
function parseArray(arrayLiteral) {
  // Remove brackets
  const content = arrayLiteral.substring(1, arrayLiteral.length - 1);
  
  // Split by commas, but not within nested structures
  const items = splitTopLevelCommas(content);
  
  return items.map(item => {
    const trimmed = item.trim();
    
    // Handle nested objects
    if (trimmed.startsWith('⟨') && trimmed.endsWith('⟩')) {
      return parseObjectLiteral(trimmed);
    }
    // Handle nested arrays
    else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return parseArray(trimmed);
    }
    // Handle primitives
    else {
      return parseValue(trimmed);
    }
  });
}

/**
 * Parse primitive values (string, number, boolean, null)
 */
function parseValue(value) {
  const trimmed = value.trim();
  
  // Handle string literals
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.substring(1, trimmed.length - 1);
  }
  // Handle numbers
  else if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }
  // Handle booleans
  else if (trimmed === 'true') {
    return true;
  }
  else if (trimmed === 'false') {
    return false;
  }
  // Handle null
  else if (trimmed === 'null') {
    return null;
  }
  // Handle undefined
  else if (trimmed === 'undefined') {
    return undefined;
  }
  // Handle color literals
  else if (trimmed.startsWith('#')) {
    return trimmed;
  }
  // Default to string
  else {
    return trimmed;
  }
}

/**
 * Split string by commas, but only at the top level
 */
function splitTopLevelCommas(str) {
  const result = [];
  let start = 0;
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
    }
    
    if (!inString) {
      if (char === '{' || char === '[' || char === '(' || char === '⟨') {
        depth++;
      } else if (char === '}' || char === ']' || char === ')' || char === '⟩') {
        depth--;
      } else if (char === ',' && depth === 0) {
        result.push(str.substring(start, i).trim());
        start = i + 1;
      }
    }
  }
  
  if (start < str.length) {
    result.push(str.substring(start).trim());
  }
  
  return result.filter(item => item.length > 0);
}

/**
 * Generate HTML from AST
 */
function generateHTML(ast) {
  // Basic HTML with references to CSS and JS
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ast.documentation.title || 'GaiaScript App'}</title>
  <link rel="stylesheet" href="styles.css">
  <meta name="description" content="${ast.documentation.overview || ''}">
</head>
<body>
  <div id="app"></div>
  <script src="gaia-ui-runtime.js"></script>
  <script src="app.js"></script>
</body>
</html>`;
}

/**
 * Generate CSS from AST
 */
function generateCSS(ast) {
  let css = '/* Generated from GaiaScript */\n\n';
  
  // Add global styles
  css += `body, html {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  height: 100%;
  width: 100%;
}

#app {
  height: 100%;
  width: 100%;
}\n\n`;
  
  // Generate component styles
  for (const [name, component] of Object.entries(ast.components)) {
    if (component.style) {
      css += `/* Styles for ${name} component */\n`;
      
      // Process each style rule
      for (const [selector, styles] of Object.entries(component.style)) {
        css += `.${name}-${selector} {\n`;
        
        // Process style properties
        for (const [property, value] of Object.entries(styles)) {
          if (typeof value === 'object') {
            // Handle nested styles (like hover, focus, etc.)
            if (property === 'hover') {
              css += `}\n\n.${name}-${selector}:hover {\n`;
              for (const [nestedProp, nestedValue] of Object.entries(value)) {
                css += `  ${convertToCssProperty(nestedProp)}: ${nestedValue};\n`;
              }
            } else if (property === 'focus') {
              css += `}\n\n.${name}-${selector}:focus {\n`;
              for (const [nestedProp, nestedValue] of Object.entries(value)) {
                css += `  ${convertToCssProperty(nestedProp)}: ${nestedValue};\n`;
              }
            } else if (property === 'active') {
              css += `}\n\n.${name}-${selector}:active {\n`;
              for (const [nestedProp, nestedValue] of Object.entries(value)) {
                css += `  ${convertToCssProperty(nestedProp)}: ${nestedValue};\n`;
              }
            } else {
              // Nested object - handle as complex property (like boxShadow)
              css += `  ${convertToCssProperty(property)}: ${convertObjectToValue(value)};\n`;
            }
          } else {
            css += `  ${convertToCssProperty(property)}: ${value};\n`;
          }
        }
        
        css += '}\n\n';
      }
    }
  }
  
  // Generate UI theme styles if present
  if (ast.ui && ast.ui.components && ast.ui.components.theme) {
    css += '/* Theme Variables */\n:root {\n';
    
    for (const [key, value] of Object.entries(ast.ui.components.theme)) {
      if (typeof value === 'object') {
        for (const [subKey, subValue] of Object.entries(value)) {
          css += `  --${key}-${subKey}: ${subValue};\n`;
        }
      } else {
        css += `  --${key}: ${value};\n`;
      }
    }
    
    css += '}\n\n';
  }
  
  return css;
}

/**
 * Convert camelCase to kebab-case for CSS properties
 */
function convertToCssProperty(property) {
  return property.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert object to CSS value string
 */
function convertObjectToValue(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  // Special case for boxShadow
  if ('x' in obj && 'y' in obj && 'blur' in obj && 'color' in obj) {
    const spread = obj.spread || 0;
    return `${obj.x}px ${obj.y}px ${obj.blur}px ${spread}px ${obj.color}`;
  }
  
  // Handle other object types
  return Object.entries(obj)
    .map(([key, value]) => `${key}(${value})`)
    .join(' ');
}

/**
 * Generate JavaScript from AST
 */
function generateJS(ast) {
  let js = '// Generated from GaiaScript\n\n';
  
  // Create object to hold compiled components
  js += 'const compiledComponents = {};\n\n';
  
  // Generate component definitions
  for (const [name, component] of Object.entries(ast.components)) {
    js += `// ${name} Component\n`;
    js += `compiledComponents.${name} = {\n`;
    
    // Add props
    js += '  props: ' + JSON.stringify(component.props, null, 2) + ',\n\n';
    
    // Add state
    js += '  state: ' + JSON.stringify(component.state, null, 2) + ',\n\n';
    
    // Add render function
    js += '  render: function() {\n';
    js += '    return ' + convertRenderToJS(component.render) + ';\n';
    js += '  },\n\n';
    
    // Add init function if present
    if (component.init) {
      js += '  init: function() {\n';
      js += '    ' + convertGaiaScriptToJS(component.init) + '\n';
      js += '  },\n\n';
    }
    
    // Add methods
    js += '  methods: {\n';
    
    for (const [methodName, method] of Object.entries(component.methods)) {
      js += `    ${methodName}: function(${method.params.join(', ')}) {\n`;
      js += '      ' + convertGaiaScriptToJS(method.body) + '\n';
      js += '    },\n';
    }
    
    js += '  }\n';
    js += '};\n\n';
  }
  
  // Generate UI framework initialization
  if (ast.ui) {
    js += '// Initialize GaiaUI Framework\n';
    js += 'document.addEventListener("DOMContentLoaded", function() {\n';
    
    // Create app definition
    js += '  const gaiaApp = {\n';
    
    // Add state
    js += '    state: ' + JSON.stringify(ast.ui.app.state, null, 2) + ',\n\n';
    
    // Add app render function
    js += '    render: function() {\n';
    js += '      return ' + convertRenderToJS(ast.ui.app.render) + ';\n';
    js += '    },\n\n';
    
    // Add app init function if present
    if (ast.ui.app.init) {
      js += '    init: function() {\n';
      js += '      ' + convertGaiaScriptToJS(ast.ui.app.init) + '\n';
      js += '    },\n\n';
    }
    
    // Add actions
    js += '    actions: {\n';
    
    for (const [actionName, action] of Object.entries(ast.ui.app.actions)) {
      js += `      ${actionName}: function(${action.params.join(', ')}) {\n`;
      js += '        ' + convertGaiaScriptToJS(action.body) + '\n';
      js += '      },\n';
    }
    
    js += '    }\n';
    js += '  };\n\n';
    
    // Initialize UI
    js += '  const ui = {\n';
    js += '    components: compiledComponents,\n';
    
    // Add theme if present
    if (ast.ui.components && ast.ui.components.theme) {
      js += '    theme: ' + JSON.stringify(ast.ui.components.theme, null, 2) + '\n';
    } else {
      js += '    theme: {}\n';
    }
    
    js += '  };\n\n';
    
    // Initialize framework
    js += '  GaiaUI.initGaiaUI({\n';
    js += '    state: {},\n';
    js += '    ui: ui,\n';
    js += '    app: gaiaApp\n';
    js += '  });\n';
    
    js += '});\n';
  }
  
  return js;
}

/**
 * Convert GaiaScript render function to JavaScript
 */
function convertRenderToJS(render) {
  if (!render) return 'null';
  
  // Replace common patterns
  let js = render
    // Replace class assignment with ternary
    .replace(/class:[(]([^|]+)[|]"([^"]+)"[|]"([^"]+)"[)]/g, 'className: $1 ? "$2" : "$3"')
    // Replace simple class assignment
    .replace(/class:"([^"]+)"/g, 'className: "$1"')
    // Replace pipe conditional with ternary
    .replace(/[(]([^|]+)[|]([^|]+)[|]([^)]+)[)]/g, '($1 ? $2 : $3)')
    // Replace arrow function shorthand
    .replace(/[(][)]=>/g, '() => ')
    // Replace pipe with function calls
    .replace(/([^|])→\[/g, '$1, [')
    // Replace map operations
    .replace(/map[(]([^⟨]+)⟨/g, 'map($1 => {return ')
    // Replace end of map operation
    .replace(/⟩[)]/g, ';})')
    // Replace state operators
    .replace(/⊜/g, '=')
    .replace(/⊕/g, '.add')
    .replace(/⊝/g, '.subtract')
    .replace(/⊙/g, '.toggle')
    .replace(/⊛/g, '.clear');
  
  // Replace element creation
  js = js.replace(/П/g, 'GaiaUI.createElement("div"')
     .replace(/⌘/g, 'GaiaUI.createElement("button"')
     .replace(/⌑/g, 'GaiaUI.createElement("span"')
     .replace(/⌹/g, 'GaiaUI.createElement("img"')
     .replace(/⌤/g, 'GaiaUI.createElement("input"');
  
  // Replace event handlers
  js = js.replace(/@([a-zA-Z]+)→([a-zA-Z0-9_$]+)/g, 'on$1: $2');
  
  // Replace data binding
  js = js.replace(/⇄([a-zA-Z0-9_$]+)/g, 'value: $1, onChange: e => $1 = e.target.value');
  
  return js;
}

/**
 * Convert GaiaScript code to JavaScript
 */
function convertGaiaScriptToJS(gaiaCode) {
  if (!gaiaCode) return '';
  
  // Replace state operators
  return gaiaCode
    .replace(/⊜/g, '=')
    .replace(/⊕/g, '.add')
    .replace(/⊝/g, '.subtract')
    .replace(/⊙/g, '.toggle')
    .replace(/⊛/g, '.clear');
}

/**
 * Generate Swift code for iOS from AST
 */
function generateSwift(ast) {
  // Basic Swift wrapper around WebView
  let swift = '// Generated Swift code for iOS from GaiaScript\n\n';
  
  swift += `import SwiftUI
import WebKit

struct GaiaScriptView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()
        
        // Load HTML content
        let htmlContent = """
        ${generateHTML(ast)}
        """
        
        // Load CSS content
        let cssContent = """
        ${generateCSS(ast)}
        """
        
        // Load JS content
        let jsContent = """
        ${generateJS(ast)}
        """
        
        // Combine all content
        let content = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
            \(cssContent)
            </style>
        </head>
        <body>
            <div id="app"></div>
            <script>
            \(jsContent)
            </script>
        </body>
        </html>
        """
        
        webView.loadHTMLString(content, baseURL: nil)
        return webView
    }
    
    func updateUIView(_ uiView: WKWebView, context: Context) {
        // Update logic here if needed
    }
}

struct GaiaScriptApp: App {
    var body: some Scene {
        WindowGroup {
            GaiaScriptView()
        }
    }
}`;
  
  return swift;
}

/**
 * Generate iOS bridge JS
 */
function generateIOSBridgeJS(ast) {
  // Bridge code for iOS integration
  return `// iOS Bridge for GaiaScript
window.iOSBridge = {
  sendMessage: function(message) {
    // Send message to iOS native code
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.gaiaBridge) {
      window.webkit.messageHandlers.gaiaBridge.postMessage(message);
    }
  },
  
  receiveMessage: function(message) {
    // Handle messages from iOS native code
    console.log("Received message from iOS:", message);
    
    // Dispatch to appropriate handlers
    if (message.type === "action") {
      // Handle action requests
      if (message.name && typeof window.gaiaActions[message.name] === "function") {
        window.gaiaActions[message.name](message.data);
      }
    }
  }
};

// Register global action handlers
window.gaiaActions = {};

// Initialize iOS bridge when document is ready
document.addEventListener("DOMContentLoaded", function() {
  // Send ready message to iOS
  window.iOSBridge.sendMessage({
    type: "ready",
    timestamp: Date.now()
  });
  
  // Register actions from app
  if (window.GaiaUI && window.GaiaUI.app && window.GaiaUI.app.actions) {
    for (const [name, fn] of Object.entries(window.GaiaUI.app.actions)) {
      window.gaiaActions[name] = fn;
    }
  }
});`;
}

/**
 * Generate C# code for Windows
 */
function generateCSharp(ast) {
  // Basic C# wrapper around WebView for Windows
  return `// Generated C# code for Windows from GaiaScript
using System;
using System.IO;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace GaiaScriptApp
{
    public sealed partial class MainPage : Page
    {
        public MainPage()
        {
            this.InitializeComponent();
            InitializeWebView();
        }

        private async void InitializeWebView()
        {
            WebView webView = new WebView();
            webView.Width = Window.Current.Bounds.Width;
            webView.Height = Window.Current.Bounds.Height;

            // HTML content
            string htmlContent = @"${generateHTML(ast).replace(/"/g, '""')}";
            
            // CSS content
            string cssContent = @"${generateCSS(ast).replace(/"/g, '""')}";
            
            // JS content
            string jsContent = @"${generateJS(ast).replace(/"/g, '""')}";
            
            // Combine all content
            string content = $@"<!DOCTYPE html>
<html>
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <style>
    {cssContent}
    </style>
</head>
<body>
    <div id=""app""></div>
    <script>
    {jsContent}
    </script>
</body>
</html>";

            // Load the content
            webView.NavigateToString(content);
            RootGrid.Children.Add(webView);
        }
    }
}`;
}

// Export the compiler API
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    compileGaiaScript,
    parseGaiaScript,
    generateHTML,
    generateCSS,
    generateJS,
    generateSwift,
    generateIOSBridgeJS,
    generateCSharp
  };
} else {
  // Browser export
  window.GaiaCompiler = {
    compileGaiaScript,
    parseGaiaScript,
    generateHTML,
    generateCSS,
    generateJS,
    generateSwift,
    generateIOSBridgeJS,
    generateCSharp
  };
}