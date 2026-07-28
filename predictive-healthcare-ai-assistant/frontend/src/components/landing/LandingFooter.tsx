import { Activity, Github, Twitter, Linkedin, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

const FOOTER_LINKS = {
  Product: ['Features', 'How It Works', 'Pricing', 'Changelog'],
  Platform: ['Disease Prediction', 'AI Assistant', 'Report Analyzer', 'Health Dashboard'],
  Company: ['About', 'Blog', 'Careers', 'Press'],
  Legal: ['Privacy Policy', 'Terms of Service', 'HIPAA Compliance', 'Cookie Policy'],
}

export default function LandingFooter() {
  return (
    <footer className="bg-slate-900 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-teal-500 flex items-center justify-center">
                <Activity size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white">HealthAI</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              AI-powered healthcare intelligence for patients and clinicians.
            </p>
            <div className="flex gap-3">
              {[Github, Twitter, Linkedin, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-slate-500 hover:text-sky-400 transition-colors hover:scale-110 inline-flex"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-slate-400 hover:text-sky-400 text-sm transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            &copy; 2026 HealthAI. All rights reserved. Built with ❤️ for better health.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-slate-500 text-xs">FastAPI · React · Scikit-Learn · OpenAI</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
