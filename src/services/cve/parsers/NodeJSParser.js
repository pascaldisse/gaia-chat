/**
 * Node.js Dependency Parser
 * Parses package.json and lock files to extract dependencies
 */

import fs from 'fs/promises';
import path from 'path';

class NodeJSParser {
  async parse(projectPath) {
    const dependencies = [];

    try {
      // Check for package-lock.json first (more accurate)
      const lockPath = path.join(projectPath, 'package-lock.json');
      const packagePath = path.join(projectPath, 'package.json');

      let lockData = null;
      let packageData = null;

      try {
        const lockContent = await fs.readFile(lockPath, 'utf8');
        lockData = JSON.parse(lockContent);
      } catch (err) {
        console.log('No package-lock.json found, falling back to package.json');
      }

      try {
        const packageContent = await fs.readFile(packagePath, 'utf8');
        packageData = JSON.parse(packageContent);
      } catch (err) {
        throw new Error('No package.json found in project');
      }

      if (lockData && lockData.packages) {
        // Parse from lock file (npm v7+)
        dependencies.push(...this.parseLockFileV2(lockData));
      } else if (lockData && lockData.dependencies) {
        // Parse from lock file (npm v6)
        dependencies.push(...this.parseLockFileV1(lockData));
      } else {
        // Fallback to package.json
        dependencies.push(...this.parsePackageJson(packageData));
      }

      return dependencies;
    } catch (error) {
      console.error('Error parsing Node.js dependencies:', error);
      return [];
    }
  }

  parseLockFileV2(lockData) {
    const dependencies = [];
    
    for (const [pkgPath, pkgInfo] of Object.entries(lockData.packages)) {
      if (pkgPath === '') continue; // Skip root package
      
      const name = pkgPath.startsWith('node_modules/') 
        ? pkgPath.substring('node_modules/'.length).split('/')[0]
        : pkgPath;

      if (pkgInfo.version && !pkgInfo.dev) {
        dependencies.push({
          ecosystem: 'npm',
          name: name,
          version: pkgInfo.version,
          resolved: pkgInfo.resolved,
          integrity: pkgInfo.integrity,
          isDev: false,
          path: pkgPath
        });
      }
    }

    return this.deduplicateDependencies(dependencies);
  }

  parseLockFileV1(lockData) {
    const dependencies = [];

    const parseDeps = (deps, isDev = false) => {
      for (const [name, info] of Object.entries(deps)) {
        if (info.version) {
          dependencies.push({
            ecosystem: 'npm',
            name: name,
            version: info.version,
            resolved: info.resolved,
            integrity: info.integrity,
            isDev: isDev,
            requires: info.requires || {}
          });

          // Parse nested dependencies
          if (info.dependencies) {
            parseDeps(info.dependencies, isDev);
          }
        }
      }
    };

    if (lockData.dependencies) {
      parseDeps(lockData.dependencies, false);
    }

    return this.deduplicateDependencies(dependencies);
  }

  parsePackageJson(packageData) {
    const dependencies = [];

    const addDeps = (deps, isDev = false) => {
      if (!deps) return;
      
      for (const [name, version] of Object.entries(deps)) {
        dependencies.push({
          ecosystem: 'npm',
          name: name,
          version: this.parseVersionRange(version),
          versionRange: version,
          isDev: isDev
        });
      }
    };

    addDeps(packageData.dependencies, false);
    addDeps(packageData.peerDependencies, false);
    
    // Skip devDependencies for security scanning by default
    // addDeps(packageData.devDependencies, true);

    return dependencies;
  }

  parseVersionRange(versionRange) {
    // Simple version parsing - in production, use a proper semver library
    // Remove common prefixes
    let version = versionRange.replace(/^[\^~>=<]/, '');
    
    // Handle version ranges
    if (version.includes(' ')) {
      // Take the first version in range
      version = version.split(' ')[0].replace(/^[\^~>=<]/, '');
    }

    // Handle wildcards
    if (version.includes('*') || version.includes('x')) {
      version = version.replace(/[*x]/g, '0');
    }

    return version;
  }

  deduplicateDependencies(dependencies) {
    const seen = new Map();
    
    for (const dep of dependencies) {
      const key = `${dep.name}@${dep.version}`;
      if (!seen.has(key) || !dep.isDev) {
        // Prefer non-dev dependencies
        seen.set(key, dep);
      }
    }

    return Array.from(seen.values());
  }

  async getInstalledVersion(projectPath, packageName) {
    try {
      const modulePath = path.join(projectPath, 'node_modules', packageName, 'package.json');
      const content = await fs.readFile(modulePath, 'utf8');
      const pkg = JSON.parse(content);
      return pkg.version;
    } catch (error) {
      return null;
    }
  }
}

export default NodeJSParser;