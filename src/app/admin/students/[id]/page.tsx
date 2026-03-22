'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Student, Booking } from '@/types/database'
import { formatLocalDateTime, convertUTCToLocal } from '@/lib/timezone'

interface StudentDetailData {
  student: Student
  bookings: Booking[]
  stats: {
    total_lessons: number
    total_amount: number
    upcoming_lessons: number
    pending_payments: number
    last_lesson_date: string | null
    next_lesson_date: string | null
  }
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [data, setData] = useState<StudentDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'lessons' | 'payments'>('info')
  const [studentId, setStudentId] = useState<string | null>(null)

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setStudentId(resolvedParams.id)
    }
    initializeParams()
  }, [params])

  useEffect(() => {
    if (studentId) {
      fetchStudentData()
    }
  }, [studentId])

  const fetchStudentData = async () => {
    if (!studentId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/students/${studentId}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
        setEditForm({
          name: result.data.student.name,
          email: result.data.student.email,
          phone: result.data.student.phone || '',
          notes: result.data.student.notes || ''
        })
      } else {
        setError(result.error || '학생 정보를 불러오는 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setError('서버 연결 오류가 발생했습니다.')
      console.error('Student detail fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId) return
    
    if (!editForm.name || !editForm.email) {
      alert('이름과 이메일은 필수입니다.')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      })

      const result = await response.json()
      
      if (result.success) {
        setEditing(false)
        await fetchStudentData()
        alert('학생 정보가 성공적으로 수정되었습니다.')
      } else {
        alert(result.error || '학생 정보 수정에 실패했습니다.')
      }
    } catch (err) {
      alert('서버 연결 오류가 발생했습니다.')
      console.error('Update student error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteStudent = async () => {
    if (!studentId) return
    
    if (!confirm('정말로 이 학생을 삭제하시겠습니까?\n완료된 수업이 있는 학생은 삭제할 수 없습니다.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        alert('학생이 성공적으로 삭제되었습니다.')
        router.push('/admin/students')
      } else {
        alert(result.error || '학생 삭제에 실패했습니다.')
      }
    } catch (err) {
      alert('서버 연결 오류가 발생했습니다.')
      console.error('Delete student error:', err)
    }
  }

  const formatAmount = (amount: number) => {
    return (amount / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    })
  }

  const formatDateTime = (dateString: string) => {
    try {
      // UTC 시간을 한국 시간대로 변환
      const date = new Date(dateString)
      
      // 한국 시간대 (Asia/Seoul)로 변환하여 표시
      return date.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } catch {
      return dateString
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '없음'
    try {
      // UTC 시간을 한국 시간대로 변환하여 날짜만 표시
      const date = new Date(dateString)
      
      return date.toLocaleDateString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">완료</span>
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">대기</span>
      case 'failed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">실패</span>
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8 text-gray-600">데이터를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">{error || '학생 정보를 찾을 수 없습니다.'}</div>
            <Link href="/admin/students" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
              ← 학생 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { student, bookings, stats } = data
  const completedBookings = bookings.filter(b => b.payment_status === 'completed')
  const pendingBookings = bookings.filter(b => b.payment_status === 'pending')
  const upcomingBookings = completedBookings.filter(b => new Date(b.lesson_date) >= new Date())

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin/students" className="text-blue-600 hover:text-blue-800">
                ← 학생 목록
              </Link>
              <h1 className="text-3xl font-bold text-gray-800">👤 {student.name}</h1>
            </div>
            <div className="flex space-x-3">
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  ✏️ 수정
                </button>
              )}
              <button
                onClick={deleteStudent}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                🗑️ 삭제
              </button>
            </div>
          </div>

          {/* 학생 기본 정보 */}
          {editing ? (
            <form onSubmit={updateStudent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                >
                  {submitting ? '저장 중...' : '💾 저장'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">기본 정보</h3>
                <div className="space-y-2">
                  <div><span className="font-medium">📧 이메일:</span> {student.email}</div>
                  <div><span className="font-medium">📞 전화번호:</span> {student.phone || '등록되지 않음'}</div>
                  <div><span className="font-medium">📅 가입일:</span> {formatDate(student.created_at)}</div>
                </div>
                {student.notes && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">📝 메모</h4>
                    <div className="bg-gray-50 p-3 rounded-md text-sm">{student.notes}</div>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">수업 통계</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{stats.total_lessons}</div>
                    <div className="text-sm text-blue-600">총 수업</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{stats.upcoming_lessons}</div>
                    <div className="text-sm text-green-600">예정 수업</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-purple-700">{formatAmount(stats.total_amount)}</div>
                    <div className="text-sm text-purple-600">총 매출</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-orange-700">{stats.pending_payments}</div>
                    <div className="text-sm text-orange-600">대기 결제</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div><span className="font-medium">📚 마지막 수업:</span> {formatDate(stats.last_lesson_date)}</div>
                  <div><span className="font-medium">📅 다음 수업:</span> {formatDate(stats.next_lesson_date)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'info'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              📊 요약
            </button>
            <button
              onClick={() => setActiveTab('lessons')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'lessons'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              📚 수업 이력 ({completedBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'payments'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              💰 결제 관리 ({pendingBookings.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">📅 예정된 수업</h3>
                  {upcomingBookings.length === 0 ? (
                    <p className="text-gray-500">예정된 수업이 없습니다.</p>
                  ) : (
                    <div className="space-y-2">
                      {upcomingBookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div>
                            <div className="font-medium">{formatDateTime(booking.lesson_date)}</div>
                            <div className="text-sm text-gray-600">{booking.duration_minutes}분 수업</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatAmount(booking.amount)}</div>
                            {getStatusBadge(booking.payment_status)}
                          </div>
                        </div>
                      ))}
                      {upcomingBookings.length > 5 && (
                        <p className="text-sm text-gray-500">...그 외 {upcomingBookings.length - 5}개</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'lessons' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">완료된 수업 이력</h3>
                {completedBookings.length === 0 ? (
                  <p className="text-gray-500">완료된 수업이 없습니다.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">날짜/시간</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">시간</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">금액</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">결제일</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {completedBookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{formatDateTime(booking.lesson_date)}</td>
                            <td className="px-4 py-3 text-sm">{booking.duration_minutes}분</td>
                            <td className="px-4 py-3 text-sm font-medium">{formatAmount(booking.amount)}</td>
                            <td className="px-4 py-3 text-sm">{booking.paid_at ? formatDate(booking.paid_at) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">결제 대기 중인 예약</h3>
                {pendingBookings.length === 0 ? (
                  <p className="text-gray-500">결제 대기 중인 예약이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div>
                          <div className="font-medium">{formatDateTime(booking.lesson_date)}</div>
                          <div className="text-sm text-gray-600">
                            {booking.duration_minutes}분 수업 • 예약일: {formatDate(booking.created_at)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatAmount(booking.amount)}</div>
                          {getStatusBadge(booking.payment_status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 