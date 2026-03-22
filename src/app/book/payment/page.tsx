'use client'
export const dynamic = "force-dynamic";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import PayPalPaymentForm from '@/components/PayPalPaymentForm'
import { format, parseISO } from 'date-fns'

function PaymentPage() {
  const searchParams = useSearchParams()
  const slotsParam = searchParams.get('slots')
  const name = searchParams.get('name') || ''
  const email = searchParams.get('email') || ''
  const pricePerSession = parseFloat(searchParams.get('price') || '25')

  const selectedSlots = useMemo(() => {
    try {
      return slotsParam ? JSON.parse(decodeURIComponent(slotsParam)) : []
    } catch {
      return []
    }
  }, [slotsParam])

  const totalAmount = selectedSlots.length * pricePerSession // Custom price per session

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Payment</h1>
        {/* Booking Summary */}
        <div className="mb-8 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="font-semibold">Name</span>
              <span>{name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <span className="font-semibold">Email</span>
              <span>{email}</span>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              {selectedSlots.map((slot: {date: string, time: string}, i: number) => (
                <div key={i} className="flex items-center gap-2 text-gray-800">
                  <span className="font-mono text-sm">{format(parseISO(slot.date), 'MMM d, yyyy (E)')}</span>
                  <span className="text-blue-600 font-bold">{slot.time}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-right text-xl font-bold text-blue-700">
            Total Amount: ${totalAmount.toFixed(2)}
          </div>
        </div>
        {/* PayPal Payment Form */}
        <div className="bg-white rounded-lg shadow p-4 border">
          <PayPalPaymentForm 
            amount={totalAmount * 100} 
            currency="USD"
            name={name}
            email={email}
            slots={selectedSlots}
            pricePerSession={pricePerSession}
          />
        </div>
      </div>
    </div>
  )
}

export default function PaymentPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentPage />
    </Suspense>
  );
} 