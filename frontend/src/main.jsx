import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import ResetPassword from './ResetPassword.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Add other routes as needed */}
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
