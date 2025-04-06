# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands
- `npm start` - Run development server
- `npm test` - Run all tests
- `npm test -- --testPathPattern=src/tests/YourTest` - Run specific test file
- `npm test -- -t "test name"` - Run test by name pattern
- `npm run build` - Build for production
- `./low-memory-build.sh` - Build with memory constraints
- `./minimal-build.sh` - Create minimal build in resource-limited environments

## Code Style Guidelines
- **Components**: Functional React with hooks for state management
- **Imports**: Order - React, components, services, utils, styles
- **Naming**: PascalCase for components/classes, camelCase for functions/variables
- **Error Handling**: Try/catch with specific error messages and console.error
- **Promises**: Use async/await with proper error handling
- **Component Props**: Destructure in function parameters
- **State**: useState for local state, useEffect for side effects
- **File Structure**: One component per file, matching filename to component
- **Persona System**: Use class-based Persona model with D20-based mechanics
- **Database**: Use the existing db service for data persistence