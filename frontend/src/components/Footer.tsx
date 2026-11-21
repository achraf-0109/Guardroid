import { useState, useRef, useEffect, useCallback } from 'react'
import type { FC, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './Footer.module.css'

import logoUrl from '../assets/guardroid-logo.png'
import goodAndroidUrl from '../assets/hero/good_android.png'
import badAndroidUrl from '../assets/hero/bad_android.png'

interface FooterProps {
  /** Callback to trigger the APK upload/analysis flow */
  onApkUploadClick?: () => void
  /** Callback to trigger the workflow/demo walkthrough */
  onSeeHowItWorksClick?: () => void
}

interface ActiveMascot {
  id: number
  type: 'green' | 'red'
  x: number
  y: number
  rotation: number
  fadingOut: boolean
}

const MASCOT_WIDTH = 84
const MASCOT_HEIGHT = 56
const LIFESPAN_MS = 30000 // stays visible for 30 seconds
const FADE_MS = 500 // smooth fade out duration

const Footer: FC<FooterProps> = ({ onApkUploadClick, onSeeHowItWorksClick }) => {
  const currentYear = new Date().getFullYear()
  const footerRef = useRef<HTMLElement>(null)
  const [mascots, setMascots] = useState<ActiveMascot[]>([])
  const navigate = useNavigate()
  const location = useLocation()

  // Alternates between green and red on each click
  const nextTypeRef = useRef<'green' | 'red'>('green')
  const nextIdRef = useRef<number>(1)
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>[]>>(new Map())

  // Clean up all pending timers on unmount
  useEffect(() => {
    const currentTimers = timersRef.current
    return () => {
      currentTimers.forEach((timerList) => {
        timerList.forEach((timer) => clearTimeout(timer))
      })
      currentTimers.clear()
    }
  }, [])

  const spawnMascot = useCallback((clientX: number, clientY: number) => {
    if (!footerRef.current) return

    const rect = footerRef.current.getBoundingClientRect()
    const padding = 10

    // Exact location centered on user's click point
    const rawX = clientX - rect.left - MASCOT_WIDTH / 2
    const rawY = clientY - rect.top - MASCOT_HEIGHT / 2

    // Clamp coordinates safely within the footer bounds so it never overflows
    const maxX = Math.max(padding, rect.width - MASCOT_WIDTH - padding)
    const maxY = Math.max(padding, rect.height - MASCOT_HEIGHT - padding)
    const safeX = Math.min(Math.max(padding, rawX), maxX)
    const safeY = Math.min(Math.max(padding, rawY), maxY)

    // Current mascot type (alternating: green first, then red, then green...)
    const type = nextTypeRef.current
    nextTypeRef.current = type === 'green' ? 'red' : 'green'

    // Playful random tilt angle between -26deg and +26deg
    const rotation = Math.round((Math.random() * 52 - 26) * 10) / 10

    const id = nextIdRef.current++
    const newMascot: ActiveMascot = {
      id,
      type,
      x: safeX,
      y: safeY,
      rotation,
      fadingOut: false,
    }

    setMascots((prev) => [...prev, newMascot])

    // Timer for 30s stay, then fade out
    const fadeTimer = setTimeout(() => {
      setMascots((prev) =>
        prev.map((m) => (m.id === id ? { ...m, fadingOut: true } : m))
      )

      const removeTimer = setTimeout(() => {
        setMascots((prev) => prev.filter((m) => m.id !== id))
        timersRef.current.delete(id)
      }, FADE_MS)

      const mascotTimers = timersRef.current.get(id)
      if (mascotTimers) {
        mascotTimers.push(removeTimer)
      }
    }, LIFESPAN_MS)

    timersRef.current.set(id, [fadeTimer])
  }, [])

  const handlePointerDown = (e: ReactMouseEvent<HTMLElement> | ReactTouchEvent<HTMLElement>) => {
    // Prevent triggering when click starts on an interactive element (links, buttons, inputs)
    const target = e.target as HTMLElement
    if (target.closest('a, button, input, textarea, select, [role="button"], [role="link"]')) {
      return
    }

    let clientX = 0
    let clientY = 0

    if ('clientX' in e) {
      clientX = e.clientX
      clientY = e.clientY
    } else if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      return
    }

    spawnMascot(clientX, clientY)
  }

  const handleNavLinkClick = (
    e: ReactMouseEvent<HTMLAnchorElement>,
    sectionId: string,
    routePath?: string,
    customAction?: () => void
  ) => {
    e.preventDefault()
    if (customAction) {
      customAction()
      return
    }

    if (routePath) {
      navigate(routePath)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (location.pathname === '/') {
      const target = document.getElementById(sectionId)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      navigate(`/#${sectionId}`)
    }
  }

  const handleCtaClick = () => {
    if (onApkUploadClick) {
      onApkUploadClick()
    } else {
      navigate('/analysis')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <footer
      ref={footerRef}
      className={styles.footer}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      role="contentinfo"
      aria-label="Site footer"
    >
      {/* Subtle background ambient glow */}
      <div className={styles.ambientGlow} aria-hidden="true" />

      {/* Main content grid */}
      <div className={styles.container}>
        {/* Brand Area */}
        <div className={styles.brandCol}>
          <a
            href="/"
            className={styles.logoLink}
            aria-label="Guardroid Home"
            onClick={(e) => {
              e.preventDefault()
              navigate('/')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <img
              src={logoUrl}
              alt="Guardroid"
              className={styles.logoImg}
              width="180"
              height="48"
              loading="lazy"
            />
          </a>

          <p className={styles.brandDesc}>
            Analyze Android APKs and review signs of potential malicious behavior with machine
            learning.
          </p>

          <p className={styles.disclaimerNote}>
            Guardroid provides analysis findings to support your decision. No scan can guarantee an
            app is safe.
          </p>
        </div>

        {/* Navigation Column */}
        <div className={styles.navCol}>
          <p className={styles.columnTitle}>Navigation</p>
          <nav aria-label="Footer Navigation">
            <ul className={styles.linkList}>

              <li>
                <a
                  href="/#hero-headline"
                  className={styles.navLink}
                  onClick={(e) => handleNavLinkClick(e, 'hero-headline', undefined, onSeeHowItWorksClick)}
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="/#about"
                  className={styles.navLink}
                  onClick={(e) => handleNavLinkClick(e, 'about')}
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/analysis"
                  className={styles.navLink}
                  onClick={(e) => handleNavLinkClick(e, 'analysis', '/analysis')}
                >
                  APK Analysis
                </a>
              </li>
              <li>
                <a
                  href="/#contact"
                  className={styles.navLink}
                  onClick={(e) => handleNavLinkClick(e, 'contact')}
                >
                  Contact
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* CTA Column */}
        <div className={styles.ctaCol}>
          <p className={styles.columnTitle}>APK Inspection</p>
          <p className={styles.ctaText}>
            Upload an Android APK package to inspect permissions, intent filters, and ML indicators.
          </p>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={handleCtaClick}
            aria-label="Analyze an APK with Guardroid"
          >
            <span>Analyze an APK</span>
            <svg
              className={styles.ctaArrow}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Legal & Copyright Bar */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomContainer}>
          <p className={styles.copyright}>
            &copy; {currentYear} Guardroid. All rights reserved.
          </p>
          <p className={styles.statusIndicator}>
            ML Detection Engine Active
          </p>
        </div>
      </div>

      {/* Interactive Easter Egg: Mascots popping at click locations, staying for 30s */}
      {mascots.map((mascot) => (
        <div
          key={mascot.id}
          className={`${styles.easterEggMascot} ${mascot.type === 'green' ? styles.greenMascot : styles.redMascot
            } ${mascot.fadingOut ? styles.fadingOut : ''}`}
          style={
            {
              left: `${mascot.x}px`,
              top: `${mascot.y}px`,
              '--rot': `${mascot.rotation}deg`,
            } as React.CSSProperties
          }
          aria-hidden="true"
        >
          <img
            src={mascot.type === 'green' ? goodAndroidUrl : badAndroidUrl}
            alt=""
            className={styles.mascotImg}
            draggable={false}
            width={MASCOT_WIDTH}
            height={MASCOT_HEIGHT}
          />
        </div>
      ))}
    </footer>
  )
}

export default Footer
