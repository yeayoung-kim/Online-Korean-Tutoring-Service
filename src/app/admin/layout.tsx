'use client'

import { usePathname } from 'next/navigation'
import AdminNavbar from '@/components/AdminNavbar'
import AuthWrapper from '@/components/AuthWrapper'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <main>
          {children}
        </main>
      </div>
    </AuthWrapper>
  )
} 