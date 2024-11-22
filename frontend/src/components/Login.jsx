import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';
import ForgotPassword from './ForgotPassword';

const baseURL = process.env.REACT_APP_API_BASE_URL;

const Login = ({ onClose, onLoginSuccess, showNotification }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showBannedPopup, setShowBannedPopup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${baseURL}/api/login`, {
        username,
        password
      });
      console.log('Login successful:', response.data);
      if (response.data.token == "Banned") {
        setShowBannedPopup(true);
        setTimeout(() => {
          setShowBannedPopup(false);
        }, 3000);
      }
      else {
        onLoginSuccess(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Error logging in:', error);
      showNotification('Invalid username or password. Please try again.', 'error');
    }
  };

  if (showForgotPassword) {
    return <ForgotPassword onClose={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit">Login</button>
      </form>
      <button className="forgot-password-link" onClick={() => setShowForgotPassword(true)}>
        Forgot Password?
      </button>

      {showBannedPopup && (
        <div className="banned-popup" style={{color: "red", fontWeight: "bold", fontSize: 50}}>
          You have been Banned. 😝😝
        </div>
      )}
    </div>
  );
};

export default Login;