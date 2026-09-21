'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'CANCELLED';
  customer: {
    name: string;
    email: string;
  };
  service: {
    name: string;
    price: string;
  };
}

export default function BusinessBookingsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'PAST'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'BUSINESS_OWNER') {
      router.push('/');
      return;
    }
    loadBookings();
  }, [user, token, authLoading]);

  const loadBookings = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data: any = await api.getBusinessBookings(token);
      setBookings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'ALL') return true;
    const bookingDate = new Date(booking.startTime);
    const now = new Date();
    if (filter === 'UPCOMING') {
      return bookingDate > now && booking.status === 'CONFIRMED';
    }
    return bookingDate <= now || booking.status === 'CANCELLED';
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-3 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All customer bookings for your services</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5">
          {['ALL', 'UPCOMING', 'PAST'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:border-blue-500'
              }`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-xs">{error}</p>
          </div>
        )}

        {filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="text-3xl mb-3">📭</div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No bookings found</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {filter === 'UPCOMING' && 'No upcoming bookings right now'}
              {filter === 'PAST' && 'No past bookings yet'}
              {filter === 'ALL' && 'Bookings will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {booking.service.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          booking.status === 'CONFIRMED'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {booking.customer.name} · {booking.customer.email}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-600 dark:text-gray-300">
                      <span>🗓 {formatDateTime(booking.startTime)}</span>
                      <span>₹{booking.service.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
