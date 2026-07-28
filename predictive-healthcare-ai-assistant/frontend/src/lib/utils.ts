import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number as a percentage string */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/** Get risk level color classes */
export function getRiskColor(level: 'low' | 'moderate' | 'high' | 'critical') {
  const map = {
    low: { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', fill: '#10b981' },
    moderate: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', fill: '#f59e0b' },
    high: { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', fill: '#f97316' },
    critical: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', fill: '#ef4444' },
  }
  return map[level]
}

/** Get status color for vital readings */
export function getStatusColor(status: 'normal' | 'warning' | 'critical' | 'good') {
  const map = {
    good: '#10b981',
    normal: '#0ea5e9',
    warning: '#f59e0b',
    critical: '#ef4444',
  }
  return map[status]
}

/** Format date to readable string */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Format time */
export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Calculate BMI */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

/** Get BMI category */
export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: '#f59e0b' }
  if (bmi < 25) return { label: 'Normal', color: '#10b981' }
  if (bmi < 30) return { label: 'Overweight', color: '#f97316' }
  return { label: 'Obese', color: '#ef4444' }
}

/** Truncate text */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/** Generate a simple UUID */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
