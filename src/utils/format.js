/**
 * Format milliseconds as M:SS
 * @param {number} ms
 * @returns {string}
 */
export const formatTime = (ms) => {
  if (!ms || ms < 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format a follower count as a locale string, e.g. 1,234,567
 * @param {number} count
 * @returns {string}
 */
export const formatFollowers = (count) => {
  if (!count && count !== 0) return '0'
  return count.toLocaleString()
}

/**
 * Format a track duration in milliseconds as a human-readable string
 * Alias for formatTime — useful when the call-site semantics differ.
 * @param {number} ms
 * @returns {string}
 */
export const formatDuration = formatTime
