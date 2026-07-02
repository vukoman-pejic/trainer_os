'use client';

import { useEffect, useState } from 'react';
import { TrainerLayout } from '../../../components/layouts/trainer-layout';
import { Card } from '../../../components/ui/card';
import { apiFetch } from '../../../lib/api';
import { useAuthGuard } from '../../../hooks/use-auth-guard';
import { Button } from '../../../components/ui/button';
import { DateTime } from 'luxon';

type CancelledSession = {
  id: string;
  startAt: string;
  cancelledAt: string;
  cancellationReason?: string | null;
  workoutTemplate?: {
    id: string;
    name: string;
  } | null;
  client: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
};

const APP_TIME_ZONE = 'Europe/Belgrade';

export default function CancelledSessionsPage() {
  const authorized = useAuthGuard({
    requiredRole: 'TRAINER',
  });

  const [sessions, setSessions] = useState<
    CancelledSession[]
  >([]);

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState('');

  async function loadSessions() {
    try {
      const data = await apiFetch(
        `/dashboard/cancelled-sessions?page=${page}`
      );

      setSessions(data.sessions);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
    loadSessions();
  }, [authorized, page]);

  if (!authorized) {
    return null;
  }

  return (
    <TrainerLayout>
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">
          Cancelled Sessions
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-slate-400 md:text-base">
          Track all cancelled client sessions
        </p>
      </div>

      {loading && (
        <Card className="p-6 text-sm text-slate-400 md:p-8 md:text-base">
          Loading cancelled sessions...
        </Card>
      )}

      {error && (
        <Card className="p-6 text-sm text-red-400 md:p-8 md:text-base">
          {error}
        </Card>
      )}

      {!loading &&
        !error &&
        sessions.length === 0 && (
          <Card className="p-6 md:p-8">
            <h2 className="text-lg font-semibold md:text-xl">
              No cancelled sessions
            </h2>

            <p className="mt-2 text-sm text-slate-400 md:text-base">
              Everything looks good.
            </p>
          </Card>
        )}

      {!loading &&
        !error &&
        sessions.length > 0 && (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className="p-5 md:p-6"
              >
                <div className="space-y-3">
                  <div>
                    <h2 className="break-words text-lg font-semibold md:text-xl">
                      {
                        session.client.user
                          .firstName
                      }{' '}
                      {
                        session.client.user
                          .lastName
                      }
                    </h2>
                  </div>

                  <div className="space-y-2 text-sm leading-relaxed text-slate-300">
                    <p className="break-words">
                      <span className="text-slate-500">
                        Session:
                      </span>{' '}
                      {formatDate(
                        session.startAt
                      )}
                    </p>

                    <p className="break-words">
                      <span className="text-slate-500">
                        Cancelled at:
                      </span>{' '}
                      {formatDate(
                        session.cancelledAt
                      )}
                    </p>

                    {session.workoutTemplate && (
                      <p className="break-words">
                        <span className="text-slate-500">
                          Workout:
                        </span>{' '}
                        {
                          session
                            .workoutTemplate
                            .name
                        }
                      </p>
                    )}

                    {session.cancellationReason && (
                      <p className="break-words">
                        <span className="text-slate-500">
                          Reason:
                        </span>{' '}
                        {
                          session.cancellationReason
                        }
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      {!loading &&
        !error &&
        totalPages > 1 && (
          <div className="mt-6 grid grid-cols-3 items-center gap-3 md:mt-8">
            <Button
              variant="ghost"
              disabled={page === 1}
              onClick={() =>
                setPage(page - 1)
              }
              className="w-full"
            >
              Previous
            </Button>

            <span className="text-center text-xs text-slate-400 sm:text-sm">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="ghost"
              disabled={
                page === totalPages
              }
              onClick={() =>
                setPage(page + 1)
              }
              className="w-full"
            >
              Next
            </Button>
          </div>
        )}
    </TrainerLayout>
  );
}