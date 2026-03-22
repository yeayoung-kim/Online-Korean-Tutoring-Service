'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { AvailableTime, Booking } from '@/types/database'
import { addDays, format, startOfDay } from 'date-fns'
import { getTimezoneInfo, getUserTimezone, convertLocalTimeToKorean } from '@/lib/timezone'

interface TimeSlot {
  date: string // yyyy-MM-dd
  dayOfWeek: number
  hour: number // 8~22
  minute: number // 0, 30 등
  is_available: boolean
  is_booked: boolean
  slotLabel: string // '08:00' 등
}

function getNext7Days() {
  const days: { date: string; dayOfWeek: number }[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(startOfDay(new Date()), i)
    days.push({ date: format(d, 'yyyy-MM-dd'), dayOfWeek: d.getDay() })
  }
  return days
}

// 1시간 단위 슬롯 생성 (분 단위까지)
function getHourSlots(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const slots: { hour: number; minute: number; slotLabel: string }[] = []
  let cur = sh * 60 + sm
  const endMin = eh * 60 + em
  while (cur + 60 <= endMin) {
    const hour = Math.floor(cur / 60)
    const minute = cur % 60
    slots.push({ hour, minute, slotLabel: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` })
    cur += 60
  }
  return slots
}

// UTC로 Date 객체 생성
function makeUTCDate(date: string, slotLabel: string) {
  return new Date(`${date}T${slotLabel}:00Z`)
}

export default function TestAvailabilityPage() {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timezoneInfo, setTimezoneInfo] = useState<{ name: string; offset: string }>({ name: 'Asia/Seoul', offset: '+09:00' })
  // 예약 폼 상태
  const [form, setForm] = useState({
    date: '',
    hour: 8,
    minute: 0,
    slotLabel: '08:00',
    name: '',
    email: '',
  })
  const [formMsg, setFormMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 데이터 fetch 함수 분리
  const fetchSlots = async () => {
    setLoading(true)
    setError('')
    try {
      const days = getNext7Days()
      const { data: times, error: timesError } = await supabase
        .from('available_times')
        .select('*')
        .eq('is_available', true)
      if (timesError) throw timesError
      const allSlots: TimeSlot[] = []
      days.forEach(({ date, dayOfWeek }) => {
        times?.forEach((t) => {
          if (t.day_of_week === dayOfWeek) {
            const hourSlots = getHourSlots(t.start_time, t.end_time)
            hourSlots.forEach(({ hour, minute, slotLabel }) => {
              allSlots.push({
                date,
                dayOfWeek,
                hour,
                minute,
                is_available: true,
                is_booked: false,
                slotLabel,
              })
            })
          }
        })
      })
      const start = days[0].date + 'T00:00:00Z'
      const end = days[6].date + 'T23:59:59Z'
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('lesson_date, duration_minutes')
        .gte('lesson_date', start)
        .lte('lesson_date', end)
      if (bookingsError) throw bookingsError
      const slotsWithStatus = allSlots.map((slot) => {
        const slotStart = makeUTCDate(slot.date, slot.slotLabel)
        const slotEnd = new Date(slotStart.getTime() + 60 * 60000)
        const isBooked = bookings?.some((b) => {
          const lessonStart = new Date(b.lesson_date)
          const lessonEnd = new Date(lessonStart.getTime() + (b.duration_minutes || 60) * 60000)
          return lessonStart < slotEnd && lessonEnd > slotStart
        })
        return { ...slot, is_booked: !!isBooked }
      })
      setSlots(slotsWithStatus)
    } catch (err: any) {
      setError(err.message || '데이터 조회 오류')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [])

  // 예약 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormMsg('')
    setSubmitting(true)
    try {
      if (!form.date || !form.name || !form.email) {
        setFormMsg('모든 값을 입력하세요.')
        setSubmitting(false)
        return
      }
      // 사용자 시간대 감지 및 한국 시간으로 변환
      const userTimezone = getUserTimezone()
      const userLocalTime = `${form.date} ${form.slotLabel}:00`
      const lesson_date = userTimezone === 'Asia/Seoul' 
        ? userLocalTime 
        : convertLocalTimeToKorean(form.date, form.slotLabel, userTimezone)
      
      const already = slots.find(
        (s) => s.date === form.date && s.slotLabel === form.slotLabel && s.is_booked
      )
      if (already) {
        setFormMsg('이미 예약된 시간입니다.')
        setSubmitting(false)
        return
      }
      const { error: insertError } = await supabase.from('bookings').insert([
        {
          name: form.name,
          email: form.email,
          lesson_date, // 한국 시간으로 변환된 시간
          local_time: userLocalTime, // 사용자의 현지 시간
          timezone: userTimezone, // 사용자의 시간대
          duration_minutes: 60,
          payment_status: 'completed',
          amount: 10000,
        },
      ])
      if (insertError) throw insertError

      // 학생 정보 생성/업데이트
      await updateStudentInfo(form.name, form.email, 1, 10000)

      setFormMsg('✅ 예약 성공!')
      setForm((f) => ({ ...f, name: '', email: '' }))
      await fetchSlots()
    } catch (err: any) {
      setFormMsg('오류: ' + (err.message || '예약 실패'))
    } finally {
      setSubmitting(false)
    }
  }

  // 학생 정보 생성/업데이트 함수
  async function updateStudentInfo(name: string, email: string, lessonCount: number, totalAmount: number) {
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
        // 기존 학생 정보 업데이트
        const { error: updateError } = await supabase
          .from('students')
          .update({
            name, // 이름이 변경될 수도 있으므로 업데이트
            last_lesson_date: currentDate,
            total_lessons: existingStudent.total_lessons + lessonCount,
            total_amount: existingStudent.total_amount + totalAmount,
          })
          .eq('email', email)

        if (updateError) {
          console.error('학생 정보 업데이트 오류:', updateError)
        }
      } else {
        // 새 학생 정보 생성
        const { error: insertError } = await supabase
          .from('students')
          .insert([
            {
              name,
              email,
              first_lesson_date: currentDate,
              last_lesson_date: currentDate,
              total_lessons: lessonCount,
              total_amount: totalAmount,
            }
          ])

        if (insertError) {
          console.error('학생 정보 생성 오류:', insertError)
        }
      }
    } catch (error) {
      console.error('학생 정보 처리 오류:', error)
    }
  }

  // 날짜별로 그룹핑
  const grouped = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = []
    acc[slot.date].push(slot)
    return acc
  }, {} as Record<string, TimeSlot[]>)

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">7일간 시간별 예약 가능/불가 테스트</h1>
      {/* 예약 테스트 폼 */}
      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded border flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">날짜</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={form.date}
            min={getNext7Days()[0].date}
            max={getNext7Days()[6].date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">시간</label>
          <select
            className="border rounded px-2 py-1"
            value={form.slotLabel}
            onChange={(e) => {
              const [h, m] = e.target.value.split(':').map(Number)
              setForm((f) => ({ ...f, hour: h, minute: m, slotLabel: e.target.value }))
            }}
          >
            {(() => {
              // 선택한 날짜의 가능한 슬롯만 보여주고, 예약된 슬롯은 disabled
              const times = slots.filter((s) => s.date === form.date)
              // 중복 제거 및 정렬
              const unique = Array.from(new Set(times.map((s) => s.slotLabel))).sort()
              return unique.map((label) => {
                const isBooked = times.find((s) => s.slotLabel === label)?.is_booked
                return (
                  <option key={label} value={label} disabled={isBooked}>
                    {label} {isBooked ? '❌ 예약 불가' : ''}
                  </option>
                )
              })
            })()}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">이름</label>
          <input
            type="text"
            className="border rounded px-2 py-1 text-gray-900"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">이메일</label>
          <input
            type="email"
            className="border rounded px-2 py-1 text-gray-900"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? '예약 중...' : '예약하기'}
        </button>
        {formMsg && <div className="ml-4 text-sm font-medium">{formMsg}</div>}
      </form>
      {/* 예약 가능/불가 테이블 */}
      {loading && <p>로딩 중...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, slots]) => (
            <div key={date}>
              <h2 className="text-lg font-semibold mb-2">{date} ({['일','월','화','수','목','금','토'][slots[0].dayOfWeek]})</h2>
              <table className="w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">시간</th>
                    <th className="border px-2 py-1">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot, i) => (
                    <tr key={i}>
                      <td className="border px-2 py-1">{slot.slotLabel}</td>
                      <td className="border px-2 py-1">
                        {slot.is_booked ? (
                          <span className="text-red-600 font-bold">❌ 예약 불가</span>
                        ) : (
                          <span className="text-green-600 font-bold">✅ 예약 가능</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 