import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import AuthModal from './AuthModal';
import UserProfile from './UserProfile';
import '../../styles/UserButton.css';

const UserButton = () => {
  const { user, isLoggedIn, logout } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [authView, setAuthView] = useState('login');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState('');
  
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
  
  const handleLogout = (e) => {
    e.stopPropagation();
    setIsLoggingOut(true);
    setLogoutMessage('Logging out...');
    
    // Simulate a small delay for UX purposes
    setTimeout(() => {
      logout();
      setLogoutMessage('Logged out successfully');
      
      // Clear the message after 2 seconds
      setTimeout(() => {
        setLogoutMessage('');
        setIsLoggingOut(false);
      }, 2000);
    }, 500);
  };
  
  return (
    <>
      <div className="user-button-container">
        {isLoggedIn ? (
          <div className="user-section">
            <div className="user-info" onClick={handleAuthClick}>
              <div className="user-avatar">
                {user.displayName ? user.displayName[0].toUpperCase() : user.username[0].toUpperCase()}
              </div>
              <div className="user-name">
                {user.displayName || user.username}
              </div>
            </div>
            <button 
              className="logout-button" 
              onClick={handleLogout} 
              title="Logout"
              disabled={isLoggingOut}
            >
              ⎋
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="login-button" onClick={handleAuthClick}>Login</button>
            <button className="register-button" onClick={handleRegisterClick}>Register</button>
          </div>
        )}
      </div>
      
      {logoutMessage && (
        <div className="logout-message">
          {logoutMessage}
        </div>
      )}
      
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