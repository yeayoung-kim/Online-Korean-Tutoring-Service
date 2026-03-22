'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { SubscriptionPlan, AvailableTime } from '@/types/database'
import { getTimezoneInfo } from '@/lib/timezone'

export default function TestSchedulePage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [times, setTimes] = useState<AvailableTime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timezoneInfo, setTimezoneInfo] = useState<{ name: string; offset: string }>({ name: 'Asia/Seoul', offset: '+09:00' })

  useEffect(() => {
    // 시간대 정보 설정
    setTimezoneInfo(getTimezoneInfo())
    
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const { data: plansData, error: plansError } = await supabase
          .from('subscription_plans')
          .select('*')
          .order('price', { ascending: true })
        if (plansError) throw plansError
        setPlans(plansData || [])

        const { data: timesData, error: timesError } = await supabase
          .from('available_times')
          .select('*')
          .order('day_of_week', { ascending: true })
        if (timesError) throw timesError
        setTimes(timesData || [])
      } catch (err: any) {
        setError(err.message || '데이터 조회 오류')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">테스트: 구독 플랜 & 시간대 조회</h1>
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          🌍 현재 시간대: {timezoneInfo.name} ({timezoneInfo.offset})
        </p>
      </div>
      {loading && <p>로딩 중...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">구독 플랜</h2>
        <ul className="space-y-2">
          {plans.map(plan => (
            <li key={plan.id} className="border rounded p-3">
              <div className="font-bold">{plan.name}</div>
              <div>{plan.description}</div>
              <div>가격: {plan.price.toLocaleString()}원 / {plan.duration_days}일, {plan.lessons_count}회</div>
              <div>활성화: {plan.is_active ? '✅' : '❌'}</div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">가능한 시간대</h2>
        <ul className="space-y-2">
          {times.map(time => (
            <li key={time.id} className="border rounded p-3">
              <div>요일: {['일','월','화','수','목','금','토'][time.day_of_week]}</div>
              <div>
                {time.start_time} ~ {time.end_time} {time.is_available ? '✅' : '❌'}
              </div>
              {time.notes && <div className="text-sm text-gray-500">비고: {time.notes}</div>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
} 