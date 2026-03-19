import { useEffect, useRef } from 'react'
import './MenuScreen.css'

function MenuScreen({ title, items, selectedIndex }) {
  const selectedRef = useRef(null)

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [selectedIndex])

  return (
    <div className="menu-screen">
      <div className="menu-header">
        <div className="menu-title">{title}</div>
      </div>
      <div className="menu-list">
        {items.map((item, index) => (
          <div
            key={index}
            ref={index === selectedIndex ? selectedRef : null}
            className={`menu-item ${index === selectedIndex ? 'selected' : ''}`}
          >
            {index === selectedIndex && <span className="selector">▶</span>}
            <span className="item-text">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MenuScreen
