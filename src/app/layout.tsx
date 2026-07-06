import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CalRoute | Smart scheduling for teams',
  description: 'Connect multiple Google Calendars and share a single booking link.',
  icons: {
    icon: '/favicon-logo.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning style={{ colorScheme: 'light' }}>
      <body className={inter.className} suppressHydrationWarning>{children}</body>
    </html>
  )
}
