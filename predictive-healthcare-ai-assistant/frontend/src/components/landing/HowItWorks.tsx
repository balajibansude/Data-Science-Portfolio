import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { UserPlus, ClipboardList, Cpu, BarChart3 } from 'lucide-react'

const STEPS = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Create Your Profile',
    description: 'Sign up in seconds. Enter your basic health data — age, weight, conditions, and medical history.',
    color: 'from-sky-400 to-blue-500',
  },
  {
    step: '02',
    icon: ClipboardList,
    title: 'Input Symptoms or Upload Reports',
    description: 'Describe your symptoms in plain language, or upload lab reports and prescriptions directly.',
    color: 'from-teal-400 to-emerald-500',
  },
  {
    step: '03',
    icon: Cpu,
    title: 'AI & ML Analyze Your Data',
    description: 'Our ML models run risk analysis. LLMs interpret your reports and provide clear medical explanations.',
    color: 'from-violet-400 to-purple-500',
  },
  {
    step: '04',
    icon: BarChart3,
    title: 'Get Personalized Health Insights',
    description: 'Receive risk scores, specialist recommendations, lifestyle tips, and a full health intelligence report.',
    color: 'from-rose-400 to-pink-500',
  },
]

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="how-it-works" ref={ref} className="py-24 px-4 bg-gradient-to-b from-transparent to-sky-50/50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-600 text-sm font-semibold mb-4">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">
            From Symptoms to{' '}
            <span className="text-gradient-teal">Answers</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Four simple steps to understand your health like never before.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-sky-200 via-teal-200 to-violet-200" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="flex flex-col items-center text-center gap-4"
                >
                  {/* Icon circle */}
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg z-10 relative`}>
                      <Icon size={24} className="text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-slate-100 text-xs font-black text-slate-400 flex items-center justify-center shadow-sm">
                      {i + 1}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800 mb-1">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
