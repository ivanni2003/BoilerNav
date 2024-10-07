import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';
import ForgotPassword from './ForgotPassword';

const Login = ({ onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/login', {
        username,
        password
      });
      console.log('Login successful:', response.data);
      onLoginSuccess(response.data);
      onClose();
    } catch (error) {
      console.error('Error logging in:', error);
      onLoginSuccess(null, 'Invalid username or password. Please try again.');
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
    </div>
  );
};

export default Login;