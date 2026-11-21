import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroSection from '../components/HeroSection'
import AboutSection from '../components/AboutSection'

const HomePage: FC = () => {
  const navigate = useNavigate()

  const handleTryGuardroid = () => {
    navigate('/analysis')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSeeHowItWorks = () => {
    const target = document.getElementById('how-it-works')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    } else {
      console.log('[Guardroid] "See how it works" clicked')
    }
  }

  return (
    <>
      <HeroSection onCtaClick={handleTryGuardroid} />
      <AboutSection onSeeHowItWorksClick={handleSeeHowItWorks} />
    </>
  )
}

export default HomePage

