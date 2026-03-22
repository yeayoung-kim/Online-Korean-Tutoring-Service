import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 학생 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('students')
      .select('*')

    // 검색 기능
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // 정렬 및 페이지네이션
    const { data: students, error, count } = await query
      .order('last_lesson_date', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)
      .limit(limit)

    if (error) {
      console.error('학생 목록 조회 오류:', error)
      return NextResponse.json(
        { error: '학생 정보를 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 각 학생별 추가 통계 계산
    const studentsWithStats = await Promise.all(
      (students || []).map(async (student) => {
        // 예정된 수업 수 조회
        const { count: upcomingCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('email', student.email)
          .eq('payment_status', 'completed')
          .gte('lesson_date', new Date().toISOString())

        // 대기 중인 결제 수 조회
        const { count: pendingCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('email', student.email)
          .eq('payment_status', 'pending')

        return {
          ...student,
          upcoming_lessons: upcomingCount || 0,
          pending_payments: pendingCount || 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: studentsWithStats,
      total: count,
      limit,
      offset
    })

  } catch (error) {
    console.error('학생 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 새 학생 생성
export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, notes } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: '이름과 이메일은 필수입니다.' },
        { status: 400 }
      )
    }

    // 이메일 중복 확인
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('email', email)
      .single()

    if (existingStudent) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다.' },
        { status: 400 }
      )
    }

    // 새 학생 생성
    const { data, error } = await supabase
      .from('students')
      .insert([
        {
          name,
          email,
          phone: phone || null,
          notes: notes || null,
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('학생 생성 오류:', error)
      return NextResponse.json(
        { error: '학생 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '학생이 성공적으로 생성되었습니다.',
      data
    })

  } catch (error) {
    console.error('학생 생성 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 