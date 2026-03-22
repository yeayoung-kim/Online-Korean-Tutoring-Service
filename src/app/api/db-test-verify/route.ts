import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, slots } = await request.json()

    if (!email || !slots) {
      return NextResponse.json(
        { error: '이메일과 슬롯 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    // 최근 1분 내에 저장된 해당 이메일의 예약 데이터 조회
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('lesson_date, local_time, timezone, name, email, created_at')
      .eq('email', email)
      .gte('created_at', oneMinuteAgo)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('DB 조회 오류:', error)
      return NextResponse.json(
        { error: 'DB 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 검증 결과 타입 정의
    interface VerificationResult {
      slot_index: number
      correct: boolean
      korean_time_correct?: boolean
      local_time_correct?: boolean
      timezone_correct?: boolean
      error?: string
      expected?: {
        korean: string
        local: string
        timezone: string
      }
      actual?: {
        korean: string
        local: string
        timezone: string
      }
      input: any
      saved: any
    }

    // 입력된 슬롯과 저장된 데이터 비교 검증
    const verification: VerificationResult[] = slots.map((inputSlot: any, index: number) => {
      const savedBooking = bookings?.[index]

      if (!savedBooking) {
        return {
          slot_index: index,
          correct: false,
          error: 'DB에 저장된 데이터를 찾을 수 없음',
          input: inputSlot,
          saved: null
        }
      }

      // 예상되는 저장 형태
      const expectedKoreanTime = `${inputSlot.date} ${inputSlot.time}:00`
      const expectedLocalTime = `${inputSlot.localDate} ${inputSlot.localTime}:00`
      const expectedTimezone = inputSlot.userTimezone

      // 검증
      const koreanTimeCorrect = savedBooking.lesson_date === expectedKoreanTime
      const localTimeCorrect = savedBooking.local_time === expectedLocalTime
      const timezoneCorrect = savedBooking.timezone === expectedTimezone

      const isCorrect = koreanTimeCorrect && localTimeCorrect && timezoneCorrect

      return {
        slot_index: index,
        correct: isCorrect,
        korean_time_correct: koreanTimeCorrect,
        local_time_correct: localTimeCorrect,
        timezone_correct: timezoneCorrect,
        expected: {
          korean: expectedKoreanTime,
          local: expectedLocalTime,
          timezone: expectedTimezone
        },
        actual: {
          korean: savedBooking.lesson_date,
          local: savedBooking.local_time,
          timezone: savedBooking.timezone
        },
        input: inputSlot,
        saved: savedBooking
      }
    })

    return NextResponse.json({
      success: true,
      bookings: bookings || [],
      verification,
      summary: {
        total_bookings: bookings?.length || 0,
        total_slots: slots.length,
        correct_conversions: verification.filter(v => v.correct).length,
        korean_time_correct: verification.filter(v => v.korean_time_correct).length,
        local_time_correct: verification.filter(v => v.local_time_correct).length,
        timezone_correct: verification.filter(v => v.timezone_correct).length
      }
    })

  } catch (error) {
    console.error('DB 검증 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}