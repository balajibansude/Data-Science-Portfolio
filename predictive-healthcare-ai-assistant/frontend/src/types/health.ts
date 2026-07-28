// ── Health Metrics ──────────────────────────────────────────
export interface HealthMetrics {
  bmi: number
  heartRate: number
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  bloodSugar: number
  sleepHours: number
  caloriesBurned: number
  stepsToday: number
  hydration: number // glasses of water
  weight: number    // kg
  height: number    // cm
}

export interface VitalReading {
  timestamp: string
  value: number
  unit: string
  status: 'normal' | 'warning' | 'critical' | 'good'
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical'

// ── Disease Prediction ──────────────────────────────────────
export type DiseaseType =
  | 'heart_disease'
  | 'diabetes'
  | 'kidney_disease'
  | 'stroke'
  | 'breast_cancer'

export interface PredictionInput {
  disease: DiseaseType
  features: Record<string, number | string>
}

export interface PredictionResult {
  disease: DiseaseType
  probability: number        // 0–1
  riskLevel: RiskLevel
  confidence: number         // 0–1
  recommendedSpecialist: string
  urgency: 'routine' | 'soon' | 'urgent' | 'emergency'
  keyFactors: string[]
  timestamp: string
}

// ── Medical Report ──────────────────────────────────────────
export interface ReportAnalysis {
  id: string
  filename: string
  uploadedAt: string
  summary: string
  findings: ReportFinding[]
  patientFriendlySummary: string
  abnormalities: string[]
  recommendations: string[]
  medicalTerms: MedicalTerm[]
}

export interface ReportFinding {
  label: string
  value: string
  status: 'normal' | 'abnormal' | 'borderline'
  reference?: string
}

export interface MedicalTerm {
  term: string
  definition: string
}

// ── AI Chat ──────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  type?: 'text' | 'suggestion' | 'alert' | 'info'
}

export interface ChatSession {
  id: string
  title: string
  createdAt: string
  messages: ChatMessage[]
}

// ── Health Timeline ──────────────────────────────────────────
export type TimelineEventType =
  | 'appointment'
  | 'report'
  | 'prediction'
  | 'medication'
  | 'ai_insight'
  | 'vitals'

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  title: string
  description: string
  date: string
  status?: 'completed' | 'upcoming' | 'missed'
  metadata?: Record<string, unknown>
}

// ── User Profile ─────────────────────────────────────────────
export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  age: number
  gender: 'male' | 'female' | 'other'
  bloodType?: string
  allergies?: string[]
  conditions?: string[]
  createdAt: string
}

// ── Notification ─────────────────────────────────────────────
export interface HealthNotification {
  id: string
  type: 'medication' | 'water' | 'exercise' | 'appointment' | 'insight'
  title: string
  message: string
  time?: string
  read: boolean
  createdAt: string
}
