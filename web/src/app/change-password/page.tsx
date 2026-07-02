'use client';

import { FormEvent, useState } from 'react';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { apiFetch } from '../../lib/api';
import { saveAuth } from '../../lib/auth';
import { useAuthGuard } from '../../hooks/use-auth-guard';
import { getRole } from '../../lib/auth';

export default function ChangePasswordPage() {
  const authorized = useAuthGuard({
    requirePasswordChange: true,
  });

  const router = useRouter();

  const [oldPassword, setOldPassword] =
    useState('');
  const [newPassword, setNewPassword] =
    useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authorized) {
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const token =
        localStorage.getItem('accessToken');

      const role = getRole();

      saveAuth(token || '', false, role || 'CLIENT');

      if (role === 'TRAINER') {
        router.push('/dashboard');
      } else {
        router.push('/client/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07070B] px-4 py-8 text-white sm:px-6">
      <Card className="w-full max-w-md p-5 sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 sm:h-16 sm:w-16">
            <Lock size={28} />
          </div>

          <h1 className="text-2xl font-bold sm:text-3xl">
            Change Password
          </h1>

          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            Set your new secure password
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <Input
            type="password"
            placeholder="Current password"
            value={oldPassword}
            onChange={(e) =>
              setOldPassword(e.target.value)
            }
          />

          <Input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) =>
              setNewPassword(e.target.value)
            }
          />

          <Input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
          />

          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading
              ? 'Updating...'
              : 'Update Password'}
          </Button>
        </form>
      </Card>
    </main>
  );
}