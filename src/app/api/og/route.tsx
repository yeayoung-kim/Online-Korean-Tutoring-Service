import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'Yeayoung Korean!'
    const description = searchParams.get('description') || 'Learn Korean with Native Speaker'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f9ff',
            backgroundImage: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '80px',
                marginRight: '20px',
              }}
            >
              🇰🇷
            </div>
            <div
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {title}
            </div>
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: '36px',
              color: '#374151',
              textAlign: 'center',
              marginBottom: '60px',
              maxWidth: '900px',
              lineHeight: '1.4',
            }}
          >
            {description}
          </div>

          {/* Features */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '60px',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>👨‍🏫</div>
              <div style={{ fontSize: '24px', color: '#1f2937', fontWeight: '600' }}>
                1-on-1 Lessons
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📧</div>
              <div style={{ fontSize: '24px', color: '#1f2937', fontWeight: '600' }}>
                Daily Newsletter
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎯</div>
              <div style={{ fontSize: '24px', color: '#1f2937', fontWeight: '600' }}>
                Personalized
              </div>
            </div>
          </div>

          {/* CTA */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#ec4899',
              color: 'white',
              padding: '20px 40px',
              borderRadius: '50px',
              fontSize: '28px',
              fontWeight: 'bold',
              boxShadow: '0 10px 25px rgba(236, 72, 153, 0.3)',
            }}
          >
            Book Your Lesson Today! 🚀
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              fontSize: '20px',
              color: '#6b7280',
            }}
          >
            reservation-lake.vercel.app
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
} 