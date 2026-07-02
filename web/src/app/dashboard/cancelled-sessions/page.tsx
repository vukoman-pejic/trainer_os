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
      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          Cancelled Sessions
        </h1>

        <p className="mt-2 text-slate-400">
          Track all cancelled client sessions
        </p>
      </div>

      {loading && (
        <Card className="p-8 text-slate-400">
          Loading cancelled sessions...
        </Card>
      )}

      {error && (
        <Card className="p-8 text-red-400">
          {error}
        </Card>
      )}

      {!loading &&
        !error &&
        sessions.length === 0 && (
          <Card className="p-8">
            <h2 className="text-xl font-semibold">
              No cancelled sessions
            </h2>

            <p className="mt-2 text-slate-400">
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
                className="p-6"
              >
                <div className="space-y-3">
                  <div>
                    <h2 className="text-xl font-semibold">
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

                  <div className="text-sm text-slate-300 space-y-1">
                    <p>
                      <span className="text-slate-500">
                        Session:
                      </span>{' '}
                      {formatDate(
                        session.startAt
                      )}
                    </p>

                    <p>
                      <span className="text-slate-500">
                        Cancelled at:
                      </span>{' '}
                      {formatDate(
                        session.cancelledAt
                      )}
                    </p>

                    {session.workoutTemplate && (
                      <p>
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
                      <p>
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
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            disabled={page === 1}
            onClick={() =>
              setPage(page - 1)
            }
          >
            Previous
          </Button>

          <span className="text-sm text-slate-400">
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
          >
            Next
          </Button>
        </div>
      )}
    </TrainerLayout>
  );
}