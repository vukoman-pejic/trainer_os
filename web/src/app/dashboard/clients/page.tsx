'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Mail, Phone, Plus, User } from 'lucide-react';
import { TrainerLayout } from '../../../components/layouts/trainer-layout';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { apiFetch } from '../../../lib/api';
import { useAuthGuard } from '../../../hooks/use-auth-guard';

type Client = {
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

export default function ClientsPage() {
  const authorized = useAuthGuard({
    requiredRole: 'TRAINER',
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authorized) return;

    async function loadClients() {
      try {
        const data = await apiFetch('/clients');
        setClients(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadClients();
  }, [authorized]);

  if (!authorized) {
    return null;
  }

  return (
    <TrainerLayout>
      <div className="mb-6 flex flex-col gap-4 md:mb-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">
            Clients
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-400 md:text-base">
            Manage your client base and training progress
          </p>
        </div>

        <Link href="/dashboard/clients/new">
          <Button className="w-full sm:w-auto">
            <Plus size={18} />
            Add Client
          </Button>
        </Link>
      </div>

      {loading && (
        <Card className="p-6 text-sm text-slate-400 md:p-8 md:text-base">
          Loading clients...
        </Card>
      )}

      {error && (
        <Card className="p-6 text-sm text-red-400 md:p-8 md:text-base">
          {error}
        </Card>
      )}

      {!loading && !error && clients.length === 0 && (
        <Card className="p-6 md:p-8">
          <h2 className="text-lg font-semibold md:text-xl">
            No clients yet
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-400 md:text-base">
            Create your first client to start managing packages and sessions.
          </p>
        </Card>
      )}

      {!loading && !error && clients.length > 0 && (
        <div className="grid gap-4">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/dashboard/clients/${client.id}`}
            >
              <Card className="p-5 transition hover:border-violet-500/50 hover:bg-white/[0.07] md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 md:h-14 md:w-14">
                      <User size={24} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="break-words text-lg font-semibold md:text-xl">
                        {client.user.firstName}{' '}
                        {client.user.lastName}
                      </h2>

                      <div className="mt-3 flex flex-col gap-2 text-sm text-slate-400 sm:flex-row sm:flex-wrap sm:gap-4">
                        <span className="flex min-w-0 items-center gap-2">
                          <Mail
                            size={15}
                            className="shrink-0"
                          />

                          <span className="break-all">
                            {client.user.email}
                          </span>
                        </span>

                        {client.user.phone && (
                          <span className="flex min-w-0 items-center gap-2">
                            <Phone
                              size={15}
                              className="shrink-0"
                            />

                            <span className="break-words">
                              {client.user.phone}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 lg:w-auto">
                    View Details
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </TrainerLayout>
  );
}