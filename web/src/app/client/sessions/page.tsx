'use client';

import { useEffect, useState } from 'react';
import { ClientLayout } from '../../../components/layouts/client-layout';
import { Card } from '../../../components/ui/card';
import { apiFetch } from '../../../lib/api';
import { useAuthGuard } from '../../../hooks/use-auth-guard';

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
      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          My Sessions
        </h1>

        <p className="mt-2 text-slate-400">
          Your upcoming and completed
          training sessions
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="mb-6 text-xl font-semibold">
            Upcoming Sessions
          </h2>

          <div className="space-y-3">
            {sessions.upcomingSessions
              .length === 0 ? (
              <p className="text-slate-400">
                No upcoming sessions
              </p>
            ) : (
              sessions.upcomingSessions.map(
                (session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border border-white/10 p-4"
                  >
                    <p className="font-semibold">
                      {formatDate(
                        session.startAt
                      )}
                    </p>

                    <p className="mt-2 text-sm text-slate-400">
                      {session.status}
                    </p>

                    <p className="mt-2 text-sm text-violet-300">
                      {session.workoutTemplate
                        ? `${session.workoutTemplate.name} (${session.workoutTemplate.type})`
                        : 'No workout assigned'}
                    </p>
                  </div>
                )
              )
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 text-xl font-semibold">
            Past Sessions
          </h2>

          <div className="space-y-3">
            {sessions.pastSessions
              .length === 0 ? (
              <p className="text-slate-400">
                No past sessions
              </p>
            ) : (
              sessions.pastSessions.map(
                (session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border border-white/10 p-4"
                  >
                    <p className="font-semibold">
                      {formatDate(
                        session.startAt
                      )}
                    </p>

                    <p className="mt-2 text-sm text-violet-300">
                      {session.workoutTemplate
                        ? `${session.workoutTemplate.name} (${session.workoutTemplate.type})`
                        : 'No workout assigned'}
                    </p>
                  </div>
                )
              )
            )}
          </div>
        </Card>
      </div>
    </ClientLayout>
  );
}