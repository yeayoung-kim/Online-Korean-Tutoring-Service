// 데이터베이스 테이블 타입 정의

export interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  price: number
  duration_days: number
  lessons_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// 학생 정보 타입 추가
export interface Student {
  id: string
  name: string
  email: string
  phone: string | null
  first_lesson_date: string | null
  last_lesson_date: string | null
  total_lessons: number
  total_amount: number // 센트 단위 (USD)
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AvailableTime {
  id: string
  day_of_week: number // 0=일요일, 1=월요일, ..., 6=토요일
  start_time: string
  end_time: string
  is_available: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  name: string
  email: string
  phone: string | null
  lesson_date: string
  local_time: string | null
  timezone: string | null
  duration_minutes: number
  lesson_type: string
  
  // 구독 정보
  is_subscription: boolean
  subscription_plan_id: string | null
  subscription_start_date: string | null
  subscription_end_date: string | null
  
  // 결제 정보
  payment_status: 'pending' | 'completed' | 'failed'
  amount: number
  stripe_payment_intent_id: string | null
  paypal_order_id: string | null
  paypal_payer_id: string | null
  paypal_payment_id: string | null
  paid_at: string | null
  
  // 시스템 정보
  created_at: string
  updated_at: string
}

// API 요청/응답 타입
export interface CreateBookingRequest {
  name: string
  email: string
  phone?: string
  lesson_date: string
  local_time?: string
  timezone?: string
  duration_minutes?: number
  lesson_type?: string
  is_subscription?: boolean
  subscription_plan_id?: string
  amount: number
}

// 학생 관련 API 타입
export interface CreateStudentRequest {
  name: string
  email: string
  phone?: string
  notes?: string
}

export interface UpdateStudentRequest {
  name?: string
  email?: string
  phone?: string
  notes?: string
}

export interface StudentWithStats extends Student {
  upcoming_lessons: number
  pending_payments: number
}

export interface BookingResponse {
  success: boolean
  booking?: Booking
  error?: string
}

// 시간대 관련 타입
export interface TimeSlot {
  date: string
  time: string
  is_available: boolean
}

export interface DaySchedule {
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
} 