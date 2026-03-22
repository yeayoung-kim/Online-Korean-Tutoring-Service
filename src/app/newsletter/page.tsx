'use client'

import { useState } from 'react'
import Link from 'next/link'
import NewsletterPayPal from '@/components/NewsletterPayPal'

// 뉴스레터 페이지 메타데이터는 layout.tsx에서 동적으로 생성됩니다

export default function NewsletterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    // 입력 검증
    if (!name.trim() || !email.trim()) {
      setError('Please fill in all fields')
      setIsSubmitting(false)
      return
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setIsSubmitting(false)
      return
    }
    
    // 이메일 중복 체크만 수행 (데이터베이스에 저장하지 않음)
    try {
      const response = await fetch('/api/newsletter-check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim()
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        console.log('Email check passed:', data)
        setShowPayment(true)
      } else {
        setError(data.error || 'Email validation failed')
      }
    } catch (error) {
      console.error('API call error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentSuccess = () => {
    setIsSubmitted(true)
    setShowPayment(false)
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
    setShowPayment(false)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-gray-100">
          <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✨</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome!</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your newsletter subscription is complete!<br />
            We'll send you a new Korean expression<br />
            every morning at 8 AM.
          </p>
          <Link 
            href="/"
            className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent hover:from-pink-600 hover:to-purple-700 transition-all duration-300">
            Yeayoung Korean!
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="w-24 h-24 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <span className="text-4xl">📬</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Daily Korean
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent block">
              Newsletter
            </span>
          </h1>
          
          {/* Price Badge */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-full shadow-lg">
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold">$2</span>
                <span className="text-sm opacity-90">/month</span>
              </div>
            </div>
          </div>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Learn a new Korean expression every morning at 8 AM<br />
            and naturally improve your Korean skills
          </p>
        </div>

        {/* What You'll Get */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">What You'll Receive Daily</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">One Sentence Daily</h3>
              <p className="text-gray-600 leading-relaxed">Learn one natural Korean sentence that's commonly used in real-life situations every day.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Detailed Explanation</h3>
              <p className="text-gray-600 leading-relaxed">Get comprehensive explanations of meaning, grammar structure, and cultural nuances that only native speakers know.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Practical Applications</h3>
              <p className="text-gray-600 leading-relaxed">Discover various expressions and usage methods for similar situations to expand your Korean vocabulary.</p>
            </div>
          </div>
        </div>

        {/* Newsletter Preview */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Newsletter Preview</h2>
          
          <div className="max-w-2xl mx-auto">
            {/* Email Preview */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Email Header */}
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Daily Korean Newsletter</h3>
                    <p className="text-pink-100 text-sm">January 15, 2024 (Mon) • 8:00 AM</p>
                  </div>
                  <div className="text-2xl">🌸</div>
                </div>
              </div>
              
              {/* Email Content */}
              <div className="p-8">
                <div className="text-center mb-6">
                  <p className="text-gray-600 text-sm mb-2">Today's Korean Expression</p>
                  <h4 className="text-2xl font-bold text-gray-800">Day 15</h4>
                </div>
                
                {/* Today's Sentence */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-xl mb-6">
                  <p className="text-2xl text-gray-800 font-medium text-center mb-2">
                    "오늘 하루도 수고하셨어요!"
                  </p>
                  <p className="text-gray-600 text-center italic">
                    "You worked hard today too!"
                  </p>
                </div>
                
                {/* Explanation */}
                <div className="space-y-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-800 mb-2">💡 Grammar Explanation</h5>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      <strong>-셨어요</strong> is an honorific expression used to show respect for someone's actions. 
                      It's perfect for colleagues, supervisors at work, or people you meet for the first time.
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-800 mb-2">🎯 Usage Situations</h5>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Perfect for saying goodbye to colleagues after work, thanking a taxi driver, 
                      or greeting store employees. It's versatile for many daily situations.
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-800 mb-2">🔄 Similar Expressions</h5>
                    <ul className="text-gray-700 text-sm space-y-1">
                      <li>• 오늘도 고생하셨습니다 (more formal version)</li>
                      <li>• 수고했어 (casual, for close friends)</li>
                      <li>• 고생 많으셨어요 (more general expression)</li>
                    </ul>
                  </div>
                </div>
                
                <div className="text-center text-xs text-gray-500 border-t pt-4">
                  See you tomorrow at 8 AM! 📚✨
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Form */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Start Learning Today!</h2>
              <p className="text-gray-600">
                Learn Korean daily for just $2/month
              </p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {!showPayment ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-900"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-900"
                    placeholder="your@email.com"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Continue to Payment'
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">Almost there!</h3>
                  <p className="text-green-700 text-sm">
                    Complete your payment to start receiving daily Korean lessons
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-2">Subscription Details:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Name:</strong> {name}</p>
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Price:</strong> $2.00/month</p>
                  </div>
                </div>

                <NewsletterPayPal
                  name={name}
                  email={email}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
                
                <button
                  onClick={() => setShowPayment(false)}
                  className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm underline"
                >
                  ← Back to edit information
                </button>
              </div>
            )}
            
            <p className="text-xs text-gray-500 text-center mt-6">
              Unsubscribe anytime. We never send spam.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 