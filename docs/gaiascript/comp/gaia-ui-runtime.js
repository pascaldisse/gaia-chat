/**
 * GaiaUI Extended Runtime
 * Enhanced runtime for GaiaUI framework with advanced features
 */

// Symbol mapping table for GaiaScript syntax elements
const SYMBOL_MAP = {
  // UI Elements
  'П': 'div',      // Panel/Div
  '⊞': 'grid',     // Grid
  '⌘': 'button',   // Button
  '⌑': 'text',     // Text/Label
  '⌤': 'input',    // Input
  '⌹': 'img',      // Image
  '∮': 'canvas',   // Canvas
  
  // State Operations
  '⊕': 'add',      // Add/Increment
  '⊝': 'subtract', // Subtract/Decrement
  '⊜': 'assign',   // Assignment
  '⊙': 'toggle',   // Toggle
  '⊛': 'clear',    // Clear
  
  // Data Binding
  '⇄': 'bind',     // Two-way binding
  '→': 'pipe',     // Function piping/chaining
  
  // Component Definition
  'C〈': 'component_start',
  '〉': 'component_end',
  
  // UI Framework
  'UI〈': 'ui_framework_start',
  '§': 'state_management',
  'γ': 'ui_components',
  'δ': 'app_definition',
  
  // Method Groups
  '⟨': 'group_start',
  '⟩': 'group_end'
};

// Extended DOM element creation with GaiaScript features
function createElement(type, props = {}, ...children) {
  // Handle GaiaScript symbols
  const elementType = SYMBOL_MAP[type] || type;
  
  // Special handling for 'text' type
  if (elementType === 'text') {
    const span = document.createElement('span');
    
    // Apply props
    for (const [key, value] of Object.entries(props)) {
      if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.substring(2).toLowerCase();
        span.addEventListener(eventName, value);
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(span.style, value);
      } else if (key === 'className' || key === 'class') {
        span.className = value;
      } else if (key === 'html') {
        span.innerHTML = value;
      } else {
        span.setAttribute(key, value);
      }
    }
    
    // Add children
    children.forEach(child => {
      if (typeof child === 'string') {
        span.innerHTML = child; // Use innerHTML for text to support variable interpolation
      } else if (child instanceof Node) {
        span.appendChild(child);
      } else if (child != null) {
        span.appendChild(document.createTextNode(String(child)));
      }
    });
    
    return span;
  }
  
  // For other element types
  const element = document.createElement(elementType);
  
  // Apply props
  for (const [key, value] of Object.entries(props)) {
    if (key === 'ref') {
      // Skip ref handling, will be processed separately
      continue;
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.substring(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key === 'className' || key === 'class') {
      element.className = value;
    } else if (key === 'html') {
      element.innerHTML = value;
    } else if (key === 'disabled' && value) {
      element.setAttribute('disabled', 'disabled');
    } else {
      element.setAttribute(key, value);
    }
  }
  
  // Process children
  children.flat().forEach(child => {
    if (child === null || child === undefined) return;
    
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    } else if (Array.isArray(child)) {
      child.forEach(item => {
        if (item instanceof Node) {
          element.appendChild(item);
        } else if (item != null) {
          element.appendChild(document.createTextNode(String(item)));
        }
      });
    } else {
      element.appendChild(document.createTextNode(String(child)));
    }
  });
  
  return element;
}

// Render a component to a container
function render(component, container) {
  const root = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
  
  if (!root) return false;
  
  root.innerHTML = '';
  root.appendChild(component);
  return true;
}

// Enhanced reactive state store with immutability guarantees
function createStore(initialState = {}) {
  let state = { ...initialState };
  const subscribers = [];
  const componentRefs = new Map();
  
  const store = {
    // Get the current state (immutable copy)
    get: function() {
      return { ...state };
    },
    
    // Set the state (with validation)
    set: function(update) {
      // Handle function updaters and direct objects
      const newState = typeof update === 'function' 
        ? update({ ...state }) 
        : { ...state, ...update };
      
      // Only update if changes were actually made
      if (JSON.stringify(state) !== JSON.stringify(newState)) {
        state = newState;
        
        // Notify all subscribers
        subscribers.forEach(callback => callback(state));
      }
    },
    
    // Update a specific property or path
    update: function(path, value) {
      const newState = { ...state };
      const pathParts = path.split('.');
      let current = newState;
      
      // Navigate to the right nesting level
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part];
      }
      
      // Set the value
      current[pathParts[pathParts.length - 1]] = value;
      
      // Update the store
      this.set(newState);
    },
    
    // Add a value to an array or increment a number
    add: function(path, value) {
      const newState = { ...state };
      const pathParts = path.split('.');
      let current = newState;
      
      // Navigate to the right nesting level
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        current = current[part];
      }
      
      // Get the target property
      const lastPart = pathParts[pathParts.length - 1];
      const target = current[lastPart];
      
      // Handle different types
      if (Array.isArray(target)) {
        // Add to array
        current[lastPart] = [...target, value];
      } else if (typeof target === 'number') {
        // Increment number
        current[lastPart] = target + (value || 1);
      } else {
        // Default behavior: set the value
        current[lastPart] = value;
      }
      
      // Update the store
      this.set(newState);
    },
    
    // Remove a value from an array or decrement a number
    subtract: function(path, value) {
      const newState = { ...state };
      const pathParts = path.split('.');
      let current = newState;
      
      // Navigate to the right nesting level
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        current = current[part];
      }
      
      // Get the target property
      const lastPart = pathParts[pathParts.length - 1];
      const target = current[lastPart];
      
      // Handle different types
      if (Array.isArray(target)) {
        if (typeof value === 'function') {
          // Filter with predicate
          current[lastPart] = target.filter(item => !value(item));
        } else {
          // Remove by value or index
          if (typeof value === 'number') {
            // Remove by index
            current[lastPart] = [...target.slice(0, value), ...target.slice(value + 1)];
          } else {
            // Remove by value
            current[lastPart] = target.filter(item => item !== value);
          }
        }
      } else if (typeof target === 'number') {
        // Decrement number
        current[lastPart] = target - (value || 1);
      }
      
      // Update the store
      this.set(newState);
    },
    
    // Toggle a boolean value
    toggle: function(path) {
      const newState = { ...state };
      const pathParts = path.split('.');
      let current = newState;
      
      // Navigate to the right nesting level
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        current = current[part];
      }
      
      // Toggle the value
      const lastPart = pathParts[pathParts.length - 1];
      current[lastPart] = !current[lastPart];
      
      // Update the store
      this.set(newState);
    },
    
    // Clear an array or reset a value
    clear: function(path) {
      const newState = { ...state };
      const pathParts = path.split('.');
      let current = newState;
      
      // Navigate to the right nesting level
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        current = current[part];
      }
      
      // Clear the value
      const lastPart = pathParts[pathParts.length - 1];
      const target = current[lastPart];
      
      if (Array.isArray(target)) {
        current[lastPart] = [];
      } else if (typeof target === 'object' && target !== null) {
        current[lastPart] = {};
      } else if (typeof target === 'number') {
        current[lastPart] = 0;
      } else if (typeof target === 'string') {
        current[lastPart] = '';
      } else if (typeof target === 'boolean') {
        current[lastPart] = false;
      }
      
      // Update the store
      this.set(newState);
    },
    
    // Subscribe to state changes
    subscribe: function(callback) {
      subscribers.push(callback);
      // Initial call with current state
      callback(state);
      
      // Return unsubscribe function
      return function() {
        const index = subscribers.indexOf(callback);
        if (index !== -1) subscribers.splice(index, 1);
      };
    },
    
    // Register a component reference
    registerRef: function(name, ref) {
      componentRefs.set(name, ref);
    },
    
    // Get a component reference
    getRef: function(name) {
      return componentRefs.get(name);
    }
  };
  
  return store;
}

// Create a component from a definition
function createComponent(definition, props = {}) {
  // Merge props into the initial state
  const initialState = {
    ...(definition.state || {}),
    ...(definition.props || {}),
    ...props
  };
  
  // Create the store
  const store = createStore(initialState);
  
  // State for component references
  const refs = {};
  
  // Create the component instance
  const component = {
    // Store reference
    store,
    
    // Component definition
    definition,
    
    // Get the current state
    getState: () => store.get(),
    
    // Getter for refs
    getRefs: () => refs,
    
    // Register a ref
    registerRef: (name, element) => {
      refs[name] = element;
      return element;
    },
    
    // Initialize component
    init: function() {
      const state = this.getState();
      
      // Call init method if defined
      if (definition.init) {
        const boundInit = definition.init.bind({
          ...state,
          ...this.createMethods()
        });
        boundInit();
      }
    },
    
    // Create methods object
    createMethods: function() {
      const methods = {};
      
      // Add built-in methods
      methods.setState = (update) => store.set(update);
      methods.updateState = (path, value) => store.update(path, value);
      methods.addToState = (path, value) => store.add(path, value);
      methods.subtractFromState = (path, value) => store.subtract(path, value);
      methods.toggleState = (path) => store.toggle(path);
      methods.clearState = (path) => store.clear(path);
      
      // Add definition methods
      if (definition.methods) {
        Object.entries(definition.methods).forEach(([name, fn]) => {
          methods[name] = (...args) => {
            const state = this.getState();
            const boundFn = fn.bind({
              ...state,
              ...methods,
              refs
            });
            return boundFn(...args);
          };
        });
      }
      
      return methods;
    },
    
    // Render the component
    render: function() {
      // Create the methods
      const methods = this.createMethods();
      
      // Get the current state
      const state = this.getState();
      
      // Combine state and methods
      const renderContext = {
        ...state,
        ...methods,
        refs
      };
      
      // Call the render function
      return definition.render.call(renderContext);
    },
    
    // Mount the component to a container
    mount: function(container) {
      // Initialize the component
      this.init();
      
      // Create the element
      const element = this.render();
      
      // Subscribe to state changes
      store.subscribe(() => {
        const newElement = this.render();
        element.replaceWith(newElement);
      });
      
      // Render to container
      return render(element, container);
    }
  };
  
  return component;
}

// Apply CSS styles to the document
function applyStyles(styles) {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

// Compile CSS from GaiaScript style definitions
function compileStyles(styleObj, prefix = '') {
  let css = '';
  
  for (const [selector, styles] of Object.entries(styleObj)) {
    css += `${prefix}${selector} {\n`;
    
    for (const [property, value] of Object.entries(styles)) {
      if (typeof value === 'object') {
        // Handle nested selectors (pseudo-classes, nested elements)
        if (property.startsWith('&')) {
          css += compileStyles({ [property.substring(1)]: value }, `${prefix}${selector}`);
        } else if (property === 'hover') {
          css += compileStyles(value, `${prefix}${selector}:hover`);
        } else if (property === 'focus') {
          css += compileStyles(value, `${prefix}${selector}:focus`);
        } else if (property === 'active') {
          css += compileStyles(value, `${prefix}${selector}:active`);
        } else if (property === 'disabled') {
          css += compileStyles(value, `${prefix}${selector}:disabled`);
        } else {
          // Handle nested objects as sub-properties
          css += `  ${property}: ${compileStyles(value)};\n`;
        }
      } else {
        // Handle standard properties
        css += `  ${property}: ${value};\n`;
      }
    }
    
    css += '}\n';
  }
  
  return css;
}

// Initialize GaiaUI framework
function initGaiaUI(framework) {
  // Extract framework sections
  const { state, ui, app } = framework;
  
  // Process theme styles
  if (ui && ui.theme) {
    // Generate CSS variables from theme
    let themeCSS = ':root {\n';
    
    for (const [category, values] of Object.entries(ui.theme)) {
      if (typeof values === 'object') {
        for (const [name, value] of Object.entries(values)) {
          themeCSS += `  --${category}-${name}: ${value};\n`;
        }
      } else {
        themeCSS += `  --${category}: ${values};\n`;
      }
    }
    
    themeCSS += '}\n';
    
    // Apply theme styles
    applyStyles(themeCSS);
  }
  
  // Register UI components
  const components = {};
  
  if (ui && ui.components) {
    for (const [name, definition] of Object.entries(ui.components)) {
      components[name] = definition;
    }
  }
  
  // Create application
  const appState = app.state || {};
  const appStore = createStore(appState);
  
  // Initialize app
  if (app.init) {
    const initContext = {
      ...appState,
      setState: appStore.set.bind(appStore),
      add: appStore.add.bind(appStore),
      subtract: appStore.subtract.bind(appStore),
      toggle: appStore.toggle.bind(appStore),
      clear: appStore.clear.bind(appStore)
    };
    
    // Bind action methods
    if (app.actions) {
      for (const [name, fn] of Object.entries(app.actions)) {
        initContext[name] = (...args) => {
          const boundFn = fn.bind({
            ...appStore.get(),
            setState: appStore.set.bind(appStore),
            add: appStore.add.bind(appStore),
            subtract: appStore.subtract.bind(appStore),
            toggle: appStore.toggle.bind(appStore),
            clear: appStore.clear.bind(appStore)
          });
          return boundFn(...args);
        };
      }
    }
    
    // Call init function
    app.init.call(initContext);
  }
  
  // Create render context for app
  const appRenderContext = {
    ...appStore.get(),
    components
  };
  
  // Bind action methods to render context
  if (app.actions) {
    for (const [name, fn] of Object.entries(app.actions)) {
      appRenderContext[name] = (...args) => {
        const boundFn = fn.bind({
          ...appStore.get(),
          setState: appStore.set.bind(appStore),
          add: appStore.add.bind(appStore),
          subtract: appStore.subtract.bind(appStore),
          toggle: appStore.toggle.bind(appStore),
          clear: appStore.clear.bind(appStore)
        });
        return boundFn(...args);
      };
    }
  }
  
  // Subscribe to state changes
  appStore.subscribe(state => {
    // Update render context
    Object.assign(appRenderContext, state);
    
    // Re-render app
    const appElement = app.render.call(appRenderContext);
    
    // Replace existing app with new render
    const container = document.getElementById('app');
    if (container) {
      container.innerHTML = '';
      container.appendChild(appElement);
    }
  });
  
  // Initial render
  const appElement = app.render.call(appRenderContext);
  
  // Render app to container
  const container = document.getElementById('app');
  if (container) {
    container.innerHTML = '';
    container.appendChild(appElement);
  }
  
  return {
    components,
    state: appStore
  };
}

// Initialize GaiaUI from a compiled definition
function initFromCompiled(compiledGaia) {
  // Apply styles
  applyStyles(compiledGaia.css);
  
  // Create UI framework
  const framework = {
    state: compiledGaia.state,
    ui: compiledGaia.ui,
    app: compiledGaia.app
  };
  
  // Initialize the framework
  return initGaiaUI(framework);
}

// Export the public API
window.GaiaUI = {
  createElement,
  render,
  createStore,
  createComponent,
  compileStyles,
  applyStyles,
  initGaiaUI,
  initFromCompiled,
  symbols: SYMBOL_MAP
};