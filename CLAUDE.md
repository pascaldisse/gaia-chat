# Gaia Project Guidelines

## Build & Test Commands
- `npm start` - Run development server
- `npm test` - Run all tests
- `npm test -- --testPathPattern=src/components/Chat` - Run specific test file
- `npm test -- -t "test name"` - Run specific test by name
- `npm run build` - Build for production
- `npm run eject` - Eject from Create React App

## Code Style Guidelines
- **React Functional Components** with hooks for state management
- **Imports**: Group imports - React, components, services, utils, styles (in that order)
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Error Handling**: Try/catch blocks with specific error messages and proper console.error logging
- **Promises**: Always use async/await with proper error handling
- **Component Props**: Destructure in function parameters
- **State Management**: Use useState for local state, useEffect for side effects
- **File Structure**: One component per file, matching filename to component name
- **RPG System**: Follow the established D20-based mechanics for persona behavior calculations
- **Persona API**: Use class-based approach for Persona model with appropriate attributes
- **Database**: Use the existing db service for data persistence