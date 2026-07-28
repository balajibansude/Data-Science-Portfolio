import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'Is HealthAI a replacement for a real doctor?',
    a: 'No. HealthAI is a decision-support and educational tool. It helps you understand your health data and identify risks, but always consult a licensed healthcare professional for diagnosis and treatment.',
  },
  {
    q: 'How accurate are the disease prediction models?',
    a: 'Our ML models are trained on publicly available clinical datasets (UCI, Kaggle Medical). Average prediction accuracy ranges from 87%–95% depending on disease type. Confidence scores are always shown alongside predictions.',
  },
  {
    q: 'Is my health data private and secure?',
    a: 'Yes. All data is encrypted in transit and at rest. We use Supabase PostgreSQL with row-level security. We never sell or share your health information with third parties.',
  },
  {
    q: 'What file formats can I upload for report analysis?',
    a: 'Currently PDF lab reports and scanned documents. We use OCR and LLM extraction to parse findings, values, and reference ranges automatically.',
  },
  {
    q: 'Which diseases can be predicted?',
    a: 'Heart Disease, Type 2 Diabetes, Chronic Kidney Disease, Stroke Risk, and Breast Cancer are currently supported, with more models being added regularly.',
  },
  {
    q: 'Can hospitals or clinics use HealthAI?',
    a: 'Yes. HealthAI is designed as a SaaS platform suitable for clinics, hospitals, and individual patients. Contact us for enterprise pricing and custom integrations.',
  },
]

function FAQItem({ q, a, isOpen, onToggle }: {
  q: string; a: string; isOpen: boolean; onToggle: () => void
}) {
  return (
    <div className="border-b border-slate-100 last:border-none">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="text-sm font-semibold text-slate-700 group-hover:text-sky-600 transition-colors">
          {q}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown size={18} className="text-slate-400 group-hover:text-sky-500 transition-colors" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-slate-500 pb-5 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" ref={ref} className="py-24 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-teal-100 text-teal-600 text-sm font-semibold mb-4">
            FAQ
          </span>
          <h2 className="text-4xl font-black text-slate-800 mb-4">
            Common <span className="text-gradient-teal">Questions</span>
          </h2>
        </motion.div>

        {/* FAQ list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-card px-8 py-2"
        >
          {FAQS.map((faq, i) => (
            <FAQItem
              key={i}
              q={faq.q}
              a={faq.a}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
