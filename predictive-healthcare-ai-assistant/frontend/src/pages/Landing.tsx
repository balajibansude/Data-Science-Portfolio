import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, Brain, Shield, Zap,
  ChevronDown, ArrowRight,
  Heart, Microscope,
} from 'lucide-react'
import HeartbeatBackground from '@/components/landing/HeartbeatBackground'
import FloatingHealthCard from '@/components/landing/FloatingHealthCard'
import StatsBanner from '@/components/landing/StatsBanner'
import FeaturesGrid from '@/components/landing/FeaturesGrid'
import HowItWorks from '@/components/landing/HowItWorks'
import Testimonials from '@/components/landing/Testimonials'
import FAQSection from '@/components/landing/FAQSection'
import LandingFooter from '@/components/landing/LandingFooter'
import LandingNav from '@/components/landing/LandingNav'

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.4], [0, -60])

  return (
    <div className="min-h-screen bg-hero-gradient overflow-x-hidden">
      {/* Navigation */}
      <LandingNav />

      {/* ── Hero ─────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden px-4"
      >
        {/* Animated heartbeat background */}
        <HeartbeatBackground />

        {/* Floating ambient orbs */}
        <div className="absolute top-32 left-10 w-72 h-72 bg-sky-300/20 rounded-full blur-3xl animate-float-slow pointer-events-none" />
        <div className="absolute bottom-32 right-10 w-96 h-96 bg-teal-300/15 rounded-full blur-3xl animate-float-slow pointer-events-none" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-100/30 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-6xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-sky-200 text-sky-700 text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            AI-Powered Healthcare Intelligence Platform
            <span className="px-2 py-0.5 bg-sky-100 rounded-full text-xs text-sky-600 font-semibold">v2.0</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-slate-800 leading-tight mb-6"
          >
            Your Health,{' '}
            <span className="shimmer-text">Predicted.</span>
            <br />
            <span className="text-gradient-health">AI-Understood.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Predict diseases before they happen. Understand your medical reports instantly.
            Get personalized AI health guidance — all in one intelligent platform.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-16"
          >
            <Link to="/dashboard">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(14,165,233,0.4)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-teal-500 text-white font-semibold rounded-2xl shadow-lg text-base"
              >
                <Activity size={20} />
                Start Health Analysis
                <ArrowRight size={18} />
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-8 py-4 glass border border-sky-200 text-sky-700 font-semibold rounded-2xl text-base hover:bg-white/80 transition-colors"
            >
              <Zap size={20} />
              Live Demo
            </motion.button>
          </motion.div>

          {/* Floating health preview cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="relative flex items-center justify-center gap-4 flex-wrap"
          >
            <FloatingHealthCard
              label="Heart Health"
              value="98 BPM"
              status="normal"
              icon={<Heart className="text-rose-400" size={20} />}
              delay={0}
            />
            <FloatingHealthCard
              label="Risk Score"
              value="Low 12%"
              status="good"
              icon={<Shield className="text-emerald-400" size={20} />}
              delay={0.15}
            />
            <FloatingHealthCard
              label="AI Insight"
              value="Excellent"
              status="good"
              icon={<Brain className="text-purple-400" size={20} />}
              delay={0.3}
            />
            <FloatingHealthCard
              label="Blood Sugar"
              value="92 mg/dL"
              status="normal"
              icon={<Microscope className="text-sky-400" size={20} />}
              delay={0.45}
            />
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400 text-xs"
        >
          <span>Explore</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            <ChevronDown size={18} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats Banner ─────────────────────────────── */}
      <StatsBanner />

      {/* ── Features ─────────────────────────────────── */}
      <FeaturesGrid />

      {/* ── How It Works ─────────────────────────────── */}
      <HowItWorks />

      {/* ── Social Proof ─────────────────────────────── */}
      <Testimonials />

      {/* ── FAQ ──────────────────────────────────────── */}
      <FAQSection />

      {/* ── Footer ───────────────────────────────────── */}
      <LandingFooter />
    </div>
  )
}
