import { createContext, useContext, useEffect, useRef, useCallback } from "react"

export type ShortcutOptions = {
  enabled?: boolean
}

export type ShortcutCallback = (event: KeyboardEvent) => void

export type ShortcutRegistry = Map<string, Set<ShortcutCallback>>

const KeyboardShortcutContext = createContext<ShortcutRegistry | undefined>(
  undefined
)

export function KeyboardShortcutProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const registryRef = useRef<ShortcutRegistry>(new Map())

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Don't trigger shortcuts when typing in input/textarea
      const target = event.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      const key = event.key.toLowerCase()
      const callbacks = registryRef.current.get(key)

      if (callbacks) {
        callbacks.forEach((callback) => callback(event))
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return (
    <KeyboardShortcutContext.Provider value={registryRef.current}>
      {children}
    </KeyboardShortcutContext.Provider>
  )
}

export function useShortcut(
  key: string,
  callback: ShortcutCallback,
  options: ShortcutOptions = {}
) {
  const { enabled = true } = options
  const registry = useContext(KeyboardShortcutContext)

  if (!registry) {
    throw new Error(
      "useShortcut must be used within a KeyboardShortcutProvider"
    )
  }

  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const wrappedCallback = useCallback(
    (event: KeyboardEvent) => {
      if (enabled) {
        callbackRef.current(event)
      }
    },
    [enabled]
  )

  useEffect(() => {
    const normalizedKey = key.toLowerCase()

    if (!registry.has(normalizedKey)) {
      registry.set(normalizedKey, new Set())
    }

    const callbacks = registry.get(normalizedKey)!
    callbacks.add(wrappedCallback)

    return () => {
      callbacks.delete(wrappedCallback)
      if (callbacks.size === 0) {
        registry.delete(normalizedKey)
      }
    }
  }, [key, wrappedCallback, registry])
}
