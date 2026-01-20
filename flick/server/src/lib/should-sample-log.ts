export const shouldSampleLog = (
  key?: string | null,
  rate = 0.05
): boolean => {
  if (rate <= 0) return false
  if (rate >= 1) return true

  if (!key) {
    return Math.random() < rate
  }

  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i)
    hash |= 0
  }

  return (Math.abs(hash) % 1000) / 1000 < rate
}
