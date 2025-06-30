/**
 * CVE Scanner Service
 * Scans project dependencies for known vulnerabilities
 */

import OSVDatabase from './databases/OSVDatabase.js';
import NodeJSParser from './parsers/NodeJSParser.js';
import PythonParser from './parsers/PythonParser.js';
import FlutterParser from './parsers/FlutterParser.js';

class CVEScanner {
  constructor() {
    this.databases = {
      osv: new OSVDatabase()
    };
    this.parsers = {
      nodejs: new NodeJSParser(),
      python: new PythonParser(),
      flutter: new FlutterParser()
    };
  }

  async scanProject(projectPath, options = {}) {
    const results = {
      vulnerabilities: [],
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      scannedAt: new Date().toISOString()
    };

    try {
      // Detect project type and dependencies
      const dependencies = await this.detectDependencies(projectPath);
      
      // Check each dependency for vulnerabilities
      for (const dep of dependencies) {
        const vulns = await this.checkVulnerabilities(dep);
        if (vulns.length > 0) {
          results.vulnerabilities.push({
            dependency: dep,
            vulnerabilities: vulns,
            remediation: await this.generateRemediation(dep, vulns)
          });
          
          // Update summary
          vulns.forEach(v => {
            const severity = this.getSeverityLevel(v.cvss);
            results.summary[severity]++;
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Scan failed:', error);
      throw error;
    }
  }

  async detectDependencies(projectPath) {
    const dependencies = [];
    
    // Check for Node.js project
    if (await this.fileExists(`${projectPath}/package.json`)) {
      dependencies.push(...await this.parsers.nodejs.parse(projectPath));
    }
    
    // Check for Python project
    if (await this.fileExists(`${projectPath}/requirements.txt`) || 
        await this.fileExists(`${projectPath}/Pipfile`)) {
      dependencies.push(...await this.parsers.python.parse(projectPath));
    }
    
    // Check for Flutter project
    if (await this.fileExists(`${projectPath}/pubspec.yaml`)) {
      dependencies.push(...await this.parsers.flutter.parse(projectPath));
    }
    
    return dependencies;
  }

  async checkVulnerabilities(dependency) {
    const vulnerabilities = [];
    
    // Check against OSV database (primary, free)
    const osvResults = await this.databases.osv.query(dependency);
    vulnerabilities.push(...osvResults);
    
    // Future: Add NVD database support for additional coverage
    
    // Deduplicate by CVE ID
    return this.deduplicateVulnerabilities(vulnerabilities);
  }

  async generateRemediation(dependency, vulnerabilities) {
    const remediation = {
      actions: [],
      safeVersion: null,
      breakingChanges: false
    };

    // Find the minimum safe version
    const safeVersion = await this.findSafeVersion(dependency, vulnerabilities);
    if (safeVersion) {
      remediation.safeVersion = safeVersion;
      
      // Generate update commands
      switch (dependency.ecosystem) {
        case 'npm':
          remediation.actions.push({
            command: `npm install ${dependency.name}@${safeVersion}`,
            description: 'Update to safe version'
          });
          break;
        case 'pip':
          remediation.actions.push({
            command: `pip install ${dependency.name}==${safeVersion}`,
            description: 'Update to safe version'
          });
          break;
        case 'pub':
          remediation.actions.push({
            command: `flutter pub upgrade ${dependency.name}`,
            description: 'Update to latest compatible version'
          });
          break;
      }
      
      // Check for breaking changes
      remediation.breakingChanges = await this.checkBreakingChanges(
        dependency.version, 
        safeVersion
      );
    }

    return remediation;
  }

  getSeverityLevel(cvssScore) {
    if (cvssScore >= 9.0) return 'critical';
    if (cvssScore >= 7.0) return 'high';
    if (cvssScore >= 4.0) return 'medium';
    return 'low';
  }

  async fileExists(filePath) {
    try {
      const fs = await import('fs/promises');
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  deduplicateVulnerabilities(vulnerabilities) {
    const seen = new Set();
    return vulnerabilities.filter(v => {
      const key = v.cve || v.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async findSafeVersion(dependency, vulnerabilities) {
    // Logic to find minimum safe version
    // Would query package registries for available versions
    return null; // Placeholder
  }

  async checkBreakingChanges(currentVersion, targetVersion) {
    // Check if upgrading would introduce breaking changes
    // Based on semantic versioning
    const current = this.parseVersion(currentVersion);
    const target = this.parseVersion(targetVersion);
    
    return target.major > current.major;
  }

  parseVersion(version) {
    const parts = version.split('.');
    return {
      major: parseInt(parts[0]) || 0,
      minor: parseInt(parts[1]) || 0,
      patch: parseInt(parts[2]) || 0
    };
  }
}

export default CVEScanner;