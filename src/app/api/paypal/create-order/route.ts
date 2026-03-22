import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'USD', description } = await request.json()

    // Debug logs for environment variables
    console.log('CLIENT_ID:', process.env.PAYPAL_CLIENT_ID);
    console.log('CLIENT_SECRET:', process.env.PAYPAL_CLIENT_SECRET);
    // 1. PayPal OAuth 토큰 받기
    const tokenResponse = await fetch(`${process.env.PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!tokenResponse.ok) {
      console.error('PayPal OAuth Error:', await tokenResponse.text())
      return NextResponse.json(
        { error: 'PayPal authentication failed' },
        { status: 500 }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // 2. PayPal 주문 생성
    const orderResponse = await fetch(`${process.env.PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: (amount / 100).toFixed(2)
            },
            description: description || 'Korean Tutoring Lesson'
          }
        ]
      })
    })

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text()
      console.error('PayPal Order Creation Error:', errorData)
      return NextResponse.json(
        { error: 'Failed to create PayPal order' },
        { status: 500 }
      )
    }

    const orderData = await orderResponse.json()

    return NextResponse.json({
      success: true,
      orderID: orderData.id,
      links: orderData.links
    })

  } catch (error) {
    console.error('PayPal API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 