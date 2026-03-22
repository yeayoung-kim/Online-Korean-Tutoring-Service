import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'korean-tutoring-secret-key-2024'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123!'

// 관리자 패스워드 확인
export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    // 환경변수의 패스워드가 해시된 것인지 일반 텍스트인지 확인
    if (ADMIN_PASSWORD.startsWith('$2')) {
      // 해시된 패스워드인 경우
      return await bcrypt.compare(password, ADMIN_PASSWORD)
    } else {
      // 일반 텍스트인 경우 (개발 환경)
      return password === ADMIN_PASSWORD
    }
  } catch (error) {
    console.error('패스워드 확인 오류:', error)
    return false
  }
}

// JWT 토큰 생성
export function generateToken(payload: any): string {
  return jwt.sign(
    { 
      ...payload, 
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24시간 유효
    },
    JWT_SECRET,
    { algorithm: 'HS256' }
  )
}

// JWT 토큰 검증
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    console.error('토큰 검증 오류:', error)
    return null
  }
}

// 관리자 세션 생성
export function createAdminSession(): string {
  return generateToken({
    role: 'admin',
    iat: Math.floor(Date.now() / 1000)
  })
}

// 관리자 권한 확인
export function isValidAdminSession(token: string): boolean {
  const decoded = verifyToken(token)
  return decoded && decoded.role === 'admin'
}

// 패스워드 해시 생성 (설정용)
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
} 