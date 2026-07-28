import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Suspense, lazy } from 'react'

// Lazy-loaded pages for code splitting
const LandingPage = lazy(() => import('@/pages/Landing'))
const DashboardPage = lazy(() => import('@/pages/Dashboard'))
const PredictPage = lazy(() => import('@/pages/Predict'))
const AssistantPage = lazy(() => import('@/pages/Assistant'))
const ReportsPage = lazy(() => import('@/pages/Reports'))
const TimelinePage = lazy(() => import('@/pages/Timeline'))

// Full-screen loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen bg-health-gradient flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Animated health pulse */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-sky-400/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-teal-400 flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white" stroke="currentColor" strokeWidth={2}>
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <p className="text-sky-600 font-medium animate-pulse">Loading HealthAI…</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />

            {/* App routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/predict" element={<PredictPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </BrowserRouter>
  )
}
