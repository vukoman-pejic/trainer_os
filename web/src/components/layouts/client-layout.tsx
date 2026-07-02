'use client';

import {
  LayoutDashboard,
  Calendar,
  User,
  LogOut,
  PlusCircle,
  Bell,
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

export function ClientLayout({
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
        '/client/notifications'
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
          `/client/notifications/${notification.id}/read`,
          {
            method: 'PATCH',
          }
        );

        await loadNotifications();
      }

      setOpenNotifications(false);
      router.push('/client/book');
    } catch {
      // ignore
    }
  }

  async function markAllNotificationsRead() {
    try {
      await apiFetch(
        '/client/notifications/read-all',
        {
          method: 'PATCH',
        }
      );

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
    } catch (error) {
      console.error(error);
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
        : 'text-slate-300 hover:bg-white/5'
    }`;
  }

  function mobileNavClass(path: string) {
    const active = pathname === path;

    return `flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] transition ${
      active
        ? 'bg-white/10 text-white'
        : 'text-slate-400'
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
    <main className="min-h-screen bg-[#07070B] text-white">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-white/10 bg-black/20 p-6 backdrop-blur-xl md:flex">
        <div className="mb-10 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Client Portal
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
            className={navClass(
              '/client/book'
            )}
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

      {/* Mobile top bar */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-[#07070B]/95 px-4 backdrop-blur-xl md:hidden">
        <h1 className="text-lg font-bold">
          Client Portal
        </h1>

        <div className="flex items-center gap-2">
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

          <button
            onClick={handleLogout}
            className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Notifications popup */}
      {openNotifications && (
        <>
          <button
            className="fixed inset-0 z-[99998] bg-black/40"
            onClick={() =>
              setOpenNotifications(false)
            }
            aria-label="Close notifications"
          />

          <div className="fixed left-4 right-4 top-20 z-[999999] rounded-2xl border border-white/10 bg-[#12121A] p-4 shadow-2xl md:left-[250px] md:right-auto md:w-[420px]">
            <h2 className="mb-4 text-lg font-semibold">
              Notifications
            </h2>

            {notifications.some(
              (notification) =>
                !notification.read
            ) && (
              <div className="mb-4 flex justify-end">
                <Button
                  variant="ghost"
                  onClick={
                    markAllNotificationsRead
                  }
                >
                  Mark all as read
                </Button>
              </div>
            )}

            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
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
        </>
      )}

      {/* Page content */}
      <section className="min-h-screen px-4 pb-24 pt-20 md:ml-72 md:p-10">
        {children}
      </section>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-4 gap-1 border-t border-white/10 bg-[#07070B]/95 px-2 py-2 backdrop-blur-xl md:hidden">
        <Link
          href="/client/dashboard"
          className={mobileNavClass(
            '/client/dashboard'
          )}
        >
          <LayoutDashboard size={20} />
          <span>Home</span>
        </Link>

        <Link
          href="/client/sessions"
          className={mobileNavClass(
            '/client/sessions'
          )}
        >
          <Calendar size={20} />
          <span>Sessions</span>
        </Link>

        <Link
          href="/client/book"
          className={mobileNavClass(
            '/client/book'
          )}
        >
          <PlusCircle size={20} />
          <span>Book</span>
        </Link>

        <Link
          href="/client/profile"
          className={mobileNavClass(
            '/client/profile'
          )}
        >
          <User size={20} />
          <span>Profile</span>
        </Link>
      </nav>
    </main>
  );
}