import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import '../../styles/Auth.css';

const Login = ({ onClose, switchToRegister }) => {
  const { login, isLoading, error } = useUser();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }
    
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setFormError(err.message || 'Login failed. Please check your credentials.');
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login to Your Account</h2>
        
        {formError && <div className="auth-error">{formError}</div>}
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Your password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Don't have an account? <button className="link-button" onClick={switchToRegister}>Register</button></p>
        </div>
        
        <button className="close-button" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default Login;