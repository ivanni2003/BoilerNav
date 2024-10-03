import React, { useState } from 'react';
import './SearchBar.css'

const SearchBar = ({items}) => {
    
    const [search, setSearch] = useState('')

    const handleChange = (e) => {
        setSearch(e.target.value)
    }

    const filteredItems = search ? items.filter(item =>
      item.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20) : [];

    const handleItemClick = (item) => {
        // jump to lat/long of item in map
    };
      return (
        <div>
          <input
            type="text"
            value={search}
            onChange={handleChange}
            placeholder="Search For Destination"
          />
          <div className="dropdown">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <ul className="item" key={index} onClick={() => handleItemClick(item)} style={{ cursor: 'pointer' }}>
              {item}
            </ul>
              ))
            ) : (
              <ul className="item">No results found</ul>
            )}
          </div>
        </div>
      );

}

export default SearchBar