'use client';

import { useEffect, useState } from 'react';
import {
  Mail,
  Phone,
  Target,
  HeartPulse,
  StickyNote,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { TrainerLayout } from '../../../../components/layouts/trainer-layout';
import { Card } from '../../../../components/ui/card';
import { apiFetch } from '../../../../lib/api';
import { useAuthGuard } from '../../../../hooks/use-auth-guard';
import { Button } from '../../../../components/ui/button';

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
  clientPackages: {
    id: string;
    remainingSessions: number;
    paymentStatus: 'PAID' | 'UNPAID';
    package: {
      id: string;
      name: string;
      sessionCount: number;
    };
  }[];
};

type PackageOption = {
  id: string;
  name: string;
  sessionCount: number;
};

export default function ClientDetailsPage() {
  const authorized = useAuthGuard({
    requiredRole: 'TRAINER',
  });

  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] =
    useState<ClientDetails | null>(null);
  const [packages, setPackages] = useState<
    PackageOption[]
  >([]);
  const [loading, setLoading] =
    useState(true);
  const [assigning, setAssigning] =
    useState(false);
  const [error, setError] =
    useState('');

  async function loadClientData() {
    const clientData = await apiFetch(
      `/clients/${clientId}`
    );

    const packagesData =
      await apiFetch('/packages');

    setClient(clientData);
    setPackages(packagesData);
  }

  async function assignPackage(packageId: string) {
    try {
      setAssigning(true);

      await apiFetch(`/clients/${clientId}/packages`, {
        method: 'POST',
        body: JSON.stringify({
          packageId,
        }),
      });

      await loadClientData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAssigning(false);
    }
  }

  async function markPaid(clientPackageId: string) {
    try {
      await apiFetch(
        `/client-packages/${clientPackageId}/payment`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            paymentStatus: 'PAID',
          }),
        }
      );

      await loadClientData();
    } catch (err: any) {
      alert(err.message);
    }
  }

  useEffect(() => {
    if (!authorized) return;

    async function init() {
      try {
        await loadClientData();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    init();
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
              <h2 className="mb-6 text-xl font-semibold">
                Package Management
              </h2>

              {client.clientPackages.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold">
                      {
                        client.clientPackages[0]
                          .package.name
                      }
                    </p>

                    <p className="mt-2 text-slate-400">
                      Remaining sessions:{' '}
                      {
                        client.clientPackages[0]
                          .remainingSessions
                      }
                    </p>

                    <p className="mt-2 text-slate-400">
                      Payment:{' '}
                      {
                        client.clientPackages[0]
                          .paymentStatus
                      }
                    </p>
                  </div>

                  {client.clientPackages[0]
                    .paymentStatus ===
                    'UNPAID' && (
                    <Button
                      onClick={() =>
                        markPaid(
                          client.clientPackages[0]
                            .id
                        )
                      }
                    >
                      Mark Paid
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-400">
                    No active package assigned
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {packages.map((pkg) => (
                      <Button
                        key={pkg.id}
                        disabled={assigning}
                        onClick={() =>
                          assignPackage(pkg.id)
                        }
                      >
                        {pkg.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </TrainerLayout>
  );
}