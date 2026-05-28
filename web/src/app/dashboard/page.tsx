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

export default function DashboardPage() {
  const authorized = useAuthGuard({
    requiredRole: 'TRAINER',
  });

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  function formatTime(date: string) {
    return new Intl.DateTimeFormat('sr-RS', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
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
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Trainer Dashboard
          </h1>

          <p className="mt-2 text-slate-400">
            Your operational overview
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard/clients/new">
            <Button>+ New Client</Button>
          </Link>

          <Link href="/dashboard/calendar">
            <Button variant="ghost">
              Full Calendar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <Users size={28} />

          <p className="mt-4 text-slate-400">
            Active Clients
          </p>

          <h3 className="mt-2 text-3xl font-bold">
            {dashboard.activeClients}
          </h3>
        </Card>

        <Card className="p-6">
          <Calendar size={28} />

          <p className="mt-4 text-slate-400">
            Today's Sessions
          </p>

          <h3 className="mt-2 text-3xl font-bold">
            {
              dashboard.todaySessions
                .length
            }
          </h3>
        </Card>

        <Card className="p-6">
          <Clock size={28} />

          <p className="mt-4 text-slate-400">
            Upcoming This Week
          </p>

          <h3 className="mt-2 text-3xl font-bold">
            {
              dashboard.upcomingThisWeek
            }
          </h3>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              Today
            </h2>
          </div>

          <div className="space-y-3">
            {dashboard.todaySessions
              .length === 0 ? (
              <p className="text-slate-400">
                No sessions today
              </p>
            ) : (
              dashboard.todaySessions.map(
                (session) => (
                  <Link
                    key={session.id}
                    href={`/dashboard/clients/${session.client.id}`}
                  >
                    <div className="rounded-xl border border-white/10 p-4 transition hover:bg-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            {
                              session.client
                                .user
                                .firstName
                            }{' '}
                            {
                              session.client
                                .user
                                .lastName
                            }
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            {formatTime(
                              session.startAt
                            )}
                          </p>
                        </div>

                        <ArrowRight
                          size={18}
                        />
                      </div>
                    </div>
                  </Link>
                )
              )
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              Tomorrow
            </h2>
          </div>

          <div className="space-y-3">
            {dashboard
              .tomorrowSessions
              .length === 0 ? (
              <p className="text-slate-400">
                No sessions tomorrow
              </p>
            ) : (
              dashboard.tomorrowSessions.map(
                (session) => (
                  <Link
                    key={session.id}
                    href={`/dashboard/clients/${session.client.id}`}
                  >
                    <div className="rounded-xl border border-white/10 p-4 transition hover:bg-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            {
                              session.client
                                .user
                                .firstName
                            }{' '}
                            {
                              session.client
                                .user
                                .lastName
                            }
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            {formatTime(
                              session.startAt
                            )}
                          </p>
                        </div>

                        <ArrowRight
                          size={18}
                        />
                      </div>
                    </div>
                  </Link>
                )
              )
            )}
          </div>
        </Card>
      </div>
    </TrainerLayout>
  );
}