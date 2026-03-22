'use client'

import { useState, useEffect } from 'react'

interface MigrationStatus {
  students_count: number
  unique_emails_in_bookings: number
  needs_migration: boolean
}

interface MigrationResult {
  success: boolean
  message?: string
  migrated?: number
  error?: string
}

export default function TestMigrationPage() {
  const [status, setStatus] = useState<MigrationStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [result, setResult] = useState<MigrationResult | null>(null)

  // 마이그레이션 상태 확인
  const checkStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/migrate-students')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('상태 확인 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 마이그레이션 실행
  const runMigration = async () => {
    setMigrating(true)
    setResult(null)
    try {
      const response = await fetch('/api/admin/migrate-students', {
        method: 'POST'
      })
      const data = await response.json()
      setResult(data)
      
      // 성공하면 상태 다시 확인
      if (data.success) {
        await checkStatus()
      }
    } catch (error) {
      console.error('마이그레이션 오류:', error)
      setResult({
        success: false,
        error: '마이그레이션 실행 중 오류가 발생했습니다.'
      })
    } finally {
      setMigrating(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            📚 학생 데이터 마이그레이션
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              기존 예약 데이터를 기반으로 학생 정보 테이블을 초기화합니다.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ 주의사항</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 완료된 결제 상태의 예약만 마이그레이션됩니다</li>
                <li>• 이메일을 기준으로 동일 학생을 식별합니다</li>
                <li>• 기존 학생 데이터가 있으면 업데이트됩니다</li>
              </ul>
            </div>
          </div>

          {/* 현재 상태 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">📊 현재 상태</h2>
            
            {loading ? (
              <div className="text-gray-500">상태 확인 중...</div>
            ) : status ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {status.students_count}
                  </div>
                  <div className="text-sm text-blue-800">등록된 학생 수</div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {status.unique_emails_in_bookings}
                  </div>
                  <div className="text-sm text-green-800">예약 내 고유 이메일</div>
                </div>
                
                <div className={`border rounded-lg p-4 ${
                  status.needs_migration 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-2xl font-bold ${
                    status.needs_migration ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {status.needs_migration ? '필요' : '불필요'}
                  </div>
                  <div className={`text-sm ${
                    status.needs_migration ? 'text-red-800' : 'text-gray-800'
                  }`}>
                    마이그레이션
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-red-500">상태 확인 실패</div>
            )}
          </div>

          {/* 마이그레이션 실행 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">🚀 마이그레이션 실행</h2>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={runMigration}
                disabled={migrating || !status?.needs_migration}
                className={`px-6 py-2 rounded-lg font-medium ${
                  migrating || !status?.needs_migration
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {migrating ? '마이그레이션 중...' : '마이그레이션 실행'}
              </button>
              
              <button
                onClick={checkStatus}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {loading ? '확인 중...' : '상태 새로고침'}
              </button>
            </div>
            
            {!status?.needs_migration && (
              <p className="text-sm text-gray-500 mt-2">
                마이그레이션이 필요하지 않습니다.
              </p>
            )}
          </div>

          {/* 결과 표시 */}
          {result && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">📋 실행 결과</h2>
              
              <div className={`border rounded-lg p-4 ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? '✅ 성공' : '❌ 실패'}
                </div>
                
                <div className={`text-sm mt-1 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message || result.error}
                </div>
                
                {result.migrated && (
                  <div className="text-sm text-green-600 mt-2">
                    {result.migrated}명의 학생 데이터가 마이그레이션되었습니다.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 링크 */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex space-x-4">
              <a
                href="/admin/students"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                → 학생 관리 페이지
              </a>
              <a
                href="/test-db"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                → 데이터베이스 테스트
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 