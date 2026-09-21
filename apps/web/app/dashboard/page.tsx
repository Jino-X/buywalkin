'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBusiness, setShowCreateBusiness] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'BUSINESS_OWNER') {
      router.push('/');
      return;
    }
    loadDashboardData();
  }, [user, token, authLoading]);

  const loadDashboardData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [businessData, servicesData, bookingsData] = await Promise.allSettled([
        api.getMyBusiness(token),
        api.getMyServices(token),
        api.getBusinessBookings(token),
      ]);

      if (businessData.status === 'fulfilled') setBusiness(businessData.value);
      if (servicesData.status === 'fulfilled') setServices(servicesData.value as any);
      if (bookingsData.status === 'fulfilled') setBookings(bookingsData.value as any);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.createBusiness({ name: businessName, description: businessDescription }, token!);
      setShowCreateBusiness(false);
      loadDashboardData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-3 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-center">
          <div className="text-3xl mb-3">🏢</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create Your Business</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Set up your profile to start receiving bookings</p>

          {!showCreateBusiness ? (
            <button
              onClick={() => setShowCreateBusiness(true)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              Create Business
            </button>
          ) : (
            <form onSubmit={handleCreateBusiness} className="text-left space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-300 text-xs">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Business Name *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  placeholder="My Business"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  placeholder="Tell customers about your business..."
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                  Create
                </button>
                <button type="button" onClick={() => setShowCreateBusiness(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'CONFIRMED' && new Date(b.startTime) > new Date()
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{business.name}</h1>
          {business.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{business.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Services', value: services.length, icon: '🛠️' },
            { label: 'Bookings', value: bookings.length, icon: '📋' },
            { label: 'Upcoming', value: upcomingBookings.length, icon: '🔥' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-lg mb-1">{stat.icon}</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            { href: '/dashboard/services', icon: '🛠️', title: 'Manage Services', desc: 'Add or edit services' },
            { href: '/dashboard/operating-hours', icon: '⏰', title: 'Operating Hours', desc: 'Set business hours' },
            { href: '/dashboard/bookings', icon: '📋', title: 'View Bookings', desc: 'See all bookings' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
            >
              <div className="text-xl mb-2">{action.icon}</div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {action.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{action.desc}</p>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Services */}
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Services</h2>
              <Link href="/dashboard/services" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                View all →
              </Link>
            </div>
            {services.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">No services yet</p>
            ) : (
              <div className="space-y-2">
                {services.slice(0, 5).map((service) => (
                  <div key={service.id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <span className="text-sm text-gray-900 dark:text-white truncate">{service.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-2">₹{service.price} · {service.durationMinutes}m</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookings */}
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Upcoming Bookings</h2>
              <Link href="/dashboard/bookings" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                View all →
              </Link>
            </div>
            {upcomingBookings.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">No upcoming bookings</p>
            ) : (
              <div className="space-y-2">
                {upcomingBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-900 dark:text-white truncate">{booking.service.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-2">{booking.customer.name}</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDateTime(booking.startTime)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
