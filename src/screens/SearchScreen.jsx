import { useState, useEffect, useRef, useCallback } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import './SearchScreen.css'

const CATEGORIES = ['Tracks', 'Albums', 'Artists']
const RECENT_SEARCHES_KEY = 'pixelpod_recent_searches'
const MAX_RECENT_SEARCHES = 5

function SearchScreen({
  searchResults,
  selectedIndex,
  onSearch,
  onSelect,
  isLoading,
  mode = 'keyboard'
}) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(0)
  const [recentSearches, setRecentSearches] = useState([])
  const inputRef = useRef(null)
  const selectedResultRef = useRef(null)

  // Debounce search query
  const debouncedQuery = useDebounce(query, 400)

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Error loading recent searches:', e)
    }
  }, [])

  // Save recent search
  const saveRecentSearch = useCallback((searchQuery) => {
    if (!searchQuery.trim()) return

    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== searchQuery.toLowerCase())
      const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES)
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Scroll selected result into view
  useEffect(() => {
    if (selectedResultRef.current && mode === 'results') {
      selectedResultRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [selectedIndex, mode])

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2 && onSearch) {
      onSearch(debouncedQuery)
      saveRecentSearch(debouncedQuery)
    }
  }, [debouncedQuery, onSearch, saveRecentSearch])

  // Handle input change
  const handleInputChange = (e) => {
    setQuery(e.target.value)
  }

  // Get results for current category
  const getCurrentResults = useCallback(() => {
    if (!searchResults) return []

    // Handle both old (array) and new (object) format
    if (Array.isArray(searchResults)) {
      return activeCategory === 0 ? searchResults : []
    }

    switch (activeCategory) {
      case 0: return searchResults.tracks || []
      case 1: return searchResults.albums || []
      case 2: return searchResults.artists || []
      default: return []
    }
  }, [searchResults, activeCategory])

  // Handle keyboard input
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const results = getCurrentResults()
      if (mode === 'results' && results.length > 0 && onSelect) {
        onSelect()
      } else if (query.trim() && onSearch) {
        onSearch(query.trim())
        saveRecentSearch(query.trim())
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      setActiveCategory(prev => (prev + 1) % CATEGORIES.length)
    }
  }

  // Handle recent search click
  const handleRecentSearch = (searchQuery) => {
    setQuery(searchQuery)
    if (onSearch) {
      onSearch(searchQuery)
    }
  }

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  }

  // Get total results count
  const getTotalCount = () => {
    if (!searchResults) return 0
    if (Array.isArray(searchResults)) return searchResults.length

    return (searchResults.tracks?.length || 0) +
           (searchResults.albums?.length || 0) +
           (searchResults.artists?.length || 0)
  }

  const currentResults = getCurrentResults()
  const hasResults = currentResults.length > 0
  const hasAnyResults = getTotalCount() > 0

  // Show results view if in results mode
  if (mode === 'results' && hasResults) {
    return (
      <div className="search-screen">
        <div className="search-header">
          <span>Results ({currentResults.length})</span>
        </div>

        <div className="category-tabs">
          {CATEGORIES.map((cat, index) => {
            const count = Array.isArray(searchResults)
              ? (index === 0 ? searchResults.length : 0)
              : (index === 0 ? searchResults.tracks?.length :
                 index === 1 ? searchResults.albums?.length :
                 searchResults.artists?.length) || 0
            return (
              <button
                key={cat}
                className={`category-tab ${activeCategory === index ? 'active' : ''}`}
                onClick={() => setActiveCategory(index)}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>

        <div className="search-results">
          {currentResults.map((item, index) => (
            <div
              key={item.id}
              ref={index === selectedIndex ? selectedResultRef : null}
              className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
            >
              {activeCategory === 0 && (
                <>
                  <div className="result-title">{item.title}</div>
                  <div className="result-artist">{item.artist}</div>
                </>
              )}
              {activeCategory === 1 && (
                <>
                  <div className="result-title">{item.title}</div>
                  <div className="result-artist">{item.artist} • {item.totalTracks} tracks</div>
                </>
              )}
              {activeCategory === 2 && (
                <>
                  <div className="result-title">{item.name}</div>
                  <div className="result-artist">{item.followers?.toLocaleString() || 0} followers</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Main input view
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
        {query && (
          <button className="clear-btn" onClick={() => setQuery('')}>×</button>
        )}
      </div>

      {/* Category tabs */}
      <div className="category-tabs">
        {CATEGORIES.map((cat, index) => {
          const count = Array.isArray(searchResults)
            ? (index === 0 ? searchResults.length : 0)
            : (index === 0 ? searchResults?.tracks?.length :
               index === 1 ? searchResults?.albums?.length :
               searchResults?.artists?.length) || 0
          return (
            <button
              key={cat}
              className={`category-tab ${activeCategory === index ? 'active' : ''}`}
              onClick={() => setActiveCategory(index)}
            >
              {cat} {count > 0 && `(${count})`}
            </button>
          )
        })}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="loading-container">
          <div className="skeleton-item">
            <div className="skeleton-title"></div>
            <div className="skeleton-subtitle"></div>
          </div>
          <div className="skeleton-item">
            <div className="skeleton-title"></div>
            <div className="skeleton-subtitle"></div>
          </div>
          <div className="skeleton-item">
            <div className="skeleton-title"></div>
            <div className="skeleton-subtitle"></div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && query.length >= 2 && !hasAnyResults && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">No results found</div>
          <div className="empty-subtitle">Try different keywords</div>
        </div>
      )}

      {/* Hint for short query */}
      {!isLoading && query.length > 0 && query.length < 2 && (
        <div className="search-hint">Type at least 2 characters</div>
      )}

      {/* Inline results */}
      {!isLoading && hasResults && (
        <div className="inline-results">
          <div className="inline-results-header">
            Found {currentResults.length} {CATEGORIES[activeCategory].toLowerCase()} - Use ↑↓ to navigate
          </div>
          <div className="inline-results-list">
            {currentResults.slice(0, 10).map((item, index) => (
              <div
                key={item.id}
                className={`inline-result-item ${index === selectedIndex ? 'selected' : ''}`}
              >
                {activeCategory === 0 && (
                  <>
                    <div className="inline-result-title">{item.title}</div>
                    <div className="inline-result-artist">{item.artist}</div>
                  </>
                )}
                {activeCategory === 1 && (
                  <>
                    <div className="inline-result-title">{item.title}</div>
                    <div className="inline-result-artist">{item.artist}</div>
                  </>
                )}
                {activeCategory === 2 && (
                  <>
                    <div className="inline-result-title">{item.name}</div>
                    <div className="inline-result-artist">{item.genres?.slice(0, 2).join(', ') || 'Artist'}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent searches */}
      {!isLoading && !hasAnyResults && query.length === 0 && recentSearches.length > 0 && (
        <div className="recent-searches">
          <div className="recent-header">
            <span>Recent Searches</span>
            <button className="clear-recent" onClick={clearRecentSearches}>Clear</button>
          </div>
          <div className="recent-list">
            {recentSearches.map((recent, index) => (
              <button
                key={index}
                className="recent-item"
                onClick={() => handleRecentSearch(recent)}
              >
                <span className="recent-icon">🕐</span>
                <span className="recent-text">{recent}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search tips when empty */}
      {!isLoading && !hasAnyResults && query.length === 0 && recentSearches.length === 0 && (
        <div className="search-tips">
          <div className="tip-item">💡 Search for songs, albums, or artists</div>
          <div className="tip-item">🎵 Use Tab to switch categories</div>
        </div>
      )}
    </div>
  )
}

export default SearchScreen
