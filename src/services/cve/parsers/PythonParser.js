/**
 * Python Dependency Parser
 * Parses requirements.txt, Pipfile, poetry.lock, and other Python dependency files
 */

import fs from 'fs/promises';
import path from 'path';

class PythonParser {
  async parse(projectPath) {
    const dependencies = [];

    try {
      // Check for various Python dependency files
      const parsers = [
        { file: 'Pipfile.lock', parser: this.parsePipfileLock },
        { file: 'poetry.lock', parser: this.parsePoetryLock },
        { file: 'requirements.txt', parser: this.parseRequirementsTxt },
        { file: 'requirements-dev.txt', parser: this.parseRequirementsTxt },
        { file: 'setup.py', parser: this.parseSetupPy },
        { file: 'pyproject.toml', parser: this.parsePyProjectToml }
      ];

      for (const { file, parser } of parsers) {
        const filePath = path.join(projectPath, file);
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const deps = await parser.call(this, content);
          dependencies.push(...deps);
        } catch (err) {
          // File doesn't exist, continue to next
          continue;
        }
      }

      return this.deduplicateDependencies(dependencies);
    } catch (error) {
      console.error('Error parsing Python dependencies:', error);
      return [];
    }
  }

  parseRequirementsTxt(content) {
    const dependencies = [];
    const lines = content.split('\n');

    for (let line of lines) {
      line = line.trim();
      
      // Skip comments and empty lines
      if (line.startsWith('#') || !line) continue;
      
      // Skip URLs and file references
      if (line.startsWith('http') || line.startsWith('git+') || line.startsWith('-e')) continue;
      
      // Parse package specification
      const match = line.match(/^([a-zA-Z0-9_.-]+)\s*([=<>!~]+)\s*(.+)$/);
      if (match) {
        const [, name, operator, version] = match;
        dependencies.push({
          ecosystem: 'pip',
          name: name.toLowerCase(),
          version: this.parseVersionSpec(operator, version),
          versionSpec: `${operator}${version}`,
          isDev: false
        });
      } else {
        // Package without version
        const packageName = line.split('[')[0].trim();
        if (packageName) {
          dependencies.push({
            ecosystem: 'pip',
            name: packageName.toLowerCase(),
            version: 'latest',
            versionSpec: '*',
            isDev: false
          });
        }
      }
    }

    return dependencies;
  }

  parsePipfileLock(content) {
    const dependencies = [];
    
    try {
      const lockData = JSON.parse(content);
      
      const parseDeps = (deps, isDev = false) => {
        for (const [name, info] of Object.entries(deps)) {
          if (info.version) {
            dependencies.push({
              ecosystem: 'pip',
              name: name.toLowerCase(),
              version: info.version.replace('==', ''),
              hash: info.hashes ? info.hashes[0] : null,
              isDev: isDev
            });
          }
        }
      };

      if (lockData.default) {
        parseDeps(lockData.default, false);
      }
      
      // Skip dev dependencies for security scanning by default
      // if (lockData.develop) {
      //   parseDeps(lockData.develop, true);
      // }

      return dependencies;
    } catch (error) {
      console.error('Error parsing Pipfile.lock:', error);
      return [];
    }
  }

  parsePoetryLock(content) {
    const dependencies = [];
    
    try {
      // Simple TOML parsing for poetry.lock
      const packages = content.split('[[package]]').slice(1);
      
      for (const pkg of packages) {
        const lines = pkg.split('\n');
        let name = null;
        let version = null;
        let isDev = false;

        for (const line of lines) {
          if (line.startsWith('name = ')) {
            name = line.match(/name = "(.+)"/)?.[1];
          } else if (line.startsWith('version = ')) {
            version = line.match(/version = "(.+)"/)?.[1];
          } else if (line.includes('category = "dev"')) {
            isDev = true;
          }
        }

        if (name && version && !isDev) {
          dependencies.push({
            ecosystem: 'pip',
            name: name.toLowerCase(),
            version: version,
            isDev: false
          });
        }
      }

      return dependencies;
    } catch (error) {
      console.error('Error parsing poetry.lock:', error);
      return [];
    }
  }

  parseSetupPy(content) {
    const dependencies = [];
    
    try {
      // Extract install_requires
      const installRequiresMatch = content.match(/install_requires\s*=\s*\[([\s\S]*?)\]/);
      if (installRequiresMatch) {
        const requiresStr = installRequiresMatch[1];
        const requires = requiresStr.match(/"([^"]+)"/g) || requiresStr.match(/'([^']+)'/g) || [];
        
        for (let req of requires) {
          req = req.replace(/['"]/g, '').trim();
          const [name, version] = this.parseRequirement(req);
          if (name) {
            dependencies.push({
              ecosystem: 'pip',
              name: name.toLowerCase(),
              version: version || 'latest',
              isDev: false
            });
          }
        }
      }

      return dependencies;
    } catch (error) {
      console.error('Error parsing setup.py:', error);
      return [];
    }
  }

  parsePyProjectToml(content) {
    const dependencies = [];
    
    try {
      // Simple TOML parsing for dependencies
      const depsMatch = content.match(/\[tool\.poetry\.dependencies\]([\s\S]*?)(?:\[|$)/);
      if (depsMatch) {
        const depsSection = depsMatch[1];
        const lines = depsSection.split('\n');
        
        for (const line of lines) {
          const match = line.match(/^([a-zA-Z0-9_.-]+)\s*=\s*"(.+)"/);
          if (match) {
            const [, name, version] = match;
            if (name !== 'python') { // Skip Python version spec
              dependencies.push({
                ecosystem: 'pip',
                name: name.toLowerCase(),
                version: this.parsePoetryVersion(version),
                versionSpec: version,
                isDev: false
              });
            }
          }
        }
      }

      return dependencies;
    } catch (error) {
      console.error('Error parsing pyproject.toml:', error);
      return [];
    }
  }

  parseRequirement(requirement) {
    const match = requirement.match(/^([a-zA-Z0-9_.-]+)\s*([=<>!~]+.*)?$/);
    if (match) {
      const [, name, versionSpec] = match;
      if (versionSpec) {
        const version = versionSpec.replace(/[=<>!~\s]/g, '').split(',')[0];
        return [name, version];
      }
      return [name, null];
    }
    return [null, null];
  }

  parseVersionSpec(operator, version) {
    // For security scanning, we care about the actual version
    // Remove any additional specifiers
    return version.split(',')[0].split(';')[0].trim();
  }

  parsePoetryVersion(versionSpec) {
    if (versionSpec.startsWith('^') || versionSpec.startsWith('~')) {
      return versionSpec.substring(1);
    }
    return versionSpec.split(',')[0].trim();
  }

  deduplicateDependencies(dependencies) {
    const seen = new Map();
    
    for (const dep of dependencies) {
      const key = dep.name;
      if (!seen.has(key) || !dep.isDev) {
        // Prefer non-dev dependencies and specific versions
        seen.set(key, dep);
      }
    }

    return Array.from(seen.values());
  }
}

export default PythonParser;