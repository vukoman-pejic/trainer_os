'use client';

import {
  Calendar,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Users,
  Bell,
  History,
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
  type: string;
  bookingId?: string;
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

  const [notificationsSkip, setNotificationsSkip] =
    useState(0);

  const [hasMoreNotifications, setHasMoreNotifications] =
    useState(true);

  const [openNotifications, setOpenNotifications] =
    useState(false);

  const [processedRequests, setProcessedRequests] =
    useState<Record<string, 'approved' | 'rejected'>>(
      {}
    );

  async function loadNotifications(
    reset = true
  ) {
    try {
      const skip = reset
        ? 0
        : notificationsSkip;

      const data = await apiFetch(
        `/dashboard/notifications?take=20&skip=${skip}`
      );

      if (reset) {
        setNotifications(data);
        setNotificationsSkip(20);
      } else {
        setNotifications((current) => [
          ...current,
          ...data,
        ]);

        setNotificationsSkip(
          skip + data.length
        );
      }

      setHasMoreNotifications(
        data.length === 20
      );
    } catch {
      // ignore
    }
  }

  async function loadMoreNotifications() {
    await loadNotifications(false);
  }

  async function markAllNotificationsRead() {
    try {
      await apiFetch(
        '/dashboard/notifications/read-all',
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

  async function approveLateRequest(
    bookingId: string,
    notificationId: string
  ) {
    try {
      await apiFetch(
        `/bookings/${bookingId}/approve-late-reschedule`,
        {
          method: 'PATCH',
        }
      );

      await apiFetch(
        `/dashboard/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
        }
      );

      await loadNotifications();

      setProcessedRequests((prev) => ({
        ...prev,
        [notificationId]: 'approved',
      }));
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function rejectLateRequest(
    bookingId: string,
    notificationId: string
  ) {
    try {
      await apiFetch(
        `/bookings/${bookingId}/reject-late-reschedule`,
        {
          method: 'PATCH',
        }
      );

      await apiFetch(
        `/dashboard/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
        }
      );

      await loadNotifications();

      setProcessedRequests((prev) => ({
        ...prev,
        [notificationId]: 'rejected',
      }));
    } catch (err: any) {
      alert(err.message);
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

      {/* Mobile top bar */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-[#07070B]/95 px-4 backdrop-blur-xl md:hidden">
        <h1 className="text-lg font-bold">
          Trainer OS
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
                  size="default"
                  onClick={markAllNotificationsRead}
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
                    <div
                      key={notification.id}
                      onClick={() =>
                        handleNotificationClick(
                          notification
                        )
                      }
                      className={`w-full cursor-pointer rounded-xl border p-4 text-left transition ${
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

                      {notification.type ===
                        'LATE_RESCHEDULE_REQUEST' &&
                        notification.bookingId &&
                        !notification.read && (
                          <div className="mt-4">
                            {processedRequests[
                              notification.id
                            ] ? (
                              <div
                                className={`rounded-xl px-3 py-2 text-sm font-medium ${
                                  processedRequests[
                                    notification.id
                                  ] === 'approved'
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-red-500/10 text-red-400'
                                }`}
                              >
                                {processedRequests[
                                  notification.id
                                ] === 'approved'
                                  ? 'Request Approved'
                                  : 'Request Rejected'}
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  size="default"
                                  onClick={(e) => {
                                    e.stopPropagation();

                                    approveLateRequest(
                                      notification.bookingId!,
                                      notification.id
                                    );
                                  }}
                                >
                                  Approve
                                </Button>

                                <Button
                                  size="default"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();

                                    rejectLateRequest(
                                      notification.bookingId!,
                                      notification.id
                                    );
                                  }}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )
                )
              )}
            </div>

            {hasMoreNotifications && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="ghost"
                  onClick={loadMoreNotifications}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Page content */}
      <section className="min-h-screen px-4 pb-24 pt-20 md:ml-72 md:p-10">
        {children}
      </section>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 gap-1 border-t border-white/10 bg-[#07070B]/95 px-2 py-2 backdrop-blur-xl md:hidden">
        <Link
          href="/dashboard"
          className={mobileNavClass(
            '/dashboard'
          )}
        >
          <LayoutDashboard size={20} />
          <span>Home</span>
        </Link>

        <Link
          href="/dashboard/clients"
          className={mobileNavClass(
            '/dashboard/clients'
          )}
        >
          <Users size={20} />
          <span>Clients</span>
        </Link>

        <Link
          href="/dashboard/calendar"
          className={mobileNavClass(
            '/dashboard/calendar'
          )}
        >
          <Calendar size={20} />
          <span>Calendar</span>
        </Link>

        <Link
          href="/dashboard/cancelled-sessions"
          className={mobileNavClass(
            '/dashboard/cancelled-sessions'
          )}
        >
          <History size={20} />
          <span>History</span>
        </Link>

        <Link
          href="/dashboard/workouts"
          className={mobileNavClass(
            '/dashboard/workouts'
          )}
        >
          <Dumbbell size={20} />
          <span>Workouts</span>
        </Link>
      </nav>
    </main>
  );
}