import CVEScanner from '../services/cve/scanner';
import NodeJSParser from '../services/cve/parsers/NodeJSParser';
import PythonParser from '../services/cve/parsers/PythonParser';
import FlutterParser from '../services/cve/parsers/FlutterParser';
import OSVDatabase from '../services/cve/databases/OSVDatabase';
import RemediationEngine from '../services/cve/remediation/RemediationEngine';
import ReportGenerator from '../services/cve/reporters/ReportGenerator';
import UsageTracker from '../services/cve/usage/UsageTracker';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock file system
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  access: jest.fn(),
  rm: jest.fn()
}));

describe('CVE Scanner', () => {
  let scanner;

  beforeEach(() => {
    scanner = new CVEScanner();
    jest.clearAllMocks();
  });

  describe('Core Scanning', () => {
    test('should scan a Node.js project with vulnerabilities', async () => {
      const mockPackageJson = {
        dependencies: {
          'express': '4.17.1',
          'lodash': '4.17.11',
          'axios': '0.21.0'
        }
      };

      const mockOSVResponse = {
        vulns: [{
          id: 'GHSA-jf85-cpcp-j695',
          aliases: ['CVE-2019-10744'],
          summary: 'Prototype Pollution in lodash',
          details: 'Versions of lodash before 4.17.12 are vulnerable to Prototype Pollution.',
          severity: [{
            type: 'CVSS_V3',
            score: '9.1'
          }],
          affected: [{
            ranges: [{
              type: 'SEMVER',
              events: [
                { introduced: '0' },
                { fixed: '4.17.12' }
              ]
            }]
          }],
          references: [{
            type: 'ADVISORY',
            url: 'https://github.com/advisories/GHSA-jf85-cpcp-j695'
          }]
        }]
      };

      // Mock file system
      const fs = require('fs/promises');
      fs.readFile.mockImplementation((path) => {
        if (path.includes('package.json')) {
          return Promise.resolve(JSON.stringify(mockPackageJson));
        }
        throw new Error('File not found');
      });
      fs.access.mockResolvedValue(undefined);

      // Mock OSV API
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOSVResponse
      });

      const results = await scanner.scanProject('./test-project');

      expect(results.summary.high).toBe(1);
      expect(results.vulnerabilities).toHaveLength(1);
      expect(results.vulnerabilities[0].dependency.name).toBe('lodash');
      expect(results.vulnerabilities[0].vulnerabilities[0].cve).toBe('CVE-2019-10744');
    });

    test('should handle projects with no vulnerabilities', async () => {
      const mockPackageJson = {
        dependencies: {
          'react': '18.2.0',
          'react-dom': '18.2.0'
        }
      };

      const fs = require('fs/promises');
      fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));
      fs.access.mockResolvedValue(undefined);

      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ vulns: [] })
      });

      const results = await scanner.scanProject('./safe-project');

      expect(results.summary.critical).toBe(0);
      expect(results.summary.high).toBe(0);
      expect(results.summary.medium).toBe(0);
      expect(results.summary.low).toBe(0);
      expect(results.vulnerabilities).toHaveLength(0);
    });
  });

  describe('Language Parsers', () => {
    describe('NodeJS Parser', () => {
      test('should parse package.json correctly', async () => {
        const parser = new NodeJSParser();
        const mockPackageJson = {
          dependencies: {
            'express': '^4.17.1',
            'lodash': '~4.17.11'
          },
          devDependencies: {
            'jest': '^27.0.0'
          }
        };

        const fs = require('fs/promises');
        fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));

        const deps = await parser.parse('./test');
        
        expect(deps).toHaveLength(2); // Only production deps by default
        expect(deps[0].name).toBe('express');
        expect(deps[0].version).toBe('4.17.1');
        expect(deps[1].name).toBe('lodash');
        expect(deps[1].version).toBe('4.17.11');
      });

      test('should parse package-lock.json for accurate versions', async () => {
        const parser = new NodeJSParser();
        const mockLockFile = {
          lockfileVersion: 2,
          packages: {
            '': {
              dependencies: {
                'express': '^4.17.1'
              }
            },
            'node_modules/express': {
              version: '4.17.3',
              resolved: 'https://registry.npmjs.org/express/-/express-4.17.3.tgz'
            }
          }
        };

        const fs = require('fs/promises');
        fs.readFile.mockImplementation((path) => {
          if (path.includes('package-lock.json')) {
            return Promise.resolve(JSON.stringify(mockLockFile));
          }
          if (path.includes('package.json')) {
            return Promise.resolve(JSON.stringify({ dependencies: { express: '^4.17.1' } }));
          }
          throw new Error('File not found');
        });

        const deps = await parser.parse('./test');
        
        expect(deps[0].version).toBe('4.17.3'); // Lock file version, not package.json
      });
    });

    describe('Python Parser', () => {
      test('should parse requirements.txt', async () => {
        const parser = new PythonParser();
        const mockRequirements = `
Django==3.2.0
requests>=2.25.0,<3.0.0
flask~=2.0.0
# This is a comment
pytest==6.2.4
`;

        const fs = require('fs/promises');
        fs.readFile.mockImplementation((path) => {
          if (path.includes('requirements.txt')) {
            return Promise.resolve(mockRequirements);
          }
          throw new Error('File not found');
        });

        const deps = await parser.parse('./test');
        
        expect(deps).toHaveLength(4);
        expect(deps[0].name).toBe('django');
        expect(deps[0].version).toBe('3.2.0');
        expect(deps[1].name).toBe('requests');
        expect(deps[1].version).toBe('2.25.0');
      });

      test('should parse Pipfile.lock', async () => {
        const parser = new PythonParser();
        const mockPipfileLock = {
          default: {
            'django': {
              version: '==3.2.0',
              hashes: ['sha256:123...']
            },
            'requests': {
              version: '==2.25.1'
            }
          },
          develop: {
            'pytest': {
              version: '==6.2.4'
            }
          }
        };

        const fs = require('fs/promises');
        fs.readFile.mockImplementation((path) => {
          if (path.includes('Pipfile.lock')) {
            return Promise.resolve(JSON.stringify(mockPipfileLock));
          }
          throw new Error('File not found');
        });

        const deps = await parser.parse('./test');
        
        expect(deps).toHaveLength(2); // Only production deps
        expect(deps[0].name).toBe('django');
        expect(deps[0].version).toBe('3.2.0');
      });
    });

    describe('Flutter Parser', () => {
      test('should parse pubspec.yaml', async () => {
        const parser = new FlutterParser();
        const mockPubspec = `
name: my_app
dependencies:
  flutter:
    sdk: flutter
  http: ^0.13.4
  provider: ^6.0.0
  shared_preferences: ^2.0.13
dev_dependencies:
  flutter_test:
    sdk: flutter
`;

        const fs = require('fs/promises');
        fs.readFile.mockImplementation((path) => {
          if (path.includes('pubspec.yaml')) {
            return Promise.resolve(mockPubspec);
          }
          throw new Error('File not found');
        });

        const deps = await parser.parse('./test');
        
        expect(deps).toHaveLength(3); // Excluding Flutter SDK
        expect(deps[0].name).toBe('http');
        expect(deps[0].version).toBe('0.13.4');
        expect(deps[0].ecosystem).toBe('pub');
      });
    });
  });

  describe('Remediation Engine', () => {
    test('should generate safe version recommendations', async () => {
      const engine = new RemediationEngine();
      const dependency = {
        name: 'lodash',
        version: '4.17.11',
        ecosystem: 'npm'
      };
      
      const vulnerabilities = [{
        affected: [{
          ranges: [{
            events: [
              { introduced: '0' },
              { fixed: '4.17.19' }
            ]
          }]
        }]
      }];

      // Mock NPM registry response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          versions: {
            '4.17.11': {},
            '4.17.19': {},
            '4.17.20': {},
            '4.17.21': {}
          }
        })
      });

      const remediation = await engine.generateRemediation(dependency, vulnerabilities);
      
      expect(remediation.safeVersion).toBe('4.17.21'); // Latest safe version
      expect(remediation.breakingChanges).toBe(false); // Same major version
      expect(remediation.actions[0].command).toBe('npm install lodash@4.17.21');
    });

    test('should detect breaking changes', async () => {
      const engine = new RemediationEngine();
      const dependency = {
        name: 'express',
        version: '3.21.2',
        ecosystem: 'npm'
      };
      
      const vulnerabilities = [{
        affected: [{
          ranges: [{
            events: [
              { introduced: '0' },
              { fixed: '4.17.0' }
            ]
          }]
        }]
      }];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          versions: {
            '3.21.2': {},
            '4.17.0': {},
            '4.18.0': {}
          }
        })
      });

      const remediation = await engine.generateRemediation(dependency, vulnerabilities);
      
      expect(remediation.breakingChanges).toBe(true); // Major version change
      expect(remediation.estimatedEffort).toBe('medium');
      expect(remediation.migrationNotes).toContain('Major version upgrade');
    });
  });

  describe('Report Generation', () => {
    test('should generate JSON report', async () => {
      const generator = new ReportGenerator();
      const scanResults = {
        scannedAt: new Date().toISOString(),
        summary: { critical: 0, high: 1, medium: 2, low: 0 },
        vulnerabilities: [{
          dependency: { name: 'test-lib', version: '1.0.0', ecosystem: 'npm' },
          vulnerabilities: [{
            id: 'TEST-001',
            cve: 'CVE-2021-1234',
            cvss: 7.5,
            summary: 'Test vulnerability',
            fixedVersions: ['1.0.1']
          }],
          remediation: {
            actions: [{
              command: 'npm install test-lib@1.0.1',
              description: 'Update to safe version'
            }]
          }
        }]
      };

      const report = await generator.generateReport(scanResults, 'json');
      const parsed = JSON.parse(report.content);
      
      expect(parsed.reportVersion).toBe('1.0.0');
      expect(parsed.summary.high).toBe(1);
      expect(parsed.vulnerabilities).toHaveLength(1);
      expect(report.mimeType).toBe('application/json');
      expect(report.extension).toBe('json');
    });

    test('should generate HTML report', async () => {
      const generator = new ReportGenerator();
      const scanResults = {
        scannedAt: new Date().toISOString(),
        summary: { critical: 1, high: 0, medium: 0, low: 0 },
        vulnerabilities: []
      };

      const report = await generator.generateReport(scanResults, 'html');
      
      expect(report.content).toContain('<!DOCTYPE html>');
      expect(report.content).toContain('CVE Security Audit Report');
      expect(report.mimeType).toBe('text/html');
    });

    test('should generate Markdown report', async () => {
      const generator = new ReportGenerator();
      const scanResults = {
        scannedAt: new Date().toISOString(),
        summary: { critical: 0, high: 0, medium: 0, low: 0 },
        vulnerabilities: []
      };

      const report = await generator.generateReport(scanResults, 'markdown');
      
      expect(report.content).toContain('# CVE Security Audit Report');
      expect(report.content).toContain('✅ No vulnerabilities found!');
      expect(report.mimeType).toBe('text/markdown');
    });
  });

  describe('Usage Tracking', () => {
    test('should track scan usage', async () => {
      const mockDb = {
        getAllStoreNames: jest.fn().mockResolvedValue(['usage', 'subscriptions']),
        put: jest.fn().mockResolvedValue(true),
        get: jest.fn().mockResolvedValue(null),
        getAll: jest.fn().mockResolvedValue([])
      };

      const tracker = new UsageTracker(mockDb);
      await tracker.initialize();

      const usage = await tracker.trackScan('user123', {
        projectType: 'npm',
        dependencyCount: 50,
        vulnerabilityCount: 3
      });

      expect(usage.userId).toBe('user123');
      expect(usage.type).toBe('scan');
      expect(usage.details.vulnerabilityCount).toBe(3);
    });

    test('should enforce usage limits', async () => {
      const mockDb = {
        getAllStoreNames: jest.fn().mockResolvedValue(['usage', 'subscriptions']),
        put: jest.fn().mockResolvedValue(true),
        get: jest.fn().mockResolvedValue({ userId: 'user123', plan: 'free' }),
        getAll: jest.fn().mockResolvedValue(
          Array(10).fill(null).map((_, i) => ({
            userId: 'user123',
            type: 'scan',
            timestamp: new Date().toISOString()
          }))
        )
      };

      const tracker = new UsageTracker(mockDb);
      const limit = await tracker.checkUsageLimit('user123');
      
      expect(limit.exceeded).toBe(true);
      expect(limit.message).toContain('You\'ve used all 10 scans');
    });

    test('should calculate pricing correctly', () => {
      const tracker = new UsageTracker({});
      
      expect(tracker.plans.free.price).toBe(0);
      expect(tracker.plans.startup.price).toBe(9);
      expect(tracker.plans.growth.price).toBe(29);
      expect(tracker.plans.enterprise.price).toBe(99);
    });
  });

  describe('Integration Tests', () => {
    test('should perform end-to-end scan with report generation', async () => {
      const mockPackageJson = {
        dependencies: {
          'axios': '0.21.0' // Known vulnerable version
        }
      };

      const mockVulnerability = {
        vulns: [{
          id: 'GHSA-4w2v-q235-vp99',
          aliases: ['CVE-2021-3749'],
          summary: 'Regular Expression Denial of Service in axios',
          severity: [{
            type: 'CVSS_V3',
            score: '7.5'
          }],
          affected: [{
            ranges: [{
              events: [
                { introduced: '0.21.0' },
                { fixed: '0.21.2' }
              ]
            }]
          }]
        }]
      };

      const fs = require('fs/promises');
      fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));
      fs.access.mockResolvedValue(undefined);

      fetch.mockImplementation((url) => {
        if (url.includes('osv.dev')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockVulnerability
          });
        }
        if (url.includes('registry.npmjs.org')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              versions: {
                '0.21.0': {},
                '0.21.1': {},
                '0.21.2': {},
                '0.21.3': {},
                '0.21.4': {}
              }
            })
          });
        }
      });

      // Perform scan
      const results = await scanner.scanProject('./test-project');
      
      // Verify vulnerability found
      expect(results.summary.high).toBe(1);
      expect(results.vulnerabilities[0].dependency.name).toBe('axios');
      
      // Generate reports
      const reports = await scanner.generateMultipleReports(results, ['json', 'html', 'markdown']);
      
      expect(reports.json).toBeDefined();
      expect(reports.html).toBeDefined();
      expect(reports.markdown).toBeDefined();
      
      // Verify remediation
      const remediation = results.vulnerabilities[0].remediation;
      expect(remediation.safeVersion).toBe('0.21.4');
      expect(remediation.actions[0].command).toBe('npm install axios@0.21.4');
    });
  });
});