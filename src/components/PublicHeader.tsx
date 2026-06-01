import Link from 'next/link'

export default function PublicHeader() {
  return (
    <header className="bg-[#F7F4EF] border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-sm sm:text-base font-semibold text-gray-900 hover:text-[#0D7377] transition-colors">
          CalRoute
        </Link>
      </div>
    </header>
  )
}
