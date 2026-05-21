'use client';

import {
  Calendar,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Users,
  Bell,
  History
} from 'lucide-react';
import Link from 'next/link';
import {
  usePathname,
  useRouter,
} from 'next/navigation';
import {
  useEffect,
  useState,
} from 'react';
import { Button } from '../ui/button';
import { logout } from '../../lib/auth';
import { apiFetch } from '../../lib/api';

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [openNotifications, setOpenNotifications] =
    useState(false);

  async function loadNotifications() {
    try {
      const data = await apiFetch(
        '/dashboard/notifications'
      );

      setNotifications(data);
    } catch {
      // ignore
    }
  }

  async function handleNotificationClick(
    notification: Notification
  ) {
    try {
      if (!notification.read) {
        await apiFetch(
          `/dashboard/notifications/${notification.id}/read`,
          {
            method: 'PATCH',
          }
        );

        await loadNotifications();
      }

      setOpenNotifications(false);
      router.push('/dashboard/calendar');
    } catch {
      // ignore
    }
  }

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

  const unreadCount =
    notifications.filter(
      (n) => !n.read
    ).length;

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <main className="flex min-h-screen bg-[#07070B] text-white">
      <aside className="flex w-72 flex-col border-r border-white/10 bg-black/20 p-6 backdrop-blur-xl">
        <div className="mb-10 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Trainer OS
          </h1>

          <button
            onClick={() =>
              setOpenNotifications(
                !openNotifications
              )
            }
            className="relative rounded-xl p-2 transition hover:bg-white/10"
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <nav className="space-y-3">
          <Link
            href="/dashboard"
            className={navClass('/dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link
            href="/dashboard/clients"
            className={navClass(
              '/dashboard/clients'
            )}
          >
            <Users size={18} />
            Clients
          </Link>

          <Link
            href="/dashboard/calendar"
            className={navClass(
              '/dashboard/calendar'
            )}
          >
            <Calendar size={18} />
            Calendar
          </Link>

          <Link
            href="/dashboard/cancelled-sessions"
            className={navClass(
              '/dashboard/cancelled-sessions'
            )}
          >
            <History size={18} />
            Cancelled Sessions
          </Link>

          <Link
            href="/dashboard/workouts"
            className={navClass(
              '/dashboard/workouts'
            )}
          >
            <Dumbbell size={18} />
            Workouts
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

      {openNotifications && (
        <div className="fixed left-[250px] top-20 z-[999999] w-[420px] rounded-2xl border border-white/10 bg-[#12121A] p-4 shadow-2xl">
          <h2 className="mb-4 text-lg font-semibold">
            Notifications
          </h2>

          <div className="max-h-96 space-y-3 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-400">
                No notifications
              </p>
            ) : (
              notifications.map(
                (notification) => (
                  <button
                    key={notification.id}
                    onClick={() =>
                      handleNotificationClick(
                        notification
                      )
                    }
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      notification.read
                        ? 'border-white/10 bg-black/20'
                        : 'border-violet-500/30 bg-violet-500/10'
                    }`}
                  >
                    <p className="font-semibold">
                      {notification.title}
                    </p>

                    <p className="mt-2 break-words text-sm leading-relaxed text-slate-300">
                      {notification.message}
                    </p>
                  </button>
                )
              )
            )}
          </div>
        </div>
      )}

      <section className="flex-1 p-10">
        {children}
      </section>
    </main>
  );
}