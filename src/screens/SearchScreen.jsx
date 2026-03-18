import { useState, useEffect, useRef } from 'react'
import './SearchScreen.css'

const KEYBOARD_LAYOUT = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
  ['O', 'P', 'Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z', '0', '1'],
  ['2', '3', '4', '5', '6', '7', '8'],
  ['9', ' ', '<', 'OK']
]

function SearchScreen({
  searchResults,
  selectedIndex,
  onSearch,
  isLoading,
  mode = 'keyboard'
}) {
  const [query, setQuery] = useState('')
  const [keyboardRow, setKeyboardRow] = useState(0)
  const [keyboardCol, setKeyboardCol] = useState(0)
  const searchTimeoutRef = useRef(null)
  const inputRef = useRef(null)

  const currentKey = KEYBOARD_LAYOUT[keyboardRow]?.[keyboardCol] || 'A'

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Handle real keyboard input from user
  const handleInputChange = (e) => {
    const newQuery = e.target.value
    setQuery(newQuery)
  }

  // Handle special keyboard keys
  const handleInputKeyDown = (e) => {
    // Let onSearch callback handle the search - it's debounced
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      if (onSearch) {
        onSearch(query.trim())
      }
    }
  }

  const handleKeySelect = (key) => {
    if (key === '<') {
      setQuery(prev => prev.slice(0, -1))
    } else if (key === 'OK') {
      if (query.trim() && onSearch) {
        onSearch(query.trim())
      }
    } else {
      setQuery(prev => prev + key)
    }
    // Refocus input after keyboard selection
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // Trigger search when query changes (debounced)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        if (onSearch) {
          onSearch(query)
        }
      }, 300)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query, onSearch])

  // Show results view if we have results and mode is 'results'
  if (mode === 'results' && searchResults.length > 0) {
    return (
      <div className="search-screen">
        <div className="search-header">
          <span>Results: "{query}"</span>
        </div>
        <div className="search-results">
          {searchResults.map((track, index) => (
            <div
              key={track.id}
              className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
            >
              <div className="result-title">{track.title}</div>
              <div className="result-artist">{track.artist}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Main keyboard/input view
  return (
    <div className="search-screen">
      <div className="search-header">Search</div>

      <div className="search-input-container">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Type to search..."
          autoFocus
        />
        <span className="search-cursor">|</span>
      </div>

      {isLoading && (
        <div className="search-loading">Searching...</div>
      )}

      {query.length > 0 && query.length < 2 && (
        <div className="search-hint">Type at least 2 characters to search</div>
      )}

      {/* Show results inline below input if we have search results */}
      {searchResults.length > 0 && !isLoading && (
        <div className="inline-results">
          <div className="inline-results-header">Found {searchResults.length} tracks - Use ↑↓ to navigate</div>
          <div className="inline-results-list">
            {searchResults.map((track, index) => (
              <div
                key={track.id}
                className={`inline-result-item ${index === selectedIndex ? 'selected' : ''}`}
              >
                <div className="inline-result-title">{track.title}</div>
                <div className="inline-result-artist">{track.artist}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show keyboard when no results or user wants to modify search */}
      {(searchResults.length === 0 || !isLoading) && (
        <div className="keyboard-section">
          <div className="keyboard-label">On-screen keyboard (optional):</div>
          <div className="keyboard">
            {KEYBOARD_LAYOUT.map((row, rowIndex) => (
              <div key={rowIndex} className="keyboard-row">
                {row.map((key, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    className={`keyboard-key ${
                      keyboardRow === rowIndex && keyboardCol === colIndex ? 'selected' : ''
                    } ${key === ' ' ? 'space-key' : ''} ${key === '<' ? 'backspace-key' : ''} ${key === 'OK' ? 'ok-key' : ''}`}
                    onClick={() => handleKeySelect(key)}
                  >
                    {key === ' ' ? '_' : key}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchScreen
