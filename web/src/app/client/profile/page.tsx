'use client';

import { useEffect, useState } from 'react';
import {
  Mail,
  Phone,
  Target,
  HeartPulse,
  StickyNote,
} from 'lucide-react';
import { ClientLayout } from '../../../components/layouts/client-layout';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { apiFetch } from '../../../lib/api';
import { useAuthGuard } from '../../../hooks/use-auth-guard';

type Profile = {
  id: string;
  goals?: string | null;
  injuries?: string | null;
  notes?: string | null;
  trainer?: {
    firstName: string;
    lastName: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
};

export default function ClientProfilePage() {
  const authorized = useAuthGuard({
    requiredRole: 'CLIENT',
  });

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [phone, setPhone] =
    useState('');

  const [goals, setGoals] =
    useState('');

  const [injuries, setInjuries] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  async function loadProfile() {
    const data = await apiFetch(
      '/client/profile'
    );

    setProfile(data);
    setPhone(data.user.phone || '');
    setGoals(data.goals || '');
    setInjuries(data.injuries || '');
  }

  async function saveProfile() {
    try {
      setSaving(true);

      await apiFetch('/client/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          phone,
          goals,
          injuries,
        }),
      });

      await loadProfile();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!authorized) return;

    async function init() {
      try {
        await loadProfile();
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [authorized]);

  if (!authorized) {
    return null;
  }

  if (loading || !profile) {
    return (
      <ClientLayout>
        <Card className="p-8 text-slate-400">
          Loading profile...
        </Card>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          Profile
        </h1>

        <p className="mt-2 text-slate-400">
          Manage your personal details
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="mb-6 text-xl font-semibold">
            Personal Information
          </h2>

          <div className="space-y-5">
            <div>
              <p className="mb-2 text-slate-400">
                Full Name
              </p>

              <p className="font-semibold">
                {profile.user.firstName}{' '}
                {profile.user.lastName}
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <Mail size={16} />
                Email
              </div>

              <p>{profile.user.email}</p>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <Phone size={16} />
                Phone
              </div>

              <Input
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
              />
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

              <textarea
                value={goals}
                onChange={(e) =>
                  setGoals(e.target.value)
                }
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <HeartPulse size={16} />
                Injuries
              </div>

              <textarea
                value={injuries}
                onChange={(e) =>
                  setInjuries(
                    e.target.value
                  )
                }
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
              />
            </div>

            <Button
              onClick={saveProfile}
              disabled={saving}
              className="w-full"
            >
              {saving
                ? 'Saving...'
                : 'Save Changes'}
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="p-6">
          <h2 className="mb-6 text-xl font-semibold">
            Trainer Notes
          </h2>

          <div className="flex items-start gap-3">
            <StickyNote
              size={18}
              className="mt-1 text-slate-400"
            />

            <p className="text-slate-300">
              {profile.notes ||
                'No notes from your trainer'}
            </p>
          </div>
        </Card>
      </div>
    </ClientLayout>
  );
}