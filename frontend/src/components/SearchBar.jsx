import React, { useState } from 'react';

const SearchBar = ({items}) => {
    
    const [search, setSearch] = useState('')

    const handleChange = (e) => {
        setSearch(e.target.value)
    }

    const filteredItems = items.filter(item =>
        item.toLowerCase().includes(search.toLowerCase())
      );

      return (
        <div>
          <input
            type="text"
            value={search}
            onChange={handleChange}
            placeholder="Search For Destination"
          />
          <ul>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <li key={index} onClick={() => handleItemClick(item)} style={{ cursor: 'pointer' }}>
              {item}
            </li>
              ))
            ) : (
              <li>No results found</li>
            )}
          </ul>
        </div>
      );

}

export default SearchBar