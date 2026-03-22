'use client'
export const dynamic = "force-dynamic";
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { format, parseISO, isBefore, startOfToday } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { convertUTCToLocal, getTimezoneInfo, convertKoreanTimeToTimezone, getUserTimezone, getCurrentKoreanTime, convertLocalTimeToKorean } from '@/lib/timezone'

interface BookingSlot {
  date: string
  time: string
}

function ConfirmPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isClient, setIsClient] = useState(false)

  // URL 파라미터에서 예약 정보 추출
  const slotsParam = searchParams.get('slots')
  const name = searchParams.get('name') || ''
  const email = searchParams.get('email') || ''
  const pricePerSession = parseFloat(searchParams.get('price') || '25')
  
  let selectedSlots: BookingSlot[] = []
  let totalAmount = 0

  try {
    if (slotsParam) {
      selectedSlots = JSON.parse(decodeURIComponent(slotsParam))
      totalAmount = selectedSlots.length * pricePerSession
    }
  } catch (error) {
    console.error('예약 정보 파싱 오류:', error)
  }

  // 클라이언트 사이드 렌더링 확인
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 달력 상태 추가 (클라이언트에서만 초기화)
  const [today, setToday] = useState<Date | null>(null)
  const [calendarYear, setCalendarYear] = useState(0)
  const [calendarMonth, setCalendarMonth] = useState(0)
  const [timezoneInfo, setTimezoneInfo] = useState<{ name: string; offset: string } | null>(null)

  // 클라이언트에서만 날짜 정보 초기화
  useEffect(() => {
    if (isClient) {
      const now = new Date()
      setToday(now)
      setCalendarYear(now.getFullYear())
      setCalendarMonth(now.getMonth())
      setTimezoneInfo(getTimezoneInfo())
    }
  }, [isClient])

  // 예약 정보가 없으면 메인 페이지로 리다이렉트 (훅 선언 이후에 위치)
  if (selectedSlots.length === 0) {
    router.push('/book')
    return null
  }

  const handlePrevMonth = () => { 
    if (calendarMonth === 0) {
      setCalendarYear(calendarYear - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };
  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarYear(calendarYear + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true)
    setMessage('')

    try {
      // 현재 시간 가져오기 (한국 시간 기준)
      const { date: currentDate, time: currentTime } = getCurrentKoreanTime()
      
      // 과거 시간 검증
      for (const { date, time } of selectedSlots) {
        if (date === currentDate && time < currentTime) {
          setMessage('오류: 과거 시간은 예약할 수 없습니다. 다시 선택해주세요.')
          setSubmitting(false)
          return
        }
      }

      // 예약 데이터 준비 (사용자 현지 시간을 한국 시간으로 변환)
      const userTimezone = getUserTimezone()
      const inserts = selectedSlots.map(({ date, time }) => {
        const userLocalTime = `${date} ${time}:00`
        
        // 사용자 현지 시간을 한국 시간으로 변환
        const koreanTime = userTimezone === 'Asia/Seoul' 
          ? userLocalTime 
          : convertLocalTimeToKorean(date, time, userTimezone)
        
        return {
          name,
          email,
          lesson_date: koreanTime, // 한국 시간으로 변환된 시간
          local_time: userLocalTime, // 사용자의 현지 시간
          timezone: userTimezone, // 사용자의 시간대
          duration_minutes: 60,
          payment_status: 'pending',
          is_subscription: false,
          subscription_plan_id: null,
          amount: Math.round(pricePerSession * 100), // 개인별 가격을 센트 단위로 저장
        }
      })

      const { error: insertError } = await supabase.from('bookings').insert(inserts)
      if (insertError) throw insertError

      // 학생 정보 생성/업데이트 (pending 상태로도 기록)
      await updateStudentInfo(name, email, selectedSlots.length, Math.round(pricePerSession * 100) * selectedSlots.length, true)

      setMessage('✅ 예약이 성공적으로 완료되었습니다!')
      
      // 3초 후 메인 페이지로 이동
      setTimeout(() => {
        router.push('/book')
      }, 3000)

    } catch (err: any) {
      setMessage('오류: ' + (err.message || '예약 실패'))
    } finally {
      setSubmitting(false)
    }
  }

  // 학생 정보 생성/업데이트 함수
  async function updateStudentInfo(name: string, email: string, lessonCount: number, totalAmount: number, isPending: boolean = false) {
    try {
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

      const currentDate = new Date().toISOString()

      if (existingStudent) {
        // 기존 학생 정보가 있는 경우 이름만 업데이트 (pending 예약은 통계에 반영하지 않음)
        const updateData: any = {
          name, // 이름이 변경될 수도 있으므로 업데이트
        }

        // 완료된 예약인 경우에만 통계 업데이트
        if (!isPending) {
          updateData.last_lesson_date = currentDate
          updateData.total_lessons = existingStudent.total_lessons + lessonCount
          updateData.total_amount = existingStudent.total_amount + totalAmount
        }

        const { error: updateError } = await supabase
          .from('students')
          .update(updateData)
          .eq('email', email)

        if (updateError) {
          console.error('학생 정보 업데이트 오류:', updateError)
        }
      } else {
        // 새 학생 정보 생성
        const insertData: any = {
          name,
          email,
          total_lessons: isPending ? 0 : lessonCount,
          total_amount: isPending ? 0 : totalAmount,
        }

        if (!isPending) {
          insertData.first_lesson_date = currentDate
          insertData.last_lesson_date = currentDate
        }

        const { error: insertError } = await supabase
          .from('students')
          .insert([insertData])

        if (insertError) {
          console.error('학생 정보 생성 오류:', insertError)
        }
      }
    } catch (error) {
      console.error('학생 정보 처리 오류:', error)
    }
  }

  const handleBack = () => {
    // 기존 정보를 URL 파라미터로 전달하여 뒤로 가기
    const slotsParam = encodeURIComponent(JSON.stringify(selectedSlots))
    const params = new URLSearchParams({
      slots: slotsParam,
      name: name,
      email: email,
      price: pricePerSession.toString()
    })
    
    router.push(`/book?${params.toString()}`)
  }

  // 클라이언트에서만 렌더링
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 tracking-tight">Booking Confirmation</h1>
          <p className="text-gray-600 text-lg">Review your booking details and proceed to payment</p>
          {timezoneInfo && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 inline-block">
              <p className="text-sm text-blue-700">
                🌍 Current Timezone: {timezoneInfo.name} ({timezoneInfo.offset})
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          {/* 예약자 정보 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-6 bg-blue-500 rounded-full mr-3"></span>
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm text-gray-600 mb-1">Name</div>
                <div className="font-semibold text-gray-800">{name}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm text-gray-600 mb-1">Email</div>
                <div className="font-semibold text-gray-800">{email}</div>
              </div>
            </div>
          </div>

          {/* 예약 내역 테이블 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-6 bg-green-500 rounded-full mr-3"></span>
              Booking Details
            </h2>
            
            {/* 선택된 날짜 달력 */}
            {today && (
              <div className="mb-8">
                {/* 현재 월/년 헤더 + 월 이동 버튼 */}
                <div className="flex items-center justify-center gap-4 mb-2">
                  <button onClick={handlePrevMonth} className="text-2xl px-2 py-1 rounded hover:bg-gray-200">&lt;</button>
                  <h3 className="text-lg font-semibold text-gray-700 text-center min-w-[120px]">
                    {calendarYear} {calendarMonth + 1}
                  </h3>
                  <button onClick={handleNextMonth} className="text-2xl px-2 py-1 rounded hover:bg-gray-200">&gt;</button>
                </div>
                <div className="flex justify-center">
                  <div className="grid grid-cols-7 gap-2 w-full max-w-xl">
                    {/* 요일 헤더 */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-base font-bold text-gray-500 py-3">
                        {day}
                      </div>
                    ))}
                    {/* 1일의 요일만큼 앞에 빈칸 */}
                    {(() => {
                      const calendarStart = new Date(calendarYear, calendarMonth, 1);
                      return Array.from({ length: calendarStart.getDay() }).map((_, i) => (
                        <div key={'empty-' + i}></div>
                      ));
                    })()}
                    {/* 이번 달 날짜 */}
                    {(() => {
                      const lastDate = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                      return Array.from({ length: lastDate }).map((_, d) => {
                        const dateObj = new Date(calendarYear, calendarMonth, d + 1);
                        const dateStr = format(dateObj, 'yyyy-MM-dd');
                        const isToday = format(dateObj, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                        const isSelected = selectedSlots.some(slot => slot.date === dateStr);
                        const selectedCount = selectedSlots.filter(slot => slot.date === dateStr).length;
                        const isPastDate = isBefore(parseISO(dateStr), startOfToday());
                        return (
                          <div
                            key={dateStr}
                            className={
                              `relative p-5 text-lg rounded-xl transition-all duration-200 font-semibold text-center ` +
                              (isPastDate 
                                ? 'bg-gray-100 text-gray-300' 
                                : isSelected 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-400'
                              ) +
                              (isToday && !isPastDate ? ' ring-2 ring-red-400' : '')
                            }
                            style={{ minWidth: 48, minHeight: 48 }}
                          >
                            {d + 1}
                            {isSelected && !isPastDate && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                                {selectedCount}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-6 py-4 text-left font-semibold text-gray-800">
                      No.
                    </th>
                    <th className="border border-gray-200 px-6 py-4 text-left font-semibold text-gray-800">
                      Date
                    </th>
                    <th className="border border-gray-200 px-6 py-4 text-left font-semibold text-gray-800">
                      Day
                    </th>
                    <th className="border border-gray-200 px-6 py-4 text-left font-semibold text-gray-800">
                      Time
                    </th>
                    <th className="border border-gray-200 px-6 py-4 text-left font-semibold text-gray-800">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSlots.map((slot, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-6 py-4 text-gray-700">
                        {index + 1}
                      </td>
                      <td className="border border-gray-200 px-6 py-4 text-gray-700">
                        {format(parseISO(slot.date), 'MMM d, yyyy')}
                      </td>
                      <td className="border border-gray-200 px-6 py-4 text-gray-700">
                        {format(parseISO(slot.date), 'E')}
                      </td>
                      <td className="border border-gray-200 px-6 py-4 text-gray-700 font-semibold">
                        {convertKoreanTimeToTimezone(slot.date + 'T' + slot.time + ':00Z', getUserTimezone())}
                      </td>
                      <td className="border border-gray-200 px-6 py-4 text-blue-600 font-semibold">
                        ${pricePerSession.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 총 집계 */}
          <div className="mb-8">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex justify-between items-center text-lg font-semibold mb-2">
                <span className="text-gray-700">Total Bookings:</span>
                <span className="text-blue-600">{selectedSlots.length}</span>
              </div>
              <div className="flex justify-between items-center text-3xl font-bold">
                <span className="text-gray-800">Total Amount:</span>
                <span className="text-blue-600">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 안내사항 */}
          <div className="mb-8 p-6 bg-yellow-50 rounded-xl border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-2 flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              Important Information
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Please double-check your selected date and time</li>
              <li>• Each lesson is 60 minutes long</li>
              <li>• To change your schedule, please contact us on Instagram</li>
              <li>• Cancellations are allowed up to 24 hours before the lesson</li>
            </ul>
          </div>

          {/* 버튼 */}
          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="flex-1 bg-gray-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-600 transition-all duration-200"
            >
              Go Back
            </button>
            <button
              onClick={() => {
                // 예약 정보 직렬화하여 결제 페이지로 이동
                const slotsParam = encodeURIComponent(JSON.stringify(selectedSlots));
                const params = new URLSearchParams({
                  slots: slotsParam,
                  name,
                  email,
                  price: pricePerSession.toString()
                });
                window.location.href = `/book/payment?${params.toString()}`;
              }}
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  예약 중...
                </span>
              ) : (
                `Pay $${totalAmount.toFixed(2)}`
              )}
            </button>
          </div>

          {message && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-green-700 font-semibold">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ConfirmPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmPage />
    </Suspense>
  );
} 