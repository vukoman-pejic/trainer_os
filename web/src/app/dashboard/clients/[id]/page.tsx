'use client';

import { useEffect, useState } from 'react';
import { Mail, Phone, Target, HeartPulse, StickyNote } from 'lucide-react';
import { useParams } from 'next/navigation';
import { TrainerLayout } from '../../../../components/layouts/trainer-layout';
import { Card } from '../../../../components/ui/card';
import { apiFetch } from '../../../../lib/api';
import { useAuthGuard } from '../../../../hooks/use-auth-guard';

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
};

export default function ClientDetailsPage() {
  const authorized = useAuthGuard({
    requiredRole: 'TRAINER',
  });

  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] =
    useState<ClientDetails | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!authorized) return;

    async function loadClient() {
      try {
        const data = await apiFetch(
          `/clients/${clientId}`
        );

        setClient(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadClient();
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold">
              {client.user.firstName}{' '}
              {client.user.lastName}
            </h1>

            <p className="mt-2 text-slate-400">
              Client profile overview
            </p>
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
              <h2 className="text-xl font-semibold">
                Package
              </h2>

              <p className="mt-3 text-slate-400">
                Package assignment coming next...
              </p>
            </Card>
          </div>
        </>
      )}
    </TrainerLayout>
  );
}