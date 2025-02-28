import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import '../../styles/Auth.css';

const Register = ({ onClose, switchToLogin }) => {
  const { register, isLoading, error } = useUser();
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: ''
  });
  
  const [formError, setFormError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    // Password validation
    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      await register(formData);
      onClose();
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please try again.');
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h2>Create a New Account</h2>
        
        {formError && <div className="auth-error">{formError}</div>}
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Choose a username"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="How should we call you? (optional)"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Choose a strong password"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Already have an account? <button className="link-button" onClick={switchToLogin}>Login</button></p>
        </div>
        
        <button className="close-button" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default Register;