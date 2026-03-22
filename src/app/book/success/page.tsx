'use client'
export const dynamic = "force-dynamic";

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { format, parseISO } from 'date-fns'
import { convertUTCToLocal, getTimezoneInfo, convertKoreanTimeToTimezone, getUserTimezone } from '@/lib/timezone'

function SuccessPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [timezoneInfo, setTimezoneInfo] = useState<{ name: string; offset: string } | null>(null)
  
  // URL 파라미터에서 정보 추출
  const name = searchParams.get('name') || ''
  const email = searchParams.get('email') || ''
  const slotsParam = searchParams.get('slots')
  const totalAmount = searchParams.get('totalAmount') || '0'
  
  let selectedSlots: any[] = []
  
  try {
    if (slotsParam) {
      selectedSlots = JSON.parse(decodeURIComponent(slotsParam))
    }
  } catch (error) {
    console.error('예약 정보 파싱 오류:', error)
  }

  // 뒤로가기 방지 및 히스토리 초기화
  useEffect(() => {
    // 시간대 정보 설정
    setTimezoneInfo(getTimezoneInfo())
    
    // 현재 페이지를 히스토리에 추가
    window.history.pushState(null, '', window.location.href)
    
    // 뒤로가기 이벤트 감지
    const handlePopState = (event: PopStateEvent) => {
      // 뒤로가기 시 메인 페이지로 리다이렉트
      router.replace('/')
    }
    
    // 이벤트 리스너 추가
    window.addEventListener('popstate', handlePopState)
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [router])



  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">

      <div className="relative z-20">
        <div className="max-w-4xl mx-auto py-16 px-4">
          {/* 성공 아이콘 */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl">
              <svg className="w-12 h-12 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4 tracking-tight animate-pulse">
              Payment Successful!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your booking has been completed!
            </p>
            {timezoneInfo && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 inline-block">
                <p className="text-sm text-blue-700">
                  🌍 Current Timezone: {timezoneInfo.name} ({timezoneInfo.offset})
                </p>
              </div>
            )}
          </div>

          {/* 축하 메시지 */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-gray-100">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Congratulations, {name}! 🎊
              </h2>
              <p className="text-lg text-gray-600">
                Your Korean lesson booking has been successfully completed.
              </p>
            </div>

            {/* 예약 정보 요약 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="w-2 h-6 bg-blue-500 rounded-full mr-3"></span>
                Booking Summary
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-semibold text-gray-800">{name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold text-gray-800">{email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Bookings:</span>
                  <span className="font-semibold text-blue-600">{selectedSlots.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-2xl text-green-600">${parseFloat(totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* 예약된 수업 목록 */}
            {selectedSlots.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className="w-2 h-6 bg-green-500 rounded-full mr-3"></span>
                  Booked Lessons
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedSlots.map((slot, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <span className="font-bold text-gray-800">
                            {format(parseISO(slot.date), 'M월 d일 (E)')}
                          </span>
                          <span className="ml-2 text-lg font-bold text-blue-600">
                            {convertKoreanTimeToTimezone(slot.date + 'T' + slot.time + ':00Z', getUserTimezone())}
                          </span>
                        </div>
                      </div>
                      <div className="text-green-600 font-semibold">
                        ✓ Confirmed
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 안내사항 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center mb-3">
                <h3 className="font-bold text-gray-800 text-lg">Lesson Information</h3>
              </div>
              <div className="pl">
                <p className="text-gray-700 font-medium">Zoom link will be sent to your email one day before the lesson</p>
                <p className="text-sm text-gray-500 mt-1">Please join at the scheduled time</p>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="text-center">
            <button
              onClick={handleGoHome}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🏠 Return to Home
            </button>
          </div>

          {/* 추가 축하 메시지 */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              Congratulations on starting your Korean learning journey! 🎓
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  )
} 