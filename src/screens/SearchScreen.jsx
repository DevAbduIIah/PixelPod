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
  error,
  mode = 'keyboard'
}) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(0)
  const [recentSearches, setRecentSearches] = useState([])
  const inputRef = useRef(null)
  const selectedResultRef = useRef(null)

  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading recent searches:', error)
    }
  }, [])

  const saveRecentSearch = useCallback((searchQuery) => {
    if (!searchQuery.trim()) return

    setRecentSearches((previousSearches) => {
      const filtered = previousSearches.filter((savedQuery) => (
        savedQuery.toLowerCase() !== searchQuery.toLowerCase()
      ))
      const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES)
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    if (selectedResultRef.current && mode === 'results') {
      selectedResultRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [selectedIndex, mode])

  useEffect(() => {
    if (debouncedQuery.length >= 2 && onSearch) {
      onSearch(debouncedQuery)
      saveRecentSearch(debouncedQuery)
    }
  }, [debouncedQuery, onSearch, saveRecentSearch])

  const handleInputChange = (event) => {
    setQuery(event.target.value)
  }

  const getCurrentResults = useCallback(() => {
    if (!searchResults) return []

    if (Array.isArray(searchResults)) {
      return activeCategory === 0 ? searchResults : []
    }

    switch (activeCategory) {
      case 0:
        return searchResults.tracks || []
      case 1:
        return searchResults.albums || []
      case 2:
        return searchResults.artists || []
      default:
        return []
    }
  }, [searchResults, activeCategory])

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      const results = getCurrentResults()

      if (mode === 'results' && results.length > 0 && onSelect) {
        onSelect()
      } else if (query.trim() && onSearch) {
        onSearch(query.trim())
        saveRecentSearch(query.trim())
      }
    } else if (event.key === 'Tab') {
      event.preventDefault()
      setActiveCategory((previousCategory) => (previousCategory + 1) % CATEGORIES.length)
    }
  }

  const handleRecentSearch = (searchQuery) => {
    setQuery(searchQuery)
    if (onSearch) {
      onSearch(searchQuery)
    }
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  }

  const getTotalCount = () => {
    if (!searchResults) return 0
    if (Array.isArray(searchResults)) return searchResults.length

    return (searchResults.tracks?.length || 0) +
      (searchResults.albums?.length || 0) +
      (searchResults.artists?.length || 0)
  }

  const currentResults = getCurrentResults()
  const hasResults = currentResults.length > 0
  const totalCount = getTotalCount()
  const hasAnyResults = totalCount > 0
  const searchError = (() => {
    if (!error) return null

    const normalizedError = error.toLowerCase()

    if (normalizedError.includes('expired') || normalizedError.includes('token') || normalizedError.includes('not authenticated')) {
      return {
        title: 'Login Expired',
        detail: 'Connect Spotify again to continue searching.',
        code: 'AUTH'
      }
    }

    return {
      title: 'Search Unavailable',
      detail: 'PixelPod could not reach Spotify search right now.',
      code: 'SYNC'
    }
  })()

  if (mode === 'results' && hasResults) {
    return (
      <div className="search-screen">
        <div className="search-header">
          <span>Search</span>
          <span className="search-header-meta">{CATEGORIES[activeCategory]} {currentResults.length}</span>
        </div>

        <div className="category-tabs">
          {CATEGORIES.map((category, index) => {
            const count = Array.isArray(searchResults)
              ? (index === 0 ? searchResults.length : 0)
              : (index === 0 ? searchResults.tracks?.length :
                 index === 1 ? searchResults.albums?.length :
                 searchResults.artists?.length) || 0

            return (
              <button
                key={category}
                className={`category-tab ${activeCategory === index ? 'active' : ''}`}
                onClick={() => setActiveCategory(index)}
              >
                {category} ({count})
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
                  <div className="result-artist">{item.artist} - {item.totalTracks} tracks</div>
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

  return (
    <div className="search-screen">
      <div className="search-header">
        <span>Search</span>
        <span className="search-header-meta">{query ? `${totalCount} results` : 'Spotify Library'}</span>
      </div>

      <div className="search-input-container">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Search songs, albums, artists"
          autoFocus
        />
        {query && (
          <button className="clear-btn" onClick={() => setQuery('')}>
            Clear
          </button>
        )}
      </div>

      <div className="category-tabs">
        {CATEGORIES.map((category, index) => {
          const count = Array.isArray(searchResults)
            ? (index === 0 ? searchResults.length : 0)
            : (index === 0 ? searchResults?.tracks?.length :
               index === 1 ? searchResults?.albums?.length :
               searchResults?.artists?.length) || 0

          return (
            <button
              key={category}
              className={`category-tab ${activeCategory === index ? 'active' : ''}`}
              onClick={() => setActiveCategory(index)}
            >
              {category} {count > 0 && `(${count})`}
            </button>
          )
        })}
      </div>

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

      {!isLoading && query.length >= 2 && searchError && (
        <div className="empty-state error-state">
          <div className="empty-icon error-icon">{searchError.code}</div>
          <div className="empty-title">{searchError.title}</div>
          <div className="empty-subtitle">{searchError.detail}</div>
        </div>
      )}

      {!isLoading && query.length >= 2 && !searchError && !hasAnyResults && (
        <div className="empty-state">
          <div className="empty-icon">SCAN</div>
          <div className="empty-title">No Results Found</div>
          <div className="empty-subtitle">Try a different artist, album, or track name.</div>
        </div>
      )}

      {!isLoading && query.length > 0 && query.length < 2 && (
        <div className="search-hint">Type at least 2 characters to begin.</div>
      )}

      {!isLoading && hasResults && (
        <div className="inline-results">
          <div className="inline-results-header">
            Top {Math.min(currentResults.length, 10)} {CATEGORIES[activeCategory].toLowerCase()} shown. Use Up and Down to move.
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
                <span className="recent-badge">{String(index + 1).padStart(2, '0')}</span>
                <span className="recent-text">{recent}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !hasAnyResults && query.length === 0 && recentSearches.length === 0 && (
        <div className="search-tips">
          <div className="tip-item">
            <span className="tip-title">Search the catalog</span>
            <span className="tip-copy">Look up songs, albums, and artists from one screen.</span>
          </div>
          <div className="tip-item">
            <span className="tip-title">Switch categories</span>
            <span className="tip-copy">Press Tab to cycle between Tracks, Albums, and Artists.</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchScreen
