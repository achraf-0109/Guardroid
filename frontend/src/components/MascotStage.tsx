import { useEffect, useRef, useState, useCallback } from 'react'
import type { FC } from 'react'
import styles from './MascotStage.module.css'

import friendlyUrl from '../assets/hero/good_android.png'
import maliciousUrl from '../assets/hero/bad_android.png'

type MascotKind = 'friendly' | 'malicious'

type AnimPhase =
  | 'idle'
  | 'hoverIn'
  | 'hoverOut'
  | 'clickOut'
  | 'clickIn'

// Image natural dimensions are 1536 x 1024 (exact 3:2 aspect ratio)
const CANVAS_W = 600
const CANVAS_H = 400

const HOVER_TARGET = 0.55
const SPEED_HOVER_IN = 1 / 350
const SPEED_HOVER_OUT = 1 / 250
const SPEED_CLICK_OUT = 1 / 220
const SPEED_CLICK_IN = 1 / 320

const labels: Record<MascotKind, string> = {
  friendly: 'Friendly appearance',
  malicious: 'Hidden threats?',
}

interface Props {
  reducedMotion: boolean
}

const MascotStage: FC<Props> = ({ reducedMotion }) => {
  const [current, setCurrent] = useState<MascotKind>('friendly')
  const [isHovered, setIsHovered] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const friendlyImg = useRef<HTMLImageElement | null>(null)
  const maliciousImg = useRef<HTMLImageElement | null>(null)

  const rafRef = useRef<number | null>(null)
  const phaseRef = useRef<AnimPhase>('idle')
  const progressRef = useRef(0)
  const currentRef = useRef<MascotKind>('friendly')
  const lastTimeRef = useRef<number | null>(null)
  const animTimeRef = useRef(0)

  // Preload images and prepare offscreen canvas for crisp pixelation
  useEffect(() => {
    const make = (src: string) => {
      const img = new Image()
      img.src = src
      return img
    }
    friendlyImg.current = make(friendlyUrl)
    maliciousImg.current = make(maliciousUrl)

    const off = document.createElement('canvas')
    off.width = CANVAS_W
    off.height = CANVAS_H
    offCanvasRef.current = off
  }, [])

  // Draw frame: The mascot's outer size and silhouette stay 100% constant.
  // All pixel lines, color effects, and shatter lines occur strictly inside.
  const draw = useCallback((timeMs: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const off = offCanvasRef.current
    if (!off) return
    const offCtx = off.getContext('2d')
    if (!offCtx) return

    const curImg = currentRef.current === 'friendly' ? friendlyImg.current : maliciousImg.current
    const nextImg = currentRef.current === 'friendly' ? maliciousImg.current : friendlyImg.current
    if (!curImg?.complete || !nextImg?.complete) return

    const W = CANVAS_W
    const H = CANVAS_H
    const p = progressRef.current
    const isFriendly = currentRef.current === 'friendly'

    ctx.clearRect(0, 0, W, H)

    // --- STEP 1: BASE MASCOT (PERFECT NORMAL SIZE & POSITION) ---
    // Drawn at fixed (0, 0, W, H) without any displacement or scaling.
    ctx.globalCompositeOperation = 'source-over'
    ctx.imageSmoothingEnabled = true
    ctx.globalAlpha = 1
    ctx.drawImage(curImg, 0, 0, W, H)

    // When progress is 0, base mascot is already cleanly rendered.
    if (p <= 0.005) return

    // --- STEP 2: LOCK SILHOUETTE ---
    // All effects are clipped to the base mascot's silhouette so the
    // character NEVER expands, shifts, or grows in size.
    ctx.globalCompositeOperation = 'source-atop'

    const t = timeMs * 0.005

    // --- STEP 3: INTERNAL PIXELATION BLOCKS (CLIPPED) ---
    // Generates a pixelated mosaic version of the mascot and blends it inside
    const blockSize = Math.max(2, Math.round(4 + p * 12))
    const smallW = Math.max(1, Math.floor(W / blockSize))
    const smallH = Math.max(1, Math.floor(H / blockSize))

    offCtx.clearRect(0, 0, W, H)
    offCtx.imageSmoothingEnabled = true
    offCtx.drawImage(curImg, 0, 0, smallW, smallH)

    ctx.imageSmoothingEnabled = false
    // Low opacity keeps the original mascot clearly recognizable
    ctx.globalAlpha = p * 0.32
    ctx.drawImage(off, 0, 0, smallW, smallH, 0, 0, W, H)

    // --- STEP 4: EMERGING COLOR WASH ---
    // Friendly -> emerging red wash; Malicious -> emerging emerald green wash
    const tintColor = isFriendly
      ? `rgba(239, 68, 68, ${p * 0.24})`
      : `rgba(52, 211, 153, ${p * 0.24})`
    ctx.fillStyle = tintColor
    ctx.fillRect(0, 0, W, H)

    // --- STEP 5: PIXEL SCAN / SHATTER LINES PASSING THROUGH ---
    // Sharp horizontal pixel lines that sweep through the mascot body
    const lineCount = 8
    for (let j = 0; j < lineCount; j++) {
      const lineY = Math.floor((j * 51 + t * 40) % H)
      const lineH = 2 + (j % 3) * 2
      const lineNoise = Math.sin(j * 37 + t * 2.2)

      if (lineNoise > -0.3) {
        // High-contrast glowing pixel color
        const lineColor = isFriendly
          ? `rgba(255, 60, 60, ${0.4 + p * 0.55})`
          : `rgba(52, 211, 153, ${0.4 + p * 0.55})`
        ctx.fillStyle = lineColor

        // Horizontal pixel dashes
        const segW = 10 + (j % 4) * 8
        const gapW = 4 + (j % 3) * 3
        let x = 0
        while (x < W) {
          ctx.fillRect(x, lineY, segW, lineH)
          x += segW + gapW
        }
      }
    }

    // --- STEP 6: EMERGING MASCOT PEEK-THROUGH (CLIPPED) ---
    // Reveal portions of the opposite mascot through the scanlines
    if (p > 0.08) {
      // Draw nextImg inside the clipped silhouette
      ctx.globalAlpha = p * 0.45
      const bandH = 14
      const peekRows = [4, 8, 12, 17, 21]
      for (const r of peekRows) {
        const py = (r * 18 + Math.floor(t * 12)) % (H - bandH)
        ctx.drawImage(
          nextImg,
          0, py, W, bandH,
          0, py, W, bandH
        )
      }
      ctx.globalAlpha = 1
    }

    // Reset back to standard composite mode
    ctx.globalCompositeOperation = 'source-over'
    ctx.imageSmoothingEnabled = true
  }, [])

  // Stop RAF
  const stopRAF = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  // Start RAF animation loop
  const startRAF = useCallback(() => {
    stopRAF()
    lastTimeRef.current = null

    const tick = (now: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = now
      const dt = Math.min(now - lastTimeRef.current, 50)
      lastTimeRef.current = now
      animTimeRef.current += dt

      const phase = phaseRef.current
      let p = progressRef.current

      if (phase === 'hoverIn') {
        p = Math.min(HOVER_TARGET, p + SPEED_HOVER_IN * dt)
        progressRef.current = p
        draw(animTimeRef.current)
      } else if (phase === 'hoverOut') {
        p = Math.max(0, p - SPEED_HOVER_OUT * dt)
        progressRef.current = p
        draw(animTimeRef.current)
        if (p <= 0) {
          phaseRef.current = 'idle'
          rafRef.current = null
          return
        }
      } else if (phase === 'clickOut') {
        p = Math.min(1, p + SPEED_CLICK_OUT * dt)
        progressRef.current = p
        draw(animTimeRef.current)
        if (p >= 1) {
          const next: MascotKind = currentRef.current === 'friendly' ? 'malicious' : 'friendly'
          currentRef.current = next
          setCurrent(next)
          phaseRef.current = 'clickIn'
        }
      } else if (phase === 'clickIn') {
        p = Math.max(0, p - SPEED_CLICK_IN * dt)
        progressRef.current = p
        draw(animTimeRef.current)
        if (p <= 0) {
          phaseRef.current = 'idle'
          rafRef.current = null
          return
        }
      } else {
        if (progressRef.current > 0) {
          draw(animTimeRef.current)
        } else {
          rafRef.current = null
          return
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [draw, stopRAF])

  // Mouse handlers
  const handleMouseEnter = useCallback(() => {
    if (reducedMotion) return
    setIsHovered(true)
    if (phaseRef.current === 'clickOut' || phaseRef.current === 'clickIn') return
    phaseRef.current = 'hoverIn'
    startRAF()
  }, [reducedMotion, startRAF])

  const handleMouseLeave = useCallback(() => {
    if (reducedMotion) return
    setIsHovered(false)
    if (phaseRef.current === 'clickOut' || phaseRef.current === 'clickIn') return
    phaseRef.current = 'hoverOut'
    startRAF()
  }, [reducedMotion, startRAF])

  const handleClick = useCallback(() => {
    if (phaseRef.current === 'clickOut' || phaseRef.current === 'clickIn') return

    if (reducedMotion) {
      const next: MascotKind = currentRef.current === 'friendly' ? 'malicious' : 'friendly'
      currentRef.current = next
      setCurrent(next)
      progressRef.current = 0
      draw(0)
      return
    }

    phaseRef.current = 'clickOut'
    startRAF()
  }, [reducedMotion, draw, startRAF])

  // Initial draw once assets load
  useEffect(() => {
    const tryDraw = () => {
      if (friendlyImg.current?.complete && maliciousImg.current?.complete) {
        draw(0)
      }
    }
    const fi = friendlyImg.current
    const mi = maliciousImg.current
    fi?.addEventListener('load', tryDraw)
    mi?.addEventListener('load', tryDraw)
    tryDraw()
    return () => {
      fi?.removeEventListener('load', tryDraw)
      mi?.removeEventListener('load', tryDraw)
    }
  }, [draw])

  useEffect(() => () => stopRAF(), [stopRAF])

  const isFriendly = current === 'friendly'

  return (
    <div className={styles.stage}>
      {/* Background glow */}
      <div
        className={`${styles.glow} ${isFriendly ? styles.glowGreen : styles.glowRed} ${
          isHovered ? (isFriendly ? styles.glowHoverRed : styles.glowHoverGreen) : ''
        }`}
        aria-hidden="true"
      />

      {/* Mascot Canvas Container: locked strict size */}
      <div
        className={`${styles.mascotWrap} ${isFriendly ? styles.wrapFriendly : styles.wrapEvil}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={
          isFriendly
            ? 'Friendly Android mascot. Hover to reveal threat scan, click to transform.'
            : 'Malicious Android mascot. Hover to reveal security scan, click to restore.'
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClick()
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className={styles.mascotCanvas}
        />

        {/* Interaction Hint */}
        <span className={styles.interactionHint}>
          {isFriendly ? 'Hover to inspect • Click to toggle' : 'Hover to cleanse • Click to restore'}
        </span>
      </div>

      {/* Synchronized label beneath artwork */}
      <div
        className={`${styles.label} ${isFriendly ? styles.labelGreen : styles.labelRed}`}
        aria-hidden="true"
      >
        {labels[current]}
      </div>
    </div>
  )
}

export default MascotStage