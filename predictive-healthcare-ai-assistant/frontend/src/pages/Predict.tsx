import { motion } from 'framer-motion'

export default function PredictPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-health-gradient flex items-center justify-center"
    >
      <div className="glass-card p-8 text-center">
        <h1 className="text-2xl font-bold text-gradient-health">Disease Prediction</h1>
        <p className="text-slate-500 mt-2">Coming in Feature 5</p>
      </div>
    </motion.div>
  )
}
