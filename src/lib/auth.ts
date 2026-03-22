import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface AuthUser {
  username: string
  role: string
  iat: number
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('JWT_SECRET이 설정되지 않았습니다')
      return null
    }

    const decoded = jwt.verify(token, jwtSecret) as AuthUser
    return decoded
  } catch (error) {
    console.error('토큰 검증 오류:', error)
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  // 쿠키에서 토큰 가져오기
  const cookieToken = request.cookies.get('admin-token')?.value
  if (cookieToken) {
    return cookieToken
  }

  // Authorization 헤더에서 토큰 가져오기
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  return null
}

export function isAuthenticated(request: NextRequest): boolean {
  const token = getTokenFromRequest(request)
  if (!token) return false

  const user = verifyToken(token)
  return user !== null && user.role === 'admin'
} 