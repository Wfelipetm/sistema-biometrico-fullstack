"use client"

import type React from "react"

import { useEffect, useRef } from "react"

interface FocusTrapProps {
  children: React.ReactNode
  active: boolean
  className?: string
}

export function FocusTrap({ children, active, className }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLElement | null>(null)
  const lastFocusableRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )

    if (focusableElements.length === 0) return

    firstFocusableRef.current = focusableElements[0] as HTMLElement
    lastFocusableRef.current = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusableRef.current) {
          e.preventDefault()
          lastFocusableRef.current?.focus()
        }
      } else {
        if (document.activeElement === lastFocusableRef.current) {
          e.preventDefault()
          firstFocusableRef.current?.focus()
        }
      }
    }

    container.addEventListener("keydown", handleKeyDown)
    firstFocusableRef.current?.focus()

    return () => {
      container.removeEventListener("keydown", handleKeyDown)
    }
  }, [active])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}
