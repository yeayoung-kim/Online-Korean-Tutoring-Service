'use client'

import { useState } from 'react'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { paypalConfig } from '@/lib/paypal'

interface NewsletterPayPalProps {
  name: string
  email: string
  onSuccess: () => void
  onError: (error: string) => void
}

export default function NewsletterPayPal({ name, email, onSuccess, onError }: NewsletterPayPalProps) {
  const [loading, setLoading] = useState(false)

  const createOrder = async (data: any, actions: any) => {
    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 200, // $2.00 in cents
          currency: 'USD',
          description: 'Daily Korean Newsletter Subscription'
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order')
      }

      return result.orderID
    } catch (error) {
      console.error('Error creating PayPal order:', error)
      onError('Failed to create payment order')
      throw error
    }
  }

  const onApprove = async (data: any, actions: any) => {
    setLoading(true)
    
    try {
      // PayPal 결제 승인 후 뉴스레터 구독 정보 업데이트
      const response = await fetch('/api/newsletter-payment-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          orderID: data.orderID,
          payerID: data.payerID,
          paymentID: data.paymentID
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        onSuccess()
      } else {
        onError(result.error || 'Payment verification failed')
      }
    } catch (error) {
      console.error('Error completing payment:', error)
      onError('Payment completion failed')
    } finally {
      setLoading(false)
    }
  }

  const onErrorHandler = (err: any) => {
    console.error('PayPal error:', err)
    onError('Payment failed. Please try again.')
    setLoading(false)
  }

  const onCancel = () => {
    console.log('Payment cancelled')
    onError('Payment was cancelled')
    setLoading(false)
  }

  return (
    <div className="w-full">
      <PayPalScriptProvider options={{
        clientId: paypalConfig.clientId,
        currency: paypalConfig.currency,
        intent: paypalConfig.intent
      }}>
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'subscribe'
          }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onErrorHandler}
          onCancel={onCancel}
          disabled={loading}
        />
      </PayPalScriptProvider>
      
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Processing payment...</p>
        </div>
      )}
    </div>
  )
} 