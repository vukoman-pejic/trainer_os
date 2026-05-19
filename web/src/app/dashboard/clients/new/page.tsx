'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrainerLayout } from '../../../../components/layouts/trainer-layout';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { apiFetch } from '../../../../lib/api';
import { useAuthGuard } from '../../../../hooks/use-auth-guard';

export default function NewClientPage() {
  const authorized = useAuthGuard({
    requiredRole: 'TRAINER',
  });

  const router = useRouter();

  const [firstName, setFirstName] =
    useState('');
  const [lastName, setLastName] =
    useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [injuries, setInjuries] =
    useState('');
  const [goals, setGoals] = useState('');
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] =
    useState<{
      email: string;
      temporaryPassword: string;
    } | null>(null);

  if (!authorized) {
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/clients', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          notes,
          injuries,
          goals,
        }),
      });

      setSuccessData(response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TrainerLayout>
      <div className="max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            Add Client
          </h1>

          <p className="text-slate-400 mt-2">
            Create a new client account
          </p>
        </div>

        {successData ? (
          <Card className="p-8 space-y-5">
            <h2 className="text-2xl font-bold">
              Client Created Successfully 🎉
            </h2>

            <div>
              <p className="text-slate-400">
                Login Email
              </p>
              <p className="text-lg font-semibold">
                {successData.email}
              </p>
            </div>

            <div>
              <p className="text-slate-400">
                Temporary Password
              </p>
              <p className="text-lg font-semibold">
                {successData.temporaryPassword}
              </p>
            </div>

            <Button
              onClick={() =>
                router.push('/dashboard/clients')
              }
            >
              Back to Clients
            </Button>
          </Card>
        ) : (
          <Card className="p-8">
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-5">
                <Input
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) =>
                    setFirstName(
                      e.target.value
                    )
                  }
                />

                <Input
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) =>
                    setLastName(
                      e.target.value
                    )
                  }
                />
              </div>

              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

              <Input
                placeholder="Phone"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
              />

              <Input
                placeholder="Goals"
                value={goals}
                onChange={(e) =>
                  setGoals(e.target.value)
                }
              />

              <Input
                placeholder="Injuries"
                value={injuries}
                onChange={(e) =>
                  setInjuries(
                    e.target.value
                  )
                }
              />

              <Input
                placeholder="Notes"
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
              />

              {error && (
                <p className="text-red-400">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading
                  ? 'Creating Client...'
                  : 'Create Client'}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </TrainerLayout>
  );
}