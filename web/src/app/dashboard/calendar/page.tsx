'use client';

import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { TrainerLayout } from '../../../components/layouts/trainer-layout';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { apiFetch } from '../../../lib/api';
import { useAuthGuard } from '../../../hooks/use-auth-guard';

type Session = {
  id: string;
  startAt: string;
  status: string;
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
  '22:00',
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

export default function CalendarPage() {
  const authorized = useAuthGuard({
    requiredRole: 'TRAINER',
  });

  const [calendar, setCalendar] =
    useState<CalendarData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [weekOffset, setWeekOffset] =
    useState(0);

  async function loadCalendar() {
    const data = await apiFetch(
      `/dashboard/calendar?weekOffset=${weekOffset}`
    );

    setCalendar(data);
  }

  function formatHeaderDate(date: string) {
    return new Intl.DateTimeFormat('sr-RS', {
      day: '2-digit',
      month: '2-digit',
    }).format(new Date(date));
  }

  function getDayDate(index: number) {
    if (!calendar) return '';

    const date = new Date(calendar.weekStart);
    date.setDate(date.getDate() + index);

    return date;
  }

  function getSessionsForSlot(
    dayIndex: number,
    timeSlot: string
  ) {
    if (!calendar) return [];

    const [hours, minutes] =
      timeSlot.split(':').map(Number);

    return calendar.sessions.filter(
      (session) => {
        const sessionDate = new Date(
          session.startAt
        );

        const targetDate =
          getDayDate(dayIndex);

        return (
          sessionDate.getDate() ===
            targetDate.getDate() &&
          sessionDate.getMonth() ===
            targetDate.getMonth() &&
          sessionDate.getFullYear() ===
            targetDate.getFullYear() &&
          sessionDate.getHours() ===
            hours &&
          sessionDate.getMinutes() ===
            minutes
        );
      }
    );
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Weekly Calendar
          </h1>

          <p className="mt-2 text-slate-400">
            {formatHeaderDate(
              calendar.weekStart
            )}{' '}
            -{' '}
            {formatHeaderDate(
              calendar.weekEnd
            )}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() =>
              setWeekOffset(
                weekOffset - 1
              )
            }
          >
            <ChevronLeft size={18} />
          </Button>

          <Button
            variant="outline"
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

      <div className="overflow-x-auto">
        <div className="grid min-w-[1200px] grid-cols-8 gap-3">
          <div />

          {DAYS.map((day, index) => (
            <Card
              key={day}
              className="p-4 text-center"
            >
              <p className="font-semibold">
                {day}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {formatHeaderDate(
                  getDayDate(index).toISOString()
                )}
              </p>
            </Card>
          ))}

          {TIME_SLOTS.map((slot) => (
            <div
              key={slot}
              className="contents"
            >
              <Card
                key={slot}
                className="flex items-center justify-center p-4"
              >
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
                      className="min-h-[120px] p-3"
                    >
                      <div className="space-y-2">
                        {sessions.map(
                          (session) => (
                            <Link
                              key={
                                session.id
                              }
                              href={`/dashboard/clients/${session.client.id}`}
                            >
                              <div className="rounded-lg border border-white/10 bg-white/5 p-3 transition hover:bg-white/10">
                                <p className="text-sm font-semibold">
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

                                <p className="mt-1 text-xs text-slate-400">
                                  {
                                    session.status
                                  }
                                </p>
                              </div>
                            </Link>
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
    </TrainerLayout>
  );
}