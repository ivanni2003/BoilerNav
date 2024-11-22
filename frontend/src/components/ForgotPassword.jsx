import React, { useState } from 'react';
import axios from 'axios';
import './ForgotPassword.css';

const baseURL = import.meta.env.VITE_API_URL;

const ForgotPassword = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${baseURL}/api/reset-password`, { email });
      setMessage(response.data.message);
      setError('');
    } catch (error) {
      setError('An error occurred. Please try again.');
      setMessage('');
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        <button type="submit">Reset Password</button>
      </form>
      <button className="close-button" onClick={onClose}>Close</button>
    </div>
  );
};

export default ForgotPassword;