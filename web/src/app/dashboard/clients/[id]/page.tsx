'use client';

import { useEffect, useState } from 'react';
import {
  Mail,
  Phone,
  Target,
  HeartPulse,
  StickyNote,
  Calendar,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { TrainerLayout } from '../../../../components/layouts/trainer-layout';
import { Card } from '../../../../components/ui/card';
import { apiFetch } from '../../../../lib/api';
import { useAuthGuard } from '../../../../hooks/use-auth-guard';
import { Button } from '../../../../components/ui/button';

type ClientDetails = {
  id: string;
  notes?: string | null;
  injuries?: string | null;
  goals?: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
  clientPackages: {
    id: string;
    remainingSessions: number;
    paymentStatus: 'PAID' | 'UNPAID';
    package: {
      id: string;
      name: string;
      sessionCount: number;
    };
  }[];
};

type PackageOption = {
  id: string;
  name: string;
  sessionCount: number;
};

type Booking = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
};

const SLOT_OPTIONS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
];

export default function ClientDetailsPage() {
  const authorized = useAuthGuard({
    requiredRole: 'TRAINER',
  });

  const params = useParams();
  const clientId = params.id as string;

  const today = new Date();
  const todayDate = today.toISOString().split('T')[0];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const defaultDate =
    tomorrow.toISOString().split('T')[0];

  const [client, setClient] =
    useState<ClientDetails | null>(null);
  const [packages, setPackages] = useState<
    PackageOption[]
  >([]);
  const [bookings, setBookings] = useState<
    Booking[]
  >([]);
  const [loading, setLoading] =
    useState(true);
  const [assigning, setAssigning] =
    useState(false);
  const [bookingLoading, setBookingLoading] =
    useState(false);
  const [cancelLoadingId, setCancelLoadingId] =
    useState<string | null>(null);
  const [rescheduleBookingId, setRescheduleBookingId] =
    useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] =
    useState(defaultDate);
  const [rescheduleTime, setRescheduleTime] =
    useState('');
  const [rescheduleLoading, setRescheduleLoading] =
    useState(false);
  const [selectedDate, setSelectedDate] =
    useState(defaultDate);
  const [selectedTime, setSelectedTime] =
    useState('');
  const [error, setError] =
    useState('');

  async function loadClientData() {
    const clientData = await apiFetch(
      `/clients/${clientId}`
    );

    const packagesData =
      await apiFetch('/packages');

    const bookingsData = await apiFetch(
      `/clients/${clientId}/bookings`
    );

    setClient(clientData);
    setPackages(packagesData);
    setBookings(bookingsData);
  }

  async function assignPackage(packageId: string) {
    try {
      setAssigning(true);

      await apiFetch(`/clients/${clientId}/packages`, {
        method: 'POST',
        body: JSON.stringify({
          packageId,
        }),
      });

      await loadClientData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAssigning(false);
    }
  }

  async function markPaid(clientPackageId: string) {
    try {
      await apiFetch(
        `/client-packages/${clientPackageId}/payment`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            paymentStatus: 'PAID',
          }),
        }
      );

      await loadClientData();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function createBooking() {
    if (!selectedDate || !selectedTime) {
      alert('Select date and time');
      return;
    }

    try {
      setBookingLoading(true);

      const isoDate =
        `${selectedDate}T${selectedTime}:00`;

      await apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          clientId,
          startAt: isoDate,
        }),
      });

      setSelectedDate(defaultDate);
      setSelectedTime('');

      await loadClientData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBookingLoading(false);
    }
  }

  async function cancelBooking(
    bookingId: string
  ) {
    try {
      setCancelLoadingId(bookingId);

      await apiFetch(
        `/bookings/${bookingId}/cancel`,
        {
          method: 'PATCH',
        }
      );

      await loadClientData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancelLoadingId(null);
    }
  }

  async function rescheduleBooking() {
    if (
      !rescheduleBookingId ||
      !rescheduleDate ||
      !rescheduleTime
    ) {
      alert('Select date and time');
      return;
    }

    try {
      setRescheduleLoading(true);

      const isoDate =
        `${rescheduleDate}T${rescheduleTime}:00`;

      await apiFetch(
        `/bookings/${rescheduleBookingId}/reschedule`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            startAt: isoDate,
          }),
        }
      );

      setRescheduleBookingId(null);
      setRescheduleDate(defaultDate);
      setRescheduleTime('');

      await loadClientData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRescheduleLoading(false);
    }
  }

  function formatBookingDate(date: string) {
    return new Intl.DateTimeFormat('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  useEffect(() => {
    if (!authorized) return;

    async function init() {
      try {
        await loadClientData();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [authorized, clientId]);

  if (!authorized) {
    return null;
  }

  return (
    <TrainerLayout>
      {loading && (
        <Card className="p-8 text-slate-400">
          Loading client...
        </Card>
      )}

      {error && (
        <Card className="p-8 text-red-400">
          {error}
        </Card>
      )}

      {client && (
        <>
          <div className="mb-8">
            <h1 className="text-4xl font-bold">
              {client.user.firstName}{' '}
              {client.user.lastName}
            </h1>

            <p className="mt-2 text-slate-400">
              Client profile overview
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="mb-6 text-xl font-semibold">
                Basic Information
              </h2>

              <div className="space-y-4 text-slate-300">
                <div className="flex items-center gap-3">
                  <Mail size={18} />
                  {client.user.email}
                </div>

                <div className="flex items-center gap-3">
                  <Phone size={18} />
                  {client.user.phone || 'No phone'}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-6 text-xl font-semibold">
                Fitness Profile
              </h2>

              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Target size={16} />
                    Goals
                  </div>

                  <p>
                    {client.goals || 'No goals set'}
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <HeartPulse size={16} />
                    Injuries
                  </div>

                  <p>
                    {client.injuries ||
                      'No injuries reported'}
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <StickyNote size={16} />
                    Notes
                  </div>

                  <p>
                    {client.notes ||
                      'No notes available'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-8">
            <Card className="p-6">
              <h2 className="mb-6 text-xl font-semibold">
                Package Management
              </h2>

              {client.clientPackages.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold">
                      {
                        client.clientPackages[0]
                          .package.name
                      }
                    </p>

                    <p className="mt-2 text-slate-400">
                      Remaining sessions:{' '}
                      {
                        client.clientPackages[0]
                          .remainingSessions
                      }
                    </p>

                    <p className="mt-2 text-slate-400">
                      Payment:{' '}
                      {
                        client.clientPackages[0]
                          .paymentStatus
                      }
                    </p>
                  </div>

                  {client.clientPackages[0]
                    .paymentStatus ===
                    'UNPAID' && (
                    <Button
                      onClick={() =>
                        markPaid(
                          client.clientPackages[0]
                            .id
                        )
                      }
                    >
                      Mark Paid
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-400">
                    No active package assigned
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {packages.map((pkg) => (
                      <Button
                        key={pkg.id}
                        disabled={assigning}
                        onClick={() =>
                          assignPackage(pkg.id)
                        }
                      >
                        {pkg.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
                <Calendar size={20} />
                Book Training
              </h2>

              <div className="space-y-4">
                <input
                  type="date"
                  min={todayDate}
                  value={selectedDate}
                  onChange={(e) =>
                    setSelectedDate(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                />

                <select
                  value={selectedTime}
                  onChange={(e) =>
                    setSelectedTime(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <option value="">
                    Select time
                  </option>

                  {SLOT_OPTIONS.map((slot) => (
                    <option
                      key={slot}
                      value={slot}
                    >
                      {slot}
                    </option>
                  ))}
                </select>

                <Button
                  disabled={
                    bookingLoading ||
                    client.clientPackages.length ===
                      0
                  }
                  onClick={createBooking}
                  className="w-full"
                >
                  {bookingLoading
                    ? 'Booking...'
                    : 'Book Session'}
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-6 text-xl font-semibold">
                Upcoming Sessions
              </h2>

              <div className="space-y-3">
                {bookings.length === 0 ? (
                  <p className="text-slate-400">
                    No bookings yet
                  </p>
                ) : (
                  bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-xl border border-white/10 p-4"
                    >
                      <p className="font-semibold">
                        {formatBookingDate(
                          booking.startAt
                        )}
                      </p>

                      {rescheduleBookingId === booking.id ? (
                        <div className="mt-4 space-y-3">
                          <input
                            type="date"
                            min={todayDate}
                            value={rescheduleDate}
                            onChange={(e) =>
                              setRescheduleDate(e.target.value)
                            }
                            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                          />

                          <select
                            value={rescheduleTime}
                            onChange={(e) =>
                              setRescheduleTime(e.target.value)
                            }
                            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                          >
                            <option value="">
                              Select time
                            </option>

                            {SLOT_OPTIONS.map((slot) => (
                              <option
                                key={slot}
                                value={slot}
                              >
                                {slot}
                              </option>
                            ))}
                          </select>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={rescheduleLoading}
                              onClick={rescheduleBooking}
                            >
                              {rescheduleLoading
                                ? 'Saving...'
                                : 'Save'}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRescheduleBookingId(null);
                                setRescheduleTime('');
                              }}
                            >
                              Close
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-sm text-slate-400">
                            {booking.status}
                          </p>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRescheduleBookingId(
                                  booking.id
                                );
                                setRescheduleDate(defaultDate);
                              }}
                            >
                              Reschedule
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={
                                cancelLoadingId === booking.id
                              }
                              onClick={() =>
                                cancelBooking(booking.id)
                              }
                            >
                              {cancelLoadingId === booking.id
                                ? 'Cancelling...'
                                : 'Cancel'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </TrainerLayout>
  );
}