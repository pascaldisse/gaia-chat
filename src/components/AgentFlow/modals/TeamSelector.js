import React, { useState, useEffect } from 'react';
import './Modal.css';

const TeamSelector = ({ teamData = {}, agents = [], onCancel, onSave }) => {
  const [name, setName] = useState(teamData.teamName || 'New Team');
  const [description, setDescription] = useState(teamData.teamDescription || '');
  const [role, setRole] = useState(teamData.teamRole || 'coordinator');
  const [selectedAgents, setSelectedAgents] = useState(teamData.agents || []);

  // Team role options
  const teamRoles = [
    { value: 'coordinator', label: 'Coordinator', description: 'Coordinates tasks and manages collaboration between agents' },
    { value: 'debate', label: 'Debate', description: 'Facilitates structured discussion between multiple perspectives' },
    { value: 'consensus', label: 'Consensus', description: 'Builds agreement and identifies common ground between agents' },
    { value: 'specialist', label: 'Specialist', description: 'Integrates specialized expertise from different agents' }
  ];

  // Handle agent selection toggle
  const toggleAgentSelection = (agent) => {
    const isSelected = selectedAgents.some(a => a.id === agent.id);
    
    if (isSelected) {
      setSelectedAgents(selectedAgents.filter(a => a.id !== agent.id));
    } else {
      setSelectedAgents([...selectedAgents, agent]);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const updatedTeamData = {
      ...teamData,
      teamName: name,
      teamDescription: description,
      teamRole: role,
      agents: selectedAgents
    };
    
    onSave(updatedTeamData);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container team-selector">
        <div className="modal-header">
          <h2>Configure Team</h2>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="team-name">Team Name</label>
              <input
                id="team-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter team name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="team-description">Description</label>
              <textarea
                id="team-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the team's purpose"
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="team-role">Team Role</label>
              <select
                id="team-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {teamRoles.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="role-description">
                {teamRoles.find(r => r.value === role)?.description}
              </div>
            </div>
            
            <div className="form-group">
              <label>Team Members</label>
              <div className="agent-list">
                {agents.length === 0 ? (
                  <div className="no-agents">
                    No agents available. Add persona nodes to your workflow first.
                  </div>
                ) : (
                  agents.map(agent => (
                    <div 
                      key={agent.id}
                      className={`agent-item ${selectedAgents.some(a => a.id === agent.id) ? 'selected' : ''}`}
                      onClick={() => toggleAgentSelection(agent)}
                    >
                      <div className="agent-info">
                        <div className="agent-name">{agent.name || 'Unnamed Agent'}</div>
                        <div className="agent-role">{agent.persona?.systemPrompt?.substring(0, 30) || 'No description'}...</div>
                      </div>
                      <div className="agent-checkbox">
                        <input 
                          type="checkbox" 
                          checked={selectedAgents.some(a => a.id === agent.id)}
                          onChange={() => {}} // Handled by the parent div click
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              <button type="button" className="cancel-button" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="save-button">
                Save Team
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeamSelector;