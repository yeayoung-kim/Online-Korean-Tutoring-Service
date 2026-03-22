import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 연속된 휴식시간 그룹화 함수
function groupConsecutiveRestBreaks(restBreaks: any[]) {
  if (restBreaks.length === 0) return []
  
  // 시간순으로 정렬
  const sorted = restBreaks.sort((a, b) => 
    new Date(a.lesson_date).getTime() - new Date(b.lesson_date).getTime()
  )
  
  const groups = []
  let currentGroup = [sorted[0]]
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const previous = sorted[i - 1]
    
    const currentStart = new Date(current.lesson_date).getTime()
    const previousEnd = new Date(previous.lesson_date).getTime() + (previous.duration_minutes * 60 * 1000)
    
    // 5분 이내의 간격이면 같은 그룹으로 처리
    if (currentStart - previousEnd <= 5 * 60 * 1000) {
      currentGroup.push(current)
    } else {
      groups.push(currentGroup)
      currentGroup = [current]
    }
  }
  
  groups.push(currentGroup)
  return groups
}

// 휴식시간 및 스케줄 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    if (!date) {
      return NextResponse.json(
        { error: '날짜가 필요합니다.' },
        { status: 400 }
      )
    }

    // 한국 시간으로 날짜 범위 설정
    const startOfDay = `${date} 00:00:00`
    const endOfDay = `${date} 23:59:59`

    // 해당 날짜의 모든 예약 조회
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .gte('lesson_date', startOfDay)
      .lte('lesson_date', endOfDay)
      .eq('payment_status', 'completed')
      .order('lesson_date', { ascending: true })

    if (bookingsError) {
      console.error('예약 조회 오류:', bookingsError)
      return NextResponse.json(
        { error: '예약 정보를 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 사용 가능한 시간대 조회 (요일별)
    const selectedDate = new Date(date)
    const dayOfWeek = selectedDate.getDay() // 0=일요일, 1=월요일, ...
    const { data: availableTimes, error: timesError } = await supabase
      .from('available_times')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)

    if (timesError) {
      console.error('사용 가능 시간 조회 오류:', timesError)
      return NextResponse.json(
        { error: '사용 가능 시간을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 휴식시간과 강의시간 분류
    const restBreaks = bookings?.filter(b => b.name === '김예영') || []
    const lessons = bookings?.filter(b => b.name !== '김예영') || []

    // 연속된 휴식시간 그룹화
    const restBreakGroups = groupConsecutiveRestBreaks(restBreaks)

    return NextResponse.json({
      success: true,
      data: {
        date,
        availableTimes: availableTimes || [],
        restBreaks,
        restBreakGroups,
        lessons,
        dayOfWeek
      }
    })

  } catch (error) {
    console.error('휴식시간 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 휴식시간 추가
export async function POST(request: NextRequest) {
  try {
    const { date, startTime, endTime, isFullDay } = await request.json()
    
    if (!date) {
      return NextResponse.json(
        { error: '날짜가 필요합니다.' },
        { status: 400 }
      )
    }

    // 하루 휴식 추가
    if (isFullDay) {
      const fullDayStart = `${date} 00:00:00`
      const fullDayEnd = `${date} 23:59:59`

      // 해당 날짜의 모든 예약 삭제 (김예영 제외한 실제 수업만)
      const { data: existingBookings, error: checkError } = await supabase
        .from('bookings')
        .select('*')
        .gte('lesson_date', fullDayStart)
        .lte('lesson_date', fullDayEnd)
        .eq('payment_status', 'completed')

      if (checkError) {
        return NextResponse.json(
          { error: '기존 예약 확인 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      const realLessons = existingBookings?.filter(b => b.name !== '김예영') || []
      
      if (realLessons.length > 0) {
        return NextResponse.json(
          { error: '해당 날짜에 기존 수업이 있어서 하루 휴식을 설정할 수 없습니다.' },
          { status: 400 }
        )
      }

      // 기존 휴식시간 삭제
      await supabase
        .from('bookings')
        .delete()
        .gte('lesson_date', fullDayStart)
        .lte('lesson_date', fullDayEnd)
        .eq('name', '김예영')

      // 하루 전체 휴식시간 추가 (한국 시간)
      const fullDayRestDate = `${date} 00:00:00`
      
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            name: '김예영',
            email: 'rest@break.com',
            lesson_date: fullDayRestDate,
            duration_minutes: 1440, // 24시간 = 1440분
            lesson_type: '하루 휴식',
            payment_status: 'completed',
            amount: 0,
            is_subscription: false
          }
        ])
        .select()

      if (error) {
        console.error('하루 휴식 추가 오류:', error)
        return NextResponse.json(
          { error: '하루 휴식 추가에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '하루 휴식이 추가되었습니다.',
        data
      })
    }

    // 일반 휴식시간 추가
    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: '시작시간과 종료시간이 필요합니다.' },
        { status: 400 }
      )
    }

    // 한국 시간으로 날짜시간 생성
    const lessonDate = `${date} ${startTime}:00`
    
    // 시간 계산
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)

    if (durationMinutes <= 0) {
      return NextResponse.json(
        { error: '종료시간이 시작시간보다 늦어야 합니다.' },
        { status: 400 }
      )
    }

    // 휴식시간을 bookings 테이블에 추가
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          name: '김예영',
          email: 'rest@break.com',
          lesson_date: lessonDate,
          duration_minutes: durationMinutes,
          lesson_type: '휴식시간',
          payment_status: 'completed',
          amount: 0,
          is_subscription: false
        }
      ])
      .select()

    if (error) {
      console.error('휴식시간 추가 오류:', error)
      return NextResponse.json(
        { error: '휴식시간 추가에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '휴식시간이 추가되었습니다.',
      data
    })

  } catch (error) {
    console.error('휴식시간 추가 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 휴식시간 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const groupIds = searchParams.get('groupIds')
    
    if (!id && !groupIds) {
      return NextResponse.json(
        { error: '휴식시간 ID 또는 그룹 ID들이 필요합니다.' },
        { status: 400 }
      )
    }

    // 그룹 삭제인 경우
    if (groupIds) {
      const ids = groupIds.split(',')
      
      // 모든 ID가 김예영의 예약인지 확인
      const { data: bookings, error: checkError } = await supabase
        .from('bookings')
        .select('id, name')
        .in('id', ids)

      if (checkError || !bookings || bookings.length !== ids.length) {
        return NextResponse.json(
          { error: '휴식시간을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      const nonRestBreaks = bookings.filter(b => b.name !== '김예영')
      if (nonRestBreaks.length > 0) {
        return NextResponse.json(
          { error: '휴식시간만 삭제할 수 있습니다.' },
          { status: 400 }
        )
      }

      // 그룹 전체 삭제
      const { error } = await supabase
        .from('bookings')
        .delete()
        .in('id', ids)

      if (error) {
        console.error('휴식시간 그룹 삭제 오류:', error)
        return NextResponse.json(
          { error: '휴식시간 그룹 삭제에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '휴식시간 그룹이 삭제되었습니다.'
      })
    }

    // 단일 휴식시간 삭제
    // 김예영 이름의 예약만 삭제 가능하도록 확인
    const { data: booking, error: checkError } = await supabase
      .from('bookings')
      .select('name')
      .eq('id', id)
      .single()

    if (checkError || !booking) {
      return NextResponse.json(
        { error: '휴식시간을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (booking.name !== '김예영') {
      return NextResponse.json(
        { error: '휴식시간만 삭제할 수 있습니다.' },
        { status: 400 }
      )
    }

    // 휴식시간 삭제
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('휴식시간 삭제 오류:', error)
      return NextResponse.json(
        { error: '휴식시간 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '휴식시간이 삭제되었습니다.'
    })

  } catch (error) {
    console.error('휴식시간 삭제 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 