# Gaia Project Guidelines

## Build & Test Commands
- `npm install` - Install dependencies
- `npm start` - Run development server
- `npm test` - Run all tests
- `npm test -- --testPathPattern=src/tests/MessageFormatting` - Run specific test file
- `npm test -- -t "formats <speech> tags correctly"` - Run test by name
- `npm run build` - Build for production
- `node test/test-cve-scanner.js` - Test CVE scanner functionality
- `node server/cve-api/index.js` - Start CVE scanner API (port 3001)

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

## CVE Scanner Architecture
- **Scanner Service**: `src/services/cve/scanner.js` - Main scanning engine
- **Language Parsers**: `src/services/cve/parsers/` - NodeJS, Python, Flutter parsers
- **OSV Database**: `src/services/cve/databases/OSVDatabase.js` - Free vulnerability data
- **Remediation Engine**: `src/services/cve/remediation/RemediationEngine.js` - Version recommendations
- **Report Generator**: `src/services/cve/reporters/ReportGenerator.js` - Multi-format reports
- **Usage Tracker**: `src/services/cve/usage/UsageTracker.js` - Subscription management
- **API Server**: `server/cve-api/index.js` - RESTful API for remote scanning
- **UI Component**: `src/components/SecurityAudit/SecurityAuditPanel.jsx` - React interface

## CVE Scanner Testing
When testing the CVE scanner:
1. Mock the OSV API responses to avoid rate limiting
2. Test each language parser independently
3. Verify remediation recommendations are accurate
4. Check report generation in all formats
5. Test usage tracking and limits