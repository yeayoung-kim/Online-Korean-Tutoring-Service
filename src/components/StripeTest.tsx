'use client'

import { useState, useEffect } from 'react'

export default function StripeTest() {
  const [amount, setAmount] = useState(1000) // 10원
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [envStatus, setEnvStatus] = useState<{
    supabase: {url: boolean, anonKey: boolean, serviceRoleKey: boolean},
    stripe: {publishableKey: boolean, secretKey: boolean}
  }>({
    supabase: {url: false, anonKey: false, serviceRoleKey: false},
    stripe: {publishableKey: false, secretKey: false}
  })
  const [envLoading, setEnvLoading] = useState(true)

  useEffect(() => {
    // 서버에서 환경 변수 상태 확인
    const checkEnvStatus = async () => {
      try {
        const response = await fetch('/api/check-env')
        const data = await response.json()
        
        if (data.success) {
          setEnvStatus(data.envStatus)
        }
      } catch (error) {
        console.error('환경 변수 확인 오류:', error)
      } finally {
        setEnvLoading(false)
      }
    }

    checkEnvStatus()
  }, [])

  const handlePayment = async () => {
    setLoading(true)
    setMessage('')

    try {
      // PaymentIntent 생성
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'krw',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      setMessage(`✅ PaymentIntent 생성 성공! Client Secret: ${data.clientSecret?.substring(0, 20)}...`)
    } catch (error) {
      setMessage(`❌ 오류: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Stripe 결제 테스트</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          결제 금액 (원)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          placeholder="1000"
        />
        <p className="text-sm text-gray-500 mt-1">
          입력한 금액: {amount}원
        </p>
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '처리 중...' : '결제하기'}
      </button>

      {message && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {message}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p className="font-semibold mb-2">환경 변수 확인:</p>
        {envLoading ? (
          <p>확인 중...</p>
        ) : (
          <>
            <div className="mb-2">
              <p className="font-medium">Supabase:</p>
              <p>• URL: {envStatus.supabase.url ? '✅ 설정됨' : '❌ 설정 안됨'}</p>
              <p>• Anon Key: {envStatus.supabase.anonKey ? '✅ 설정됨' : '❌ 설정 안됨'}</p>
              <p>• Service Role Key: {envStatus.supabase.serviceRoleKey ? '✅ 설정됨' : '❌ 설정 안됨'}</p>
            </div>
            <div>
              <p className="font-medium">Stripe:</p>
              <p>• Publishable Key: {envStatus.stripe.publishableKey ? '✅ 설정됨' : '❌ 설정 안됨'}</p>
              <p>• Secret Key: {envStatus.stripe.secretKey ? '✅ 설정됨' : '❌ 설정 안됨'}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 