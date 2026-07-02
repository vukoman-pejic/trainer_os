'use client';

import { useEffect, useState } from 'react';
import { ClientLayout } from '../../../components/layouts/client-layout';
import { Card } from '../../../components/ui/card';
import { apiFetch } from '../../../lib/api';
import { useAuthGuard } from '../../../hooks/use-auth-guard';
import { DateTime } from 'luxon';

type Workout = {
  id: string;
  name: string;
  type: 'HERCULES' | 'REFORMER';
};

type Session = {
  id: string;
  startAt: string;
  status: string;
  workoutTemplate?: Workout | null;
};

type SessionsResponse = {
  upcomingSessions: Session[];
  pastSessions: Session[];
};

const APP_TIME_ZONE = 'Europe/Belgrade';

export default function ClientSessionsPage() {
  const authorized = useAuthGuard({
    requiredRole: 'CLIENT',
  });

  const [sessions, setSessions] =
    useState<SessionsResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  async function loadSessions() {
    const data = await apiFetch(
      '/client/sessions'
    );

    setSessions(data);
  }

  function formatDate(date: string) {
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
        await loadSessions();
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [authorized]);

  if (!authorized) {
    return null;
  }

  if (loading || !sessions) {
    return (
      <ClientLayout>
        <Card className="p-8 text-slate-400">
          Loading sessions...
        </Card>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">
          My Sessions
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-slate-400 md:text-base">
          Your upcoming and completed training sessions
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Card className="p-5 md:p-6">
          <h2 className="mb-5 text-lg font-semibold md:mb-6 md:text-xl">
            Upcoming Sessions
          </h2>

          <div className="space-y-3">
            {sessions.upcomingSessions.length === 0 ? (
              <p className="text-sm text-slate-400 md:text-base">
                No upcoming sessions
              </p>
            ) : (
              sessions.upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-xl border border-white/10 p-4"
                >
                  <p className="font-semibold leading-snug">
                    {formatDate(session.startAt)}
                  </p>

                  <p className="mt-2 inline-flex rounded-full border border-white/10 px-2 py-1 text-xs text-slate-400">
                    {session.status}
                  </p>

                  <p className="mt-3 break-words text-sm leading-relaxed text-violet-300">
                    {session.workoutTemplate
                      ? `${session.workoutTemplate.name} (${session.workoutTemplate.type})`
                      : 'No workout assigned'}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5 md:p-6">
          <h2 className="mb-5 text-lg font-semibold md:mb-6 md:text-xl">
            Past Sessions
          </h2>

          <div className="space-y-3">
            {sessions.pastSessions.length === 0 ? (
              <p className="text-sm text-slate-400 md:text-base">
                No past sessions
              </p>
            ) : (
              sessions.pastSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-xl border border-white/10 p-4"
                >
                  <p className="font-semibold leading-snug">
                    {formatDate(session.startAt)}
                  </p>

                  <p className="mt-3 break-words text-sm leading-relaxed text-violet-300">
                    {session.workoutTemplate
                      ? `${session.workoutTemplate.name} (${session.workoutTemplate.type})`
                      : 'No workout assigned'}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </ClientLayout>
  );
}