import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">CalRoute</h1>
        <p className="text-xl text-gray-500 mb-8">
          Connect multiple Google Calendars. Share one link.
          Let your team&apos;s availability speak for itself.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl text-base font-medium hover:bg-blue-700 transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/book/demo"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl text-base font-medium hover:bg-gray-50 transition-colors"
          >
            See a demo
          </Link>
        </div>
      </div>
    </main>
  )
}
