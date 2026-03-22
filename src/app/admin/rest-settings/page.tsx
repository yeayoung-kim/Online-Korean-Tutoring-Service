'use client'

import { useState, useEffect, useRef } from 'react'

interface RestBreak {
  id: string
  lesson_date: string
  duration_minutes: number
}

interface Lesson {
  id: string
  name: string
  lesson_date: string
  duration_minutes: number
}

interface AvailableTime {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface ScheduleData {
  date: string
  availableTimes: AvailableTime[]
  restBreaks: RestBreak[]
  restBreakGroups: RestBreak[][]
  lessons: Lesson[]
  dayOfWeek: number
}

export default function RestSettingsPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragEnd, setDragEnd] = useState<number | null>(null)
  const [selectedRange, setSelectedRange] = useState<{start: number, end: number} | null>(null)
  
  const timeTableRef = useRef<HTMLDivElement>(null)

  // 시간 슬롯 (1시간 단위로 8시-22시)
  const timeSlots: number[] = []
  for (let hour = 8; hour < 23; hour++) {
    timeSlots.push(hour * 60) // 시간을 분으로 변환
  }

  useEffect(() => {
    fetchScheduleData()
  }, [selectedDate])

  const fetchScheduleData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/rest-breaks?date=${selectedDate}`)
      const result = await response.json()
      
      if (result.success) {
        setScheduleData(result.data)
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

  const addRestBreak = async () => {
    if (!selectedRange) return

    const startTime = minutesToTimeString(selectedRange.start)
    const endTime = minutesToTimeString(selectedRange.end)

    try {
      setLoading(true)
      const response = await fetch('/api/admin/rest-breaks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          startTime,
          endTime
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setSelectedRange(null)
        await fetchScheduleData()
      } else {
        setError(result.error || '휴식시간 추가에 실패했습니다.')
      }
    } catch (err) {
      setError('서버 연결 오류가 발생했습니다.')
      console.error('Add rest break error:', err)
    } finally {
      setLoading(false)
    }
  }

  const addFullDayRest = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/rest-breaks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          isFullDay: true
        })
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchScheduleData()
      } else {
        setError(result.error || '하루 휴식 추가에 실패했습니다.')
      }
    } catch (err) {
      setError('서버 연결 오류가 발생했습니다.')
      console.error('Add full day rest error:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteRestBreak = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/rest-breaks?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchScheduleData()
      } else {
        setError(result.error || '휴식시간 삭제에 실패했습니다.')
      }
    } catch (err) {
      setError('서버 연결 오류가 발생했습니다.')
      console.error('Delete rest break error:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteRestBreakGroup = async (groupIds: string[]) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/rest-breaks?groupIds=${groupIds.join(',')}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchScheduleData()
      } else {
        setError(result.error || '휴식시간 그룹 삭제에 실패했습니다.')
      }
    } catch (err) {
      setError('서버 연결 오류가 발생했습니다.')
      console.error('Delete rest break group error:', err)
    } finally {
      setLoading(false)
    }
  }

  const minutesToTimeString = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  const timeStringToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  const formatTime = (dateString: string) => {
    // 한국 시간 형식 처리: "2024-01-15 14:00:00" 또는 "2024-01-15T14:00:00Z"
    let timePart: string
    if (dateString.includes('T')) {
      // ISO 형식인 경우
      timePart = dateString.split('T')[1]
      timePart = timePart.split('.')[0].split('Z')[0]
    } else {
      // 한국 시간 형식인 경우
      timePart = dateString.split(' ')[1]
    }
    const [hours, minutes] = timePart.split(':')
    return `${hours}:${minutes}`
  }

  const getTimeSlotStatus = (slotMinutes: number) => {
    if (!scheduleData) return 'available'

    // 강의시간 확인
    for (const lesson of scheduleData.lessons) {
      const lessonStart = timeStringToMinutes(formatTime(lesson.lesson_date))
      const lessonEnd = lessonStart + lesson.duration_minutes
      
      if (slotMinutes >= lessonStart && slotMinutes < lessonEnd) {
        return 'lesson'
      }
    }

    // 휴식시간 확인
    for (const restBreak of scheduleData.restBreaks) {
      const restStart = timeStringToMinutes(formatTime(restBreak.lesson_date))
      const restEnd = restStart + restBreak.duration_minutes
      
      if (slotMinutes >= restStart && slotMinutes < restEnd) {
        return 'rest'
      }
    }

    return 'available'
  }

  const handleMouseDown = (slotIndex: number) => {
    const slotMinutes = timeSlots[slotIndex]
    if (getTimeSlotStatus(slotMinutes) !== 'available') return

    setIsDragging(true)
    setDragStart(slotMinutes)
    setDragEnd(slotMinutes)
    setSelectedRange(null)
  }

  const handleMouseMove = (slotIndex: number) => {
    if (!isDragging || dragStart === null) return

    const slotMinutes = timeSlots[slotIndex]
    setDragEnd(slotMinutes)
  }

  const handleMouseUp = () => {
    if (!isDragging || dragStart === null || dragEnd === null) return

    const start = Math.min(dragStart, dragEnd)
    const end = Math.max(dragStart, dragEnd) + 60 // 1시간 슬롯 크기 추가

    setSelectedRange({ start, end })
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }

  const isSlotInDragRange = (slotMinutes: number) => {
    if (!isDragging || dragStart === null || dragEnd === null) return false
    
    const start = Math.min(dragStart, dragEnd)
    const end = Math.max(dragStart, dragEnd)
    
    return slotMinutes >= start && slotMinutes <= end
  }

  const isSlotInSelectedRange = (slotMinutes: number) => {
    if (!selectedRange) return false
    return slotMinutes >= selectedRange.start && slotMinutes < selectedRange.end
  }

  const getSlotClassName = (slotMinutes: number) => {
    const status = getTimeSlotStatus(slotMinutes)
    const inDragRange = isSlotInDragRange(slotMinutes)
    const inSelectedRange = isSlotInSelectedRange(slotMinutes)
    
    let className = 'h-16 border border-gray-200 cursor-pointer transition-colors flex items-center justify-center '
    
    if (inSelectedRange) {
      className += 'bg-green-200 border-green-400 '
    } else if (inDragRange) {
      className += 'bg-blue-200 border-blue-400 '
    } else if (status === 'lesson') {
      className += 'bg-blue-500 border-blue-600 cursor-not-allowed '
    } else if (status === 'rest') {
      className += 'bg-orange-500 border-orange-600 cursor-pointer hover:bg-orange-600 '
    } else {
      className += 'bg-gray-50 hover:bg-gray-100 '
    }
    
    return className
  }

  const formatGroupTime = (group: RestBreak[]) => {
    if (group.length === 1) {
      const restBreak = group[0]
      const startTime = formatTime(restBreak.lesson_date)
      const endTime = minutesToTimeString(
        timeStringToMinutes(startTime) + restBreak.duration_minutes
      )
      return `${startTime} - ${endTime} (${restBreak.duration_minutes}분)`
    }
    
    // 연속된 휴식시간
    const firstBreak = group[0]
    const lastBreak = group[group.length - 1]
    const startTime = formatTime(firstBreak.lesson_date)
    const totalDuration = group.reduce((sum, rb) => sum + rb.duration_minutes, 0)
    const endTime = minutesToTimeString(
      timeStringToMinutes(startTime) + totalDuration
    )
    
    return `${startTime} - ${endTime} (연속 휴식시간 ${totalDuration}분)`
  }

  if (loading && !scheduleData) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8 text-gray-600">데이터를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">😴 휴식시간 설정</h1>
          
          {/* 날짜 선택 및 하루 휴식 버튼 */}
          <div className="mb-6 flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                날짜 선택:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-6">
              <button
                onClick={addFullDayRest}
                disabled={loading}
                className="px-6 py-3 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 font-medium"
              >
                🌙 하루 휴식 추가
              </button>
            </div>
          </div>

          {/* 범례 */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-50 border border-gray-200"></div>
              <span>사용 가능</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 border border-blue-600"></div>
              <span>강의 중</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 border border-orange-600"></div>
              <span>휴식시간</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 border border-green-400"></div>
              <span>선택된 범위</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* 시간표 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              시간표 - {new Date(selectedDate).toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </h2>
            
            {selectedRange && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  선택된 시간: {minutesToTimeString(selectedRange.start)} - {minutesToTimeString(selectedRange.end)}
                </span>
                <button
                  onClick={addRestBreak}
                  disabled={loading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  휴식시간 추가
                </button>
                <button
                  onClick={() => setSelectedRange(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  취소
                </button>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-600 mb-4">
            💡 드래그해서 휴식시간을 선택하세요 (1시간 단위). 오렌지색 휴식시간을 클릭하면 삭제됩니다.
          </div>

          {/* 시간표 그리드 */}
          <div 
            ref={timeTableRef}
            className="select-none"
            onMouseLeave={() => {
              if (isDragging) {
                handleMouseUp()
              }
            }}
          >
            {/* 시간 라벨 */}
            <div className="grid grid-cols-[80px_1fr] gap-2 mb-2">
              <div></div>
              <div className="flex">
                {Array.from({ length: 15 }, (_, i) => i + 8).map(hour => (
                  <div key={hour} className="flex-1 text-xs text-center text-gray-600 font-medium">
                    {hour}:00
                  </div>
                ))}
              </div>
            </div>

            {/* 시간 슬롯 */}
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <div className="text-sm text-gray-600 flex items-center">
                1시간 단위
              </div>
              <div className="flex">
                {timeSlots.map((slotMinutes, index) => (
                  <div
                    key={index}
                    className={`${getSlotClassName(slotMinutes)} flex-1`}
                    onMouseDown={() => handleMouseDown(index)}
                    onMouseMove={() => handleMouseMove(index)}
                    onMouseUp={handleMouseUp}
                    onClick={() => {
                      if (getTimeSlotStatus(slotMinutes) === 'rest') {
                        const restBreak = scheduleData?.restBreaks.find(rb => {
                          const restStart = timeStringToMinutes(formatTime(rb.lesson_date))
                          const restEnd = restStart + rb.duration_minutes
                          return slotMinutes >= restStart && slotMinutes < restEnd
                        })
                        if (restBreak) {
                          deleteRestBreak(restBreak.id)
                        }
                      }
                    }}
                    title={
                      getTimeSlotStatus(slotMinutes) === 'lesson' 
                        ? '강의 중' 
                        : getTimeSlotStatus(slotMinutes) === 'rest'
                        ? '휴식시간 (클릭하여 삭제)'
                        : minutesToTimeString(slotMinutes)
                    }
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* 예약 정보 */}
          {scheduleData && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 강의 목록 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📚 강의 일정</h3>
                {scheduleData.lessons.length === 0 ? (
                  <p className="text-gray-500">강의가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {scheduleData.lessons.map(lesson => (
                      <div key={lesson.id} className="bg-blue-50 p-3 rounded-lg">
                        <div className="font-medium text-blue-800">{lesson.name}</div>
                        <div className="text-sm text-blue-600">
                          {formatTime(lesson.lesson_date)} - {minutesToTimeString(
                            timeStringToMinutes(formatTime(lesson.lesson_date)) + lesson.duration_minutes
                          )} ({lesson.duration_minutes}분)
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 휴식시간 그룹 목록 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">😴 휴식시간</h3>
                {scheduleData.restBreakGroups.length === 0 ? (
                  <p className="text-gray-500">휴식시간이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {scheduleData.restBreakGroups.map((group, groupIndex) => (
                      <div key={groupIndex} className="bg-orange-50 p-3 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="text-sm text-orange-600">
                            {formatGroupTime(group)}
                          </div>
                          {group.length > 1 && (
                            <div className="text-xs text-orange-500 mt-1">
                              {group.length}개의 연속된 휴식시간
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => deleteRestBreakGroup(group.map(rb => rb.id))}
                          disabled={loading}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {group.length > 1 ? '그룹 삭제' : '삭제'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 