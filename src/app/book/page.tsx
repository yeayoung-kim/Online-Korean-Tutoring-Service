'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { addDays, format, startOfDay, parseISO, isBefore, startOfToday } from 'date-fns'
import { convertUTCToLocal, getUserTimezone, getTimezoneInfo, convertKoreanTimeToTimezone, getCurrentKoreanTime } from '@/lib/timezone'

// 월 단위 달력 데이터 생성
function getCalendarData(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const firstDayOfWeek = firstDay.getDay() // 0=일요일, 1=월요일, ...
  const daysInMonth = lastDay.getDate()

  const calendar: Array<{ date: string; dayOfWeek: number } | null> = []

  // 이전 달의 빈 칸들
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendar.push(null)
  }

  // 현재 달의 날짜들
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    calendar.push({
      date: format(date, 'yyyy-MM-dd'),
      dayOfWeek: date.getDay()
    })
  }

  return calendar
}

function getHourSlots(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const slots: string[] = []
  let cur = sh * 60 + sm
  const endMin = eh * 60 + em
  while (cur + 60 <= endMin) {
    const hour = Math.floor(cur / 60)
    const minute = cur % 60
    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
    cur += 60
  }
  return slots
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function BookPage() {
  const [availableTimes, setAvailableTimes] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pricePerSession, setPricePerSession] = useState('25') // 기본값 25달러
  const [selectedDate, setSelectedDate] = useState(format(startOfToday(), 'yyyy-MM-dd'))
  const [selectedSlots, setSelectedSlots] = useState<{ date: string; time: string; localDate?: string; localTime?: string; userTimezone?: string }[]>([])
  const [formMsg, setFormMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [timezoneInfo, setTimezoneInfo] = useState<{ name: string; offset: string } | null>(null)

  // 달력 상태
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())

  const calendarData = getCalendarData(currentYear, currentMonth)

  // URL 파라미터에서 정보 가져오기 (뒤로가기 시)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const slotsParam = urlParams.get('slots')
    const nameParam = urlParams.get('name')
    const emailParam = urlParams.get('email')
    const priceParam = urlParams.get('price')

    if (slotsParam) {
      try {
        const slots = JSON.parse(decodeURIComponent(slotsParam))
        setSelectedSlots(slots)
      } catch (error) {
        console.error('슬롯 정보 파싱 오류:', error)
      }
    }

    if (nameParam) setName(nameParam)
    if (emailParam) setEmail(emailParam)
    if (priceParam) setPricePerSession(priceParam)
  }, [])

  // 예약된 시간대 계산 (duration 고려)
  const getBookedTimeSlots = (date: string) => {
    const bookedSlots: string[] = []

    bookings
      .filter((b) => b.lesson_date.startsWith(date))
      .forEach((booking) => {
        const startTime = booking.lesson_date.slice(11, 16) // "10:00"
        const duration = booking.duration_minutes || 60 // 기본값 60분
        const [startHour, startMin] = startTime.split(':').map(Number)
        const startMinutes = startHour * 60 + startMin
        const endMinutes = startMinutes + duration

        // duration 시간 동안의 모든 시간대를 blocked으로 표시
        for (let minutes = startMinutes; minutes < endMinutes; minutes += 60) {
          const hour = Math.floor(minutes / 60)
          const min = minutes % 60
          const timeSlot = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
          if (!bookedSlots.includes(timeSlot)) {
            bookedSlots.push(timeSlot)
          }
        }
      })

    return bookedSlots
  }

  // 날짜별 예약 가능 시간대 계산
  const getAvailableSlots = (date: string) => {
    if (!date) return []
    const dayOfWeek = new Date(date).getDay()
    const times = availableTimes.filter((t) => t.day_of_week === dayOfWeek)
    let slotList: string[] = []
    times.forEach((t) => {
      slotList = slotList.concat(getHourSlots(t.start_time, t.end_time))
    })

    // 현재 시간 가져오기 (한국 시간 기준)
    const { date: currentDate, time: currentTime } = getCurrentKoreanTime()
    const nowKST = new Date(`${currentDate}T${currentTime}:00+09:00`)

    // 예약된 시간대 제외 (duration 고려)
    const bookedSlots = getBookedTimeSlots(date)

    return slotList
      .filter(s => {
        // 예약된 시간 제외
        if (bookedSlots.includes(s)) return false
        // 오늘 날짜이고 현재 시간보다 이전인 경우 제외 (Date 객체로 비교)
        const slotDate = new Date(`${date}T${s}:00+09:00`)
        if (slotDate < nowKST) return false
        return true
      })
      .map((s) => ({
        time: s,
        isAvailable: true,
      }))
  }

  // 모든 시간대 (예약 불가능한 시간 포함)
  const getAllSlots = (date: string) => {
    if (!date) return []
    const dayOfWeek = new Date(date).getDay()
    const times = availableTimes.filter((t) => t.day_of_week === dayOfWeek)
    let slotList: string[] = []
    times.forEach((t) => {
      slotList = slotList.concat(getHourSlots(t.start_time, t.end_time))
    })

    // 현재 시간 가져오기 (한국 시간 기준)
    const { date: currentDate, time: currentTime } = getCurrentKoreanTime()
    const nowKST = new Date(`${currentDate}T${currentTime}:00+09:00`)

    // 예약된 시간대 포함 (duration 고려)
    const bookedSlots = getBookedTimeSlots(date)

    return slotList.map((s) => {
      // 오늘 날짜이고 현재 시간보다 이전인 경우 비활성화 (Date 객체로 비교)
      const slotDate = new Date(`${date}T${s}:00+09:00`)
      const isPastTime = slotDate < nowKST
      const isBooked = bookedSlots.includes(s)

      return {
        time: s,
        localTime: convertKoreanTimeToTimezone(date + 'T' + s + ':00Z', getUserTimezone()),
        isAvailable: !isBooked && !isPastTime,
      }
    })
  }

  useEffect(() => {
    // 시간대 정보 설정 (클라이언트에서만)
    setTimezoneInfo(getTimezoneInfo())
  }, [])

  // 달력 월이 변경될 때마다 데이터 다시 가져오기
  useEffect(() => {
    const fetchAll = async () => {
      const { data: timesData } = await supabase
        .from('available_times')
        .select('*')
        .eq('is_available', true)
      setAvailableTimes(timesData || [])

      // 현재 달력 월의 첫날과 마지막날
      const startOfMonth = new Date(currentYear, currentMonth, 1)
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0)

      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('lesson_date, duration_minutes')
        .gte('lesson_date', format(startOfMonth, 'yyyy-MM-dd') + 'T00:00:00Z')
        .lte('lesson_date', format(endOfMonth, 'yyyy-MM-dd') + 'T23:59:59Z')
      setBookings(bookingsData || [])
    }
    fetchAll()
  }, [currentYear, currentMonth])

  // 시간대 선택/해제 토글
  const toggleTimeSlot = (date: string, time: string, localTime: string) => {
    // 과거 시간 체크 (Date 객체로 비교)
    const { date: currentDate, time: currentTime } = getCurrentKoreanTime()
    const nowKST = new Date(`${currentDate}T${currentTime}:00+09:00`)
    const slotDate = new Date(`${date}T${time}:00+09:00`)
    if (slotDate < nowKST) {
      return // 과거 시간은 선택 불가
    }

    const slotKey = `${date} ${time}`
    const isSelected = selectedSlots.some(s => `${s.date} ${s.time}` === slotKey)

    if (isSelected) {
      // 해제
      setSelectedSlots(selectedSlots.filter(s => `${s.date} ${s.time}` !== slotKey))
    } else {
      // 선택 - 한국 시간과 현지 시간 모두 저장
      const userTimezone = getUserTimezone()

      // 한국 시간을 사용자 현지 시간으로 변환
      const koreanDateTime = new Date(`${date}T${time}:00+09:00`)
      const userDateTime = new Date(koreanDateTime.toLocaleString('en-US', { timeZone: userTimezone }))
      
      // 사용자 현지 날짜와 시간 추출
      const localDate = format(userDateTime, 'yyyy-MM-dd')
      const localTimeFormatted = format(userDateTime, 'HH:mm')

      setSelectedSlots([...selectedSlots, {
        date, // 한국 날짜 (항상 한국 시간대 기준)
        time, // 한국 시간 (항상 한국 시간대 기준)
        localDate, // 사용자 현지 날짜
        localTime: localTimeFormatted, // 사용자 현지 시간
        userTimezone // 사용자 시간대
      }])
    }
  }

  // 선택된 슬롯 삭제
  const removeSelectedSlot = (date: string, time: string) => {
    setSelectedSlots(selectedSlots.filter(s => !(s.date === date && s.time === time)))
  }

  // 예약 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormMsg('')

    try {
      if (!name || !email) {
        setFormMsg('Please enter your name and email.')
        return
      }
      if (selectedSlots.length === 0) {
        setFormMsg('Please select a time slot.')
        return
      }

      // 과거 시간 체크 (Date 객체로 비교)
      const { date: currentDate, time: currentTime } = getCurrentKoreanTime()
      const nowKST = new Date(`${currentDate}T${currentTime}:00+09:00`)
      for (const slot of selectedSlots) {
        const slotDate = new Date(`${slot.date}T${slot.time}:00+09:00`)
        if (slotDate < nowKST) {
          setFormMsg('오류: 과거 시간은 예약할 수 없습니다. 다시 선택해주세요.')
          return
        }
      }

      // 중복 체크 (duration 고려)
      for (const slot of selectedSlots) {
        const bookedSlots = getBookedTimeSlots(slot.date)
        if (bookedSlots.includes(slot.time)) {
          setFormMsg(`${slot.date} ${slot.time} is already booked.`)
          return
        }
      }

      // 확인 페이지로 이동
      const slotsParam = encodeURIComponent(JSON.stringify(selectedSlots))
      const params = new URLSearchParams({
        slots: slotsParam,
        name: name,
        email: email,
        price: pricePerSession
      })

      window.location.href = `/book/confirm?${params.toString()}`
    } catch (err: any) {
      setFormMsg('Error: ' + (err.message || 'Booking failed'))
    }
  }

  // 총 금액 계산 (개인별 가격 적용)
  const totalAmount = selectedSlots.length * parseFloat(pricePerSession || '0')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 tracking-tight">Book Your Lesson</h1>
          <p className="text-gray-600 text-lg">Select your preferred date and time</p>
          {timezoneInfo && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 inline-block">
              <p className="text-sm text-blue-700">
                🌍 Current Timezone: {timezoneInfo.name} ({timezoneInfo.offset})
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* 왼쪽: 달력 */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 min-h-[600px] flex flex-col">
              <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                <span className="w-2 h-6 bg-blue-500 rounded-full mr-3"></span>
                Select Date
              </h2>

              {/* 월 네비게이션 */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentYear(currentYear - 1)
                      setCurrentMonth(11)
                    } else {
                      setCurrentMonth(currentMonth - 1)
                    }
                  }}
                  disabled={
                    currentYear < new Date().getFullYear() ||
                    (currentYear === new Date().getFullYear() && currentMonth <= new Date().getMonth())
                  }
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                <h3 className="text-lg font-semibold text-gray-800">
                  {new Date(currentYear, currentMonth).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </h3>
                <button
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentYear(currentYear + 1)
                      setCurrentMonth(0)
                    } else {
                      setCurrentMonth(currentMonth + 1)
                    }
                  }}
                  disabled={
                    currentYear > new Date().getFullYear() + 1 ||
                    (currentYear === new Date().getFullYear() + 1 && currentMonth >= new Date().getMonth())
                  }
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-1 mb-3">
                {WEEKDAYS.map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* 달력 그리드 */}
              <div className="grid grid-cols-7 gap-1">
                {calendarData.map((day, idx) => {
                  if (!day) {
                    return <div key={idx} className="p-3"></div> // 빈 칸
                  }

                  const isSelected = selectedDate === day.date
                  const hasSelectedSlots = selectedSlots.some(s => s.date === day.date)
                  const availableSlots = getAvailableSlots(day.date)
                  const hasAvailableSlots = availableSlots.length > 0
                  const isPastDate = isBefore(parseISO(day.date), startOfToday())

                  return (
                    <button
                      key={idx}
                      onClick={() => !isPastDate && setSelectedDate(day.date)}
                      disabled={isPastDate || !hasAvailableSlots}
                      className={`
                        relative p-3 text-sm rounded-lg transition-all duration-200 font-medium
                        ${isPastDate
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          : isSelected
                            ? 'bg-blue-600 text-white shadow-md'
                            : hasSelectedSlots
                              ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                              : hasAvailableSlots
                                ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      {parseISO(day.date).getDate()}
                      {hasSelectedSlots && !isSelected && !isPastDate && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* 선택된 날짜 정보 */}
              {selectedDate && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-bold text-gray-800 mb-2">
                    {format(parseISO(selectedDate), 'M월 d일 (E)')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Available slots: {getAvailableSlots(selectedDate).length}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 중앙: 시간대 선택 */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 min-h-[600px] flex flex-col">
              <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                <span className="w-2 h-6 bg-green-500 rounded-full mr-3"></span>
                Select Time
              </h2>

              {selectedDate ? (
                <div className="flex-grow">
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      {format(parseISO(selectedDate), 'M월 d일 (E)')}
                    </h3>
                    <p className="text-sm text-gray-600">Click to select a time</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {getAllSlots(selectedDate).map((slot) => {
                      const isSelected = selectedSlots.some(s => s.date === selectedDate && s.time === slot.time)
                      return (
                        <button
                          key={slot.time}
                          onClick={() => slot.isAvailable && toggleTimeSlot(selectedDate, slot.time, slot.localTime)}
                          disabled={!slot.isAvailable}
                          className={`
                            py-4 px-3 rounded-lg text-sm font-medium transition-all duration-200
                            ${!slot.isAvailable
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : isSelected
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                            }
                          `}
                        >
                          {slot.localTime}
                        </button>
                      )
                    })}
                  </div>

                  {getAllSlots(selectedDate).length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📅</span>
                      </div>
                      <p className="text-gray-500 font-medium">No available time slots</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-grow text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📅</span>
                  </div>
                  <p className="text-gray-500 font-medium">Please select a date</p>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 예약 내역 및 결제 */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 min-h-[600px] flex flex-col">
              <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                <span className="w-2 h-6 bg-purple-500 rounded-full mr-3"></span>
                Booking Summary
              </h2>

              {/* 선택된 슬롯 리스트 */}
              <div className="mb-6 flex-grow">
                {selectedSlots.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📝</span>
                    </div>
                    <p className="text-gray-500 font-medium">No bookings selected</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedSlots.map((slot, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div>
                          <span className="font-bold text-gray-800">
                            {format(parseISO(slot.date), 'M월 d일 (E)')}
                          </span>
                          <span className="ml-2 text-lg font-bold text-blue-600">
                            {convertKoreanTimeToTimezone(slot.date + 'T' + slot.time + ':00Z', getUserTimezone())}
                          </span>
                        </div>
                        <button
                          onClick={() => removeSelectedSlot(slot.date, slot.time)}
                          className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-all"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 총 집계 */}
              {selectedSlots.length > 0 && (
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-center text-sm font-semibold mb-1">
                      <span className="text-gray-600">Per Lesson:</span>
                      <span className="text-blue-600">${parseFloat(pricePerSession || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-semibold mb-2">
                      <span className="text-gray-700">Total Bookings:</span>
                      <span className="text-blue-600">{selectedSlots.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-2xl font-bold">
                      <span className="text-gray-800">Total Amount:</span>
                      <span className="text-blue-600">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 이름/이메일/가격 입력 */}
              <form onSubmit={handleSubmit} className="space-y-4 mt-auto">
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold mb-2 text-gray-800">Name</label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all text-gray-900"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2 text-gray-800">Email</label>
                    <input
                      type="email"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all text-gray-900"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2 text-gray-800">
                      Lesson Price (per hour)
                      <span className="text-sm font-normal text-gray-500 ml-2">Enter in USD</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        className="w-full border border-gray-200 rounded-lg pl-8 pr-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all text-gray-900"
                        value={pricePerSession}
                        onChange={(e) => setPricePerSession(e.target.value)}
                        placeholder="25"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Set your custom price per lesson
                    </p>
                  </div>
                </div>

                {/* 예약 확인 버튼 */}
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  disabled={selectedSlots.length === 0}
                >
                  Review Booking
                </button>
              </form>

              {formMsg && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                  <p className="text-green-700 font-semibold">{formMsg}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 