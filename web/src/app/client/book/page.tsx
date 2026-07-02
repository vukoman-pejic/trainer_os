'use client';

import {
  useEffect,
  useState,
} from 'react';
import { ClientLayout } from '../../../components/layouts/client-layout';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { apiFetch } from '../../../lib/api';
import { useAuthGuard } from '../../../hooks/use-auth-guard';
import { DateTime } from 'luxon';

type Slot = {
  startAt: string;
  time: string;
  capacity: number;
  bookedCount: number;
  availableCount: number;
  isFull: boolean;
  bookedByClient: boolean;
  clientBookingId: string | null;
  isBookable: boolean;
};

type Day = {
  date: string;
  slots: Slot[];
};

type AvailabilityResponse = {
  weekStart: string;
  weekEnd: string;
  maxBookingsPerWeek: number;
  clientBookingsThisWeek: number;
  days: Day[];
};

type PopupMode =
  | 'book'
  | 'manage'
  | 'reschedule';

const APP_TIME_ZONE = 'Europe/Belgrade';

function getSlotDateTime(startAt: string) {
  return DateTime.fromISO(startAt, {
    zone: 'utc',
  }).setZone(APP_TIME_ZONE);
}

export default function ClientBookPage() {
  const authorized = useAuthGuard({
    requiredRole: 'CLIENT',
  });

  const [availability, setAvailability] =
    useState<AvailabilityResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [selectedSlot, setSelectedSlot] =
    useState<Slot | null>(null);

  const [processing, setProcessing] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState<'current' | 'next'>(
      'next'
    );

  const [popupMode, setPopupMode] =
    useState<PopupMode>('book');

  async function loadAvailability() {
    const data = await apiFetch(
      '/client/availability'
    );

    setAvailability(data);
  }

  async function confirmBooking() {
    if (!selectedSlot) return;

    try {
      setProcessing(true);

      await apiFetch('/client/book', {
        method: 'POST',
        body: JSON.stringify({
          startAt: selectedSlot.startAt,
        }),
      });

      closePopup();
      await loadAvailability();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function cancelBooking() {
    if (!selectedSlot?.clientBookingId)
      return;

    try {
      setProcessing(true);

      await apiFetch(
        `/client/bookings/${selectedSlot.clientBookingId}/cancel`,
        {
          method: 'PATCH',
        }
      );

      closePopup();
      await loadAvailability();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function rescheduleBooking(
    newSlot: Slot
  ) {
    if (!selectedSlot?.clientBookingId)
      return;

    try {
      setProcessing(true);

      await apiFetch(
        `/client/bookings/${selectedSlot.clientBookingId}/reschedule`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            startAt: newSlot.startAt,
          }),
        }
      );

      closePopup();
      await loadAvailability();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  }

  function closePopup() {
    setSelectedSlot(null);
    setPopupMode('book');
  }

  function handleSlotClick(slot: Slot) {
    if (slot.bookedByClient) {
      setSelectedSlot(slot);
      setPopupMode('manage');
      return;
    }

    if (
      slot.isBookable &&
      !slot.isFull
    ) {
      setSelectedSlot(slot);
      setPopupMode('book');
    }
  }

  function formatDay(date: string) {
    return DateTime.fromISO(date, {
      zone: APP_TIME_ZONE,
    }).toFormat('ccc dd.MM');
  }

  useEffect(() => {
    if (!authorized) return;

    async function init() {
      try {
        await loadAvailability();
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [authorized]);

  if (!authorized) {
    return null;
  }

  if (loading || !availability) {
    return (
      <ClientLayout>
        <Card className="p-8">
          Loading availability...
        </Card>
      </ClientLayout>
    );
  }

  const currentWeek =
    availability.days.slice(0, 7);

  const nextWeek =
    availability.days.slice(7, 14);

  const visibleDays = (
    activeTab === 'current'
      ? currentWeek
      : nextWeek
  ).filter((day) => {
    const date = DateTime.fromISO(day.date, {
      zone: APP_TIME_ZONE,
    });

    return date.weekday !== 7;
  });

  return (
    <ClientLayout>
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">
          Calendar
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-slate-400 md:text-base">
          Bookings are available only for
          next week. Existing bookings can
          be managed anytime.
        </p>

        <p className="mt-2 text-sm text-slate-400 md:text-base">
          Booked next week:{' '}
          {
            availability.clientBookingsThisWeek
          }
          /3
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:flex">
        <button
          onClick={() =>
            setActiveTab('current')
          }
          className={`rounded-xl px-4 py-3 text-sm transition md:px-5 md:text-base ${
            activeTab === 'current'
              ? 'bg-white/10 text-white'
              : 'bg-black/20 text-slate-400 hover:bg-white/5'
          }`}
        >
          Current Week
        </button>

        <button
          onClick={() =>
            setActiveTab('next')
          }
          className={`rounded-xl px-4 py-3 text-sm transition md:px-5 md:text-base ${
            activeTab === 'next'
              ? 'bg-white/10 text-white'
              : 'bg-black/20 text-slate-400 hover:bg-white/5'
          }`}
        >
          Next Week
        </button>
      </div>

      <div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          {visibleDays.map((day) => (
            <Card
              key={day.date}
              className="p-4"
            >
              <h2 className="mb-4 text-center font-semibold">
                {formatDay(day.date)}
              </h2>

              <div className="space-y-3">
                {day.slots
                  .filter((slot) => {
                    const date = getSlotDateTime(slot.startAt);

                    const dayOfWeek = date.weekday;
                    const hour = date.hour;

                    if (dayOfWeek === 6) {
                      return hour >= 8 && hour <= 11;
                    }

                    return true;
                  })
                  .map(
                    (slot) => (
                      <button
                    key={slot.startAt}
                    onClick={() =>
                      handleSlotClick(slot)
                    }
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      slot.bookedByClient
                        ? 'border-violet-500 bg-violet-500/20'
                        : !slot.isBookable
                        ? 'border-white/10 bg-black/10 opacity-40'
                        : slot.isFull
                        ? 'border-red-500/20 bg-red-500/10 opacity-60'
                        : 'border-white/10 bg-black/20 hover:bg-white/5'
                    }`}
                  >
                    <p className="font-semibold">
                      {getSlotDateTime(slot.startAt).toFormat('HH:mm')}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {slot.bookedByClient
                        ? 'Your booking'
                        : !slot.isBookable
                        ? 'Current week'
                        : slot.isFull
                        ? 'Full'
                        : `${slot.availableCount} spots left`}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {selectedSlot &&
        popupMode === 'book' && (
          <div className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/70 p-4 md:items-center">
            <Card className="w-full max-w-md p-5 md:p-6">
              <h2 className="text-xl font-semibold">
                Confirm Booking
              </h2>

              <p className="mt-4 text-slate-400">
                Reserve session at{' '}
                {selectedSlot.time}?
              </p>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={closePopup}
                >
                  Close
                </Button>

                <Button
                  className="flex-1"
                  disabled={processing}
                  onClick={confirmBooking}
                >
                  {processing
                    ? 'Booking...'
                    : 'Confirm'}
                </Button>
              </div>
            </Card>
          </div>
        )}

      {selectedSlot &&
        popupMode === 'manage' && (
          <div className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/70 p-4 md:items-center">
            <Card className="w-full max-w-md p-5 md:p-6">
              <h2 className="text-xl font-semibold">
                Manage Session
              </h2>

              <p className="mt-4 text-slate-400">
                Your booking at{' '}
                {selectedSlot.time}
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Button
                  variant="ghost"
                  onClick={() =>
                    setPopupMode(
                      'reschedule'
                    )
                  }
                >
                  Reschedule
                </Button>

                <Button
                  className="flex-1 border border-red-500/30 text-red-400 hover:bg-red-500/10"
                  disabled={processing}
                  onClick={cancelBooking}
                >
                  {processing
                    ? 'Cancelling...'
                    : 'Cancel Booking'}
                </Button>

                <Button
                  variant="ghost"
                  onClick={closePopup}
                >
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}

      {selectedSlot &&
        popupMode === 'reschedule' && (
          <div className="fixed inset-0 z-[99999] overflow-auto bg-black/80 p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
              <Card className="p-5 md:p-6">
                <h2 className="mb-6 text-xl font-semibold md:text-2xl">
                  Select New Slot
                </h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
                  {visibleDays.map((day) => (
                    <Card
                      key={day.date}
                      className="p-4"
                    >
                      <h3 className="mb-4 text-center font-semibold">
                        {formatDay(day.date)}
                      </h3>

                      <div className="space-y-3">
                        {day.slots
                          .filter((slot) => {
                            const date = getSlotDateTime(slot.startAt);

                            const dayOfWeek = date.weekday;
                            const hour = date.hour;

                            if (dayOfWeek === 6) {
                              return hour >= 8 && hour <= 11;
                            }

                            return true;
                          })
                          .map((slot) => (
                            <button
                              key={slot.startAt}
                              disabled={
                                processing ||
                                slot.isFull ||
                                slot.bookedByClient ||
                                !slot.isBookable
                              }
                              onClick={() =>
                                rescheduleBooking(slot)
                              }
                              className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                slot.bookedByClient
                                  ? 'border-violet-500 bg-violet-500/20'
                                  : !slot.isBookable
                                  ? 'border-white/10 bg-black/10'
                                  : slot.isFull
                                  ? 'border-red-500/20 bg-red-500/10'
                                  : 'border-white/10 bg-black/20 hover:bg-white/5'
                              }`}
                            >
                              <div>
                                <p className="font-semibold">
                                  {getSlotDateTime(slot.startAt).toFormat('HH:mm')}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {slot.bookedByClient
                                    ? 'Current booking'
                                    : !slot.isBookable
                                    ? 'Current week'
                                    : slot.isFull
                                    ? 'Full'
                                    : `${slot.availableCount} spots left`}
                                </p>
                              </div>

                              <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-300">
                                {slot.bookedCount}/{slot.capacity}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  className="mt-6"
                  onClick={closePopup}
                >
                  Close
                </Button>
              </Card>
            </div>
          </div>
        )}
    </ClientLayout>
  );
}