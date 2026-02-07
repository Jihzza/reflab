import { useCallback, useMemo, useRef } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router-dom'

export function useLeaveGuard(enabled: boolean) {
  const bypassRef = useRef(false)

  const shouldBlock = useCallback(
    () => {
      if (!enabled) return false
      if (bypassRef.current) {
        bypassRef.current = false
        return false
      }
      return true
    },
    [enabled],
  )

  const blocker = useBlocker(shouldBlock)
  const open = blocker.state === 'blocked'

  useBeforeUnload(
    (event) => {
      if (!enabled) return
      event.preventDefault()
      // Chrome requires returnValue to be set.
      event.returnValue = ''
    },
    { capture: true },
  )

  return useMemo(
    () => ({
      open,
      blocker,
      bypassNextNavigation: () => {
        bypassRef.current = true
      },
      closeAndStay: () => {
        blocker.reset?.()
      },
      closeAndLeave: () => {
        blocker.proceed?.()
      },
    }),
    [open, blocker],
  )
}
