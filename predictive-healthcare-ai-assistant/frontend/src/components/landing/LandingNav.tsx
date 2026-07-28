import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { Activity, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
]

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 40))

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass border-b border-white/60 shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-teal-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Activity size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gradient-health">HealthAI</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-slate-500 hover:text-sky-600 font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/dashboard">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="px-5 py-2 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors"
            >
              Sign In
            </motion.button>
          </Link>
          <Link to="/dashboard">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(14,165,233,0.35)' }}
              whileTap={{ scale: 0.96 }}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-teal-500 rounded-xl shadow-md"
            >
              Get Started Free
            </motion.button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl glass border border-white/60"
        >
          {mobileOpen ? <X size={20} className="text-sky-600" /> : <Menu size={20} className="text-sky-600" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden glass border-t border-white/60 px-6 py-4 flex flex-col gap-4"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-slate-600 font-medium py-1"
            >
              {link.label}
            </a>
          ))}
          <Link to="/dashboard">
            <button className="w-full py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-teal-500 rounded-xl">
              Get Started Free
            </button>
          </Link>
        </motion.div>
      )}
    </motion.nav>
  )
}
