import { useState } from 'react'
import './App.css'
import axios from 'axios'
import logoImage from './img/icon.png'
import CreateAccount from './CreateAccount'
import Login from './Login'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

const baseURL = 'http://localhost:3001'

/*
How to run:
1) ensure you are in frontend directory
2) npm install vite
3) type npm run dev in terminal
4) open localhost 5173

*/
function App() {
  const [testData, setTestData] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const handleCreateAccount = () => {
    setShowCreateAccount(true);
    setIsPopupOpen(false);
  };

  const handleCloseCreateAccount = () => {
    setShowCreateAccount(false);
  };

  const handleLogin = () => {
    setShowLogin(true);
    setIsPopupOpen(false);
  };

  const handleCloseLogin = () => {
    setShowLogin(false);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <button className="user-button" onClick={togglePopup}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </button>
        {isPopupOpen && (
          <div className="popup">
            <button onClick={handleCreateAccount}>Create Account</button>
            <button onClick={handleLogin}>Log In</button>
          </div>
        )}
        <div className="logo-title">
          <img src={logoImage} alt="BoilerNav Logo" className="logo" />
          <h1>BoilerNav</h1>
        </div>
      </header>
      <div className="content">
        {showCreateAccount ? (
          <CreateAccount onClose={handleCloseCreateAccount} />
        ) : showLogin ? (
          <Login onClose={handleCloseLogin} onLoginSuccess={handleLoginSuccess} />
        ) : (
          <div className="map-container">
            <MapContainer center={[40.4274, -86.9132]} zoom={15} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[40.4274, -86.9132]}>
                <Popup>
                  Purdue University
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default App
