import Link from 'next/link'

export default function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#F7F4EF] border-t border-gray-200 px-4 sm:px-6 py-6 sm:py-8 mt-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs sm:text-sm text-gray-600">
          <div className="order-2 sm:order-1">© {currentYear} CalRoute. All rights reserved.</div>
          <div className="order-1 sm:order-2 flex items-center gap-3 sm:gap-6 flex-wrap">
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">
              Terms
            </Link>
            <a href="mailto:hello@calroute.me" className="hover:text-gray-900 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
