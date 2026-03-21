import { usePlayback as usePlaybackContext } from '../context/PlaybackContext'

export function usePlayback() {
  return usePlaybackContext()
}

