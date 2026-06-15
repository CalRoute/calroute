import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-[#0D7377]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-[#0D7377]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-[#0D7377] uppercase tracking-widest mb-3">404</p>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Page not found</h1>
      <p className="text-gray-500 text-base max-w-sm mb-8">
        This page doesn&apos;t exist. The link may have been moved, deleted, or you may have mistyped the URL.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard"
          className="bg-[#0D7377] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0a5f63] transition-colors"
        >
          Go to dashboard
        </Link>
        <Link
          href="/"
          className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
