import React, { useState, useEffect } from 'react';
import CVEScanner from '../../services/cve/scanner';
import './SecurityAuditPanel.css';

const SecurityAuditPanel = ({ projectPath }) => {
  const [scanResults, setScanResults] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [lastScan, setLastScan] = useState(null);

  const scanner = new CVEScanner();

  const runScan = async () => {
    setIsScanning(true);
    setError(null);

    try {
      const results = await scanner.scanProject(projectPath || '.');
      setScanResults(results);
      setLastScan(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#d32f2f',
      high: '#f44336',
      medium: '#ff9800',
      low: '#ffc107'
    };
    return colors[severity] || '#9e9e9e';
  };

  const renderSummary = () => {
    if (!scanResults) return null;

    const { summary } = scanResults;
    const total = summary.critical + summary.high + summary.medium + summary.low;

    return (
      <div className="security-summary">
        <h3>Vulnerability Summary</h3>
        <div className="summary-stats">
          <div className="stat-item" style={{ color: getSeverityColor('critical') }}>
            <span className="stat-count">{summary.critical}</span>
            <span className="stat-label">Critical</span>
          </div>
          <div className="stat-item" style={{ color: getSeverityColor('high') }}>
            <span className="stat-count">{summary.high}</span>
            <span className="stat-label">High</span>
          </div>
          <div className="stat-item" style={{ color: getSeverityColor('medium') }}>
            <span className="stat-count">{summary.medium}</span>
            <span className="stat-label">Medium</span>
          </div>
          <div className="stat-item" style={{ color: getSeverityColor('low') }}>
            <span className="stat-count">{summary.low}</span>
            <span className="stat-label">Low</span>
          </div>
        </div>
        <div className="total-vulnerabilities">
          Total: {total} {total === 1 ? 'vulnerability' : 'vulnerabilities'} found
        </div>
      </div>
    );
  };

  const renderVulnerability = (vuln) => {
    const severity = scanner.getSeverityLevel(vuln.cvss);
    
    return (
      <div key={vuln.id} className="vulnerability-item">
        <div className="vuln-header">
          <span 
            className="severity-badge" 
            style={{ backgroundColor: getSeverityColor(severity) }}
          >
            {severity.toUpperCase()}
          </span>
          <span className="vuln-id">{vuln.cve || vuln.id}</span>
          <span className="cvss-score">CVSS: {vuln.cvss.toFixed(1)}</span>
        </div>
        
        <div className="vuln-details">
          <p className="vuln-summary">{vuln.summary}</p>
          
          {vuln.fixedVersions.length > 0 && (
            <div className="fixed-versions">
              <strong>Fixed in:</strong> {vuln.fixedVersions.join(', ')}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRemediation = (dep, remediation) => {
    if (!remediation.actions.length) return null;

    return (
      <div className="remediation-section">
        <h4>Remediation Steps</h4>
        {remediation.actions.map((action, index) => (
          <div key={index} className="remediation-action">
            <code className="command">{action.command}</code>
            <button 
              className="copy-button"
              onClick={() => navigator.clipboard.writeText(action.command)}
            >
              Copy
            </button>
            <span className="action-description">{action.description}</span>
          </div>
        ))}
        
        {remediation.breakingChanges && (
          <div className="warning-message">
            ⚠️ This update includes breaking changes. Review changelog before updating.
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    if (!scanResults || !scanResults.vulnerabilities.length) {
      return (
        <div className="no-vulnerabilities">
          ✅ No vulnerabilities found! Your dependencies are up to date.
        </div>
      );
    }

    return (
      <div className="vulnerability-list">
        {scanResults.vulnerabilities.map(({ dependency, vulnerabilities, remediation }) => (
          <div key={`${dependency.name}-${dependency.version}`} className="dependency-section">
            <h3 className="dependency-header">
              {dependency.name} @ {dependency.version}
              <span className="ecosystem-badge">{dependency.ecosystem}</span>
            </h3>
            
            {vulnerabilities.map(vuln => renderVulnerability(vuln))}
            {renderRemediation(dependency, remediation)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="security-audit-panel">
      <div className="panel-header">
        <h2>Security Audit</h2>
        <button 
          className="scan-button"
          onClick={runScan}
          disabled={isScanning}
        >
          {isScanning ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>

      {lastScan && (
        <div className="last-scan-info">
          Last scan: {lastScan.toLocaleString()}
        </div>
      )}

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {scanResults && (
        <>
          {renderSummary()}
          {renderResults()}
        </>
      )}

      {!scanResults && !isScanning && !error && (
        <div className="empty-state">
          <p>No scan results yet. Click "Run Scan" to check for vulnerabilities.</p>
          <p className="scan-info">
            Scans Node.js, Python, and Flutter/Dart dependencies for known CVEs.
          </p>
        </div>
      )}
    </div>
  );
};

export default SecurityAuditPanel;