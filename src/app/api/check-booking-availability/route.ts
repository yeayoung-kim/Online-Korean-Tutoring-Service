import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 시간 문자열을 분으로 변환하는 함수 (한국 시간 기준)
function timeToMinutes(timeString: string): number {
  // "2024-01-15 14:30:00" 형태에서 시간 부분만 추출
  const timePart = timeString.split(' ')[1] // "14:30:00"
  const [hours, minutes] = timePart.split(':').map(Number)
  return hours * 60 + minutes
}

export async function POST(request: NextRequest) {
  try {
    const { slots } = await request.json()

    if (!slots || !Array.isArray(slots)) {
      return NextResponse.json(
        { error: 'Invalid slots data' },
        { status: 400 }
      )
    }

    // 각 슬롯에 대해 중복 확인 (duration 고려) - 한국 시간 기준
    const conflicts = []
    
    for (const slot of slots) {
      const { date, time } = slot
      const newSlotTime = `${date} ${time}:00`
      
      // 해당 날짜의 모든 예약 조회 (한국 시간 기준)
      const startOfDay = `${date} 00:00:00`
      const endOfDay = `${date} 23:59:59`
      
      const { data: existingBookings, error } = await supabase
        .from('bookings')
        .select('lesson_date, name, email, duration_minutes')
        .gte('lesson_date', startOfDay)
        .lte('lesson_date', endOfDay)
      
      if (error) {
        console.error('예약 확인 오류:', error)
        return NextResponse.json(
          { error: '예약 확인 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }
      
      // 시간 겹침 확인 (duration 고려) - 한국 시간 기준
      const conflictingBookings = existingBookings?.filter(booking => {
        const existingTime = booking.lesson_date.replace('T', ' ').split('.')[0] // "2024-01-15 14:00:00" 형태로 변환
        const existingStartMinutes = timeToMinutes(existingTime)
        const existingEndMinutes = existingStartMinutes + (booking.duration_minutes || 60)
        
        const newSlotStartMinutes = timeToMinutes(newSlotTime)
        const newSlotEndMinutes = newSlotStartMinutes + 60 // 새 예약은 60분 기본값
        
        // 시간 범위가 겹치는지 확인
        return newSlotStartMinutes < existingEndMinutes && newSlotEndMinutes > existingStartMinutes
      }) || []
      
      if (conflictingBookings.length > 0) {
        conflicts.push({
          date,
          time,
          lessonDate: newSlotTime,
          existingBookings: conflictingBookings
        })
      }
    }

    if (conflicts.length > 0) {
      return NextResponse.json({
        available: false,
        conflicts,
        message: `${conflicts.length}개의 시간대가 이미 예약되어 있습니다.`
      })
    }

    return NextResponse.json({
      available: true,
      message: '모든 시간대가 예약 가능합니다.'
    })

  } catch (error) {
    console.error('예약 가능성 확인 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 