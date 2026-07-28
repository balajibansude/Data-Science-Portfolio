import { useEffect, useRef } from 'react'

/**
 * Animated ECG/heartbeat line drawn on canvas.
 * Runs continuously as a looping animation.
 */
export default function HeartbeatBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animFrame: number
    let offset = 0

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // ECG wave shape: flat → spike up → spike down → flat → bump
    function getECGY(x: number, width: number): number {
      const segment = width / 5
      const localX = ((x % width) + width) % width

      if (localX < segment * 0.4) return 0
      if (localX < segment * 0.55) {
        const t = (localX - segment * 0.4) / (segment * 0.15)
        return -Math.sin(t * Math.PI) * 40
      }
      if (localX < segment * 0.65) {
        const t = (localX - segment * 0.55) / (segment * 0.1)
        return Math.sin(t * Math.PI) * 100
      }
      if (localX < segment * 0.72) {
        const t = (localX - segment * 0.65) / (segment * 0.07)
        return -Math.sin(t * Math.PI) * 30
      }
      if (localX < segment) {
        const t = (localX - segment * 0.72) / (segment * 0.28)
        return Math.sin(t * Math.PI) * 15
      }
      return 0
    }

    function draw() {
      if (!canvas || !ctx) return
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      // Draw multiple parallel lines with varying opacity
      const lines = [
        { y: height * 0.3, color: 'rgba(14,165,233,0.18)', amplitude: 0.7 },
        { y: height * 0.5, color: 'rgba(6,182,212,0.22)', amplitude: 1 },
        { y: height * 0.7, color: 'rgba(20,184,166,0.15)', amplitude: 0.6 },
      ]

      for (const line of lines) {
        ctx.beginPath()
        ctx.strokeStyle = line.color
        ctx.lineWidth = 1.5
        ctx.lineJoin = 'round'

        for (let x = 0; x <= width; x += 2) {
          const ecgY = getECGY(x - offset, 300) * line.amplitude
          const y = line.y + ecgY
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      offset += 1.2
      animFrame = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animFrame)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
}
