import './SettingsScreen.css'

function SettingsScreen({ userProfile, onLogout }) {
  return (
    <div className="settings-screen">
      <div className="settings-header">
        <div className="settings-title">Settings</div>
      </div>
      <div className="settings-content">
        {userProfile && (
          <div className="user-info">
            <div className="info-row">
              <span className="info-label">User:</span>
              <span className="info-value">{userProfile.name || 'Unknown'}</span>
            </div>
            {userProfile.email && (
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{userProfile.email}</span>
              </div>
            )}
          </div>
        )}

        <div className="settings-section">
          <div className="settings-item">
            <span className="item-text">Version: 1.0.0</span>
          </div>
          <div className="settings-item">
            <span className="item-text">PixelPod - iPod Classic Simulator</span>
          </div>
        </div>

        {onLogout && (
          <div className="settings-actions">
            <button className="logout-button" onClick={onLogout}>
              Log Out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsScreen
