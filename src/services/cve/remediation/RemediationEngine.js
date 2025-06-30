/**
 * Remediation Engine
 * Generates intelligent remediation recommendations for vulnerabilities
 */

class RemediationEngine {
  constructor() {
    this.registries = {
      npm: new NpmRegistry(),
      pip: new PyPIRegistry(),
      pub: new PubRegistry()
    };
  }

  async generateRemediation(dependency, vulnerabilities) {
    const remediation = {
      actions: [],
      safeVersion: null,
      alternativeVersions: [],
      breakingChanges: false,
      migrationNotes: [],
      estimatedEffort: 'low' // low, medium, high
    };

    try {
      // Get all available versions from registry
      const availableVersions = await this.getAvailableVersions(dependency);
      
      // Find the best safe version
      const safeVersion = await this.findBestSafeVersion(
        dependency, 
        vulnerabilities, 
        availableVersions
      );

      if (safeVersion) {
        remediation.safeVersion = safeVersion.version;
        remediation.breakingChanges = safeVersion.breakingChanges;
        
        // Generate update commands
        remediation.actions = this.generateUpdateCommands(dependency, safeVersion);
        
        // Add migration notes if breaking changes
        if (safeVersion.breakingChanges) {
          remediation.migrationNotes = await this.getMigrationNotes(
            dependency, 
            safeVersion
          );
          remediation.estimatedEffort = this.estimateUpgradeEffort(
            dependency.version, 
            safeVersion.version
          );
        }
        
        // Find alternative versions if main upgrade is complex
        if (remediation.estimatedEffort === 'high') {
          remediation.alternativeVersions = await this.findAlternativeVersions(
            dependency,
            vulnerabilities,
            availableVersions,
            safeVersion
          );
        }
      } else {
        // No direct fix available, provide alternatives
        remediation.actions = this.generateAlternativeActions(dependency, vulnerabilities);
      }

      return remediation;
    } catch (error) {
      console.error(`Remediation generation failed for ${dependency.name}:`, error);
      return remediation;
    }
  }

  async getAvailableVersions(dependency) {
    const registry = this.registries[dependency.ecosystem];
    if (!registry) {
      console.warn(`No registry handler for ecosystem: ${dependency.ecosystem}`);
      return [];
    }
    
    return await registry.getVersions(dependency.name);
  }

  async findBestSafeVersion(dependency, vulnerabilities, availableVersions) {
    const currentVersion = this.parseVersion(dependency.version);
    const affectedRanges = this.extractAffectedRanges(vulnerabilities);
    
    // Sort versions from newest to oldest
    const sortedVersions = availableVersions
      .filter(v => this.isValidVersion(v.version))
      .sort((a, b) => this.compareVersions(b.version, a.version));

    // Find the best safe version
    for (const versionInfo of sortedVersions) {
      const version = versionInfo.version;
      
      // Skip if version is affected by any vulnerability
      if (this.isVersionAffected(version, affectedRanges)) {
        continue;
      }
      
      // Skip pre-release versions unless current is also pre-release
      if (this.isPreRelease(version) && !this.isPreRelease(dependency.version)) {
        continue;
      }
      
      // Check if this is a good upgrade candidate
      const breakingChanges = this.hasBreakingChanges(currentVersion, version);
      const isNewer = this.compareVersions(version, dependency.version) > 0;
      
      if (isNewer) {
        return {
          version: version,
          breakingChanges: breakingChanges,
          published: versionInfo.published,
          deprecated: versionInfo.deprecated || false
        };
      }
    }
    
    return null;
  }

  extractAffectedRanges(vulnerabilities) {
    const ranges = [];
    
    for (const vuln of vulnerabilities) {
      if (vuln.affected) {
        vuln.affected.forEach(affected => {
          if (affected.ranges) {
            ranges.push(...affected.ranges);
          }
        });
      }
    }
    
    return ranges;
  }

  isVersionAffected(version, affectedRanges) {
    for (const range of affectedRanges) {
      if (this.isInRange(version, range)) {
        return true;
      }
    }
    return false;
  }

  isInRange(version, range) {
    // Simplified range checking - in production use a proper semver library
    if (!range.events) return false;
    
    let introduced = null;
    let fixed = null;
    
    for (const event of range.events) {
      if (event.introduced) introduced = event.introduced;
      if (event.fixed) fixed = event.fixed;
    }
    
    if (introduced && fixed) {
      return this.compareVersions(version, introduced) >= 0 && 
             this.compareVersions(version, fixed) < 0;
    }
    
    return false;
  }

  generateUpdateCommands(dependency, safeVersion) {
    const commands = [];
    
    switch (dependency.ecosystem) {
      case 'npm':
        commands.push({
          command: `npm install ${dependency.name}@${safeVersion.version}`,
          description: 'Update to safe version',
          type: 'primary'
        });
        
        if (safeVersion.breakingChanges) {
          commands.push({
            command: `npm outdated ${dependency.name}`,
            description: 'Check for other outdated dependencies',
            type: 'info'
          });
          commands.push({
            command: `npm test`,
            description: 'Run tests after update',
            type: 'verification'
          });
        }
        break;
        
      case 'pip':
        commands.push({
          command: `pip install ${dependency.name}==${safeVersion.version}`,
          description: 'Update to safe version',
          type: 'primary'
        });
        
        // Update requirements file
        commands.push({
          command: `pip freeze | grep -v "^${dependency.name}=" > requirements.tmp && echo "${dependency.name}==${safeVersion.version}" >> requirements.tmp && mv requirements.tmp requirements.txt`,
          description: 'Update requirements.txt',
          type: 'secondary'
        });
        break;
        
      case 'pub':
        commands.push({
          command: `flutter pub upgrade ${dependency.name}`,
          description: 'Update to latest compatible version',
          type: 'primary'
        });
        
        if (safeVersion.breakingChanges) {
          commands.push({
            command: `flutter analyze`,
            description: 'Check for breaking changes',
            type: 'verification'
          });
        }
        break;
    }
    
    return commands;
  }

  generateAlternativeActions(dependency, vulnerabilities) {
    const actions = [];
    
    // Suggest removing if possible
    actions.push({
      command: `# Consider removing ${dependency.name} if not essential`,
      description: 'Remove vulnerable dependency',
      type: 'alternative'
    });
    
    // Suggest alternatives
    const alternatives = this.findAlternativePackages(dependency);
    if (alternatives.length > 0) {
      alternatives.forEach(alt => {
        actions.push({
          command: `# Consider switching to ${alt.name}`,
          description: alt.description,
          type: 'alternative'
        });
      });
    }
    
    // Suggest mitigation
    actions.push({
      command: `# Implement security controls to mitigate: ${vulnerabilities[0].summary}`,
      description: 'Apply security controls',
      type: 'mitigation'
    });
    
    return actions;
  }

  async getMigrationNotes(dependency, safeVersion) {
    const notes = [];
    
    // Get changelog URL
    const changelogUrl = await this.getChangelogUrl(dependency);
    if (changelogUrl) {
      notes.push(`Review changelog: ${changelogUrl}`);
    }
    
    // Add common migration patterns
    const majorChange = this.getMajorVersionDiff(dependency.version, safeVersion.version);
    if (majorChange > 0) {
      notes.push(`Major version upgrade (${majorChange} major version${majorChange > 1 ? 's' : ''})`);
      notes.push('Review API changes and deprecated features');
      notes.push('Update import statements if package structure changed');
      notes.push('Test thoroughly in development environment first');
    }
    
    return notes;
  }

  estimateUpgradeEffort(currentVersion, targetVersion) {
    const current = this.parseVersion(currentVersion);
    const target = this.parseVersion(targetVersion);
    
    const majorDiff = target.major - current.major;
    const minorDiff = target.minor - current.minor;
    
    if (majorDiff > 1) return 'high';
    if (majorDiff === 1) return 'medium';
    if (minorDiff > 5) return 'medium';
    
    return 'low';
  }

  findAlternativePackages(dependency) {
    // In a real implementation, this would query a database of package alternatives
    const alternatives = {
      'request': [
        { name: 'axios', description: 'Modern HTTP client with promise support' },
        { name: 'node-fetch', description: 'Lightweight fetch API implementation' }
      ],
      'moment': [
        { name: 'date-fns', description: 'Modern JavaScript date utility library' },
        { name: 'dayjs', description: 'Lightweight alternative to Moment.js' }
      ]
    };
    
    return alternatives[dependency.name] || [];
  }

  // Version parsing and comparison utilities
  parseVersion(version) {
    const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)(.*)$/);
    if (!match) {
      return { major: 0, minor: 0, patch: 0, prerelease: version };
    }
    
    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3]),
      prerelease: match[4]
    };
  }

  compareVersions(a, b) {
    const vA = this.parseVersion(a);
    const vB = this.parseVersion(b);
    
    if (vA.major !== vB.major) return vA.major - vB.major;
    if (vA.minor !== vB.minor) return vA.minor - vB.minor;
    if (vA.patch !== vB.patch) return vA.patch - vB.patch;
    
    // Handle pre-release versions
    if (vA.prerelease && !vB.prerelease) return -1;
    if (!vA.prerelease && vB.prerelease) return 1;
    
    return 0;
  }

  isValidVersion(version) {
    return /^\d+\.\d+\.\d+/.test(version);
  }

  isPreRelease(version) {
    return version.includes('-') || version.includes('alpha') || 
           version.includes('beta') || version.includes('rc');
  }

  hasBreakingChanges(currentVersion, targetVersion) {
    return targetVersion.major > currentVersion.major;
  }

  getMajorVersionDiff(current, target) {
    const currentMajor = this.parseVersion(current).major;
    const targetMajor = this.parseVersion(target).major;
    return targetMajor - currentMajor;
  }

  async getChangelogUrl(dependency) {
    // In a real implementation, fetch from registry metadata
    return `https://github.com/search?q=${dependency.name}+changelog`;
  }
}

// Registry interfaces
class NpmRegistry {
  async getVersions(packageName) {
    try {
      const response = await fetch(`https://registry.npmjs.org/${packageName}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      const versions = Object.keys(data.versions || {}).map(version => ({
        version: version,
        published: data.time?.[version],
        deprecated: data.versions[version].deprecated
      }));
      
      return versions;
    } catch (error) {
      console.error(`Failed to fetch NPM versions for ${packageName}:`, error);
      return [];
    }
  }
}

class PyPIRegistry {
  async getVersions(packageName) {
    try {
      const response = await fetch(`https://pypi.org/pypi/${packageName}/json`);
      if (!response.ok) return [];
      
      const data = await response.json();
      const versions = Object.keys(data.releases || {}).map(version => ({
        version: version,
        published: data.releases[version]?.[0]?.upload_time
      }));
      
      return versions;
    } catch (error) {
      console.error(`Failed to fetch PyPI versions for ${packageName}:`, error);
      return [];
    }
  }
}

class PubRegistry {
  async getVersions(packageName) {
    try {
      const response = await fetch(`https://pub.dev/api/packages/${packageName}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      const versions = data.versions?.map(v => ({
        version: v.version,
        published: v.published
      })) || [];
      
      return versions;
    } catch (error) {
      console.error(`Failed to fetch Pub versions for ${packageName}:`, error);
      return [];
    }
  }
}

export default RemediationEngine;