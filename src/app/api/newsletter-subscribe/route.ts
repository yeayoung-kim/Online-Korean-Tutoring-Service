import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST 메서드는 더 이상 사용되지 않습니다.
// 결제 완료 후에만 데이터베이스에 저장하도록 변경되었습니다.
// 대신 /api/newsletter-check-email을 사용하세요.

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/newsletter-check-email instead.' },
    { status: 410 }
  )
}

// 구독자 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    const { data: subscribers, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Database fetch error:', error)
      return NextResponse.json(
        { error: '구독자 정보를 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      subscribers
    })
    
  } catch (error) {
    console.error('Newsletter fetch error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 