'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="bg-white dark:bg-gray-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/30 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 text-center">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 rounded-full">
            Local Service Marketplace
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Book Local Services,{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Instantly
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 max-w-xl mx-auto">
            Discover salons, spas, fitness sessions and more. Check real-time availability, book your slot in seconds, and manage everything in one place.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-2.5">
            <Link
              href="/services"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Browse Services
            </Link>
            {!loading && !user && (
              <Link
                href="/register"
                className="px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:border-blue-500 transition-colors"
              >
                Get Started Free
              </Link>
            )}
            {!loading && user?.role === 'CUSTOMER' && (
              <Link
                href="/my-bookings"
                className="px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:border-blue-500 transition-colors"
              >
                My Bookings
              </Link>
            )}
            {!loading && user?.role === 'BUSINESS_OWNER' && (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:border-blue-500 transition-colors"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: '500+', label: 'Local Businesses' },
              { value: '10k+', label: 'Bookings Made' },
              { value: '4.9', label: 'Avg. Rating' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{stat.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">How It Works</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Book your next appointment in three simple steps</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', icon: '🔍', title: 'Find a Service', desc: 'Browse services from verified local businesses near you.' },
            { step: '2', icon: '📅', title: 'Pick a Time', desc: 'See real-time availability and choose a slot that works for you.' },
            { step: '3', icon: '✅', title: 'Get Confirmed', desc: 'Instant confirmation. Manage or cancel anytime from your account.' },
          ].map((item) => (
            <div key={item.step} className="relative bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
              <span className="absolute top-3 right-3 text-xs font-bold text-gray-300 dark:text-gray-700">{item.step}</span>
              <div className="text-2xl mb-2">{item.icon}</div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Why Buywalkin?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Built for both customers and businesses</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '⚡', title: 'Real-Time Slots', desc: 'Availability updates instantly — no double bookings.' },
              { icon: '🔒', title: 'Secure & Reliable', desc: 'Your data is protected with industry-standard security.' },
              { icon: '📱', title: 'Works Everywhere', desc: 'Fully responsive on mobile, tablet, and desktop.' },
              { icon: '🏢', title: 'Business Tools', desc: 'Manage services, hours, and bookings from one dashboard.' },
            ].map((f) => (
              <div key={f.title} className="bg-white dark:bg-gray-950 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="text-xl mb-2">{f.icon}</div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{f.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Business CTA */}
      {!loading && !user && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Grow Your Business with Buywalkin</h2>
            <p className="text-sm text-blue-100 mb-5 max-w-lg mx-auto">
              List your services, set your hours, and start receiving bookings — free to join.
            </p>
            <Link
              href="/register"
              className="inline-block px-5 py-2.5 bg-white text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              Register Your Business
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
