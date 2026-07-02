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
import { useRouter } from 'next/navigation';
import { TrainerLayout } from '../../../../components/layouts/trainer-layout';
import { Card } from '../../../../components/ui/card';
import { apiFetch } from '../../../../lib/api';
import { useAuthGuard } from '../../../../hooks/use-auth-guard';
import { Button } from '../../../../components/ui/button';
import { DateTime } from 'luxon';

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
  upcomingSessions: Booking[];
  pastSessions: Booking[];
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

  workoutTemplate?: {
    id: string;
    name: string;
    type: 'HERCULES' | 'REFORMER';
    content: string;
  } | null;

  workoutLog?: {
    notes?: string | null;

    exercises: {
      id: string;
      name: string;
      weight?: number | null;
      reps?: number | null;
      notes?: string | null;
    }[];
  } | null;
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
];

const APP_TIME_ZONE = 'Europe/Belgrade';

function toUtcIso(date: string, time: string) {
  return DateTime.fromISO(`${date}T${time}`, {
    zone: APP_TIME_ZONE,
  })
    .toUTC()
    .toISO();
}

export default function ClientDetailsPage() {
  const authorized = useAuthGuard({
    requiredRole: 'TRAINER',
  });

  const router = useRouter();

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
  const [workouts, setWorkouts] =
    useState<
      {
        id: string;
        name: string;
        type: 'HERCULES' | 'REFORMER';
      }[]
    >([]);
  const [workoutSavingId, setWorkoutSavingId] =
    useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);
  const [deletingClient, setDeletingClient] =
    useState(false);
  const [resettingPassword, setResettingPassword] =
    useState(false);
  const [selectedWorkouts, setSelectedWorkouts] =
    useState<Record<string, string>>({});
  const [loading, setLoading] =
    useState(true);
  const [assigning, setAssigning] =
    useState(false);
  const [selectedPackage, setSelectedPackage] =
    useState<PackageOption | null>(null);
  const [showAssignConfirm, setShowAssignConfirm] =
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
  const [showWorkoutLogModal, setShowWorkoutLogModal] =
    useState(false);

  const [selectedBookingForLog, setSelectedBookingForLog] =
    useState<Booking | null>(null);

  const [exerciseLogs, setExerciseLogs] =
    useState<
      {
        name: string;
        weight?: string;
        reps?: string;
      }[]
    >([]);

  const [workoutLogNotes, setWorkoutLogNotes] =
    useState('');

  const [savingWorkoutLog, setSavingWorkoutLog] =
    useState(false);

  async function loadClientData() {
    const clientData = await apiFetch(
      `/clients/${clientId}`
    );

    const packagesData =
      await apiFetch('/packages');

    const workoutsData =
      await apiFetch('/workouts');

    setClient(clientData);
    setPackages(packagesData);
    setWorkouts(workoutsData);

    const initialSelections: Record<
      string,
      string
    > = {};

    clientData.upcomingSessions.forEach(
      (booking: any) => {
        initialSelections[booking.id] =
          booking.workoutTemplate?.id || '';
      }
    );

    setSelectedWorkouts(initialSelections);
  }

  async function assignPackage() {
    if (!selectedPackage) return;

    try {
      setAssigning(true);

      await apiFetch(`/clients/${clientId}/packages`, {
        method: 'POST',
        body: JSON.stringify({
          packageId: selectedPackage.id,
        }),
      });

      setShowAssignConfirm(false);
      setSelectedPackage(null);

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

      const isoDate = toUtcIso(selectedDate, selectedTime);

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

      const isoDate = toUtcIso(rescheduleDate, rescheduleTime);

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

  async function assignWorkout(
    bookingId: string
  ) {
    try {
      setWorkoutSavingId(bookingId);

      await apiFetch(
        `/bookings/${bookingId}/workout`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            workoutTemplateId:
              selectedWorkouts[
                bookingId
              ] || null,
          }),
        }
      );

      await loadClientData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setWorkoutSavingId(null);
    }
  }

  function openWorkoutLogModal(
    booking: Booking
  ) {
    const exercises =
      booking.workoutTemplate?.content
        ?.split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((exercise) => ({
          name: exercise,
          weight: '',
          reps: '',
        })) ?? [];

    setSelectedBookingForLog(booking);
    setExerciseLogs(exercises);
    setWorkoutLogNotes('');
    setShowWorkoutLogModal(true);
  }

  async function saveWorkoutLog() {
    if (!selectedBookingForLog) return;

    try {
      setSavingWorkoutLog(true);

      await apiFetch(
        `/bookings/${selectedBookingForLog.id}/workout-log`,
        {
          method: 'POST',
          body: JSON.stringify({
            notes: workoutLogNotes,
            exercises: exerciseLogs.map(
              (exercise) => ({
                name: exercise.name,
                weight: exercise.weight
                  ? Number(
                      exercise.weight
                    )
                  : undefined,
                reps: exercise.reps
                  ? Number(
                      exercise.reps
                    )
                  : undefined,
              })
            ),
          }),
        }
      );

      setShowWorkoutLogModal(false);

      await loadClientData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingWorkoutLog(false);
    }
  }

  async function resetClientPassword() {
    try {
      setResettingPassword(true);

      const data = await apiFetch(
        `/clients/${clientId}/reset-password`,
        {
          method: 'PATCH',
        }
      );

      alert(
        `Temporary password: ${data.tempPassword}`
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResettingPassword(false);
    }
  }

  async function deleteClient() {
    try {
      setDeletingClient(true);

      await apiFetch(
        `/clients/${clientId}`,
        {
          method: 'DELETE',
        }
      );

      router.push('/dashboard/clients');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingClient(false);
    }
  }

  function formatBookingDate(date: string) {
    return DateTime.fromISO(date, {
      zone: 'utc',
    })
      .setZone(APP_TIME_ZONE)
      .toFormat('dd.MM.yyyy. HH:mm');
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
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold">
                {client?.user?.firstName}{' '}
                {client?.user?.lastName}
              </h1>

              <p className="mt-2 text-slate-400">
                Client details and session overview
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                disabled={resettingPassword}
                onClick={resetClientPassword}
              >
                {resettingPassword
                  ? 'Resetting...'
                  : 'Reset Password'}
              </Button>

              <Button
                variant="ghost"
                onClick={() =>
                  setShowDeleteConfirm(true)
                }
              >
                Delete Client
              </Button>
            </div>
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
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setShowAssignConfirm(true);
                        }}
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
                {client.upcomingSessions.length === 0 ? (
                  <p className="text-slate-400">
                    No bookings yet
                  </p>
                ) : (
                  client.upcomingSessions.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-xl border border-white/10 p-4"
                    >
                      <p className="font-semibold">
                        {formatBookingDate(
                          booking.startAt
                        )}
                      </p>
                      {booking.workoutTemplate ? (
                        <p className="mt-2 text-sm text-violet-300">
                          {booking.workoutTemplate.name} (
                          {booking.workoutTemplate.type})
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">
                          No workout assigned
                        </p>
                      )}

                      <div className="mt-4 space-y-3">
                        <select
                          value={
                            selectedWorkouts[
                              booking.id
                            ] || ''
                          }
                          onChange={(e) =>
                            setSelectedWorkouts(
                              (
                                prev
                              ) => ({
                                ...prev,
                                [booking.id]:
                                  e.target.value,
                              })
                            )
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                        >
                          <option value="">
                            No workout
                          </option>

                          {workouts.map((workout) => (
                            <option
                              key={workout.id}
                              value={workout.id}
                            >
                              {workout.name} (
                              {workout.type})
                            </option>
                          ))}
                        </select>

                        <Button
                          size="default"
                          className="w-full"
                          disabled={
                            workoutSavingId ===
                            booking.id
                          }
                          onClick={() =>
                            assignWorkout(
                              booking.id
                            )
                          }
                        >
                          {workoutSavingId ===
                          booking.id
                            ? 'Saving...'
                            : 'Save Workout'}
                        </Button>
                      </div>

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
                              size="default"
                              disabled={rescheduleLoading}
                              onClick={rescheduleBooking}
                            >
                              {rescheduleLoading
                                ? 'Saving...'
                                : 'Save'}
                            </Button>

                            <Button
                              size="default"
                              variant="ghost"
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
                              size="default"
                              variant="ghost"
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
                              size="default"
                              variant="ghost"
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
            <Card className="p-6">
              <h2 className="mb-6 text-xl font-semibold">
                Past Sessions
              </h2>

              <div className="space-y-3">
                {client.pastSessions.length === 0 ? (
                  <p className="text-slate-400">
                    No completed sessions yet
                  </p>
                ) : (
                  client.pastSessions.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-xl border border-white/10 p-4"
                    >
                      <p className="font-semibold">
                        {formatBookingDate(
                          booking.startAt
                        )}
                      </p>

                      {booking.workoutTemplate ? (
                        <p className="mt-2 text-sm text-violet-300">
                          {booking.workoutTemplate.name} (
                          {booking.workoutTemplate.type})
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">
                          No workout assigned
                        </p>
                      )}
                      {booking.workoutLog?.exercises?.length ? (
                        <div className="mt-4 rounded-xl border border-green-500/20 p-3">
                          <p className="mb-2 text-sm font-semibold text-green-400">
                            Results Recorded
                          </p>

                          {booking.workoutLog.exercises.map(
                            (exercise) => (
                              <p
                                key={exercise.id}
                                className="text-sm text-slate-300"
                              >
                                {exercise.name}
                                {exercise.weight
                                  ? ` • ${exercise.weight}kg`
                                  : ''}
                                {exercise.reps
                                  ? ` x ${exercise.reps}`
                                  : ''}
                              </p>
                            )
                          )}
                        </div>
                      ) : (
                        <Button
                          className="mt-4"
                          onClick={() =>
                            openWorkoutLogModal(booking)
                          }
                        >
                          Record Results
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    {showDeleteConfirm && (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70">
        <Card className="w-full max-w-md p-6">
          <h2 className="text-xl font-semibold">
            Delete Client
          </h2>

          <p className="mt-4 text-slate-400">
            This will permanently remove the
            client, bookings, packages and
            history.
          </p>

          <div className="mt-6 flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() =>
                setShowDeleteConfirm(false)
              }
            >
              Cancel
            </Button>

            <Button
              variant="ghost"
              className="flex-1"
              disabled={deletingClient}
              onClick={deleteClient}
            >
              {deletingClient
                ? 'Deleting...'
                : 'Delete Client'}
            </Button>
          </div>
        </Card>
      </div>
    )}
    {showAssignConfirm && selectedPackage && (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70">
        <Card className="w-full max-w-md p-6">
          <h2 className="text-xl font-semibold">
            Assign Package
          </h2>

          <div className="mt-5 space-y-3 text-slate-300">
            <p>
              <span className="text-slate-400">
                Client:
              </span>{' '}
              {client?.user?.firstName}{' '}
              {client?.user?.lastName}
            </p>

            <p>
              <span className="text-slate-400">
                Package:
              </span>{' '}
              {selectedPackage.name}
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setShowAssignConfirm(false);
                setSelectedPackage(null);
              }}
            >
              Cancel
            </Button>

            <Button
              className="flex-1"
              disabled={assigning}
              onClick={assignPackage}
            >
              {assigning
                ? 'Assigning...'
                : 'Confirm Assignment'}
            </Button>
          </div>
        </Card>
      </div>
    )}
    {showWorkoutLogModal &&
      selectedBookingForLog && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
            <h2 className="text-xl font-semibold">
              Workout Results
            </h2>

            <div className="mt-6 space-y-4">
              {exerciseLogs.map(
                (exercise, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/10 p-4"
                  >
                    <p className="mb-3 font-medium">
                      {exercise.name}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        placeholder="Weight (kg)"
                        value={
                          exercise.weight || ''
                        }
                        onChange={(e) => {
                          const copy = [
                            ...exerciseLogs,
                          ];

                          copy[index].weight =
                            e.target.value;

                          setExerciseLogs(
                            copy
                          );
                        }}
                        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                      />

                      <input
                        placeholder="Reps"
                        value={
                          exercise.reps || ''
                        }
                        onChange={(e) => {
                          const copy = [
                            ...exerciseLogs,
                          ];

                          copy[index].reps =
                            e.target.value;

                          setExerciseLogs(
                            copy
                          );
                        }}
                        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                      />
                    </div>
                  </div>
                )
              )}

              <textarea
                placeholder="Session notes..."
                value={workoutLogNotes}
                onChange={(e) =>
                  setWorkoutLogNotes(
                    e.target.value
                  )
                }
                className="min-h-[120px] w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
              />

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() =>
                    setShowWorkoutLogModal(
                      false
                    )
                  }
                >
                  Cancel
                </Button>

                <Button
                  className="flex-1"
                  disabled={
                    savingWorkoutLog
                  }
                  onClick={
                    saveWorkoutLog
                  }
                >
                  {savingWorkoutLog
                    ? 'Saving...'
                    : 'Save Results'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
    )}
    </TrainerLayout>
  );
}