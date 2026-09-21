import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                B
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">Buywalkin</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Book local services instantly. Simple scheduling for customers, powerful tools for businesses.
            </p>
          </div>

          {/* For Customers */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Customers</h4>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li><Link href="/services" className="hover:text-blue-600 dark:hover:text-blue-400">Browse Services</Link></li>
              <li><Link href="/register" className="hover:text-blue-600 dark:hover:text-blue-400">Create Account</Link></li>
              <li><Link href="/my-bookings" className="hover:text-blue-600 dark:hover:text-blue-400">My Bookings</Link></li>
            </ul>
          </div>

          {/* For Business */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Business</h4>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li><Link href="/register" className="hover:text-blue-600 dark:hover:text-blue-400">Register Business</Link></li>
              <li><Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400">Dashboard</Link></li>
              <li><Link href="/dashboard/services" className="hover:text-blue-600 dark:hover:text-blue-400">Manage Services</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Platform</h4>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Real-time availability
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Secure bookings
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Instant confirmation
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-6 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Buywalkin. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Built for seamless service booking
          </p>
        </div>
      </div>
    </footer>
  );
}
