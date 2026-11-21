import type { FC } from 'react'
import aboutGif from '../assets/about/guardroid.gif'
import styles from './AboutSection.module.css'

interface AboutSectionProps {
  /** Callback when user clicks "See how it works" */
  onSeeHowItWorksClick?: () => void
}

const AboutSection: FC<AboutSectionProps> = ({ onSeeHowItWorksClick }) => {
  const handleButtonClick = () => {
    if (onSeeHowItWorksClick) {
      onSeeHowItWorksClick()
      return
    }

    // Default behavior: scroll to #how-it-works if present, or log integration point
    const target = document.getElementById('how-it-works')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    } else {
      console.log('[Guardroid] "See how it works" clicked — wire to workflow/modal/section')
    }
  }

  return (
    <section
      id="about"
      className={styles.aboutSection}
      aria-labelledby="about-headline"
    >
      <div className={styles.container}>
        {/* Text column */}
        <div className={styles.textCol}>
          <p className={styles.eyebrow}>ABOUT GUARDROID</p>

          <h2 id="about-headline" className={styles.heading}>
            Safer look inside every app
          </h2>

          <p className={styles.description}>
            We install apps every day, often without knowing what’s inside. Some are harmless;
            others may hide malicious behavior. Guardroid helps you check before installing
            by analyzing Android APKs with machine learning and highlighting signs of potential
            threats. Upload an APK, review the findings, and make a more informed decision.
          </p>

          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={handleButtonClick}
              aria-label="See how Guardroid APK analysis works"
            >
              <span>See how it works</span>
              <svg
                className={styles.btnArrow}
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

        {/* Media column with framed panel */}
        <div className={styles.mediaCol}>
          {/* Subtle dual-color ambient glow behind panel */}
          <div className={styles.panelGlow} aria-hidden="true" />

          {/* Framed panel */}
          <div className={styles.panel}>
            <div className={styles.imageWrapper}>
              <img
                src={aboutGif}
                alt="Animation showing Android apps being packaged, illustrating how harmless and potentially malicious apps can appear identical from the outside."
                className={styles.gifImage}
                loading="lazy"
                width="1024"
                height="1024"
              />
            </div>
          </div>

          {/* Caption with dual green/red storytelling indicator dots */}
          <div className={styles.caption} aria-hidden="true">
            <span className={styles.indicatorDots}>
              <span className={styles.dotGreen} />
              <span className={styles.dotRed} />
            </span>
            <span className={styles.captionText}>
              Harmless and malicious apps can look alike.
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AboutSection

