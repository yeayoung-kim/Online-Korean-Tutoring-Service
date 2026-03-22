'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import StripeTest from '@/components/StripeTest'

export default function TestPage() {
  const [status, setStatus] = useState<string>('테스트 중...')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    testSupabaseConnection()
  }, [])

  const testSupabaseConnection = async () => {
    try {
      setStatus('Supabase 연결 테스트 중...')
      
      // 간단한 쿼리로 연결 테스트
      const { data, error } = await supabase
        .from('test_table')
        .select('*')
        .limit(1)
      
      if (error) {
        // 테이블이 없어도 연결은 성공한 것
        if (error.code === 'PGRST116') {
          setStatus('✅ Supabase 연결 성공! (테이블은 아직 없음)')
        } else {
          setError(`연결 오류: ${error.message}`)
        }
      } else {
        setStatus('✅ Supabase 연결 성공!')
      }
    } catch (err) {
      setError(`예상치 못한 오류: ${err}`)
    }
  }

  const insertTestData = async () => {
    setStatus('데이터 삽입 중...')
    setError('')
    try {
      const { error } = await supabase
        .from('test_table')
        .insert([{ name: '테스트 데이터' }])
      if (error) {
        setError(`삽입 오류: ${error.message}`)
      } else {
        setStatus('✅ 데이터 삽입 성공!')
      }
    } catch (err) {
      setError(`예상치 못한 오류: ${err}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Supabase 테스트 섹션 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Supabase 연결 테스트
          </h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">{status}</p>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          <button
            onClick={testSupabaseConnection}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            연결 다시 테스트
          </button>
          <button
            onClick={insertTestData}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            테스트 데이터 삽입
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">클라이언트 환경 변수 확인:</h3>
          <p className="text-sm text-gray-600">
            URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 설정 안됨'}
          </p>
          <p className="text-sm text-gray-600">
            Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 설정 안됨'}
          </p>
          <p className="text-sm text-gray-600">
            Stripe Publishable Key: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ 설정됨' : '❌ 설정 안됨'}
          </p>
        </div>
        </div>

        {/* Stripe 테스트 섹션 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Stripe API 테스트
          </h1>
          <StripeTest />
        </div>

        {/* 실제 결제 테스트 섹션 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            실제 결제 테스트
          </h1>
          {/* <StripePaymentForm amount={1000} /> */}
        </div>
      </div>
    </div>
  )
} 