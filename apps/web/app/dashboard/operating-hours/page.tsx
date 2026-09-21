'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const DAYS = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
  { key: 'SATURDAY', label: 'Saturday' },
  { key: 'SUNDAY', label: 'Sunday' },
];

interface DayHours {
  dayOfWeek: string;
  openingTime: string;
  closingTime: string;
  enabled: boolean;
}

export default function OperatingHoursPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [hours, setHours] = useState<DayHours[]>(
    DAYS.map((day) => ({
      dayOfWeek: day.key,
      openingTime: '09:00',
      closingTime: '18:00',
      enabled: false,
    }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'BUSINESS_OWNER') {
      router.push('/');
      return;
    }
    loadOperatingHours();
  }, [user, token, authLoading]);

  const loadOperatingHours = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data: any = await api.getOperatingHours(token);
      setHours(
        DAYS.map((day) => {
          const existing = data.find((h: any) => h.dayOfWeek === day.key);
          return existing
            ? { dayOfWeek: day.key, openingTime: existing.openingTime, closingTime: existing.closingTime, enabled: true }
            : { dayOfWeek: day.key, openingTime: '09:00', closingTime: '18:00', enabled: false };
        })
      );
    } catch (err) {
      // No hours set yet — keep defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const enabledHours = hours
        .filter((h) => h.enabled)
        .map((h) => ({ dayOfWeek: h.dayOfWeek, openingTime: h.openingTime, closingTime: h.closingTime }));
      await api.updateOperatingHours({ hours: enabledHours }, token!);
      setSuccess('Operating hours saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayOfWeek: string) => {
    setHours(hours.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, enabled: !h.enabled } : h)));
  };

  const updateTime = (dayOfWeek: string, field: 'openingTime' | 'closingTime', value: string) => {
    setHours(hours.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h)));
  };

  const applyToAll = () => {
    const firstEnabled = hours.find((h) => h.enabled);
    if (!firstEnabled) return;
    setHours(
      hours.map((h) => ({ ...h, openingTime: firstEnabled.openingTime, closingTime: firstEnabled.closingTime }))
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-3 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Operating Hours</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Set when you're open each day</p>
          </div>
          <button
            onClick={applyToAll}
            className="px-3 py-1.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-medium hover:border-blue-500 transition-colors shrink-0"
          >
            Apply first to all
          </button>
        </div>

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

        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
          {DAYS.map((day) => {
            const dayHours = hours.find((h) => h.dayOfWeek === day.key)!;
            return (
              <div key={day.key} className="p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => toggleDay(day.key)}
                      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                        dayHours.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                      aria-label={`Toggle ${day.label}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          dayHours.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium ${dayHours.enabled ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                      {day.label}
                    </span>
                  </div>

                  {dayHours.enabled ? (
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <input
                        type="time"
                        value={dayHours.openingTime}
                        onChange={(e) => updateTime(day.key, 'openingTime', e.target.value)}
                        className="min-w-0 flex-1 sm:w-24 px-2 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                      <span className="text-gray-400 text-xs">–</span>
                      <input
                        type="time"
                        value={dayHours.closingTime}
                        onChange={(e) => updateTime(day.key, 'closingTime', e.target.value)}
                        className="min-w-0 flex-1 sm:w-24 px-2 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">Closed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Hours'}
        </button>
      </div>
    </div>
  );
}
