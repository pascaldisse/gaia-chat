import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import '../../styles/Auth.css';

const AuthModal = ({ onClose, initialView = 'login' }) => {
  const [view, setView] = useState(initialView);
  
  const switchToLogin = () => setView('login');
  const switchToRegister = () => setView('register');
  
  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={e => e.stopPropagation()}>
        {view === 'login' ? (
          <Login onClose={onClose} switchToRegister={switchToRegister} />
        ) : (
          <Register onClose={onClose} switchToLogin={switchToLogin} />
        )}
      </div>
    </div>
  );
};

export default AuthModal;