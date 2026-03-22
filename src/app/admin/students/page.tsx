'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { StudentWithStats } from '@/types/database'

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)
  
  // 마이그레이션 관련 상태
  const [migrationStatus, setMigrationStatus] = useState<{
    students_count: number
    unique_emails_in_bookings: number
    needs_migration: boolean
  } | null>(null)
  const [showMigrationModal, setShowMigrationModal] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean
    message?: string
    migrated?: number
    error?: string
  } | null>(null)

  useEffect(() => {
    fetchStudents()
  }, [searchTerm])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/admin/students?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setStudents(result.data)
      } else {
        setError(result.error || '학생 정보를 불러오는 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setError('서버 연결 오류가 발생했습니다.')
      console.error('Students fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStudent.name || !newStudent.email) {
      alert('이름과 이메일은 필수입니다.')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStudent)
      })

      const result = await response.json()
      
      if (result.success) {
        setShowAddModal(false)
        setNewStudent({ name: '', email: '', phone: '', notes: '' })
        await fetchStudents()
        alert('학생이 성공적으로 추가되었습니다.')
      } else {
        alert(result.error || '학생 추가에 실패했습니다.')
      }
    } catch (err) {
      alert('서버 연결 오류가 발생했습니다.')
      console.error('Add student error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // 마이그레이션 관련 함수들
  const checkMigrationStatus = async () => {
    try {
      const response = await fetch('/api/admin/migrate-students')
      const data = await response.json()
      setMigrationStatus(data)
    } catch (error) {
      console.error('마이그레이션 상태 확인 오류:', error)
    }
  }

  const runMigration = async () => {
    setMigrating(true)
    setMigrationResult(null)
    try {
      const response = await fetch('/api/admin/migrate-students', {
        method: 'POST'
      })
      const data = await response.json()
      setMigrationResult(data)
      
      // 성공하면 상태 다시 확인하고 학생 목록 새로고침
      if (data.success) {
        await checkMigrationStatus()
        await fetchStudents()
      }
    } catch (error) {
      console.error('마이그레이션 오류:', error)
      setMigrationResult({
        success: false,
        error: '마이그레이션 실행 중 오류가 발생했습니다.'
      })
    } finally {
      setMigrating(false)
    }
  }

  // 페이지 로드 시 마이그레이션 상태 확인
  useEffect(() => {
    checkMigrationStatus()
  }, [])

  const formatAmount = (amount: number) => {
    return (amount / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '없음'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">👥 학생 정보 관리</h1>
            <div className="flex items-center space-x-3">
              {migrationStatus?.needs_migration && (
                <button
                  onClick={() => setShowMigrationModal(true)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 font-medium text-sm"
                >
                  📚 데이터 마이그레이션
                </button>
              )}
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                ➕ 새 학생 추가
              </button>
            </div>
          </div>
          
          {/* 검색 */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="이름 또는 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{students.length}</div>
              <div className="text-sm text-blue-600">총 학생 수</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {students.filter(s => s.last_lesson_date && 
                  new Date(s.last_lesson_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                ).length}
              </div>
              <div className="text-sm text-green-600">활성 학생 (30일 내)</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {formatAmount(students.reduce((sum, s) => sum + s.total_amount, 0))}
              </div>
              <div className="text-sm text-purple-600">총 매출</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* 학생 목록 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-8 text-gray-600">데이터를 불러오는 중...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              {searchTerm ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      학생 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      수업 통계
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      마지막 수업
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 매출
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            📧 {student.email}
                          </div>
                          {student.phone && (
                            <div className="text-sm text-gray-500">
                              📞 {student.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          📚 총 {student.total_lessons}회
                        </div>
                        <div className="text-sm text-gray-500">
                          📅 예정 {student.upcoming_lessons}회
                        </div>
                        {student.pending_payments > 0 && (
                          <div className="text-sm text-orange-600">
                            ⏳ 대기 {student.pending_payments}회
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(student.last_lesson_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatAmount(student.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.last_lesson_date && 
                          new Date(student.last_lesson_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                            ? 'bg-green-100 text-green-800'
                            : student.total_lessons > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.last_lesson_date && 
                           new Date(student.last_lesson_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                            ? '활성'
                            : student.total_lessons > 0
                            ? '비활성'
                            : '신규'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          상세보기
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 새 학생 추가 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">새 학생 추가</h2>
              <form onSubmit={addStudent}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름 *
                    </label>
                    <input
                      type="text"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이메일 *
                    </label>
                    <input
                      type="email"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      value={newStudent.phone}
                      onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      메모
                    </label>
                    <textarea
                      value={newStudent.notes}
                      onChange={(e) => setNewStudent({...newStudent, notes: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    {submitting ? '추가 중...' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 마이그레이션 모달 */}
        {showMigrationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">📚 학생 데이터 마이그레이션</h2>
                <button
                  onClick={() => setShowMigrationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  기존 예약 데이터를 기반으로 학생 정보 테이블을 초기화합니다.
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">⚠️ 주의사항</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• 완료된 결제 상태의 예약만 마이그레이션됩니다</li>
                    <li>• 이메일을 기준으로 동일 학생을 식별합니다</li>
                    <li>• 김예영 데이터는 제외됩니다</li>
                    <li>• 기존 학생 데이터가 있으면 업데이트됩니다</li>
                  </ul>
                </div>
              </div>

              {/* 현재 상태 */}
              {migrationStatus && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 현재 상태</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {migrationStatus.students_count}
                      </div>
                      <div className="text-sm text-blue-800">등록된 학생 수</div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {migrationStatus.unique_emails_in_bookings}
                      </div>
                      <div className="text-sm text-green-800">예약 내 고유 이메일</div>
                    </div>
                    
                    <div className={`border rounded-lg p-4 ${
                      migrationStatus.needs_migration 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        migrationStatus.needs_migration ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {migrationStatus.needs_migration ? '필요' : '불필요'}
                      </div>
                      <div className={`text-sm ${
                        migrationStatus.needs_migration ? 'text-red-800' : 'text-gray-800'
                      }`}>
                        마이그레이션
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 결과 표시 */}
              {migrationResult && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 실행 결과</h3>
                  
                  <div className={`border rounded-lg p-4 ${
                    migrationResult.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className={`font-medium ${
                      migrationResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {migrationResult.success ? '✅ 성공' : '❌ 실패'}
                    </div>
                    
                    <div className={`text-sm mt-1 ${
                      migrationResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {migrationResult.message || migrationResult.error}
                    </div>
                    
                    {migrationResult.migrated && (
                      <div className="text-sm text-green-600 mt-2">
                        {migrationResult.migrated}명의 학생 데이터가 마이그레이션되었습니다.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => checkMigrationStatus()}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  상태 새로고침
                </button>
                <button
                  onClick={() => setShowMigrationModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  닫기
                </button>
                <button
                  onClick={runMigration}
                  disabled={migrating || !migrationStatus?.needs_migration}
                  className={`px-6 py-2 rounded-lg font-medium ${
                    migrating || !migrationStatus?.needs_migration
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {migrating ? '마이그레이션 중...' : '마이그레이션 실행'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 