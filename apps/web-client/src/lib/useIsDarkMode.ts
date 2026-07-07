import { useSyncExternalStore } from 'react'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/**
 * Reactively tracks the user's OS colour-scheme preference so chart internals
 * (which can't use Tailwind's `dark:` variant) can pick matching colours.
 */
export function useIsDarkMode(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  )
}
