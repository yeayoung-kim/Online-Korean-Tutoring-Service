import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yeayoung Korean! - Learn Korean with Native Speaker",
  description: "Learn Korean naturally with Yeayoung! Personalized 1-on-1 lessons, daily newsletter, and fun learning experience. Book your Korean lesson today!",
  keywords: ["Korean", "Korean lessons", "Korean tutor", "Learn Korean", "Korean language", "Korean teacher", "Korean classes"],
  authors: [{ name: "Yeayoung Korean" }],
  creator: "Yeayoung Korean",
  publisher: "Yeayoung Korean",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://reservation-lake.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Yeayoung Korean! - Learn Korean with Native Speaker",
    description: "Learn Korean naturally with Yeayoung! Personalized 1-on-1 lessons, daily newsletter, and fun learning experience. Book your Korean lesson today!",
    url: 'https://reservation-lake.vercel.app',
    siteName: 'Yeayoung Korean',
    images: [
      {
        url: '/api/og?title=Yeayoung Korean!&description=Learn Korean with Native Speaker',
        width: 1200,
        height: 630,
        alt: 'Yeayoung Korean - Learn Korean with Native Speaker',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Yeayoung Korean! - Learn Korean with Native Speaker",
    description: "Learn Korean naturally with Yeayoung! Personalized 1-on-1 lessons, daily newsletter, and fun learning experience.",
    images: ['/api/og?title=Yeayoung Korean!&description=Learn Korean with Native Speaker'],
    creator: '@yeayoungkorean',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
