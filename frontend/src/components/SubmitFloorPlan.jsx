import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SubmitFloorPlan.css';

const baseURL = process.env.VITE_APP_URL;

const PopupForm = ({isVisible, onClose, user, building, showNotification}) => {
    const [imageURL, setImageURL] = useState('')
    const [floorNumber, setFloorNumber] = useState('')
    if (!isVisible) {
        return null
    }
  
    const handleImageURLChange = (e) => {
      setImageURL(e.target.value);
    }
  
    const handleFloorNumberChange = (e) => {
      setFloorNumber(e.target.value);
    }
  
    const handleSubmit = async (e) => {
      e.preventDefault()
  
      try {

        if (imageURL.length == 0 || floorNumber.length == 0) {
          showNotification('Please enter information in the input fields', 'error')
          return
        }
        if (!(imageURL.startsWith("https://") || imageURL.startsWith("http://"))) {
          showNotification('Please enter a valid URL (https:// or http://)', 'error')
          return
        }

        const floorNum = Number(floorNumber)

        if (!(Number.isInteger(floorNum))) {
          console.log('int error')
          showNotification('Please enter a valid Floor Number', 'error')
          return
        }

        const response = await axios.post(`${baseURL}/api/users/floorPlanRequests`, {
          username: user.username,
          imageURL: imageURL,
          buildingID: building.id,
          floorNumber: floorNumber
        })
        console.log("success")
        showNotification('Request submitted successfully', 'success')
      }
      catch (error) {
        console.log(error)
      }
    }
  
    return (
        <div>
            <div>
            <span className="close" onClick={onClose}>&times;</span>
                <h2 style={{ fontSize: '18px'}}>Submit Floor Plan</h2>
                <form className="popup-form" onSubmit={handleSubmit}>
                  <div>
                    <label>
                      Floor Plan URL:
                      <input type="text" placeholder="Enter Image URL" onChange={handleImageURLChange} value={imageURL}/>
                    </label>
                  </div>
                  <div>
                  <label>
                      Floor Number:
                      <input type="text" 
                            value={floorNumber}
                            placeholder="-1: Basement, 0: Ground, 1: Floor 1, ..." 
                            onChange={handleFloorNumberChange}/>
                    </label>
                  </div>
                  <div>
                    <button type="submit">Submit</button>
                  </div>
                </form>
            </div>
        </div>
    )
  }

const SubmitFloorPlan = ({user, building, showNotification}) => {
    const [isPopupFormVisible, setIsPopupFormVisible] = useState(false)

    const closePopupForm = () => {
        setIsPopupFormVisible(false)
      }
    
      const handleOpenPopupForm = () => {
        if (user) {
          setIsPopupFormVisible(true)
        }
        else {
          console.log("notification")
          showNotification('Please login to submit floor plans', 'info');
        }
      }

      return (
        <div className='submit-floor-plan'>
            {!isPopupFormVisible && 
             <button className="submit-floor-plan-btn" onClick={() => handleOpenPopupForm()}>Submit Floor Plan Image</button>
            }
        <PopupForm isVisible={isPopupFormVisible} onClose={closePopupForm} user={user} building={building} showNotification={showNotification}/>
        </div>
      )
}

 export default SubmitFloorPlan