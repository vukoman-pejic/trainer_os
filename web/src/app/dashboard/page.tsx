'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  Users,
  ArrowRight,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { TrainerLayout } from '../../components/layouts/trainer-layout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuthGuard } from '../../hooks/use-auth-guard';
import { apiFetch } from '../../lib/api';
import { DateTime } from 'luxon';

type Session = {
  id: string;
  startAt: string;
  client: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
};

type DashboardData = {
  todaySessions: Session[];
  tomorrowSessions: Session[];
  activeClients: number;
  upcomingThisWeek: number;
};

const APP_TIME_ZONE = 'Europe/Belgrade';

export default function DashboardPage() {
  const authorized = useAuthGuard({
    requiredRole: 'TRAINER',
  });

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  function formatTime(date: string) {
    return DateTime.fromISO(date, {
      zone: 'utc',
    })
      .setZone(APP_TIME_ZONE)
      .toFormat('HH:mm');
  }

  async function loadDashboard() {
    const data = await apiFetch(
      '/dashboard/trainer'
    );

    setDashboard(data);
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
      <TrainerLayout>
        <Card className="p-8 text-slate-400">
          Loading dashboard...
        </Card>
      </TrainerLayout>
    );
  }

  return (
    <TrainerLayout>
      <div className="mb-6 flex flex-col gap-4 md:mb-10 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">
            Trainer Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-400 md:text-base">
            Your operational overview
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Link href="/dashboard/clients/new">
            <Button className="w-full sm:w-auto">
              + New Client
            </Button>
          </Link>

          <Link href="/dashboard/calendar">
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
            >
              Full Calendar
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6 md:mb-8">
        <Card className="p-5 md:p-6">
          <Users size={28} />

          <p className="mt-4 text-sm text-slate-400 md:text-base">
            Active Clients
          </p>

          <h3 className="mt-2 text-3xl font-bold">
            {dashboard.activeClients}
          </h3>
        </Card>

        <Card className="p-5 md:p-6">
          <Calendar size={28} />

          <p className="mt-4 text-sm text-slate-400 md:text-base">
            Today's Sessions
          </p>

          <h3 className="mt-2 text-3xl font-bold">
            {dashboard.todaySessions.length}
          </h3>
        </Card>

        <Card className="p-5 md:p-6 sm:col-span-2 xl:col-span-1">
          <Clock size={28} />

          <p className="mt-4 text-sm text-slate-400 md:text-base">
            Upcoming This Week
          </p>

          <h3 className="mt-2 text-3xl font-bold">
            {dashboard.upcomingThisWeek}
          </h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Card className="p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between md:mb-6">
            <h2 className="text-xl font-semibold md:text-2xl">
              Today
            </h2>
          </div>

          <div className="space-y-3">
            {dashboard.todaySessions.length === 0 ? (
              <p className="text-sm text-slate-400 md:text-base">
                No sessions today
              </p>
            ) : (
              dashboard.todaySessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/dashboard/clients/${session.client.id}`}
                >
                  <div className="rounded-xl border border-white/10 p-4 transition hover:bg-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-semibold">
                          {session.client.user.firstName}{' '}
                          {session.client.user.lastName}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          {formatTime(session.startAt)}
                        </p>
                      </div>

                      <ArrowRight
                        size={18}
                        className="shrink-0"
                      />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between md:mb-6">
            <h2 className="text-xl font-semibold md:text-2xl">
              Tomorrow
            </h2>
          </div>

          <div className="space-y-3">
            {dashboard.tomorrowSessions.length === 0 ? (
              <p className="text-sm text-slate-400 md:text-base">
                No sessions tomorrow
              </p>
            ) : (
              dashboard.tomorrowSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/dashboard/clients/${session.client.id}`}
                >
                  <div className="rounded-xl border border-white/10 p-4 transition hover:bg-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-semibold">
                          {session.client.user.firstName}{' '}
                          {session.client.user.lastName}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          {formatTime(session.startAt)}
                        </p>
                      </div>

                      <ArrowRight
                        size={18}
                        className="shrink-0"
                      />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </TrainerLayout>
  );
}