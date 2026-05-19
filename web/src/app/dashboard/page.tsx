'use client';

import {
  Calendar,
  LogOut,
  Package,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  logout,
} from '../../lib/auth';
import { useAuthGuard } from '../../hooks/use-auth-guard';

export default function DashboardPage() {
  useAuthGuard({
    requiredRole: 'TRAINER',
  });

  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <main className="min-h-screen bg-[#07070B] text-white flex">
      <aside className="w-72 border-r border-white/10 bg-black/20 backdrop-blur-xl p-6">
        <h1 className="text-2xl font-bold mb-10">
          Trainer OS
        </h1>

        <nav className="space-y-3">
          <button className="w-full text-left rounded-2xl px-4 py-3 bg-white/10">
            Dashboard
          </button>

          <button className="w-full text-left rounded-2xl px-4 py-3 hover:bg-white/5 transition">
            Clients
          </button>

          <button className="w-full text-left rounded-2xl px-4 py-3 hover:bg-white/5 transition">
            Calendar
          </button>

          <button className="w-full text-left rounded-2xl px-4 py-3 hover:bg-white/5 transition">
            Packages
          </button>
        </nav>

        <div className="mt-auto pt-10">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </aside>

      <section className="flex-1 p-10">
        <h2 className="text-4xl font-bold mb-8">
          Dashboard
        </h2>

        <div className="grid grid-cols-4 gap-6">
          <Card className="p-6">
            <Users size={28} />
            <p className="mt-4 text-slate-400">
              Active Clients
            </p>
            <h3 className="text-3xl font-bold mt-2">
              12
            </h3>
          </Card>

          <Card className="p-6">
            <Calendar size={28} />
            <p className="mt-4 text-slate-400">
              Today's Sessions
            </p>
            <h3 className="text-3xl font-bold mt-2">
              8
            </h3>
          </Card>

          <Card className="p-6">
            <Package size={28} />
            <p className="mt-4 text-slate-400">
              Active Packages
            </p>
            <h3 className="text-3xl font-bold mt-2">
              21
            </h3>
          </Card>

          <Card className="p-6">
            <Users size={28} />
            <p className="mt-4 text-slate-400">
              Pending Requests
            </p>
            <h3 className="text-3xl font-bold mt-2">
              3
            </h3>
          </Card>
        </div>
      </section>
    </main>
  );
}