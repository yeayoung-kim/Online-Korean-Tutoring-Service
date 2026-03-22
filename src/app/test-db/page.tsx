'use client'

import { useState, useEffect } from 'react'

interface Subscriber {
  id: string
  name: string
  email: string
  subscription_status: string
  payment_status: string
  created_at: string
}

export default function TestDBPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscribers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/newsletter-subscribe')
      const data = await response.json()
      
      if (response.ok) {
        setSubscribers(data.subscribers || [])
      } else {
        setError(data.error || '데이터를 가져오는 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.')
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscribers()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">뉴스레터 구독자 데이터베이스 테스트</h1>
            <button
              onClick={fetchSubscribers}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '로딩 중...' : '새로고침'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              총 구독자 수: {subscribers.length}명
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이메일
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      구독 상태
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      결제 상태
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      가입일
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscribers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        아직 구독자가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    subscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {subscriber.name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {subscriber.email}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            subscriber.subscription_status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : subscriber.subscription_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {subscriber.subscription_status}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            subscriber.payment_status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : subscriber.payment_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {subscriber.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {new Date(subscriber.created_at).toLocaleString('ko-KR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">테스트 방법:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
              <li>뉴스레터 페이지(/newsletter)로 가서 구독 신청을 해보세요</li>
              <li><strong>PayPal 결제를 완료</strong>해야 데이터베이스에 저장됩니다</li>
              <li>이 페이지에서 새로고침 버튼을 눌러 결제 완료 후 데이터가 저장되었는지 확인하세요</li>
              <li>결제 전에는 데이터베이스에 저장되지 않습니다 (결제 성공 후에만 저장)</li>
            </ol>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ 중요 변경사항:</h3>
            <p className="text-sm text-yellow-700">
              이제 데이터베이스에 저장되는 시점이 <strong>결제 완료 후</strong>로 변경되었습니다. 
              결제가 실패하거나 취소되면 데이터베이스에 저장되지 않습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 