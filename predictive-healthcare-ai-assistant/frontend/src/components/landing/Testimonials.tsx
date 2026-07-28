import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Star } from 'lucide-react'

const TESTIMONIALS = [
  {
    name: 'Dr. Sarah Chen',
    role: 'Cardiologist, Stanford Medical',
    avatar: 'SC',
    avatarColor: 'from-sky-400 to-blue-500',
    rating: 5,
    quote: "HealthAI's prediction models are remarkably accurate. The heart disease risk scoring has helped me identify at-risk patients much earlier in the care cycle.",
  },
  {
    name: 'Marcus Thompson',
    role: 'Patient — Diabetes Management',
    avatar: 'MT',
    avatarColor: 'from-teal-400 to-emerald-500',
    rating: 5,
    quote: "I uploaded my blood work and the AI explained every value in plain English. It caught that my A1C trend was worsening before my doctor mentioned it.",
  },
  {
    name: 'Dr. Priya Patel',
    role: 'General Practitioner, NHS',
    avatar: 'PP',
    avatarColor: 'from-violet-400 to-purple-500',
    rating: 5,
    quote: "The report analyzer saves me 20 minutes per patient visit. The AI summaries are clinically accurate and patients love the plain-language explanations.",
  },
  {
    name: 'James Rodriguez',
    role: 'Preventive Health Enthusiast',
    avatar: 'JR',
    avatarColor: 'from-rose-400 to-pink-500',
    rating: 5,
    quote: "The disease prediction feature motivated me to change my diet and exercise habits after seeing my diabetes risk score. Down 18 lbs in 4 months.",
  },
  {
    name: 'Emily Nakamura',
    role: 'Nurse Practitioner',
    avatar: 'EN',
    avatarColor: 'from-amber-400 to-orange-500',
    rating: 5,
    quote: "Recommending this to all my patients for self-monitoring between visits. The health timeline feature is brilliant for tracking chronic conditions.",
  },
  {
    name: 'Dr. Amir Hassan',
    role: 'Endocrinologist, Mayo Clinic',
    avatar: 'AH',
    avatarColor: 'from-cyan-400 to-sky-500',
    rating: 5,
    quote: "The ML models for kidney disease prediction are impressive. The confidence scores and key risk factor breakdown help patients understand their own data.",
  },
]

export default function Testimonials() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="testimonials" ref={ref} className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-violet-100 text-violet-600 text-sm font-semibold mb-4">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">
            Trusted by Doctors{' '}
            <span className="text-gradient-blue">&amp; Patients</span>
          </h2>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <motion.div
                whileHover={{ y: -4 }}
                className="glass-card p-6 flex flex-col gap-4 h-full"
              >
                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm text-slate-600 leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
