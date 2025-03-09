# Gaia Project Guidelines

## Build & Test Commands
- `npm install` - Install dependencies
- `npm start` - Run development server
- `npm test` - Run all tests
- `npm test -- --testPathPattern=src/tests/MessageFormatting` - Run specific test file
- `npm test -- -t "formats <speech> tags correctly"` - Run test by name
- `npm run build` - Build for production

## Linting & Formatting
- Uses ESLint with React App defaults
- Follow the eslintConfig rules in package.json

## Code Style Guidelines
- **React Functional Components** with hooks for state management
- **Imports**: Group imports - React, libraries, components, services, utils, styles
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Error Handling**: Try/catch blocks with specific error messages and console.error logging
- **Promises**: Always use async/await with proper error handling
- **Component Props**: Destructure in function parameters
- **Testing**: Jest and React Testing Library with descriptive test names
- **File Structure**: One component per file, matching filename to component name
- **Custom Tags**: Use <speech>, <action>, and <function> tags for persona formatting
- **Persona API**: Use class-based approach for Persona model with appropriate attributes
- **Database**: Use the existing db service for data persistence