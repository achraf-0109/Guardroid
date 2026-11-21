import { useEffect } from 'react'
import type { FC } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import AnalysisPage from './pages/AnalysisPage'

/**
 * ScrollToTop ensures the viewport scrolls to the top on route transitions
 * while preserving hash scrolling when an anchor is specified.
 */
const ScrollToTop: FC = () => {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.replace('#', ''))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}

const AppLayout: FC = () => {
  const navigate = useNavigate()

  const handleNavigateToAnalysis = () => {
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
      <ScrollToTop />
      <Navbar onCtaClick={handleNavigateToAnalysis} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        {/* Catch-all route fallback to home */}
        <Route path="*" element={<HomePage />} />
      </Routes>
      <Footer
        onApkUploadClick={handleNavigateToAnalysis}
        onSeeHowItWorksClick={handleSeeHowItWorks}
      />
    </>
  )
}

const App: FC = () => {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
