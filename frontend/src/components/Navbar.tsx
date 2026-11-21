import type { FC } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import styles from './Navbar.module.css'
import logoUrl from '../assets/guardroid-logo.png'

interface NavbarProps {
  onCtaClick?: () => void
}

const Navbar: FC<NavbarProps> = ({ onCtaClick }) => {
  const navigate = useNavigate()

  const handleCta = () => {
    if (onCtaClick) {
      onCtaClick()
    } else {
      navigate('/analysis')
    }
  }

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main navigation">
        {/* Wordmark logo */}
        <Link to="/" className={styles.wordmark} aria-label="Guardroid home">
          <img
            src={logoUrl}
            alt="Guardroid"
            className={styles.logoImg}
            width="140"
            height="52"
          />
        </Link>

        {/* Center navigation links */}
        <div className={styles.navLinks}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.activeNavItem : ''}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/analysis"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.activeNavItem : ''}`
            }
          >
            Analysis
          </NavLink>
        </div>

        {/* Primary CTA */}
        <button
          className={styles.ctaBtn}
          onClick={handleCta}
          type="button"
          aria-label="Try Guardroid APK Analysis"
        >
          Try Guardroid
        </button>
      </nav>
    </header>
  )
}

export default Navbar
