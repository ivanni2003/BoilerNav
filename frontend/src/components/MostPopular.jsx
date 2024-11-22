import React, { useEffect, useState } from 'react';
import './MostPopular.css';
import PopupDropdown from './PopupDropdown';

const MostPopular = ({items, buttonName, markRoom, viewSavedRoute}) => {
    const [isMenuVisible, setIsMenuVisible] = useState(false)
    const [selectedEnd, setSelectedEnd] = useState(null)
    const [selectedRoutes, setSelectedRoutes] = useState([])
    const [isRoutesPopupVisible, setIsRoutesPopupVisible] = useState(false)

    const handleItemClick = (item) => {
        if (markRoom) {
            markRoom(item)
            setIsMenuVisible(false)
        }
        else if (viewSavedRoute) {
            viewSavedRoute(item)
            setIsMenuVisible(false)
        }
    }

    const handleRouteListClick = (item) => {
        setIsRoutesPopupVisible(true)
        setSelectedEnd(item[0])
        setSelectedRoutes(item[1])
    }


    return (
        <div className="most-popular-container">
            <button className='feature-button' 
                    onClick={() => setIsMenuVisible(!isMenuVisible)}>{buttonName}</button>
            { isMenuVisible &&
                <div className="most-popular-dropdown">
                    { items.length > 0 && markRoom ? (
                        items.map((item, index) =>
                        <ul className="item" key={index} 
                            onClick={() => handleItemClick(item)} 
                                style={{ cursor: 'pointer' }}
                        >
                            {`${item.properties.RoomName} (${item.properties.DestinationCount})`}
                        </ul>
                        )
                    ) :  items.length > 0 && viewSavedRoute ? (
                        items.map((item, index) =>
                            <ul className="item" key={index} 
                                onClick={() => handleRouteListClick(item)}
                                style={{ cursor: 'pointer' }}
                            >
                                {`... to ${item[0]}`}
                            </ul>
                            )
                    ) : (
                        <ul className="item">No results</ul>
                    )} 
                    <div className='most-popular-popup'> 
                        <PopupDropdown 
                            isVisible={isRoutesPopupVisible} 
                            onClose={() => setIsRoutesPopupVisible(false)} 
                            heading={`... to ${selectedEnd}`}
                            items={selectedRoutes}
                            updateMap={null}
                            viewSavedRoute={viewSavedRoute}
                        ></PopupDropdown>
                    </div>  
                </div>
            }
        </div>
    )
}

export default MostPopular