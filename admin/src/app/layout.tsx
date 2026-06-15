import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CalRoute Admin',
  description: 'CalRoute admin panel',
  robots: 'noindex, nofollow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0f1117] text-white antialiased">{children}</body>
    </html>
  )
}
