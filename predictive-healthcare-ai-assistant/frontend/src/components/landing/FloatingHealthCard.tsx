import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface FloatingHealthCardProps {
  label: string
  value: string
  status: 'normal' | 'good' | 'warning' | 'critical'
  icon: ReactNode
  delay?: number
}

const statusColors = {
  good: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  normal: 'text-sky-600 bg-sky-50 border-sky-200',
  warning: 'text-amber-600 bg-amber-50 border-amber-200',
  critical: 'text-red-600 bg-red-50 border-red-200',
}

const dotColors = {
  good: 'bg-emerald-400',
  normal: 'bg-sky-400',
  warning: 'bg-amber-400',
  critical: 'bg-red-400',
}

export default function FloatingHealthCard({
  label,
  value,
  status,
  icon,
  delay = 0,
}: FloatingHealthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      style={{
        animation: `float ${3 + delay}s ease-in-out ${delay + 0.5}s infinite`,
      }}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl glass border ${statusColors[status]} shadow-md cursor-default select-none`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="text-left">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm font-bold text-slate-700">{value}</p>
      </div>
      <span className={`w-2 h-2 rounded-full ${dotColors[status]} animate-pulse ml-1`} />
    </motion.div>
  )
}
