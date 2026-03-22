import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 특정 학생 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const studentId = id

    // 학생 기본 정보 조회
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 학생의 모든 예약 정보 조회
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('email', student.email)
      .order('lesson_date', { ascending: false })

    if (bookingsError) {
      console.error('예약 정보 조회 오류:', bookingsError)
    }

    // 통계 계산
    const now = new Date().toISOString()
    const allBookings = bookings || []
    const completedBookings = allBookings.filter(b => b.payment_status === 'completed')
    const upcomingBookings = completedBookings.filter(b => b.lesson_date >= now)
    const pastBookings = completedBookings.filter(b => b.lesson_date < now)
    const pendingBookings = allBookings.filter(b => b.payment_status === 'pending')

    const stats = {
      total_lessons: completedBookings.length,
      total_amount: completedBookings.reduce((sum, b) => sum + (b.amount || 0), 0),
      upcoming_lessons: upcomingBookings.length,
      pending_payments: pendingBookings.length,
      last_lesson_date: pastBookings.length > 0 ? pastBookings[0].lesson_date : null,
      next_lesson_date: upcomingBookings.length > 0 ? 
        upcomingBookings.sort((a, b) => new Date(a.lesson_date).getTime() - new Date(b.lesson_date).getTime())[0].lesson_date : null
    }

    return NextResponse.json({
      success: true,
      data: {
        student,
        bookings: allBookings,
        stats
      }
    })

  } catch (error) {
    console.error('학생 정보 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 학생 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const studentId = id
    const { name, email, phone, notes } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: '이름과 이메일은 필수입니다.' },
        { status: 400 }
      )
    }

    // 이메일 중복 확인 (자신 제외)
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('email', email)
      .neq('id', studentId)
      .single()

    if (existingStudent) {
      return NextResponse.json(
        { error: '이미 다른 학생이 사용 중인 이메일입니다.' },
        { status: 400 }
      )
    }

    // 기존 이메일 조회 (예약 정보 업데이트를 위해)
    const { data: currentStudent } = await supabase
      .from('students')
      .select('email')
      .eq('id', studentId)
      .single()

    if (!currentStudent) {
      return NextResponse.json(
        { error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 학생 정보 업데이트
    const { data, error } = await supabase
      .from('students')
      .update({
        name,
        email,
        phone: phone || null,
        notes: notes || null,
      })
      .eq('id', studentId)
      .select()
      .single()

    if (error) {
      console.error('학생 정보 수정 오류:', error)
      return NextResponse.json(
        { error: '학생 정보 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 이메일이 변경된 경우 관련 예약 정보도 업데이트
    if (currentStudent.email !== email) {
      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({ email })
        .eq('email', currentStudent.email)

      if (bookingUpdateError) {
        console.error('예약 정보 이메일 업데이트 오류:', bookingUpdateError)
        // 에러가 있어도 학생 정보 수정은 성공으로 처리
      }
    }

    return NextResponse.json({
      success: true,
      message: '학생 정보가 성공적으로 수정되었습니다.',
      data
    })

  } catch (error) {
    console.error('학생 정보 수정 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 학생 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const studentId = id

    // 학생 정보 조회
    const { data: student } = await supabase
      .from('students')
      .select('email')
      .eq('id', studentId)
      .single()

    if (!student) {
      return NextResponse.json(
        { error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 완료된 예약이 있는지 확인
    const { data: completedBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('email', student.email)
      .eq('payment_status', 'completed')

    if (completedBookings && completedBookings.length > 0) {
      return NextResponse.json(
        { error: '완료된 수업이 있는 학생은 삭제할 수 없습니다. 대신 노트에 비활성화 표시를 해주세요.' },
        { status: 400 }
      )
    }

    // 대기 중인 예약 삭제
    await supabase
      .from('bookings')
      .delete()
      .eq('email', student.email)
      .eq('payment_status', 'pending')

    // 학생 정보 삭제
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId)

    if (error) {
      console.error('학생 삭제 오류:', error)
      return NextResponse.json(
        { error: '학생 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '학생이 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('학생 삭제 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 