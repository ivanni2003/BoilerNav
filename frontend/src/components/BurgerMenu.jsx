import React from 'react';
import { Menu, X, User, LogIn, UserPlus, LogOut, UserCog, HelpCircle } from 'lucide-react';


const BurgerMenu = ({
  user,
  onCreateAccount,
  onLogin,
  onViewProfile,
  onLogout,
  isOpen,
  setIsOpen,
  onStartTutorial
}) => {
  // Previous code remains the same until the Menu Panel div

  return (
    <>
      {/* Burger Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{
          position: 'absolute',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Menu Content */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 9999
        }}>
          {/* Overlay */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)'
            }}
          />

          {/* Menu Panel */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '250px',
              background: 'white',
              boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
              padding: '20px',
              transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s ease',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* User Icon/Circle */}
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#4CAF50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '40px auto 20px',
                color: 'white'
              }}
            >
              {user ? (
                <span style={{ fontSize: '24px' }}>
                  {user.name?.[0]?.toUpperCase() || <User size={32} />}
                </span>
              ) : (
                <User size={32} />
              )}
            </div>

            {/* Main Menu Items Container */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px',
              marginTop: '20px',
              flex: 1 // This will push the divider and tutorial button to the bottom
            }}>
              {user ? (
                <>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onViewProfile();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      gap: '10px',
                      width: '100%',
                      fontSize: '16px',
                      transition: 'background-color 0.2s ease',
                      borderRadius: '4px'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <UserCog size={20} />
                    View Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onLogout();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      gap: '10px',
                      width: '100%',
                      fontSize: '16px',
                      transition: 'background-color 0.2s ease',
                      borderRadius: '4px'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut size={20} />
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onCreateAccount();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      gap: '10px',
                      width: '100%',
                      fontSize: '16px',
                      transition: 'background-color 0.2s ease',
                      borderRadius: '4px'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <UserPlus size={20} />
                    Create Account
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onLogin();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      gap: '10px',
                      width: '100%',
                      fontSize: '16px',
                      transition: 'background-color 0.2s ease',
                      borderRadius: '4px'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogIn size={20} />
                    Log In
                  </button>
                </>
              )}
            </div>

            {/* Bottom Section Container */}
            <div style={{
              marginTop: 'auto', // Push this to the bottom
              width: '100%'
            }}>
              {/* Divider */}
              <div
                style={{
                  height: '1px',
                  background: '#e0e0e0',
                  margin: '20px 0',
                  width: '100%'
                }}
              />

              {/* Tutorial Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onStartTutorial();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  border: '2px solid #4CAF50',
                  background: 'white',
                  cursor: 'pointer',
                  gap: '10px',
                  width: '100%',
                  fontSize: '16px',
                  borderRadius: '4px',
                  color: '#4CAF50',
                  transition: 'all 0.2s ease',
                  marginBottom: '40px' // Increased bottom margin
                }}
                onMouseOver={e => {
                  e.currentTarget.style.backgroundColor = '#4CAF50';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = '#4CAF50';
                }}
              >
                <HelpCircle size={20} />
                Start Tutorial
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BurgerMenu;