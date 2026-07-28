import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Users, TrendingUp, Award, Zap } from 'lucide-react'

const STATS = [
  { icon: Users, label: 'Patients Analyzed', value: '250K+', color: 'text-sky-500' },
  { icon: TrendingUp, label: 'Prediction Accuracy', value: '94.7%', color: 'text-emerald-500' },
  { icon: Award, label: 'Diseases Covered', value: '15+', color: 'text-teal-500' },
  { icon: Zap, label: 'Avg. Analysis Time', value: '<2s', color: 'text-violet-500' },
]

function AnimatedNumber({ value }: { value: string }) {
  return <span>{value}</span>
}

export default function StatsBanner() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="glass-card p-8 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {STATS.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col items-center text-center gap-2"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-100 flex items-center justify-center shadow-sm`}>
                  <Icon size={22} className={stat.color} />
                </div>
                <p className={`text-3xl font-black ${stat.color}`}>
                  <AnimatedNumber value={stat.value} />
                </p>
                <p className="text-xs text-slate-400 font-medium leading-tight">{stat.label}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
