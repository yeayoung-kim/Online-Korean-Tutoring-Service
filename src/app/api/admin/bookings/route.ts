import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date') 
    const endDate = searchParams.get('end_date')
    
    // 기본값: 현재 날짜로부터 2주
    const today = new Date()
    const defaultStartDate = new Date(today) // 오늘부터
    const defaultEndDate = new Date(today)
    defaultEndDate.setDate(today.getDate() + 14) // 2주 후까지
    
    const start = startDate ? new Date(startDate) : defaultStartDate
    const end = endDate ? new Date(endDate) : defaultEndDate
    
    // 종료일을 23:59:59로 설정
    end.setHours(23, 59, 59, 999)
    
    // 데이터베이스에서 예약 정보 조회
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        name,
        email,
        phone,
        lesson_date,
        duration_minutes,
        lesson_type,
        payment_status,
        amount,
        created_at,
        is_subscription,
        subscription_plan_id,
        stripe_payment_intent_id,
        paypal_order_id,
        paid_at
      `)
      .gte('lesson_date', start.toISOString())
      .lte('lesson_date', end.toISOString())
      .order('lesson_date', { ascending: true })

    if (error) {
      console.error('Database fetch error:', error)
      return NextResponse.json(
        { error: '예약 정보를 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 김예영 예약은 휴식시간으로 분류하고 통계에서 제외
    // 결제 완료된 예약만 포함
    const regularBookings = bookings?.filter(b => b.name !== '김예영' && b.payment_status === 'completed') || []
    const restBreaks = bookings?.filter(b => b.name === '김예영') || []
    
    // 결과 통계 계산 (휴식시간 및 결제 대기 제외)
    const stats = {
      totalBookings: regularBookings.length,
      completedPayments: regularBookings.length, // 모두 결제 완료된 것들
      totalRevenue: regularBookings.reduce((sum, b) => sum + b.amount, 0),
      restBreaks: restBreaks.length
    }

    return NextResponse.json({
      success: true,
      data: {
        bookings: bookings || [],
        stats,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Admin bookings fetch error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 