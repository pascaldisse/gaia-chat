/**
 * GaiaUI Runtime
 * Minimal runtime for GaiaUI framework - less than 1KB when minified
 */

// Create DOM elements with attributes and event listeners
function createElement(type, props = {}, ...children) {
  const element = document.createElement(type);
  
  // Set props and event listeners
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on') && key.toLowerCase() in window) {
      element.addEventListener(key.toLowerCase().substr(2), value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key === 'className') {
      element.className = value;
    } else if (key === 'disabled' && value === true) {
      element.setAttribute('disabled', 'disabled');
    } else {
      element.setAttribute(key, value);
    }
  }
  
  // Append children
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    } else if (child != null) {
      // Handle arrays or other iterables
      element.appendChild(document.createTextNode(String(child)));
    }
  });
  
  return element;
}

// Render a component to a container
function render(component, container) {
  if (typeof container === 'string') {
    container = document.querySelector(container);
  }
  if (!container) return false;
  
  container.innerHTML = '';
  container.appendChild(component);
  return true;
}

// Create a reactive state store
function createStore(initialState) {
  let state = initialState;
  let subscribers = [];
  
  return {
    getState: () => state,
    
    setState: (newState) => {
      state = typeof newState === 'function' ? newState(state) : newState;
      subscribers.forEach(callback => callback(state));
    },
    
    updateState: (partialState) => {
      state = { ...state, ...(typeof partialState === 'function' ? partialState(state) : partialState) };
      subscribers.forEach(callback => callback(state));
    },
    
    subscribe: (callback) => {
      subscribers.push(callback);
      return () => {
        subscribers = subscribers.filter(sub => sub !== callback);
      };
    }
  };
}

// Create a component from a config object
function createComponent(config, props = {}) {
  // Initialize state
  const store = createStore({ 
    ...config.state,
    ...props 
  });
  
  // Create DOM element
  let element = renderComponent();
  
  // Subscribe to state changes
  store.subscribe(() => {
    const newElement = renderComponent();
    element.replaceWith(newElement);
    element = newElement;
  });
  
  // Render component based on current state
  function renderComponent() {
    const state = store.getState();
    
    // Create methods object with state updaters
    const methods = {};
    if (config.methods) {
      Object.entries(config.methods).forEach(([name, fn]) => {
        methods[name] = (...args) => {
          fn.apply({ 
            ...state, 
            ...methods,
            setState: store.setState,
            updateState: store.updateState
          }, args);
        };
      });
    }
    
    // Call render function with state and methods
    return config.render.call({
      ...state,
      ...methods,
      setState: store.setState,
      updateState: store.updateState
    });
  }
  
  return element;
}

// Apply CSS styles to the document
function applyStyles(styles) {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

// Initialize GaiaUI application
function initApp(config) {
  const app = createComponent(config);
  render(app, '#app');
}

// Export the public API
window.GaiaUI = {
  createElement,
  render,
  createStore,
  createComponent,
  applyStyles,
  initApp
};