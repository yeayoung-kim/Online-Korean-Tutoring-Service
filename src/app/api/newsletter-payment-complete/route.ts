import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { name, email, orderID, payerID, paymentID } = await request.json()
    
    // 입력 검증
    if (!name || !email || !orderID) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // PayPal 결제 확인을 위한 OAuth 토큰 받기
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

    // PayPal 주문 상태 확인
    const orderResponse = await fetch(`${process.env.PAYPAL_API_BASE}/v2/checkout/orders/${orderID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!orderResponse.ok) {
      console.error('PayPal Order Check Error:', await orderResponse.text())
      return NextResponse.json(
        { error: 'Failed to verify PayPal payment' },
        { status: 500 }
      )
    }

    const orderData = await orderResponse.json()
    
    // 결제 상태 확인
    if (orderData.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // 결제 금액 확인 ($2.00)
    const paidAmount = parseFloat(orderData.purchase_units[0].amount.value)
    if (paidAmount !== 2.00) {
      return NextResponse.json(
        { error: 'Invalid payment amount' },
        { status: 400 }
      )
    }

    // 구독자 정보 생성 (결제 성공 후에만 데이터베이스에 저장)
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
    
    // 기존 구독자 확인 (혹시 이미 결제된 구독자가 있는지 체크)
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', email)
      .single()

    let subscriberData

    if (existingSubscriber) {
      // 기존 구독자가 있다면 구독 연장/갱신
      const { data: updatedSubscriber, error: updateError } = await supabase
        .from('newsletter_subscribers')
        .update({
          name,
          subscription_status: 'active',
          payment_status: 'completed',
          subscription_start_date: now.toISOString(),
          subscription_end_date: nextMonth.toISOString(),
          last_payment_date: now.toISOString(),
          next_payment_date: nextMonth.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('email', email)
        .select()
        .single()

      if (updateError) {
        console.error('Database update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        )
      }

      subscriberData = updatedSubscriber
    } else {
      // 새 구독자 생성 (결제 성공 후 첫 저장)
      const { data: newSubscriber, error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert([
          {
            name,
            email,
            subscription_status: 'active',
            payment_status: 'completed',
            subscription_start_date: now.toISOString(),
            subscription_end_date: nextMonth.toISOString(),
            last_payment_date: now.toISOString(),
            next_payment_date: nextMonth.toISOString()
          }
        ])
        .select()
        .single()

      if (insertError) {
        console.error('Database insert error:', insertError)
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        )
      }

      subscriberData = newSubscriber
    }

    return NextResponse.json({
      success: true,
      message: 'Newsletter subscription payment completed successfully',
      subscriber: subscriberData,
      paypal: {
        orderID,
        payerID,
        paymentID,
        amount: paidAmount,
        status: orderData.status
      }
    })

  } catch (error) {
    console.error('Newsletter payment completion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 