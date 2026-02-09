import { useState, useCallback } from "react"
import { useShortcut } from "@/hooks/use-keyboard-shortcuts"

export type NavigableListOptions = {
  enabled?: boolean
  wrap?: boolean
}

export function useNavigableList<T>(
  items: T[],
  options: NavigableListOptions = {}
) {
  const { enabled = true, wrap = true } = options
  const [selectedIndex, setSelectedIndex] = useState(0)

  const moveUp = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev <= 0) {
        return wrap ? items.length - 1 : 0
      }
      return prev - 1
    })
  }, [items.length, wrap])

  const moveDown = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev >= items.length - 1) {
        return wrap ? 0 : items.length - 1
      }
      return prev + 1
    })
  }, [items.length, wrap])

  // I key for up
  useShortcut("i", moveUp, { enabled })

  // K key for down
  useShortcut("k", moveDown, { enabled })

  const selectedItem = items[selectedIndex] || null

  return {
    selectedIndex,
    selectedItem,
    setSelectedIndex,
    moveUp,
    moveDown,
  }
}
