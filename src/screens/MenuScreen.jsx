import { useEffect, useRef } from 'react'
import './MenuScreen.css'

function MenuScreen({ title, items, selectedIndex, isLoading }) {
  const selectedRef = useRef(null)

  // Detect loading state: hook returns a single status item with tone='loading'
  const isLoadingState = items.length === 1 && items[0]?.type === 'status' && items[0]?.tone === 'loading'

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [selectedIndex])

  const isObjectItem = (item) => typeof item === 'object' && item !== null

  const isStatusItem = (item) => isObjectItem(item) && item.type === 'status'

  const shouldRenderArtwork = (item) => {
    if (!isObjectItem(item) || isStatusItem(item)) {
      return false
    }

    return Boolean(
      item.image ||
      item.albumArtSmall ||
      item.albumArt ||
      item.trackCount !== undefined ||
      item.artist
    )
  }

  const getItemText = (item) => {
    if (typeof item === 'string') return item
    if (isStatusItem(item)) return item.title
    if (item?.name) return item.name
    if (item?.title) return item.title
    return 'Unknown'
  }

  const getItemSubtitle = (item) => {
    if (!isObjectItem(item)) {
      return null
    }

    if (isStatusItem(item)) {
      return item.detail || null
    }

    if (item.artist) return item.artist
    if (item.trackCount !== undefined) return `${item.trackCount} tracks`
    if (item.owner) return item.owner

    return null
  }

  const getItemImage = (item) => {
    if (!isObjectItem(item)) {
      return null
    }

    return item.image || item.albumArtSmall || item.albumArt || null
  }

  const getFallbackLabel = (item) => {
    const label = getItemText(item)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')

    return label || 'PP'
  }

  return (
    <div className="menu-screen">
      <div className="menu-header">
        <div className="menu-title">{title}</div>
      </div>

      {isLoadingState ? (
        <div className="menu-list" aria-busy="true" aria-label="Loading">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="menu-item skeleton-item no-artwork">
              <div className="skeleton-marker" />
              <div className="item-content">
                <div className="skeleton-title" />
                <div className="skeleton-subtitle" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="menu-list" aria-busy={isLoading}>
          {items.map((item, index) => {
            const itemText = getItemText(item)
            const subtitle = getItemSubtitle(item)
            const itemImage = getItemImage(item)
            const showArtwork = shouldRenderArtwork(item)
            const statusItem = isStatusItem(item)

            return (
              <div
                key={isObjectItem(item) && item.id ? item.id : index}
                ref={index === selectedIndex ? selectedRef : null}
                className={`menu-item ${index === selectedIndex && !statusItem ? 'selected' : ''} ${showArtwork ? 'has-artwork' : 'no-artwork'} ${statusItem ? `status-item ${item.tone || 'info'}` : ''}`}
              >
                <span className="item-marker" aria-hidden="true">{statusItem ? item.code || '...' : ''}</span>

                {showArtwork && (
                  <div className={`item-thumbnail ${itemImage ? '' : 'fallback'}`}>
                    {itemImage ? (
                      <img src={itemImage} alt="" aria-hidden="true" />
                    ) : (
                      <span className="thumbnail-fallback">{getFallbackLabel(item)}</span>
                    )}
                  </div>
                )}

                <div className="item-content">
                  <span className="item-text" title={itemText}>{itemText}</span>
                  {subtitle && <span className="item-subtitle">{subtitle}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MenuScreen
