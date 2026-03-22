'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const AdminNavbar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const menuItems = [
    { name: '🏠 홈', href: '/admin', exact: true },
    { name: '👥 학생 정보 관리', href: '/admin/students' },
    { name: '😴 휴식시간 설정', href: '/admin/rest-settings' }
  ]

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      })
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('로그아웃 오류:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* 로고/타이틀 */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800">
              🏫 관리자 패널
            </h1>
          </div>

          {/* 메뉴 */}
          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  isActive(item.href, item.exact)
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 rounded-lg font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 disabled:opacity-50"
            >
              {isLoggingOut ? '로그아웃 중...' : '🚪 로그아웃'}
            </button>
          </div>

          {/* 모바일 메뉴 (나중에 필요시 추가) */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 드롭다운 */}
        <div className="md:hidden pb-4">
          <div className="flex flex-col space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  isActive(item.href, item.exact)
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 rounded-lg font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 disabled:opacity-50 text-left"
            >
              {isLoggingOut ? '로그아웃 중...' : '🚪 로그아웃'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default AdminNavbar 