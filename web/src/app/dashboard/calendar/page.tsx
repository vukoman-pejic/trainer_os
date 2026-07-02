'use client';

import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { TrainerLayout } from '../../../components/layouts/trainer-layout';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { apiFetch } from '../../../lib/api';
import { useAuthGuard } from '../../../hooks/use-auth-guard';
import { DateTime } from 'luxon';

type Workout = {
  id: string;
  name: string;
  type: 'HERCULES' | 'REFORMER';
  content: string;
};

type Session = {
  id: string;
  startAt: string;
  status: string;
  workoutTemplate?: Workout | null;
  clientPackage: {
    paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  };
  client: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
};

type CalendarData = {
  weekStart: string;
  weekEnd: string;
  sessions: Session[];
};

const TIME_SLOTS = [
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

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const APP_TIME_ZONE = 'Europe/Belgrade';

function toUtcIso(date: string, time: string) {
  return DateTime.fromISO(`${date}T${time}`, {
    zone: APP_TIME_ZONE,
  })
    .toUTC()
    .toISO();
}

export default function CalendarPage() {
  const authorized = useAuthGuard({
    requiredRole: 'TRAINER',
  });

  const [calendar, setCalendar] =
    useState<CalendarData | null>(null);

  const [workouts, setWorkouts] =
    useState<Workout[]>([]);

  const [selectedWorkoutId, setSelectedWorkoutId] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [weekOffset, setWeekOffset] =
    useState(0);

  const [selectedBooking, setSelectedBooking] =
    useState<Session | null>(null);

  const [popupPosition, setPopupPosition] =
    useState({
      x: 0,
      y: 0,
    });

  const [isMobilePopup, setIsMobilePopup] =
    useState(false);

  const [rescheduleDate, setRescheduleDate] =
    useState('');

  const [rescheduleTime, setRescheduleTime] =
    useState('');

  const [actionLoading, setActionLoading] =
    useState(false);

  async function loadCalendar() {
    const data = await apiFetch(
      `/dashboard/calendar?weekOffset=${weekOffset}`
    );

    const workoutsData = await apiFetch(
        '/workouts'
    );

    setCalendar(data);
    setWorkouts(workoutsData);
  }

  function formatHeaderDate(date: string) {
    return DateTime.fromISO(date, {
      zone: 'utc',
    })
      .setZone(APP_TIME_ZONE)
      .toFormat('dd.MM');
  }

  function getDayDate(index: number) {
    if (!calendar) {
      return DateTime.now().setZone(APP_TIME_ZONE);
    }

    return DateTime.fromISO(calendar.weekStart, {
      zone: 'utc',
    })
      .setZone(APP_TIME_ZONE)
      .plus({ days: index });
  }

  function getSessionsForSlot(
    dayIndex: number,
    timeSlot: string
  ) {
    if (!calendar) return [];

    const [hours, minutes] =
      timeSlot.split(':').map(Number);

    const targetDate = getDayDate(dayIndex);

    return calendar.sessions.filter((session) => {
      const sessionDate = DateTime.fromISO(session.startAt, {
        zone: 'utc',
      }).setZone(APP_TIME_ZONE);

      return (
        sessionDate.year === targetDate.year &&
        sessionDate.month === targetDate.month &&
        sessionDate.day === targetDate.day &&
        sessionDate.hour === hours &&
        sessionDate.minute === minutes
      );
    });
  }

  function getNextDayFromBooking(bookingDate: string) {
    return DateTime.fromISO(bookingDate, {
      zone: 'utc',
    })
      .setZone(APP_TIME_ZONE)
      .plus({ days: 1 })
      .toFormat('yyyy-MM-dd');
  }

  async function cancelBooking() {
    if (!selectedBooking) return;

    try {
      setActionLoading(true);

      await apiFetch(
        `/bookings/${selectedBooking.id}/cancel`,
        {
          method: 'PATCH',
        }
      );

      setSelectedBooking(null);
      setRescheduleDate('');
      setRescheduleTime('');

      await loadCalendar();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function rescheduleBooking() {
    if (
      !selectedBooking ||
      !rescheduleDate ||
      !rescheduleTime
    ) {
      alert('Select date and time');
      return;
    }

    try {
      setActionLoading(true);

      await apiFetch(
        `/bookings/${selectedBooking.id}/reschedule`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            startAt: toUtcIso(rescheduleDate, rescheduleTime),
          }),
        }
      );

      setSelectedBooking(null);
      setSelectedWorkoutId('');
      setRescheduleDate('');
      setRescheduleTime('');

      await loadCalendar();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function assignWorkout() {
    if (!selectedBooking) return;

    try {
      setActionLoading(true);

      await apiFetch(
        `/bookings/${selectedBooking.id}/workout`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            workoutTemplateId:
              selectedWorkoutId || null,
          }),
        }
      );

      setSelectedBooking(null);
      setSelectedWorkoutId('');

      await loadCalendar();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    if (!authorized) return;

    async function init() {
      try {
        await loadCalendar();
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [authorized, weekOffset]);

  if (!authorized) {
    return null;
  }

  if (loading || !calendar) {
    return (
      <TrainerLayout>
        <Card className="p-8 text-slate-400">
          Loading calendar...
        </Card>
      </TrainerLayout>
    );
  }

  return (
    <TrainerLayout>
      <div className="mb-6 flex flex-col gap-4 md:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">
            Weekly Calendar
          </h1>

          <p className="mt-2 text-sm text-slate-400 md:text-base">
            {formatHeaderDate(
              calendar.weekStart
            )}{' '}
            -{' '}
            {formatHeaderDate(
              calendar.weekEnd
            )}
          </p>
        </div>

        <div className="flex gap-2 sm:gap-3">
          <Button
            variant="ghost"
            onClick={() =>
              setWeekOffset(
                weekOffset - 1
              )
            }
          >
            <ChevronLeft size={18} />
          </Button>

          <Button
            variant="ghost"
            onClick={() =>
              setWeekOffset(
                weekOffset + 1
              )
            }
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl pb-3">
        <div className="grid min-w-[980px] grid-cols-8 gap-2 md:min-w-[1200px] md:gap-3">
          <div className="sticky left-0 z-20 bg-[#07070B]" />

          {DAYS.map((day, index) => (
            <Card
              key={day}
              className="p-3 text-center md:p-4"
            >
              <p className="font-semibold">
                {day}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {getDayDate(index).toFormat('dd.MM')}
              </p>
            </Card>
          ))}

          {TIME_SLOTS.map((slot) => (
            <div
              key={slot}
              className="contents"
            >
              <Card className="sticky left-0 z-10 flex items-center justify-center bg-[#111118] p-3 md:p-4">
                <p className="font-semibold">
                  {slot}
                </p>
              </Card>

              {DAYS.map(
                (_, dayIndex) => {
                  const sessions =
                    getSessionsForSlot(
                      dayIndex,
                      slot
                    );

                  return (
                    <Card
                      key={`${slot}-${dayIndex}`}
                      className="min-h-[105px] p-2 md:min-h-[120px] md:p-3"
                    >
                      <div className="space-y-2">
                        {sessions.map(
                          (session) => (
                            <button
                              key={
                                session.id
                              }
                              onClick={(e) => {
                                if (
                                  selectedBooking?.id ===
                                  session.id
                                ) {
                                  setSelectedBooking(
                                    null
                                  );
                                  return;
                                }

                                const isMobile =
                                  window.innerWidth < 768;

                                setIsMobilePopup(isMobile);

                                if (isMobile) {
                                  setPopupPosition({
                                    x: 0,
                                    y: 0,
                                  });
                                } else {

                                const rect =
                                  e.currentTarget.getBoundingClientRect();

                                const popupWidth =
                                  320;
                                const popupHeight =
                                  700;

                                let x =
                                  rect.right +
                                  12;

                                let y = rect.top;

                                if (
                                  x +
                                    popupWidth >
                                  window.innerWidth
                                ) {
                                  x =
                                    rect.left -
                                    popupWidth -
                                    12;
                                }

                                if (
                                  y +
                                    popupHeight >
                                  window.innerHeight
                                ) {
                                  y =
                                    window.innerHeight -
                                    popupHeight -
                                    20;
                                }

                                if (y < 20) {
                                  y = 20;
                                }

                                setPopupPosition(
                                  {
                                    x,
                                    y,
                                  }
                                );
                            }

                                setRescheduleDate(
                                  getNextDayFromBooking(
                                    session.startAt
                                  )
                                );

                                setRescheduleTime('');

                                setSelectedWorkoutId(
                                  session.workoutTemplate?.id || ''
                                );

                                setSelectedBooking(
                                  session
                                );
                              }}
                              className={`w-full rounded-lg border-l-4 p-2 text-left transition hover:bg-white/10 md:p-3 ${
                                session.clientPackage.paymentStatus ===
                                'PAID'
                                  ? 'border-l-emerald-500 border-white/10 bg-emerald-500/10'
                                  : 'border-l-red-500 border-white/10 bg-red-500/10'
                              }`}
                            >
                              <p className="break-words text-xs font-semibold md:text-sm">
                                {
                                  session
                                    .client
                                    .user
                                    .firstName
                                }{' '}
                                {
                                  session
                                    .client
                                    .user
                                    .lastName
                                }
                              </p>

                              <div className="mt-1 space-y-1">

                                <span
                                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    session.clientPackage.paymentStatus ===
                                    'PAID'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-red-500/20 text-red-300'
                                  }`}
                                >
                                  {session.clientPackage.paymentStatus ===
                                  'PAID'
                                    ? 'PAID'
                                    : 'UNPAID'}
                                </span>
                              </div>
                              {session.workoutTemplate && (
                                <p className="mt-1 break-words text-[11px] text-violet-300 md:text-xs">
                                  {session.workoutTemplate.name}
                                </p>
                              )}
                            </button>
                          )
                        )}
                      </div>
                    </Card>
                  );
                }
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedBooking && (
        <>
          {isMobilePopup && (
            <button
              className="fixed inset-0 z-[99998] bg-black/50"
              onClick={() => {
                setSelectedBooking(null);
                setSelectedWorkoutId('');
                setRescheduleDate('');
                setRescheduleTime('');
              }}
              aria-label="Close booking popup"
            />
          )}

          <div
            style={
              isMobilePopup
                ? undefined
                : {
                    position: 'fixed',
                    left: popupPosition.x,
                    top: popupPosition.y,
                    zIndex: 99999,
                  }
            }
            className={
              isMobilePopup
                ? 'fixed inset-x-4 bottom-4 z-[99999] max-h-[82vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#111118] p-5 shadow-2xl'
                : 'w-80 max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#111118] p-5 shadow-2xl'
            }
          >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">
                {
                  selectedBooking.client.user
                    .firstName
                }{' '}
                {
                  selectedBooking.client.user
                    .lastName
                }
              </h3>

              <p className="text-sm text-slate-400">
                {selectedBooking.status}
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedBooking(null);
                setSelectedWorkoutId('');
                setRescheduleDate('');
                setRescheduleTime('');
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2">
            <Link
              href={`/dashboard/clients/${selectedBooking.client.id}`}
              className="w-full"
            >
              <Button variant="ghost" className="w-full">
                Open Client
              </Button>
            </Link>

            <Button
              className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10"
              disabled={actionLoading}
              onClick={cancelBooking}
            >
              Cancel
            </Button>
          </div>

          <div className="mb-5 space-y-3">
            <p className="text-sm font-medium">
              Workout
            </p>

            {selectedBooking.workoutTemplate ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="font-semibold">
                  {selectedBooking.workoutTemplate.name}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {selectedBooking.workoutTemplate.type}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No workout assigned
              </p>
            )}

            <select
              value={selectedWorkoutId}
              onChange={(e) =>
                setSelectedWorkoutId(
                  e.target.value
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
                  {workout.name} - {workout.type}
                </option>
              ))}
            </select>

            <Button
              className="w-full"
              disabled={actionLoading}
              onClick={assignWorkout}
            >
              Save Workout
            </Button>
          </div>

          <div className="space-y-3">
            <input
              type="date"
              value={rescheduleDate}
              onChange={(e) =>
                setRescheduleDate(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
            />

            <select
              value={rescheduleTime}
              onChange={(e) =>
                setRescheduleTime(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
            >
              <option value="">
                Select time
              </option>

              {TIME_SLOTS.map((slot) => (
                <option
                  key={slot}
                  value={slot}
                >
                  {slot}
                </option>
              ))}
            </select>

            <Button
              className="w-full"
              disabled={actionLoading}
              onClick={rescheduleBooking}
            >
              Reschedule
            </Button>
          </div>
        </div>
       </>
      )}
    </TrainerLayout>
  );
}