-- 한국어 튜터 예약 시스템 데이터베이스 스키마

-- 1. 구독 플랜 테이블
CREATE TABLE subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL, -- 원 단위
    duration_days INTEGER NOT NULL, -- 기간 (일)
    lessons_count INTEGER NOT NULL, -- 수업 횟수
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 가능한 시간대 테이블
CREATE TABLE available_times (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week INTEGER NOT NULL, -- 0=일요일, 1=월요일, ..., 6=토요일
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 뉴스레터 구독자 테이블
CREATE TABLE newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    subscription_status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    last_payment_date TIMESTAMP WITH TIME ZONE,
    next_payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 예약 정보 테이블
CREATE TABLE bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    lesson_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60, -- 기본 60분
    lesson_type TEXT DEFAULT '일반', -- '일반', '정기구독', '시험준비' 등
    
    -- 구독 정보 (정기구독인 경우)
    is_subscription BOOLEAN DEFAULT false,
    subscription_plan_id UUID REFERENCES subscription_plans(id),
    subscription_start_date DATE,
    subscription_end_date DATE,
    
    -- 결제 정보
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    amount INTEGER NOT NULL, -- 원 단위
    stripe_payment_intent_id TEXT,
    paypal_order_id TEXT,
    paypal_payer_id TEXT,
    paypal_payment_id TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- 시스템 정보
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 학생 정보 테이블 추가
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  first_lesson_date TIMESTAMPTZ,
  last_lesson_date TIMESTAMPTZ,
  total_lessons INTEGER DEFAULT 0,
  total_amount INTEGER DEFAULT 0, -- 센트 단위 (USD)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 학생 정보 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_students_updated_at();

-- 이메일 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_bookings_lesson_date ON bookings(lesson_date);
CREATE INDEX idx_bookings_email ON bookings(email);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_available_times_day ON available_times(day_of_week);
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_status ON newsletter_subscribers(subscription_status);

-- 기본 구독 플랜 데이터 삽입
INSERT INTO subscription_plans (name, description, price, duration_days, lessons_count) VALUES
('주 1회 수업', '주 1회 60분 수업', 80000, 30, 4),
('주 2회 수업', '주 2회 60분 수업', 150000, 30, 8),
('월 1회 수업', '월 1회 60분 수업', 20000, 30, 1);

-- 기본 가능 시간대 데이터 삽입 (월-금 8시-23시)
INSERT INTO available_times (day_of_week, start_time, end_time) VALUES
(1, '08:00', '23:00'), -- 월요일
(2, '08:00', '23:00'), -- 화요일
(3, '08:00', '23:00'), -- 수요일
(4, '08:00', '23:00'), -- 목요일
(5, '08:00', '23:00'), -- 금요일
(6, '08:00', '23:00'), -- 토요일
(0, '08:00', '23:00'); -- 일요일 