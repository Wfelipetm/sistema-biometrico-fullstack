"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  connections: number[]
}

interface NeuralNetworkBackgroundProps {
  className?: string
}

export default function NeuralNetworkBackground({ className = "" }: NeuralNetworkBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Detectar tema escuro/claro
    const isDarkMode = () => {
      return (
        document.documentElement.classList.contains("dark") || window.matchMedia("(prefers-color-scheme: dark)").matches
      )
    }

    // Configurações da rede neural (aumentadas para mais nitidez)
    const PARTICLE_COUNT = 60
    const MAX_DISTANCE = 140
    const PARTICLE_SPEED = 0.4
    const CONNECTION_OPACITY_LIGHT = 0.4 // Aumentado para tema claro
    const CONNECTION_OPACITY_DARK = 0.3 // Aumentado para tema escuro
    const PARTICLE_SIZE = 2.5

    // Cores SEMPRE AZUIS para ambos os temas
    const COLORS = {
      primary: "59, 130, 246", // blue-500 - azul principal
      secondary: "37, 99, 235", // blue-600 - azul mais escuro
      accent: "96, 165, 250", // blue-400 - azul mais claro
      light: "147, 197, 253", // blue-300 - azul bem claro
    }

    // Função para redimensionar o canvas
    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (!container) return

      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      canvas.style.width = rect.width + "px"
      canvas.style.height = rect.height + "px"
    }

    // Inicializar partículas
    const initParticles = () => {
      const container = canvas.parentElement
      if (!container) return

      const rect = container.getBoundingClientRect()
      particlesRef.current = []
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particlesRef.current.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * PARTICLE_SPEED,
          vy: (Math.random() - 0.5) * PARTICLE_SPEED,
          connections: [],
        })
      }
    }

    // Calcular distância entre duas partículas
    const getDistance = (p1: Particle, p2: Particle) => {
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
    }

    // Atualizar posições das partículas
    const updateParticles = () => {
      const particles = particlesRef.current
      const container = canvas.parentElement
      if (!container) return

      const rect = container.getBoundingClientRect()

      particles.forEach((particle) => {
        // Atualizar posição
        particle.x += particle.vx
        particle.y += particle.vy

        // Rebater nas bordas
        if (particle.x <= 0 || particle.x >= rect.width) {
          particle.vx *= -1
        }
        if (particle.y <= 0 || particle.y >= rect.height) {
          particle.vy *= -1
        }

        // Manter dentro dos limites
        particle.x = Math.max(0, Math.min(rect.width, particle.x))
        particle.y = Math.max(0, Math.min(rect.height, particle.y))

        // Resetar conexões
        particle.connections = []
      })

      // Calcular conexões
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const distance = getDistance(particles[i], particles[j])
          if (distance < MAX_DISTANCE) {
            particles[i].connections.push(j)
          }
        }
      }
    }

    // Renderizar a rede neural
    const render = () => {
      const particles = particlesRef.current
      const container = canvas.parentElement
      if (!container) return

      const rect = container.getBoundingClientRect()
      const darkMode = isDarkMode()
      const connectionOpacity = darkMode ? CONNECTION_OPACITY_DARK : CONNECTION_OPACITY_LIGHT

      // Limpar canvas
      ctx.clearRect(0, 0, rect.width, rect.height)

      // Desenhar conexões - SEMPRE AZUIS
      ctx.lineWidth = 1.5

      particles.forEach((particle, i) => {
        particle.connections.forEach((connectionIndex) => {
          const connectedParticle = particles[connectionIndex]
          const distance = getDistance(particle, connectedParticle)
          const opacity = (1 - distance / MAX_DISTANCE) * connectionOpacity

          // Gradiente azul nas conexões
          const gradient = ctx.createLinearGradient(particle.x, particle.y, connectedParticle.x, connectedParticle.y)
          gradient.addColorStop(0, `rgba(${COLORS.primary}, ${opacity})`)
          gradient.addColorStop(0.5, `rgba(${COLORS.secondary}, ${opacity * 0.8})`)
          gradient.addColorStop(1, `rgba(${COLORS.primary}, ${opacity})`)

          ctx.beginPath()
          ctx.strokeStyle = gradient
          ctx.moveTo(particle.x, particle.y)
          ctx.lineTo(connectedParticle.x, connectedParticle.y)
          ctx.stroke()
        })
      })

      // Desenhar partículas (neurônios) - SEMPRE AZUIS
      particles.forEach((particle) => {
        const connectionCount = particle.connections.length
        const intensity = Math.min(connectionCount / 4, 1)

        // Neurônio principal com gradiente azul
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          PARTICLE_SIZE + intensity + 2,
        )

        // Gradiente azul para ambos os temas
        gradient.addColorStop(0, `rgba(${COLORS.primary}, ${0.9 + intensity * 0.1})`)
        gradient.addColorStop(0.7, `rgba(${COLORS.secondary}, ${0.6 + intensity * 0.3})`)
        gradient.addColorStop(1, `rgba(${COLORS.accent}, 0.2)`)

        ctx.beginPath()
        ctx.fillStyle = gradient
        ctx.arc(particle.x, particle.y, PARTICLE_SIZE + intensity, 0, Math.PI * 2)
        ctx.fill()

        // Brilho azul do neurônio para conexões ativas
        if (connectionCount > 2) {
          const glowGradient = ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            PARTICLE_SIZE + intensity + 4,
          )

          glowGradient.addColorStop(0, `rgba(${COLORS.light}, ${intensity * 0.5})`)
          glowGradient.addColorStop(1, `rgba(${COLORS.light}, 0)`)

          ctx.beginPath()
          ctx.fillStyle = glowGradient
          ctx.arc(particle.x, particle.y, PARTICLE_SIZE + intensity + 3, 0, Math.PI * 2)
          ctx.fill()
        }

        // Núcleo azul brilhante
        ctx.beginPath()
        ctx.fillStyle = `rgba(${COLORS.primary}, ${0.95 + intensity * 0.05})`
        ctx.arc(particle.x, particle.y, PARTICLE_SIZE * 0.4, 0, Math.PI * 2)
        ctx.fill()

        // Ponto central super brilhante
        ctx.beginPath()
        ctx.fillStyle = `rgba(${COLORS.light}, ${0.8 + intensity * 0.2})`
        ctx.arc(particle.x, particle.y, PARTICLE_SIZE * 0.2, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Loop de animação
    const animate = () => {
      updateParticles()
      render()
      animationRef.current = requestAnimationFrame(animate)
    }

    // Inicializar
    resizeCanvas()
    initParticles()
    animate()

    // Event listeners
    const handleResize = () => {
      resizeCanvas()
      initParticles()
    }

    // Observer para mudanças de tema
    const themeObserver = new MutationObserver(() => {
      // Re-render quando o tema mudar
      render()
    })

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener("resize", handleResize)
      themeObserver.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        background: "transparent",
      }}
    />
  )
}
