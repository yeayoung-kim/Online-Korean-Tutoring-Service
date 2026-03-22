import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authenticated = isAuthenticated(request)
    
    if (authenticated) {
      return NextResponse.json({ authenticated: true }, { status: 200 })
    } else {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }
  } catch (error) {
    console.error('인증 확인 오류:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
} 