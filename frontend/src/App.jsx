import { useState } from 'react'
import './App.css'
import axios from 'axios'

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

  const getData = async () => {
    try {
      const response = await axios.get(baseURL + '/api/test');
      setTestData(response.data);
    } catch (exception) {
      console.log(exception)
    }
  };

  return (
    <div>
      <h1>BoilerNav Frontend Test</h1>
      <button onClick={getData}>Show test data</button>
     
      {(
        <ul>
          {testData.map(user => (
            <li key={user.id}>ID: {user.id}, Name: {user.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App
