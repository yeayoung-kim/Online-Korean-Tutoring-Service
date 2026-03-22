import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { slots, userTimezone } = await request.json()

    if (!slots || !Array.isArray(slots)) {
      return NextResponse.json(
        { error: '슬롯 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 예약 데이터 준비 (실제 저장하지 않고 테스트만)
    const testData = slots.map((slot: any) => {
      const { date, time, localDate, localTime, userTimezone: slotTimezone } = slot || {}
      const timezone = slotTimezone || userTimezone || 'Asia/Seoul'
      
      // 사용자 현지 시간
      const userLocalTime = localDate && localTime 
        ? `${localDate} ${localTime}:00` 
        : `${date} ${time}:00`
      
      // 한국 시간 - date와 time은 항상 한국 시간대 기준
      const koreanTime = `${date} ${time}:00`

      // 한국 시간을 그대로 저장 (시간대 정보 없이)
      const koreanTimeISO = koreanTime

      return {
        lesson_date: koreanTimeISO, // 한국 시간 (ISO 형식, 시간대 정보 포함)
        local_time: userLocalTime, // 사용자의 현지 시간
        timezone: timezone, // 사용자의 시간대
        
        // 추가 디버깅 정보
        debug_info: {
          input_korean_date: date,
          input_korean_time: time,
          input_local_date: localDate,
          input_local_time: localTime,
          calculated_korean_datetime: koreanTime,
          calculated_local_datetime: userLocalTime,
          user_timezone: timezone
        }
      }
    })

    // 변환 검증
    const verification = testData.map((data, index) => {
      const originalSlot = slots[index]
      
      // 저장된 한국 시간이 원래 한국 시간과 일치하는지 확인
      const expectedKoreanTime = `${originalSlot.date} ${originalSlot.time}:00+09:00`
      const isKoreanTimeCorrect = data.lesson_date === expectedKoreanTime
      
      // 저장된 현지 시간이 원래 현지 시간과 일치하는지 확인
      const expectedLocalTime = `${originalSlot.localDate} ${originalSlot.localTime}:00`
      const isLocalTimeCorrect = data.local_time === expectedLocalTime

      return {
        slot_index: index,
        korean_time_correct: isKoreanTimeCorrect,
        local_time_correct: isLocalTimeCorrect,
        expected_korean: expectedKoreanTime,
        actual_korean: data.lesson_date,
        expected_local: expectedLocalTime,
        actual_local: data.local_time
      }
    })

    return NextResponse.json({
      success: true,
      message: '시간대 변환 테스트 완료',
      savedData: testData,
      verification: verification,
      summary: {
        total_slots: slots.length,
        korean_time_correct: verification.filter(v => v.korean_time_correct).length,
        local_time_correct: verification.filter(v => v.local_time_correct).length,
        user_timezone: userTimezone
      }
    })

  } catch (error) {
    console.error('시간대 테스트 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}