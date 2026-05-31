export default function PageFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">About</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Privacy</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500 text-center">© 2026 CalRoute. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
