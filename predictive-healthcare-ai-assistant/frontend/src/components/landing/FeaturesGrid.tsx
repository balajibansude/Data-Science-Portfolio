import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Activity, Brain, FileText, Heart, Clock, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Health Assistant',
    description: 'Natural language medical guidance. Ask about symptoms, medications, lifestyle — get instant, evidence-based AI answers.',
    color: 'from-violet-400 to-purple-500',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    href: '/assistant',
    tag: 'LLM Powered',
  },
  {
    icon: Activity,
    title: 'Disease Prediction',
    description: 'ML models trained on clinical datasets predict heart disease, diabetes, kidney disease, and more with 94%+ accuracy.',
    color: 'from-sky-400 to-blue-500',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    href: '/predict',
    tag: 'XGBoost · Scikit-Learn',
  },
  {
    icon: FileText,
    title: 'Medical Report Analyzer',
    description: 'Upload your lab reports or prescriptions. AI extracts findings, highlights abnormalities, and explains in plain language.',
    color: 'from-teal-400 to-emerald-500',
    bg: 'bg-teal-50',
    border: 'border-teal-100',
    href: '/reports',
    tag: 'PDF · LangChain',
  },
  {
    icon: Heart,
    title: 'Health Dashboard',
    description: 'Track BMI, heart rate, blood pressure, sleep, calories, and more with beautiful real-time visualizations.',
    color: 'from-rose-400 to-pink-500',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    href: '/dashboard',
    tag: 'Recharts · Live Data',
  },
  {
    icon: Clock,
    title: 'Health Timeline',
    description: 'An interactive timeline of all your appointments, AI predictions, medicines, and health milestones in one view.',
    color: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    href: '/timeline',
    tag: 'Framer Motion',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Medicine reminders, hydration alerts, exercise nudges, and AI-generated weekly health reports delivered proactively.',
    color: 'from-cyan-400 to-sky-500',
    bg: 'bg-cyan-50',
    border: 'border-cyan-100',
    href: '/dashboard',
    tag: 'Real-Time',
  },
]

export default function FeaturesGrid() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="features" ref={ref} className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-sky-100 text-sky-600 text-sm font-semibold mb-4">
            Platform Features
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">
            Everything Your Health{' '}
            <span className="text-gradient-health">Needs</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            From AI predictions to report analysis — a complete health intelligence suite built for patients and clinicians.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Link to={feature.href}>
                  <motion.div
                    whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(14,165,233,0.12)' }}
                    transition={{ duration: 0.2 }}
                    className={`glass-card p-6 h-full cursor-pointer group ${feature.border} border`}
                  >
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon size={22} className="text-white" />
                    </div>

                    {/* Tag */}
                    <span className={`inline-block px-2.5 py-1 rounded-lg ${feature.bg} text-slate-500 text-xs font-medium mb-3`}>
                      {feature.tag}
                    </span>

                    <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-sky-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
