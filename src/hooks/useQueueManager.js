import { useState, useEffect, useCallback } from 'react'

export default function useQueueManager({
  playbackTrack,
  playbackReady,
  play,
  toggleShuffle,
  shuffleEnabled,
  isPlaying,
  currentProgress,
  currentPlaylistTracks,
  likedSongs,
  currentScreen
}) {
  const [currentTrack, setCurrentTrack] = useState(null)
  const [currentTrackList, setCurrentTrackList] = useState([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [currentSourceTracks, setCurrentSourceTracks] = useState([])
  const [currentPlaybackSource, setCurrentPlaybackSource] = useState(null)
  const [queueShuffleEnabled, setQueueShuffleEnabled] = useState(false)

  const isQueuePlayback = currentPlaybackSource?.kind === 'queue'
  const effectiveShuffleEnabled = isQueuePlayback ? queueShuffleEnabled : shuffleEnabled

  // Sync playbackTrack from Spotify SDK → local currentTrack
  useEffect(() => {
    if (!playbackTrack?.uri) {
      return
    }

    const matchedTrack = currentTrackList.find((track) => (
      track?.id === playbackTrack.id || track?.uri === playbackTrack.uri
    ))

    if (matchedTrack) {
      setCurrentTrack(matchedTrack)

      const matchedIndex = currentTrackList.findIndex((track) => (
        track?.id === playbackTrack.id || track?.uri === playbackTrack.uri
      ))

      if (matchedIndex >= 0) {
        setCurrentTrackIndex(matchedIndex)
      }

      return
    }

    setCurrentTrack(playbackTrack)
  }, [playbackTrack, currentTrackList])

  const getCurrentTracks = useCallback(() => {
    if (currentScreen === 'playlistTracks') return currentPlaylistTracks
    if (currentScreen === 'songs') return likedSongs
    return []
  }, [currentScreen, currentPlaylistTracks, likedSongs])

  const createLinearQueue = useCallback((tracks, selectedTrackIndex) => {
    if (!Array.isArray(tracks) || tracks.length === 0) {
      return []
    }

    return [
      ...tracks.slice(selectedTrackIndex),
      ...tracks.slice(0, selectedTrackIndex)
    ]
  }, [])

  const shuffleTracks = useCallback((tracks) => {
    const shuffledTracks = [...tracks]

    for (let index = shuffledTracks.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1))
      ;[shuffledTracks[index], shuffledTracks[randomIndex]] = [shuffledTracks[randomIndex], shuffledTracks[index]]
    }

    return shuffledTracks
  }, [])

  const createLikedSongsQueue = useCallback((tracks, selectedTrackId, shouldShuffle) => {
    const playableTracks = tracks.filter((track) => track?.uri)
    const selectedTrackIndex = playableTracks.findIndex((track) => track.id === selectedTrackId)
    const safeSelectedTrackIndex = selectedTrackIndex >= 0 ? selectedTrackIndex : 0
    const linearQueue = createLinearQueue(playableTracks, safeSelectedTrackIndex)

    if (!shouldShuffle || linearQueue.length <= 1) {
      return linearQueue
    }

    const [selectedTrack, ...remainingTracks] = linearQueue
    return [selectedTrack, ...shuffleTracks(remainingTracks)]
  }, [createLinearQueue, shuffleTracks])

  const applyTrackSelection = useCallback((tracks, selectedTrackIndex, playbackSource) => {
    const selectedTrack = tracks[selectedTrackIndex]
    if (!selectedTrack) {
      return
    }

    setCurrentTrack(selectedTrack)
    setCurrentTrackList(tracks)
    setCurrentTrackIndex(selectedTrackIndex)
    setCurrentPlaybackSource(playbackSource)
  }, [])

  const handleSkipForward = useCallback(() => {
    if (currentTrack && playbackReady && currentTrackList.length > 0) {
      const nextIndex = (currentTrackIndex + 1) % currentTrackList.length
      const nextTrack = currentTrackList[nextIndex]

      if (nextTrack && nextTrack.uri) {
        if (currentPlaybackSource?.kind === 'playlist' && currentPlaybackSource.contextUri) {
          setCurrentTrack(nextTrack)
          setCurrentTrackIndex(nextIndex)
          play(nextTrack.uri, currentPlaybackSource.contextUri, nextIndex)
          return
        }

        if (currentPlaybackSource?.kind === 'queue') {
          const reorderedQueue = [
            ...currentTrackList.slice(nextIndex),
            ...currentTrackList.slice(0, nextIndex)
          ]
          const queueUris = reorderedQueue.map((track) => track.uri).filter(Boolean)

          setCurrentTrack(reorderedQueue[0])
          setCurrentTrackList(reorderedQueue)
          setCurrentTrackIndex(0)

          if (queueUris.length > 0) {
            play(queueUris[0], null, 0, queueUris)
          }

          return
        }

        setCurrentTrack(nextTrack)
        setCurrentTrackIndex(nextIndex)
        play(nextTrack.uri)
      }
    }
  }, [currentTrack, playbackReady, currentTrackList, currentTrackIndex, play, currentPlaybackSource])

  const handleSkipBack = useCallback(() => {
    if (currentTrack && playbackReady && currentTrackList.length > 0) {
      const previousIndex = (currentTrackIndex - 1 + currentTrackList.length) % currentTrackList.length
      const previousTrack = currentTrackList[previousIndex]

      if (previousTrack && previousTrack.uri) {
        if (currentPlaybackSource?.kind === 'playlist' && currentPlaybackSource.contextUri) {
          setCurrentTrack(previousTrack)
          setCurrentTrackIndex(previousIndex)
          play(previousTrack.uri, currentPlaybackSource.contextUri, previousIndex)
          return
        }

        if (currentPlaybackSource?.kind === 'queue') {
          const reorderedQueue = [
            ...currentTrackList.slice(previousIndex),
            ...currentTrackList.slice(0, previousIndex)
          ]
          const queueUris = reorderedQueue.map((track) => track.uri).filter(Boolean)

          setCurrentTrack(reorderedQueue[0])
          setCurrentTrackList(reorderedQueue)
          setCurrentTrackIndex(0)

          if (queueUris.length > 0) {
            play(queueUris[0], null, 0, queueUris)
          }

          return
        }

        setCurrentTrack(previousTrack)
        setCurrentTrackIndex(previousIndex)
        play(previousTrack.uri)
      }
    }
  }, [currentTrack, playbackReady, currentTrackList, currentTrackIndex, play, currentPlaybackSource])

  const handleToggleShuffle = useCallback(async () => {
    const nextShuffleState = !effectiveShuffleEnabled
    const isQueuePlaybackActive = currentPlaybackSource?.kind === 'queue'
      && currentSourceTracks.length > 0
      && Boolean(currentTrack?.id)

    await toggleShuffle({
      syncRemote: !isQueuePlaybackActive,
      forceState: nextShuffleState
    })

    if (!isQueuePlaybackActive) {
      return
    }

    const nextQueue = createLikedSongsQueue(currentSourceTracks, currentTrack.id, nextShuffleState)
    const nextQueueUris = nextQueue.map((track) => track.uri).filter(Boolean)

    setQueueShuffleEnabled(nextShuffleState)
    setCurrentTrackList(nextQueue)
    setCurrentTrackIndex(0)
    setCurrentTrack(nextQueue[0] || null)

    if (isPlaying && nextQueueUris.length > 0) {
      await play(nextQueueUris[0], null, 0, nextQueueUris, currentProgress)
    }
  }, [
    effectiveShuffleEnabled,
    toggleShuffle,
    currentPlaybackSource,
    currentSourceTracks,
    currentTrack,
    createLikedSongsQueue,
    isPlaying,
    play,
    currentProgress
  ])

  const resetQueue = useCallback(() => {
    setCurrentTrack(null)
    setCurrentTrackList([])
    setCurrentTrackIndex(0)
    setCurrentSourceTracks([])
    setCurrentPlaybackSource(null)
    setQueueShuffleEnabled(false)
  }, [])

  return {
    currentTrack,
    currentTrackList,
    currentTrackIndex,
    currentSourceTracks,
    setCurrentSourceTracks,
    currentPlaybackSource,
    queueShuffleEnabled,
    isQueuePlayback,
    effectiveShuffleEnabled,
    getCurrentTracks,
    createLikedSongsQueue,
    applyTrackSelection,
    handleSkipForward,
    handleSkipBack,
    handleToggleShuffle,
    resetQueue
  }
}
