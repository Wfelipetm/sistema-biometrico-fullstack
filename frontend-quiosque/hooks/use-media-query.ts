"use client"

import { useEffect, useState } from "react"

export function useMediaQuery(query: string): boolean {
  // Inicializar com false para evitar incompatibilidade entre servidor e cliente
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // Definir o valor inicial
    setMatches(media.matches)

    // Callback para quando o valor mudar
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Adicionar listener
    media.addEventListener("change", listener)

    // Cleanup
    return () => {
      media.removeEventListener("change", listener)
    }
  }, [query])

  return matches
}
