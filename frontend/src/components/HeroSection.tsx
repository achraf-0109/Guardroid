import { useEffect, useState } from 'react'
import type { FC } from 'react'
import MascotStage from './MascotStage'
import styles from './HeroSection.module.css'

interface HeroSectionProps {
  /** Called when "Try Guardroid" is clicked — wire this to your APK upload flow */
  onCtaClick?: () => void
}

const HeroSection: FC<HeroSectionProps> = ({ onCtaClick }) => {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <section className={styles.hero} aria-labelledby="hero-headline">
      {/* Text column */}
      <div className={styles.textCol}>
        <p className={styles.eyebrow}>AI-powered Android APK analysis</p>

        <h1 id="hero-headline" className={styles.headline}>
          Looks friendly.<br />
          <span className={styles.headlineAccent}>Is it safe?</span>
        </h1>

        <p className={styles.subtitle}>
          Look beneath the surface of Android apps. Guardroid uses machine
          learning to analyze APKs and flag signs of malicious activity before
          you install.
        </p>

        <div className={styles.ctaRow}>
          <button
            className={styles.ctaBtn}
            onClick={onCtaClick}
            type="button"
            aria-label="Try Guardroid — upload an APK to get started"
          >
            Try Guardroid
            {/* Arrow icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              focusable="false"
              className={styles.ctaArrow}
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

        <p className={styles.supportText}>Upload an APK to get started.</p>
      </div>

      {/* Mascot column */}
      <div className={styles.mascotCol} aria-hidden="true">
        <MascotStage reducedMotion={reducedMotion} />
      </div>
    </section>
  )
}

export default HeroSection
