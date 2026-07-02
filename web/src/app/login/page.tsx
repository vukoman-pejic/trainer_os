'use client';

import { FormEvent, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { apiFetch } from '../../lib/api';
import { saveAuth } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      saveAuth(
        response.accessToken,
        response.mustChangePassword,
        response.user.role
      );

      if (response.mustChangePassword) {
        router.push('/change-password');
      } else if (response.user.role === 'TRAINER') {
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
    <main className="flex min-h-screen bg-[#07070B] text-white">
      <div className="hidden flex-1 flex-col justify-center px-20 lg:flex">
        <div className="max-w-xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
              <Dumbbell size={28} />
            </div>

            <h1 className="text-4xl font-bold">
              Trainer OS
            </h1>
          </div>

          <h2 className="text-6xl font-bold leading-tight">
            Manage clients.
            <br />
            Schedule sessions.
            <br />
            Grow your business.
          </h2>

          <p className="mt-8 text-xl leading-relaxed text-slate-400">
            A premium operating system for modern trainers and boutique fitness studios.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <Card className="w-full max-w-md p-5 sm:p-8">
          <div className="mb-8 text-center sm:text-left">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 lg:hidden">
              <Dumbbell size={28} />
            </div>

            <h3 className="text-2xl font-bold sm:text-3xl">
              Welcome back
            </h3>

            <p className="mt-2 text-sm text-slate-400 sm:text-base">
              Sign in to your account
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
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
                ? 'Signing in...'
                : 'Sign In'}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}