import Link from 'next/link'

export default function PageHeader() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-gray-900">
          CalRoute
        </Link>
        <nav className="flex items-center gap-6">
          <a href="https://calroute.me" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Visit website
          </a>
        </nav>
      </div>
    </header>
  )
}
