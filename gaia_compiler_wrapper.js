/**
 * GaiaScript to React Compiler Wrapper
 * This script acts as a compatibility layer between main.gaia and the React component structure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const MAIN_GAIA_PATH = path.resolve(__dirname, 'main.gaia');
const SRC_DIR = path.resolve(__dirname, 'src');
const COMPONENTS_DIR = path.resolve(SRC_DIR, 'components');
const BUILD_DIR = path.resolve(__dirname, 'build');

// Make sure directories exist
function ensureDirectories() {
  if (!fs.existsSync(SRC_DIR)) {
    fs.mkdirSync(SRC_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(COMPONENTS_DIR)) {
    fs.mkdirSync(COMPONENTS_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
  }
}

// Check if main.gaia exists
function checkMainGaia() {
  if (!fs.existsSync(MAIN_GAIA_PATH)) {
    console.error(`Error: main.gaia file not found at ${MAIN_GAIA_PATH}`);
    process.exit(1);
  }
  console.log(`Found main.gaia at ${MAIN_GAIA_PATH}`);
}

// Main function
function main() {
  console.log("Starting GaiaScript to React compilation process...");
  
  // Initialize
  ensureDirectories();
  checkMainGaia();
  
  try {
    // Try to run the GaiaScript compiler
    console.log("Running GaiaScript compiler...");
    
    // Use .gaia/comp/build.js with correct parameters
    const compilerPath = path.resolve(__dirname, '.gaia', 'comp', 'build.js');
    
    if (!fs.existsSync(compilerPath)) {
      console.error(`Error: GaiaScript compiler not found at ${compilerPath}`);
      console.error("Make sure the symbolic link to .gaia is set up correctly.");
      process.exit(1);
    }
    
    // Execute compiler
    execSync(`node ${compilerPath} --output=${BUILD_DIR}/gaia-compiled.js main.gaia`, { 
      stdio: 'inherit',
      cwd: __dirname
    });
    
    console.log("GaiaScript compilation successful!");
    
    // Since the compiler was successful, now use the pre-existing React components
    // They have been manually created to match the GaiaScript structure
    console.log("Compilation and setup complete!");
    
  } catch (error) {
    console.error("Error during compilation:", error.message);
    console.error("Compilation failed!");
    process.exit(1);
  }
}

// Run the main function
main();
