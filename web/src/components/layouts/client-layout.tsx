'use client';

import {
  LayoutDashboard,
  Calendar,
  User,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import {
  usePathname,
  useRouter,
} from 'next/navigation';
import { Button } from '../ui/button';
import { logout } from '../../lib/auth';

export function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  function navClass(path: string) {
    const active = pathname === path;

    return `flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
      active
        ? 'bg-white/10 text-white'
        : 'hover:bg-white/5 text-slate-300'
    }`;
  }

  return (
    <main className="flex min-h-screen bg-[#07070B] text-white">
      <aside className="flex w-72 flex-col border-r border-white/10 bg-black/20 p-6 backdrop-blur-xl">
        <h1 className="mb-10 text-2xl font-bold">
          Client Portal
        </h1>

        <nav className="space-y-3">
          <Link
            href="/client/dashboard"
            className={navClass(
              '/client/dashboard'
            )}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link
            href="/client/sessions"
            className={navClass(
              '/client/sessions'
            )}
          >
            <Calendar size={18} />
            My Sessions
          </Link>

          <Link
            href="/client/book"
            className={navClass('/client/book')}
          >
            <PlusCircle size={18} />
            Book Session
          </Link>

          <Link
            href="/client/profile"
            className={navClass(
              '/client/profile'
            )}
          >
            <User size={18} />
            Profile
          </Link>
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