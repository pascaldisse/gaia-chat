/**
 * Flutter/Dart Dependency Parser
 * Parses pubspec.yaml and pubspec.lock files
 */

import fs from 'fs/promises';
import path from 'path';

class FlutterParser {
  async parse(projectPath) {
    const dependencies = [];

    try {
      const pubspecPath = path.join(projectPath, 'pubspec.yaml');
      const lockPath = path.join(projectPath, 'pubspec.lock');

      let pubspecData = null;
      let lockData = null;

      // Read pubspec.yaml
      try {
        const pubspecContent = await fs.readFile(pubspecPath, 'utf8');
        pubspecData = this.parseYaml(pubspecContent);
      } catch (err) {
        throw new Error('No pubspec.yaml found in project');
      }

      // Read pubspec.lock if available
      try {
        const lockContent = await fs.readFile(lockPath, 'utf8');
        lockData = this.parseYaml(lockContent);
      } catch (err) {
        console.log('No pubspec.lock found, using pubspec.yaml only');
      }

      if (lockData && lockData.packages) {
        // Parse from lock file (more accurate)
        dependencies.push(...this.parseLockFile(lockData));
      } else {
        // Fallback to pubspec.yaml
        dependencies.push(...this.parsePubspec(pubspecData));
      }

      return dependencies;
    } catch (error) {
      console.error('Error parsing Flutter dependencies:', error);
      return [];
    }
  }

  parseYaml(content) {
    // Simple YAML parser for pubspec files
    const result = {};
    const lines = content.split('\n');
    let currentSection = null;
    let currentIndent = 0;
    const stack = [result];

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const indent = line.search(/\S/);
      const keyValue = trimmed.match(/^([^:]+):\s*(.*)$/);

      if (keyValue) {
        const [, key, value] = keyValue;
        
        // Handle section changes based on indentation
        while (stack.length > 1 && indent <= currentIndent) {
          stack.pop();
          currentIndent -= 2;
        }

        const current = stack[stack.length - 1];

        if (!value || value === '|' || value === '>') {
          // New section
          current[key] = {};
          stack.push(current[key]);
          currentIndent = indent;
        } else {
          // Key-value pair
          current[key] = this.parseYamlValue(value);
        }
      }
    }

    return result;
  }

  parseYamlValue(value) {
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    
    // Parse numbers
    if (/^\d+(\.\d+)?$/.test(value)) {
      return parseFloat(value);
    }
    
    // Parse booleans
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    return value;
  }

  parseLockFile(lockData) {
    const dependencies = [];

    if (!lockData.packages) return dependencies;

    for (const [name, info] of Object.entries(lockData.packages)) {
      if (info.dependency === 'transitive') {
        // Skip transitive dependencies for now
        continue;
      }

      const version = info.version || 'unknown';
      const source = info.source || 'hosted';
      
      dependencies.push({
        ecosystem: 'pub',
        name: name,
        version: version,
        source: source,
        dependency: info.dependency,
        isDev: info.dependency === 'dev',
        description: info.description
      });
    }

    return dependencies;
  }

  parsePubspec(pubspecData) {
    const dependencies = [];

    const addDeps = (deps, isDev = false) => {
      if (!deps || typeof deps !== 'object') return;

      for (const [name, spec] of Object.entries(deps)) {
        if (name === 'flutter' && spec === 'sdk') continue; // Skip Flutter SDK

        let version = 'any';
        let source = 'hosted';

        if (typeof spec === 'string') {
          version = spec;
        } else if (typeof spec === 'object') {
          if (spec.version) version = spec.version;
          if (spec.hosted) source = 'hosted';
          if (spec.git) source = 'git';
          if (spec.path) source = 'path';
        }

        dependencies.push({
          ecosystem: 'pub',
          name: name,
          version: this.parseVersionConstraint(version),
          versionConstraint: version,
          source: source,
          isDev: isDev
        });
      }
    };

    if (pubspecData.dependencies) {
      addDeps(pubspecData.dependencies, false);
    }

    // Skip dev_dependencies for security scanning by default
    // if (pubspecData.dev_dependencies) {
    //   addDeps(pubspecData.dev_dependencies, true);
    // }

    return dependencies;
  }

  parseVersionConstraint(constraint) {
    if (!constraint || constraint === 'any') return 'latest';
    
    // Handle caret syntax
    if (constraint.startsWith('^')) {
      return constraint.substring(1);
    }
    
    // Handle greater than or equal
    if (constraint.startsWith('>=')) {
      const parts = constraint.split(' ');
      return parts[0].substring(2);
    }
    
    // Handle exact version
    return constraint;
  }

  async getPackageInfo(packageName) {
    // In a real implementation, this would query pub.dev API
    try {
      const response = await fetch(`https://pub.dev/api/packages/${packageName}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error(`Failed to fetch package info for ${packageName}:`, error);
    }
    return null;
  }
}

export default FlutterParser;