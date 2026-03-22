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

export default function TimezoneTestPage() {
  const [selectedSlots, setSelectedSlots] = useState<TestSlot[]>([])
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

  const testBooking = async () => {
    if (selectedSlots.length === 0) {
      alert('테스트할 시간 슬롯을 선택해주세요.')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/timezone-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slots: selectedSlots,
          userTimezone: getUserTimezone()
        }),
      })

      const result = await response.json()
      setTestResults([...testResults, {
        timestamp: new Date().toISOString(),
        userTimezone: getUserTimezone(),
        slots: selectedSlots,
        result
      }])

      setSelectedSlots([])
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
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">시간대 변환 테스트</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">현재 설정</h2>
        <p><strong>현재 시간대:</strong> {currentTimezone}</p>
        <p><strong>현재 시간:</strong> {new Date().toLocaleString()}</p>
        <p className="text-sm text-gray-600 mt-2">
          Chrome 개발자 도구 → Console → Settings → Sensors → Location → Custom → 시간대 변경 후 페이지 새로고침
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시간 선택 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">한국 시간 선택 (8시-22시)</h2>
          
          {testDates.map(date => (
            <div key={date} className="mb-4">
              <h3 className="font-medium mb-2">{date}</h3>
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
            onClick={testBooking}
            disabled={isLoading || selectedSlots.length === 0}
            className="w-full mt-4 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {isLoading ? '테스트 중...' : '예약 테스트 실행'}
          </button>
        </div>

        {/* 결과 표시 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">테스트 결과</h2>
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
                    {result.slots.map((slot: TestSlot, slotIndex: number) => (
                      <div key={slotIndex} className="text-sm">
                        <div className="font-medium">슬롯 {slotIndex + 1}:</div>
                        <div className="ml-2">
                          <div><strong>입력:</strong> 한국 {slot.date} {slot.time} → 현지 {slot.localDate} {slot.localTime}</div>
                          {result.result.savedData && result.result.savedData[slotIndex] && (
                            <div className="mt-1 p-2 bg-blue-50 rounded">
                              <div><strong>저장된 데이터:</strong></div>
                              <div><strong>lesson_date:</strong> {result.result.savedData[slotIndex].lesson_date}</div>
                              <div><strong>local_time:</strong> {result.result.savedData[slotIndex].local_time}</div>
                              <div><strong>timezone:</strong> {result.result.savedData[slotIndex].timezone}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {result.result.error && (
                    <div className="mt-2 p-2 bg-red-50 text-red-700 rounded">
                      오류: {result.result.error}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}