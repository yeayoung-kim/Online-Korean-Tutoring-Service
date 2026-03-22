import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    paypal: {
      clientId: !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
      secretKey: !!process.env.PAYPAL_CLIENT_SECRET,
      apiBase: !!process.env.PAYPAL_API_BASE,
    }
  })
} 