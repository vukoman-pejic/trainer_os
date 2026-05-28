'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  Package,
  Clock,
} from 'lucide-react';
import { ClientLayout } from '../../../components/layouts/client-layout';
import { Card } from '../../../components/ui/card';
import { apiFetch } from '../../../lib/api';
import { useAuthGuard } from '../../../hooks/use-auth-guard';

type DashboardData = {
  activePackage?: {
    id: string;
    remainingSessions: number;
    paymentStatus: 'PAID' | 'UNPAID';
    package: {
      name: string;
      sessionCount: number;
    };
  } | null;

  nextSession?: {
    startAt: string;

    workoutTemplate?: {
      name: string;
      type: string;
    } | null;
  } | null;
};

export default function ClientDashboardPage() {
  const authorized = useAuthGuard({
    requiredRole: 'CLIENT',
  });

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  async function loadDashboard() {
    const data = await apiFetch(
      '/client/dashboard'
    );

    setDashboard(data);
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
        await loadDashboard();
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [authorized]);

  if (!authorized) {
    return null;
  }

  if (loading || !dashboard) {
    return (
      <ClientLayout>
        <Card className="p-8 text-slate-400">
          Loading dashboard...
        </Card>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-400">
          Welcome back
        </p>
      </div>

      {(!dashboard.activePackage ||
        dashboard.activePackage.paymentStatus ===
          'UNPAID') && (
          <Card className="mb-6 border-amber-500/30 bg-amber-500/10 p-6">
            <h2 className="text-lg font-semibold text-amber-300">
              {!dashboard.activePackage
                ? 'No Active Package'
                : 'Payment Required'}
            </h2>

            <p className="mt-2 text-sm text-amber-200">
              {!dashboard.activePackage
                ? 'You currently do not have an active training package. Please contact your trainer.'
                : 'Your current training package has not been paid yet. Please contact your trainer.'}
            </p>
          </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        <Card className="p-6">
          <Calendar size={24} />

          <p className="mt-4 text-slate-400">
            Next Session
          </p>

          {dashboard.nextSession ? (
            <>
              <p className="mt-2 text-lg font-semibold">
                {formatDate(
                  dashboard.nextSession.startAt
                )}
              </p>

              <p className="mt-2 text-sm text-violet-300">
                {dashboard.nextSession
                  .workoutTemplate
                  ? `${dashboard.nextSession.workoutTemplate.name} (${dashboard.nextSession.workoutTemplate.type})`
                  : 'No workout assigned'}
              </p>
            </>
          ) : (
            <p className="mt-2 text-slate-500">
              No upcoming sessions
            </p>
          )}
        </Card>

        <Card className="p-6">
          <Package size={24} />

          <p className="mt-4 text-slate-400">
            Remaining Sessions
          </p>

          <p className="mt-2 text-3xl font-bold">
            {dashboard.activePackage
              ?.remainingSessions ?? 0}
          </p>
        </Card>

        <Card className="p-6">
          <Clock size={24} />

          <p className="mt-4 text-slate-400">
            Current Package
          </p>

          <p className="mt-2 text-lg font-semibold">
            {dashboard.activePackage
              ?.package.name ||
              'No active package'}
          </p>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="p-6">
          <h2 className="mb-6 text-xl font-semibold">
            Recent Sessions
          </h2>

          <div className="space-y-3">
            {dashboard.recentPastSessions
              .length === 0 ? (
              <p className="text-slate-400">
                No past sessions yet
              </p>
            ) : (
              dashboard.recentPastSessions.map(
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