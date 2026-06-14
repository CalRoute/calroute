import Link from 'next/link'

export default function PublicHeader() {
  return (
    <header className="bg-[#F7F4EF] border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <svg viewBox="0 0 100 100" className="w-9 h-9 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="pubHeaderGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <g transform="translate(15, 12)">
              <rect x="0" y="8" width="70" height="72" rx="14" fill="#1e293b" />
              <path d="M 0 20 L 70 20 L 70 20 C 70 13.37, 63.63 8, 56 8 L 14 8 C 6.37 8, 0 13.37, 0 20 Z" fill="#334155" />
              <rect x="16" y="0" width="8" height="14" rx="4" fill="#64748b" />
              <rect x="46" y="0" width="8" height="14" rx="4" fill="#64748b" />
              <path d="M 12 56 C 24 56, 26 38, 44 38" fill="none" stroke="url(#pubHeaderGrad)" strokeWidth="7" strokeLinecap="round" />
              <rect x="36" y="30" width="16" height="16" rx="4" fill="none" stroke="#ffffff" strokeWidth="3" />
              <circle cx="44" cy="38" r="3.5" fill="#ffffff" />
              <path d="M 44 38 L 78 38" fill="none" stroke="url(#pubHeaderGrad)" strokeWidth="7" strokeLinecap="round" />
              <path d="M 69 30 L 78 38 L 69 46" fill="none" stroke="url(#pubHeaderGrad)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
          <span className="text-xl font-bold text-gray-900 group-hover:text-[#0D7377] transition-colors">
            Cal<span className="text-[#0D7377]">Route</span>
          </span>
        </Link>
      </div>
    </header>
  )
}
