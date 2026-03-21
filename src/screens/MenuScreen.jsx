import { useEffect, useRef } from 'react'
import './MenuScreen.css'

function MenuScreen({ title, items, selectedIndex, isLoading }) {
  const selectedRef = useRef(null)

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [selectedIndex])

  const isObjectItem = (item) => typeof item === 'object' && item !== null

  const shouldRenderArtwork = (item) => {
    if (!isObjectItem(item)) {
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
    if (item?.name) return item.name
    if (item?.title) return item.title
    return 'Unknown'
  }

  const getItemSubtitle = (item) => {
    if (!isObjectItem(item)) {
      return null
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

      <div className="menu-list" aria-busy={isLoading}>
        {items.map((item, index) => {
          const itemText = getItemText(item)
          const subtitle = getItemSubtitle(item)
          const itemImage = getItemImage(item)
          const showArtwork = shouldRenderArtwork(item)

          return (
            <div
              key={isObjectItem(item) && item.id ? item.id : index}
              ref={index === selectedIndex ? selectedRef : null}
              className={`menu-item ${index === selectedIndex ? 'selected' : ''} ${showArtwork ? 'has-artwork' : 'no-artwork'}`}
            >
              <span className="item-marker" aria-hidden="true" />

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
    </div>
  )
}

export default MenuScreen
