// ── Generic API Response wrapper ─────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  detail: string
  code?: string
  status: number
}

// ── Auth ─────────────────────────────────────────────────────
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  age: number
  gender: 'male' | 'female' | 'other'
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: {
    id: string
    name: string
    email: string
  }
}

// ── Chat API ─────────────────────────────────────────────────
export interface ChatRequest {
  message: string
  session_id?: string
  context?: Record<string, unknown>
}

export interface ChatApiResponse {
  reply: string
  session_id: string
  suggestions?: string[]
  type?: 'text' | 'suggestion' | 'alert' | 'info'
}

// ── Prediction API ───────────────────────────────────────────
export interface PredictRequest {
  disease: string
  features: Record<string, number | string>
}

export interface PredictApiResponse {
  disease: string
  probability: number
  risk_level: string
  confidence: number
  recommended_specialist: string
  urgency: string
  key_factors: string[]
}

// ── Report API ───────────────────────────────────────────────
export interface ReportApiResponse {
  id: string
  filename: string
  summary: string
  findings: Array<{
    label: string
    value: string
    status: string
    reference?: string
  }>
  patient_friendly_summary: string
  abnormalities: string[]
  recommendations: string[]
  medical_terms: Array<{ term: string; definition: string }>
}
