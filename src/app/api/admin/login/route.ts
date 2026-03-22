import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // 환경변수에서 관리자 정보 가져오기
    const adminUsername = process.env.ADMIN_USERNAME
    const adminPasswordHashBase64 = process.env.ADMIN_PASSWORD_HASH_BASE64
    const jwtSecret = process.env.JWT_SECRET

    console.log('환경변수 확인:')
    console.log('ADMIN_USERNAME:', adminUsername)
    console.log('ADMIN_PASSWORD_HASH_BASE64:', adminPasswordHashBase64)
    console.log('JWT_SECRET:', jwtSecret ? '설정됨' : '없음')
    console.log('받은 데이터:', { username, password })

    if (!adminUsername || !adminPasswordHashBase64 || !jwtSecret) {
      console.log('환경변수 누락!')
      return NextResponse.json(
        { error: '서버 설정 오류' },
        { status: 500 }
      )
    }

    // Base64 디코딩으로 원본 해시 복원
    const adminPasswordHash = Buffer.from(adminPasswordHashBase64, 'base64').toString('utf8')
    console.log('디코딩된 해시:', adminPasswordHash)

    // 아이디 검증
    if (username !== adminUsername) {
      console.log('아이디 불일치:', username, '!=', adminUsername)
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    // 비밀번호 검증
    console.log('비밀번호 검증 시작...')
    const isPasswordValid = await bcrypt.compare(password, adminPasswordHash)
    console.log('비밀번호 검증 결과:', isPasswordValid)
    
    if (!isPasswordValid) {
      console.log('비밀번호 불일치!')
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        username: adminUsername,
        role: 'admin',
        iat: Math.floor(Date.now() / 1000)
      },
      jwtSecret,
      { expiresIn: '24h' }
    )

    // 쿠키에 토큰 설정
    const response = NextResponse.json(
      { message: '로그인 성공', token },
      { status: 200 }
    )

    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24시간
    })

    return response
  } catch (error) {
    console.error('로그인 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
} 