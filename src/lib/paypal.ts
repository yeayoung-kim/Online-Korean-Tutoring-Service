// PayPal 설정
export const paypalConfig = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
  currency: 'USD',
  intent: 'capture' as const,
}

// PayPal 결제 상태
export const PAYPAL_STATUS = {
  COMPLETED: 'COMPLETED',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
} as const

// PayPal 결제 정보 타입
export interface PayPalPaymentData {
  orderID: string
  payerID: string
  paymentID: string
  status: string
} 