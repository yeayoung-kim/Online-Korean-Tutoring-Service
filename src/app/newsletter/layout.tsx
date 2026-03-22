import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Daily Korean Newsletter - $2/month | Yeayoung Korean",
  description: "Learn Korean daily with our newsletter! Get a new Korean expression every morning at 8 AM with detailed explanations and practical usage. Only $2/month.",
  keywords: ["Korean newsletter", "Daily Korean", "Learn Korean", "Korean expressions", "Korean language learning"],
  openGraph: {
    title: "Daily Korean Newsletter - $2/month",
    description: "Learn Korean daily with our newsletter! Get a new Korean expression every morning at 8 AM with detailed explanations and practical usage. Only $2/month.",
    url: 'https://reservation-lake.vercel.app/newsletter',
    images: [
      {
        url: '/api/og?title=Daily Korean Newsletter&description=Learn Korean expressions daily for just $2/month',
        width: 1200,
        height: 630,
        alt: 'Daily Korean Newsletter - Learn Korean expressions daily',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Daily Korean Newsletter - $2/month",
    description: "Learn Korean daily with our newsletter! Get a new Korean expression every morning at 8 AM.",
    images: ['/api/og?title=Daily Korean Newsletter&description=Learn Korean expressions daily for just $2/month'],
  },
}

export default function NewsletterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 