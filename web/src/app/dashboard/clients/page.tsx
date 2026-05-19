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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Clients</h1>
          <p className="mt-2 text-slate-400">
            Manage your client base and training progress
          </p>
        </div>

        <Link href="/dashboard/clients/new">
          <Button>
            <Plus size={18} />
            Add Client
          </Button>
        </Link>
      </div>

      {loading && (
        <Card className="p-8 text-slate-400">
          Loading clients...
        </Card>
      )}

      {error && (
        <Card className="p-8 text-red-400">
          {error}
        </Card>
      )}

      {!loading && !error && clients.length === 0 && (
        <Card className="p-8">
          <h2 className="text-xl font-semibold">No clients yet</h2>
          <p className="mt-2 text-slate-400">
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
              <Card className="p-6 transition hover:border-violet-500/50 hover:bg-white/[0.07]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
                      <User size={24} />
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold">
                        {client.user.firstName} {client.user.lastName}
                      </h2>

                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-2">
                          <Mail size={15} />
                          {client.user.email}
                        </span>

                        {client.user.phone && (
                          <span className="flex items-center gap-2">
                            <Phone size={15} />
                            {client.user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
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