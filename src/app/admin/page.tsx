'use client'

import { useState, useEffect } from 'react'
import { formatInTimeZone } from 'date-fns-tz'

interface Booking {
  id: string
  name: string
  email: string
  phone: string | null
  lesson_date: string
  duration_minutes: number
  lesson_type: string
  payment_status: 'pending' | 'completed' | 'failed'
  amount: number
  created_at: string
  is_subscription: boolean
  subscription_plan_id: string | null
  stripe_payment_intent_id: string | null
  paypal_order_id: string | null
  paid_at: string | null
}

interface Stats {
  totalBookings: number
  completedPayments: number
  totalRevenue: number
  restBreaks: number
}

interface BookingData {
  bookings: Booking[]
  stats: Stats
  dateRange: {
    start: string
    end: string
  }
}

export default function AdminPage() {
  const [data, setData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    fetchBookings()
  }, [])

  // 현재 시간 실시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const fetchBookings = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      
      const response = await fetch(`/api/admin/bookings?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || '데이터를 불러오는 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setError('서버 연결 오류가 발생했습니다.')
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      // 서버에 저장된 한국 시간을 그대로 사용 (시간대 변환 없음)
      const date = dateString.split('T')[0] // "2024-01-15"
      const [year, month, day] = date.split('-')
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      
      return dateObj.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short'
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (dateString: string) => {
    try {
      // 서버에 저장된 한국 시간을 그대로 사용 (시간대 변환 없음)
      const timePart = dateString.split('T')[1] // "10:00:00Z" 또는 "10:00:00.000Z"
      const time = timePart.split('.')[0].split('Z')[0] // "10:00:00"
      const [hours, minutes] = time.split(':')
      
      return `${hours}:${minutes}`
    } catch {
      return dateString
    }
  }

  const formatAmount = (amount: number) => {
    return (amount / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    })
  }

  const isRestBreak = (booking: Booking) => {
    return booking.name === '김예영'
  }

  // 연속된 휴식시간을 그룹화하는 함수
  const groupConsecutiveRestBreaks = (bookings: Booking[]) => {
    const restBreaks = bookings.filter(isRestBreak).sort((a, b) => 
      new Date(a.lesson_date).getTime() - new Date(b.lesson_date).getTime()
    )
    
    const nonRestBookings = bookings.filter(b => !isRestBreak(b))
    
    if (restBreaks.length === 0) {
      return nonRestBookings
    }
    
    const groupedRestBreaks = []
    let currentGroup = [restBreaks[0]]
    
    for (let i = 1; i < restBreaks.length; i++) {
      const currentBreak = restBreaks[i]
      const lastBreakInGroup = currentGroup[currentGroup.length - 1]
      
      // 이전 휴식시간의 종료시간과 현재 휴식시간의 시작시간 비교
      const lastBreakEnd = new Date(lastBreakInGroup.lesson_date)
      lastBreakEnd.setMinutes(lastBreakEnd.getMinutes() + lastBreakInGroup.duration_minutes)
      
      const currentBreakStart = new Date(currentBreak.lesson_date)
      
      // 연속된 시간인지 확인 (5분 이내 차이는 연속으로 간주)
      const timeDiff = Math.abs(currentBreakStart.getTime() - lastBreakEnd.getTime())
      const isConsecutive = timeDiff <= 5 * 60 * 1000 // 5분
      
      if (isConsecutive) {
        currentGroup.push(currentBreak)
      } else {
        // 현재 그룹을 완료하고 새 그룹 시작
        if (currentGroup.length > 1) {
          // 그룹화된 휴식시간 생성
          const groupedBreak = {
            ...currentGroup[0],
            id: `rest-group-${currentGroup[0].id}`,
            isRestGroup: true,
            originalBreaks: currentGroup,
            totalDuration: currentGroup.reduce((sum, b) => sum + b.duration_minutes, 0)
          }
          groupedRestBreaks.push(groupedBreak)
        } else {
          // 단독 휴식시간
          groupedRestBreaks.push({
            ...currentGroup[0],
            isRestGroup: false,
            totalDuration: currentGroup[0].duration_minutes
          })
        }
        currentGroup = [currentBreak]
      }
    }
    
    // 마지막 그룹 처리
    if (currentGroup.length > 1) {
      const groupedBreak = {
        ...currentGroup[0],
        id: `rest-group-${currentGroup[0].id}`,
        isRestGroup: true,
        originalBreaks: currentGroup,
        totalDuration: currentGroup.reduce((sum, b) => sum + b.duration_minutes, 0)
      }
      groupedRestBreaks.push(groupedBreak)
    } else {
      groupedRestBreaks.push({
        ...currentGroup[0],
        isRestGroup: false,
        totalDuration: currentGroup[0].duration_minutes
      })
    }
    
    // 일반 예약과 그룹화된 휴식시간을 합쳐서 시간순으로 정렬
    return [...nonRestBookings, ...groupedRestBreaks].sort((a, b) => 
      new Date(a.lesson_date).getTime() - new Date(b.lesson_date).getTime()
    )
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '결제완료'
      case 'pending':
        return '결제대기'
      case 'failed':
        return '결제실패'
      default:
        return status
    }
  }

  // 날짜별로 그룹핑하고 연속된 휴식시간 그룹화
  const groupedBookings = data?.bookings.reduce((groups, booking) => {
    const date = formatDate(booking.lesson_date)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(booking)
    return groups
  }, {} as Record<string, Booking[]>) || {}

  // 각 날짜별로 연속된 휴식시간 그룹화 적용
  const processedGroupedBookings = Object.keys(groupedBookings).reduce((processed, date) => {
    processed[date] = groupConsecutiveRestBreaks(groupedBookings[date])
    return processed
  }, {} as Record<string, any[]>)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
  }

  const handleDateFilter = () => {
    if (selectedDate) {
      const startDate = new Date(selectedDate)
      const endDate = new Date(selectedDate)
      endDate.setDate(endDate.getDate() + 14) // 2주 후까지
      
      fetchBookings(startDate.toISOString(), endDate.toISOString())
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">데이터를 불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">🏫 관리자 대시보드</h1>
              <p className="text-gray-600">한국어 튜터링 예약 관리 시스템</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {currentTime.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </div>
              <div className="text-lg font-semibold text-blue-600">
                {currentTime.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                })}
              </div>
              <div className="text-xs text-gray-400">
                현재 시간 (로컬)
              </div>
            </div>
          </div>
          
          {/* 날짜 필터 */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">📅 날짜 필터</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  시작 날짜:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDateFilter}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm font-medium"
                >
                  📊 필터 적용
                </button>
                <button
                  onClick={() => {
                    setSelectedDate('')
                    fetchBookings()
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors text-sm font-medium"
                >
                  🔄 전체 보기
                </button>
              </div>
            </div>
          </div>

                    {/* 통계 */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-lg border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-800 mb-1">📊 총 예약 수</h3>
                    <p className="text-3xl font-bold text-blue-600">{data.stats.totalBookings}</p>
                  </div>
                  <div className="text-blue-400 opacity-50">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 00-1 1v1H4V5zM3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm6 7a1 1 0 100-2 1 1 0 000 2z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 rounded-lg border-l-4 border-green-500 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-green-800 mb-1">✅ 결제 완료</h3>
                    <p className="text-3xl font-bold text-green-600">{data.stats.completedPayments}</p>
                  </div>
                  <div className="text-green-400 opacity-50">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-5 rounded-lg border-l-4 border-orange-500 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-orange-800 mb-1">😴 휴식시간</h3>
                    <p className="text-3xl font-bold text-orange-600">{data.stats.restBreaks}</p>
                  </div>
                  <div className="text-orange-400 opacity-50">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-4a1 1 0 100-2 1 1 0 000 2zm0-3a1 1 0 100-2 1 1 0 000 2zm1-7a1 1 0 00-1 1v3a1 1 0 102 0V5a1 1 0 00-1-1z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-5 rounded-lg border-l-4 border-purple-500 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-purple-800 mb-1">💰 총 수익</h3>
                    <p className="text-3xl font-bold text-purple-600">{formatAmount(data.stats.totalRevenue)}</p>
                  </div>
                  <div className="text-purple-400 opacity-50">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-6-8a6 6 0 1112 0 6 6 0 01-12 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 예약 목록 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              📝 예약 목록
              {data && (
                <span className="text-sm font-normal text-gray-500">
                  (총 {data.stats.totalBookings}건)
                </span>
              )}
            </h2>
            <div className="text-xs text-gray-500">
              📅 기본 2주치 예약을 표시합니다
            </div>
          </div>
          
          {Object.keys(processedGroupedBookings).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              해당 기간에 예약이 없습니다.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(processedGroupedBookings).map(([date, bookings]) => (
                <div key={date} className="border-l-4 border-blue-500 pl-4 bg-gradient-to-r from-blue-50 to-transparent rounded-r-lg py-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full">
                      {bookings.length}
                    </span>
                    {date}
                  </h3>
                  <div className="space-y-3">
                    {bookings.map((booking) => {
                      const isRest = isRestBreak(booking)
                      const isGrouped = booking.isRestGroup
                      
                      // 그룹화된 휴식시간의 경우 시작시간과 종료시간 계산
                      let displayTime = formatTime(booking.lesson_date)
                      let displayDuration = booking.duration_minutes
                      let timeRange = displayTime
                      
                      if (isRest && isGrouped && booking.originalBreaks) {
                        const firstBreak = booking.originalBreaks[0]
                        const lastBreak = booking.originalBreaks[booking.originalBreaks.length - 1]
                        const startTime = formatTime(firstBreak.lesson_date)
                        
                        // 종료시간 계산 (시간대 변환 없이 단순 계산)
                        const lastBreakTime = formatTime(lastBreak.lesson_date)
                        const [lastHour, lastMinute] = lastBreakTime.split(':').map(Number)
                        const totalMinutes = lastHour * 60 + lastMinute + lastBreak.duration_minutes
                        const endHour = Math.floor(totalMinutes / 60)
                        const endMinute = totalMinutes % 60
                        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
                        
                        displayTime = `${startTime} - ${endTime}`
                        timeRange = displayTime
                        displayDuration = booking.totalDuration
                      } else if (!isRest) {
                        // 일반 예약의 경우 종료시간도 계산 (시간대 변환 없이 단순 계산)
                        const [startHour, startMinute] = displayTime.split(':').map(Number)
                        const totalMinutes = startHour * 60 + startMinute + booking.duration_minutes
                        const endHour = Math.floor(totalMinutes / 60)
                        const endMinute = totalMinutes % 60
                        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
                        timeRange = `${displayTime} - ${endTime}`
                      }
                      
                      return (
                        <div
                          key={booking.id}
                          className={`rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
                            isRest 
                              ? 'bg-orange-50 hover:bg-orange-100 border-l-4 border-orange-400' 
                              : 'bg-white hover:bg-blue-50 border-l-4 border-blue-400'
                          }`}
                        >
                          <div className="flex">
                            {/* 시간 섹션 */}
                            <div className={`flex-shrink-0 w-32 sm:w-40 p-4 flex flex-col items-center justify-center text-center ${
                              isRest 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              <div className="text-2xl sm:text-3xl font-bold leading-none">
                                {isRest && isGrouped ? (
                                  <div className="text-lg font-semibold">
                                    {displayTime}
                                  </div>
                                ) : (
                                  <div>
                                    {displayTime}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs sm:text-sm mt-1 opacity-75">
                                {displayDuration}분
                                {isRest && isGrouped && (
                                  <div className="text-xs">
                                    ({booking.originalBreaks.length}개)
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* 내용 섹션 */}
                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  {/* 학생/휴식 정보 */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-3 h-3 rounded-full ${isRest ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                                    <h4 className={`text-xl font-semibold ${isRest ? 'text-orange-800' : 'text-gray-800'}`}>
                                      {isRest ? (isGrouped ? '휴식' : '😴 휴식시간') : booking.name}
                                    </h4>
                                  </div>
                                  
                                  {/* 상세 정보 */}
                                  <div className="space-y-1">
                                    {!isRest && (
                                      <div className="text-sm text-gray-600">
                                        📧 {booking.email}
                                      </div>
                                    )}
                                    {!isRest && booking.phone && (
                                      <div className="text-sm text-gray-600">
                                        📞 {booking.phone}
                                      </div>
                                    )}

                                    {!isRest && (
                                      <div className="text-sm text-gray-600">
                                        💰 {formatAmount(booking.amount)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* 상태 뱃지 */}
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center gap-2">
                                    {isRest ? (
                                      <span className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-medium">
                                        {isGrouped ? '🛌 휴식' : '🛌 휴식'}
                                      </span>
                                                                    ) : (
                                  <>
                                    {booking.is_subscription && (
                                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                        정기구독
                                      </span>
                                    )}
                                  </>
                                )}
                                  </div>
                                  <div className="text-xs text-gray-500 text-right">
                                    {timeRange}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 