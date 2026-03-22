import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { convertLocalTimeToKorean } from '@/lib/timezone'

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      email,
      slots,
      pricePerSession,
      paypalOrderId,
      paypalPayerId,
      paypalPaymentId,
      userTimezone // 사용자 시간대 정보 추가
    } = await request.json()

    if (!name || !email || !slots || !pricePerSession) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 예약 데이터 준비
    const inserts = slots.map((slot: any) => {
      // 확장된 슬롯 객체에서 필요한 정보 추출
      const { date, time, localDate, localTime, userTimezone: slotTimezone } = slot || {}
      const timezone = slotTimezone || userTimezone || 'Asia/Seoul'
      
      // 사용자 현지 시간 (localDate와 localTime이 있으면 사용, 없으면 기존 방식으로 계산)
      const userLocalTime = localDate && localTime 
        ? `${localDate} ${localTime}:00` 
        : `${date} ${time}:00` // 이전 버전과의 호환성 유지
      
      // 한국 시간 - date와 time은 항상 한국 시간대 기준
      const koreanTime = `${date} ${time}:00`

      // 한국 시간을 그대로 저장 (시간대 정보 없이)
      const koreanTimeISO = koreanTime

      return {
        name,
        email,
        lesson_date: koreanTimeISO, // 한국 시간으로 변환된 시간 (ISO 형식, 시간대 정보 포함)
        local_time: userLocalTime, // 사용자의 현지 시간
        timezone: timezone, // 사용자의 시간대
        duration_minutes: 60,
        payment_status: 'completed',
        stripe_payment_intent_id: null, // Stripe 대신 PayPal 사용
        paypal_order_id: paypalOrderId || null,
        paypal_payer_id: paypalPayerId || null,
        paypal_payment_id: paypalPaymentId || null,
        paid_at: new Date().toISOString(),
        is_subscription: false,
        subscription_plan_id: null,
        amount: Math.round(pricePerSession * 100), // 센트 단위로 저장
      }
    })

    // 데이터베이스에 예약 정보 저장
    const { error: insertError } = await supabase.from('bookings').insert(inserts)

    if (insertError) {
      console.error('예약 저장 오류:', insertError)
      return NextResponse.json(
        { error: '예약 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 신규 학생 정보 생성 (기존 학생은 업데이트하지 않음)
    await createStudentIfNew(name, email, slots.length, Math.round(pricePerSession * 100) * slots.length)

    return NextResponse.json({
      success: true,
      message: '예약이 성공적으로 완료되었습니다.'
    })

  } catch (error) {
    console.error('예약 완료 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 신규 학생 정보만 생성하는 함수 (기존 학생은 업데이트하지 않음, 김예영 제외)
async function createStudentIfNew(name: string, email: string, lessonCount: number, totalAmount: number) {
  try {
    // 김예영은 학생 정보에 추가하지 않음
    if (name === '김예영') {
      console.log(`김예영(${email}) 데이터는 학생 정보에 추가하지 않습니다.`)
      return
    }

    // 기존 학생 정보 확인
    const { data: existingStudent, error: checkError } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116는 "no rows returned" 에러
      console.error('학생 정보 확인 오류:', checkError)
      return
    }

    // 기존 학생이 있으면 아무것도 하지 않음
    if (existingStudent) {
      console.log(`기존 학생 ${email}의 정보는 업데이트하지 않습니다.`)
      return
    }

    // 새 학생인 경우에만 정보 생성
    const currentDate = new Date().toISOString()
    const { error: insertError } = await supabase
      .from('students')
      .insert([
        {
          name,
          email,
          first_lesson_date: currentDate,
          last_lesson_date: currentDate,
          total_lessons: lessonCount,
          total_amount: totalAmount,
        }
      ])

    if (insertError) {
      console.error('학생 정보 생성 오류:', insertError)
    } else {
      console.log(`신규 학생 ${email}의 정보가 생성되었습니다.`)
    }
  } catch (error) {
    console.error('학생 정보 처리 오류:', error)
  }
} 