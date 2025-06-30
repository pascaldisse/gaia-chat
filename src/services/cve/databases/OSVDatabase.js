/**
 * OSV (Open Source Vulnerabilities) Database Integration
 * Free API with comprehensive vulnerability data
 */

class OSVDatabase {
  constructor() {
    this.baseUrl = 'https://api.osv.dev/v1';
    this.cache = new Map();
    this.cacheExpiry = 3600000; // 1 hour
  }

  async query(dependency) {
    const cacheKey = `${dependency.ecosystem}:${dependency.name}:${dependency.version}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          package: {
            ecosystem: this.mapEcosystem(dependency.ecosystem),
            name: dependency.name
          },
          version: dependency.version
        })
      });

      if (!response.ok) {
        throw new Error(`OSV API error: ${response.status}`);
      }

      const data = await response.json();
      const vulnerabilities = this.parseVulnerabilities(data.vulns || []);
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: vulnerabilities,
        timestamp: Date.now()
      });

      return vulnerabilities;
    } catch (error) {
      console.error('OSV query failed:', error);
      return [];
    }
  }

  mapEcosystem(ecosystem) {
    const mapping = {
      'npm': 'npm',
      'pip': 'PyPI',
      'pub': 'Pub'
    };
    return mapping[ecosystem] || ecosystem;
  }

  parseVulnerabilities(vulns) {
    return vulns.map(vuln => ({
      id: vuln.id,
      cve: this.extractCVE(vuln),
      summary: vuln.summary,
      details: vuln.details,
      severity: this.parseSeverity(vuln),
      cvss: this.extractCVSS(vuln),
      affected: vuln.affected,
      references: vuln.references || [],
      published: vuln.published,
      modified: vuln.modified,
      fixedVersions: this.extractFixedVersions(vuln)
    }));
  }

  extractCVE(vuln) {
    if (vuln.aliases) {
      const cve = vuln.aliases.find(alias => alias.startsWith('CVE-'));
      if (cve) return cve;
    }
    return null;
  }

  parseSeverity(vuln) {
    if (vuln.severity) {
      return vuln.severity[0]?.type || 'UNKNOWN';
    }
    return 'UNKNOWN';
  }

  extractCVSS(vuln) {
    if (vuln.severity) {
      const cvss = vuln.severity.find(s => s.type === 'CVSS_V3');
      if (cvss && cvss.score) {
        return parseFloat(cvss.score);
      }
    }
    return 0;
  }

  extractFixedVersions(vuln) {
    const fixed = [];
    if (vuln.affected) {
      vuln.affected.forEach(affected => {
        if (affected.ranges) {
          affected.ranges.forEach(range => {
            if (range.events) {
              range.events.forEach(event => {
                if (event.fixed) {
                  fixed.push(event.fixed);
                }
              });
            }
          });
        }
      });
    }
    return [...new Set(fixed)]; // Deduplicate
  }

  async batchQuery(dependencies) {
    // OSV supports batch queries for efficiency
    try {
      const queries = dependencies.map(dep => ({
        package: {
          ecosystem: this.mapEcosystem(dep.ecosystem),
          name: dep.name
        },
        version: dep.version
      }));

      const response = await fetch(`${this.baseUrl}/querybatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ queries })
      });

      if (!response.ok) {
        throw new Error(`OSV batch query error: ${response.status}`);
      }

      const results = await response.json();
      return results.results.map((result, index) => ({
        dependency: dependencies[index],
        vulnerabilities: this.parseVulnerabilities(result.vulns || [])
      }));
    } catch (error) {
      console.error('OSV batch query failed:', error);
      // Fallback to individual queries
      return Promise.all(
        dependencies.map(async dep => ({
          dependency: dep,
          vulnerabilities: await this.query(dep)
        }))
      );
    }
  }
}

export default OSVDatabase;