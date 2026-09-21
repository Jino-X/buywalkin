'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, token } = useAuth();
  const [service, setService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadService();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, [params.id]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailability();
    }
  }, [selectedDate]);

  const loadService = async () => {
    try {
      const data = await api.getService(params.id);
      setService(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      setSlotsLoading(true);
      const data: any = await api.getAvailability(params.id, selectedDate);
      setSlots(data.slots || []);
    } catch (err: any) {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'CUSTOMER') {
      setError('Only customers can book services');
      return;
    }

    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    setBookingLoading(true);
    setError('');

    try {
      const startDateTime = new Date(`${selectedDate}T${selectedSlot}:00`);
      await api.createBooking(
        {
          serviceId: params.id,
          startTime: startDateTime.toISOString(),
        },
        token!
      );
      setSuccess('Booking confirmed! Redirecting...');
      setTimeout(() => router.push('/my-bookings'), 1500);
    } catch (err: any) {
      setError(err.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-3 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Service not found</p>
          <Link href="/services" className="text-sm text-blue-600 hover:underline">← Back to services</Link>
        </div>
      </div>
    );
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link href="/services" className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 mb-4">
          ← Back to services
        </Link>

        {/* Service Info */}
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{service.name}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4z" clipRule="evenodd" />
                </svg>
                {service.business?.name}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">₹{service.price}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 justify-end">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {service.durationMinutes} min
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{service.description}</p>
        </div>

        {/* Booking */}
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Book an appointment</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-xs">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-300 text-xs">{success}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                }}
                min={minDate.toISOString().split('T')[0]}
                max={maxDate.toISOString().split('T')[0]}
                className="w-full sm:w-56 px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              />
            </div>

            {slotsLoading ? (
              <div className="flex items-center gap-2 py-6 justify-center">
                <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-xs text-gray-500">Loading slots...</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">No slots available — business may be closed this day</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Time</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.startTime}
                        onClick={() => slot.available && setSelectedSlot(slot.startTime)}
                        disabled={!slot.available}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                          selectedSlot === slot.startTime
                            ? 'bg-blue-600 text-white'
                            : slot.available
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                            : 'bg-gray-50 dark:bg-gray-900 text-gray-300 dark:text-gray-600 cursor-not-allowed line-through'
                        }`}
                      >
                        {slot.startTime}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={!selectedSlot || bookingLoading}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {bookingLoading ? 'Booking...' : user ? 'Confirm Booking' : 'Login to Book'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
