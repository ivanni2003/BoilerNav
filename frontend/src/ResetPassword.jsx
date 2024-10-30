// ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Extract token from query params
  const query = new URLSearchParams(location.search);
  const token = query.get('token');

  useEffect(() => {
    // Check if the token is present
    if (!token) {
      setErrorMessage('Invalid or expired token. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      return; // Stop the submission process
    }
    try {
      await axios.post('http://localhost:3001/reset-password', { token, newPassword });
      alert('Password reset successful!');
      navigate('/');
    } catch (error) {
      alert('Invalid or expired token.');
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
        <input 
          type="password" 
          placeholder="New Password" 
          value={newPassword} 
          onChange={(e) => setNewPassword(e.target.value)} 
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default ResetPassword;
