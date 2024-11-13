import React, { useEffect, useState } from 'react';
import './MostPopular.css';

const MostPopular = ({items, buttonName, markRoom, viewSavedRoute}) => {
    const [isMenuVisible, setIsMenuVisible] = useState(false)


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

    return (
        <div>
            <button className='feature-button' onClick={() => setIsMenuVisible(!isMenuVisible)}>{buttonName}</button>
            { isMenuVisible &&
                <div className="dropdown">
                    { items.length > 0 ? (
                        items.map((item, index) =>
                        <ul className={item} key={index} onClick={() => handleItemClick(item)} style={{ cursor: 'pointer' }}
                        >
                            item here
                        </ul>
                        )
                    ) : (
                        <ul className="item">No results found</ul>
                      )
                }
                </div>
            }
        </div>
    )
}

export default MostPopular