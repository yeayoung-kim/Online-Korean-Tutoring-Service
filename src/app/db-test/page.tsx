'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { getUserTimezone } from '@/lib/timezone'

interface TestSlot {
  date: string
  time: string
  localDate: string
  localTime: string
  userTimezone: string
}

interface SavedBooking {
  lesson_date: string
  local_time: string
  timezone: string
  name: string
  email: string
  created_at: string
}

export default function DBTestPage() {
  const [selectedSlots, setSelectedSlots] = useState<TestSlot[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [testResults, setTestResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 테스트용 한국 시간 슬롯들 (8시-22시)
  const koreanTimeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
  ]

  // 테스트용 날짜들
  const testDates = [
    '2025-07-24', '2025-07-25', '2025-07-26'
  ]

  const toggleTimeSlot = (date: string, time: string) => {
    const slotKey = `${date} ${time}`
    const isSelected = selectedSlots.some(s => `${s.date} ${s.time}` === slotKey)

    if (isSelected) {
      setSelectedSlots(selectedSlots.filter(s => `${s.date} ${s.time}` !== slotKey))
    } else {
      const userTimezone = getUserTimezone()

      // 한국 시간을 사용자 현지 시간으로 변환
      const koreanDateTime = new Date(`${date}T${time}:00+09:00`)
      const userDateTime = new Date(koreanDateTime.toLocaleString('en-US', { timeZone: userTimezone }))
      
      const localDate = format(userDateTime, 'yyyy-MM-dd')
      const localTimeFormatted = format(userDateTime, 'HH:mm')

      setSelectedSlots([...selectedSlots, {
        date,
        time,
        localDate,
        localTime: localTimeFormatted,
        userTimezone
      }])
    }
  }

  const testRealBooking = async () => {
    if (!name || !email) {
      alert('이름과 이메일을 입력해주세요.')
      return
    }

    if (selectedSlots.length === 0) {
      alert('테스트할 시간 슬롯을 선택해주세요.')
      return
    }

    setIsLoading(true)
    
    try {
      // 실제 complete-booking API 호출
      const response = await fetch('/api/complete-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          slots: selectedSlots,
          pricePerSession: 1, // 테스트용으로 1원
          paypalOrderId: 'TEST_ORDER_' + Date.now(),
          paypalPayerId: 'TEST_PAYER_' + Date.now(),
          paypalPaymentId: 'TEST_PAYMENT_' + Date.now(),
          userTimezone: getUserTimezone()
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        // DB에서 방금 저장된 데이터 조회
        const verifyResponse = await fetch('/api/db-test-verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            slots: selectedSlots
          }),
        })

        const verifyResult = await verifyResponse.json()

        setTestResults([...testResults, {
          timestamp: new Date().toISOString(),
          userTimezone: getUserTimezone(),
          inputSlots: selectedSlots,
          saveResult: result,
          savedBookings: verifyResult.bookings || [],
          verification: verifyResult.verification || []
        }])

        setSelectedSlots([])
        alert('DB에 실제로 저장되었습니다!')
      } else {
        alert('저장 실패: ' + result.error)
      }

    } catch (error) {
      console.error('테스트 오류:', error)
      alert('테스트 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  const currentTimezone = getUserTimezone()

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">실제 DB 저장 테스트</h1>
      
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2 text-red-800">⚠️ 주의사항</h2>
        <p className="text-red-700">이 페이지는 실제 DB에 데이터를 저장합니다. 테스트용으로만 사용하세요!</p>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">현재 설정</h2>
        <p><strong>현재 시간대:</strong> {currentTimezone}</p>
        <p><strong>현재 시간:</strong> {new Date().toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 입력 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">예약 정보 입력</h2>
          
          {/* 이름과 이메일 입력 */}
          <div className="mb-4 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="테스트용 이름 입력"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="test@example.com"
              />
            </div>
          </div>

          {/* 시간 선택 */}
          <h3 className="text-lg font-medium mb-3">한국 시간 선택 (8시-22시)</h3>
          
          {testDates.map(date => (
            <div key={date} className="mb-4">
              <h4 className="font-medium mb-2">{date}</h4>
              <div className="grid grid-cols-4 gap-2">
                {koreanTimeSlots.map(time => {
                  const isSelected = selectedSlots.some(s => s.date === date && s.time === time)
                  const koreanDateTime = new Date(`${date}T${time}:00+09:00`)
                  const userDateTime = new Date(koreanDateTime.toLocaleString('en-US', { timeZone: currentTimezone }))
                  const localTimeStr = format(userDateTime, 'HH:mm')
                  
                  return (
                    <button
                      key={time}
                      onClick={() => toggleTimeSlot(date, time)}
                      className={`p-2 text-sm rounded border ${
                        isSelected 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'bg-gray-50 hover:bg-gray-100 border-gray-300'
                      }`}
                    >
                      <div>{time}</div>
                      <div className="text-xs text-gray-500">
                        ({localTimeStr})
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {selectedSlots.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">선택된 슬롯:</h4>
              {selectedSlots.map((slot, index) => (
                <div key={index} className="text-sm mb-1">
                  <strong>한국:</strong> {slot.date} {slot.time} → 
                  <strong> 현지:</strong> {slot.localDate} {slot.localTime}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={testRealBooking}
            disabled={isLoading || selectedSlots.length === 0 || !name || !email}
            className="w-full mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:bg-gray-400"
          >
            {isLoading ? '실제 DB에 저장 중...' : '실제 DB에 저장하기'}
          </button>
        </div>

        {/* 결과 표시 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">DB 저장 결과</h2>
            <button
              onClick={clearResults}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              결과 지우기
            </button>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">아직 테스트 결과가 없습니다.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="p-3 border rounded bg-gray-50">
                  <div className="text-xs text-gray-500 mb-2">
                    {new Date(result.timestamp).toLocaleString()} ({result.userTimezone})
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">입력한 슬롯:</div>
                    {result.inputSlots.map((slot: TestSlot, slotIndex: number) => (
                      <div key={slotIndex} className="text-sm ml-2">
                        한국 {slot.date} {slot.time} → 현지 {slot.localDate} {slot.localTime}
                      </div>
                    ))}

                    <div className="text-sm font-medium mt-3">DB에 실제 저장된 데이터:</div>
                    {result.savedBookings.map((booking: SavedBooking, bookingIndex: number) => (
                      <div key={bookingIndex} className="ml-2 p-2 bg-green-50 rounded">
                        <div className="text-xs">
                          <div><strong>lesson_date:</strong> {booking.lesson_date}</div>
                          <div><strong>local_time:</strong> {booking.local_time}</div>
                          <div><strong>timezone:</strong> {booking.timezone}</div>
                          <div><strong>name:</strong> {booking.name}</div>
                          <div><strong>email:</strong> {booking.email}</div>
                        </div>
                      </div>
                    ))}

                    {result.verification && result.verification.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm font-medium">검증 결과:</div>
                        {result.verification.map((verify: any, verifyIndex: number) => (
                          <div key={verifyIndex} className="ml-2 text-xs">
                            슬롯 {verifyIndex + 1}: 
                            <span className={verify.correct ? 'text-green-600' : 'text-red-600'}>
                              {verify.correct ? ' ✅ 정확' : ' ❌ 오류'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}