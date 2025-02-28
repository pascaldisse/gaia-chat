import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import AuthModal from './AuthModal';
import UserProfile from './UserProfile';
import '../../styles/UserButton.css';

const UserButton = () => {
  const { user, isLoggedIn } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [authView, setAuthView] = useState('login');
  
  const handleAuthClick = () => {
    if (isLoggedIn) {
      setShowProfile(true);
    } else {
      setAuthView('login');
      setShowAuthModal(true);
    }
  };
  
  const handleRegisterClick = (e) => {
    e.stopPropagation();
    setAuthView('register');
    setShowAuthModal(true);
  };
  
  return (
    <>
      <div className="user-button-container" onClick={handleAuthClick}>
        {isLoggedIn ? (
          <div className="user-info">
            <div className="user-avatar">
              {user.displayName ? user.displayName[0].toUpperCase() : user.username[0].toUpperCase()}
            </div>
            <div className="user-name">
              {user.displayName || user.username}
            </div>
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="login-button">Login</button>
            <button className="register-button" onClick={handleRegisterClick}>Register</button>
          </div>
        )}
      </div>
      
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          initialView={authView} 
        />
      )}
      
      {showProfile && isLoggedIn && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}
    </>
  );
};

export default UserButton;