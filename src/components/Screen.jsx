import BootScreen from '../screens/BootScreen'
import MenuScreen from '../screens/MenuScreen'
import NowPlayingScreen from '../screens/NowPlayingScreen'
import LoginScreen from '../screens/LoginScreen'
import SearchScreen from '../screens/SearchScreen'
import './Screen.css'

function Screen({
  currentScreen,
  menuItems,
  selectedIndex,
  currentTrack,
  isPlaying,
  progress,
  searchQuery,
  searchResults,
  onSearch,
  isLoading,
  mode
}) {
  const renderScreen = () => {
    switch (currentScreen) {
      case 'boot':
        return <BootScreen />
      case 'login':
        return <LoginScreen />
      case 'main':
        return <MenuScreen title="Main Menu" items={menuItems} selectedIndex={selectedIndex} />
      case 'music':
        return <MenuScreen title="Music" items={menuItems} selectedIndex={selectedIndex} />
      case 'playlists':
        return <MenuScreen title="Playlists" items={menuItems} selectedIndex={selectedIndex} />
      case 'songs':
        return <MenuScreen title="Songs" items={menuItems} selectedIndex={selectedIndex} isLoading={isLoading} />
      case 'playlistTracks':
        return <MenuScreen title="Playlist" items={menuItems} selectedIndex={selectedIndex} isLoading={isLoading} />
      case 'search':
        return (
          <SearchScreen
            searchResults={searchResults}
            selectedIndex={selectedIndex}
            onSearch={onSearch}
            isLoading={isLoading}
            mode={mode || 'keyboard'}
          />
        )
      case 'searchResults':
        return <MenuScreen title="Results" items={searchResults} selectedIndex={selectedIndex} isLoading={isLoading} />
      case 'nowPlaying':
        return (
          <NowPlayingScreen
            track={currentTrack}
            isPlaying={isPlaying}
            progress={progress}
          />
        )
      default:
        return <MenuScreen title="Menu" items={[]} selectedIndex={0} />
    }
  }

  return (
    <div className="screen">
      <div className="screen-content">
        {renderScreen()}
      </div>
    </div>
  )
}

export default Screen
