import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 기존 bookings 데이터를 기반으로 students 테이블 초기화
export async function POST(request: NextRequest) {
  try {
    console.log('학생 데이터 마이그레이션 시작...')

    // 1. 기존 완료된 예약 데이터에서 고유한 이메일 목록 가져오기
    const { data: completedBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('name, email, lesson_date, amount, payment_status')
      .eq('payment_status', 'completed')
      .order('lesson_date', { ascending: true })

    if (bookingsError) {
      console.error('예약 데이터 조회 오류:', bookingsError)
      return NextResponse.json(
        { error: '예약 데이터를 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    if (!completedBookings || completedBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: '완료된 예약 데이터가 없습니다.',
        migrated: 0
      })
    }

    // 2. 이메일별로 데이터 그룹화하여 학생 정보 계산 (김예영 제외)
    const studentDataMap = new Map()

    completedBookings.forEach(booking => {
      const email = booking.email
      const name = booking.name
      
      // 김예영 데이터는 제외
      if (name === '김예영') {
        console.log(`김예영 데이터 제외: ${email}`)
        return
      }
      
      if (!studentDataMap.has(email)) {
        studentDataMap.set(email, {
          name: booking.name,
          email: email,
          first_lesson_date: booking.lesson_date,
          last_lesson_date: booking.lesson_date,
          total_lessons: 0,
          total_amount: 0,
        })
      }

      const studentData = studentDataMap.get(email)
      
      // 이름 업데이트 (가장 최신 이름 사용)
      studentData.name = booking.name
      
      // 첫 번째 및 마지막 수업 날짜 업데이트
      if (new Date(booking.lesson_date) < new Date(studentData.first_lesson_date)) {
        studentData.first_lesson_date = booking.lesson_date
      }
      if (new Date(booking.lesson_date) > new Date(studentData.last_lesson_date)) {
        studentData.last_lesson_date = booking.lesson_date
      }
      
      // 총 수업 횟수 및 금액 누적
      studentData.total_lessons += 1
      studentData.total_amount += booking.amount || 0
    })

    // 3. 기존 students 테이블 초기화 (선택사항 - 주석 해제하면 기존 데이터 삭제)
    // const { error: deleteError } = await supabase
    //   .from('students')
    //   .delete()
    //   .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 레코드 삭제

    // 4. 김예영 데이터가 이미 있다면 삭제
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .eq('name', '김예영')

    if (deleteError) {
      console.warn('김예영 데이터 삭제 오류 (데이터가 없을 수 있음):', deleteError)
    } else {
      console.log('기존 김예영 데이터 삭제 완료')
    }

    // 5. 새로운 학생 데이터 삽입
    const studentsToInsert = Array.from(studentDataMap.values())
    
    console.log(`${studentsToInsert.length}명의 학생 데이터를 삽입합니다...`)

    const { data: insertedStudents, error: insertError } = await supabase
      .from('students')
      .upsert(studentsToInsert, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select()

    if (insertError) {
      console.error('학생 데이터 삽입 오류:', insertError)
      return NextResponse.json(
        { error: '학생 데이터 삽입 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    console.log('학생 데이터 마이그레이션 완료!')

    return NextResponse.json({
      success: true,
      message: `${studentsToInsert.length}명의 학생 데이터가 성공적으로 마이그레이션되었습니다.`,
      migrated: studentsToInsert.length,
      students: insertedStudents
    })

  } catch (error) {
    console.error('마이그레이션 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 마이그레이션 상태 확인
export async function GET() {
  try {
    // students 테이블 레코드 수 확인
    const { count: studentsCount, error: studentsError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })

    // 완료된 예약에서 고유 이메일 수 확인 (김예영 제외)
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('email, name')
      .eq('payment_status', 'completed')

    if (studentsError || bookingsError) {
      return NextResponse.json(
        { error: '데이터 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 김예영 제외한 고유 이메일 수 계산
    const filteredBookings = bookings?.filter(b => b.name !== '김예영') || []
    const uniqueEmailCount = new Set(filteredBookings.map(b => b.email)).size

    return NextResponse.json({
      students_count: studentsCount || 0,
      unique_emails_in_bookings: uniqueEmailCount,
      needs_migration: (studentsCount || 0) < uniqueEmailCount
    })

  } catch (error) {
    console.error('상태 확인 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 