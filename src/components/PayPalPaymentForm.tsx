'use client'

import { useState } from 'react'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { paypalConfig, PayPalPaymentData } from '@/lib/paypal'
import { getUserTimezone } from '@/lib/timezone'

interface PayPalPaymentFormProps {
  amount: number
  currency?: string
  name: string
  email: string
  slots: any[]
  pricePerSession: number
}

export default function PayPalPaymentForm({
  amount,
  currency = 'USD',
  name,
  email,
  slots,
  pricePerSession
}: PayPalPaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [paymentCompleted, setPaymentCompleted] = useState(false)

  const handlePaymentSuccess = async (paymentData: PayPalPaymentData) => {
    setLoading(true)
    setMessage('')

    try {
      // 1. 먼저 예약 가능성 확인
      const availabilityResponse = await fetch('/api/check-booking-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slots: slots,
        }),
      })

      const availabilityData = await availabilityResponse.json()

      if (!availabilityResponse.ok) {
        throw new Error(availabilityData.error || 'Availability check failed')
      }

      if (!availabilityData.available) {
        // 중복 예약이 있는 경우
        setMessage(`❌ ${availabilityData.message} Please go back and select different times.`)
        
        // 3초 후 예약 페이지로 리다이렉트
        setTimeout(() => {
          const slotsParam = encodeURIComponent(JSON.stringify(slots))
          const params = new URLSearchParams({
            slots: slotsParam,
            name: name,
            email: email,
            price: pricePerSession.toString()
          })
          window.location.href = `/book?${params.toString()}`
        }, 2000)
        
        setLoading(false)
        return
      }

      // 2. 결제 성공 후 예약 정보 저장
      const userTimezone = getUserTimezone() // 사용자 시간대 감지
      const bookingResponse = await fetch('/api/complete-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          slots,
          pricePerSession,
          paypalOrderId: paymentData.orderID,
          paypalPayerId: paymentData.payerID,
          paypalPaymentId: paymentData.paymentID,
          userTimezone, // 사용자 시간대 정보 추가
        }),
      })

      const bookingData = await bookingResponse.json()

      if (bookingResponse.ok) {
        setPaymentCompleted(true)
        
        console.log('Payment completed:', {
          name,
          email,
          slots: slots.length,
          totalAmount: (amount / 100).toString(),
          paypalOrderId: paymentData.orderID,
        })
        
        // Redirect to success page immediately
        const slotsParam = encodeURIComponent(JSON.stringify(slots))
        const params = new URLSearchParams({
          name,
          email,
          slots: slotsParam,
          totalAmount: (amount / 100).toString()
        })
        
        window.location.href = `/book/success?${params.toString()}`
      } else {
        setMessage(`Booking failed: ${bookingData.error}`)
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const createOrder = async (data: any, actions: any) => {
    try {
      // 서버 사이드에서 PayPal 주문 생성
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'USD',
          description: `Korean Tutoring - ${slots.length} lesson(s)`,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order')
      }

      return result.orderID
    } catch (error) {
      console.error('Order creation error:', error)
      throw error
    }
  }

  const onApprove = (data: any, actions: any) => {
    return actions.order.capture().then((details: PayPalPaymentData) => {
      handlePaymentSuccess(details)
    })
  }

  const onError = (err: any) => {
    setMessage(`PayPal Error: ${err.message || 'Payment failed'}`)
  }

  return (
    <div className="space-y-4">
      {message && !paymentCompleted && (
        <div className={`p-3 rounded text-center text-base font-medium ${
          message.includes('❌')
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}
      
      {loading && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded text-center">
          Processing payment...
        </div>
      )}
      
      {!paymentCompleted && !loading && (
        <PayPalScriptProvider 
          options={{
            ...paypalConfig,
            currency: 'USD',
          }}
        >
          <PayPalButtons
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onError}
            style={{
              layout: 'vertical',
              color: 'blue',
              shape: 'rect',
              label: 'pay',
            }}
          />
        </PayPalScriptProvider>
      )}
      
      {paymentCompleted && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded text-center">
          Payment completed successfully!
        </div>
      )}
    </div>
  )
} 