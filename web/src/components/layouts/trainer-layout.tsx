'use client';

import {
  Calendar,
  LayoutDashboard,
  LogOut,
  Package,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { logout } from '../../lib/auth';

export function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <main className="min-h-screen bg-[#07070B] text-white flex">
      <aside className="w-72 border-r border-white/10 bg-black/20 backdrop-blur-xl p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10">
          Trainer OS
        </h1>

        <nav className="space-y-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-white/5 transition"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link
            href="/dashboard/clients"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-white/5 transition"
          >
            <Users size={18} />
            Clients
          </Link>

          <button className="w-full text-left flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-white/5 transition">
            <Calendar size={18} />
            Calendar
          </button>

          <button className="w-full text-left flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-white/5 transition">
            <Package size={18} />
            Packages
          </button>
        </nav>

        <div className="mt-auto">
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
        {children}
      </section>
    </main>
  );
}