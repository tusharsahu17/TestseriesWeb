"use client";

import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectIsAuthenticated,
  selectAuthUser,
  logout,
} from "../auth/authSlice";
import {
  fetchDashboardNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  selectNotifications,
  selectUnreadNotificationsCount,
} from "../../store/slices/notificationsSlice";
import type { AppDispatch } from "../../store/store";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  CheckCheck,
  ClipboardList,
  Compass,
  FileBarChart2,
  FileText,
  Home,
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react";
import {
  formatRelativeTime,
  getNotificationMeta,
} from "../../components/dashboard/notificationMeta";
import type { UserNotification } from "../../types/dashboard";
import "./dashboard.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authUser = useSelector(selectAuthUser);
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadNotificationsCount);

  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();

  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push("/auth?tab=login");
    }
  }, [isAuthenticated, router, isMounted]);

  useEffect(() => {
    if (isMounted && isAuthenticated) {
      dispatch(fetchDashboardNotifications());
    }
  }, [dispatch, isMounted, isAuthenticated]);

  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch(logout());
      router.push("/auth?tab=login");
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [dispatch, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/auth?tab=login");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/dashboard/tests?search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/dashboard/tests");
    }
  };

  const handleNotificationClick = async (notif: UserNotification) => {
    if (!notif.isRead) {
      await dispatch(markNotificationAsRead(notif.id));
    }
    setIsNotifOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const displayName = isMounted
    ? authUser?.fullName ||
      authUser?.name ||
      authUser?.username ||
      authUser?.email ||
      "Student"
    : "Student";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "ST";
  const roleLabel =
    isMounted && authUser?.role ? String(authUser.role) : "Student";
  const safeUnreadCount = isMounted ? unreadCount : 0;

  const navItems = [
    { name: "My Exams", href: "/dashboard/exams", Icon: BookOpen },
    { name: "Analytics", href: "/dashboard", Icon: Home },
    { name: "Available Tests", href: "/dashboard/tests", Icon: Compass },
    { name: "Study Material", href: "/dashboard/pdfs", Icon: FileText },
    { name: "Results", href: "/dashboard/results", Icon: ClipboardList },
    {
      name: "Performance",
      href: "/dashboard/performance",
      Icon: FileBarChart2,
    },
    {
      name: "Notifications",
      href: "/dashboard/notifications",
      Icon: Bell,
      badge: safeUnreadCount,
    },
  ];

  return (
    <div
      className="dashboard-app"
      style={{
        visibility: isMounted && isAuthenticated ? "visible" : "hidden",
      }}
    >
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-9 bg-slate-900/40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`dashboard-sidebar flex flex-col justify-between ${isSidebarOpen ? "mobile-open" : ""}`}
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="dashboard-logo">
              <div className="dashboard-logo-icon">
                <img
                  src="/cec-logo.png"
                  alt="CEC Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <span>CEC</span>
            </div>
            <button
              type="button"
              className="md:hidden text-slate-400 hover:text-white mb-6 cursor-pointer"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          <div className="dashboard-menu-title">Main Menu</div>
          <nav className="dashboard-nav">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.Icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`dashboard-nav-item justify-between ${isActive ? "active" : ""}`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={17} />
                    <span>{item.name}</span>
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleLogout}
            className="dashboard-nav-item w-full text-left text-rose-300 hover:text-rose-200 hover:bg-rose-500/10"
          >
            <LogOut size={17} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="dashboard-main">
        {/* Mobile header */}
        <div className="dashboard-mobile-header">
          <div className="dashboard-mobile-logo">
            <div className="dashboard-mobile-logo-icon">
              <img
                src="/cec-logo.png"
                alt="CEC Logo"
                className="h-full w-full object-contain"
              />
            </div>
            CEC
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/notifications"
              className="relative p-1.5 text-slate-200 hover:text-white"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {safeUnreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" />
              )}
            </Link>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-white cursor-pointer"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>

        {/* Desktop Topbar */}
        <header className="dashboard-topbar">
          <form onSubmit={handleSearchSubmit} className="dashboard-search">
            <Search size={15} className="dashboard-search-icon" />
            <input
              type="text"
              placeholder="Search available tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="dashboard-top-actions ml-auto">
            {/* Notification Bell + Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer"
                aria-label="Toggle notifications"
              >
                <Bell size={18} />
                {safeUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {safeUnreadCount > 9 ? "9+" : safeUnreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Notifications
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {unreadCount > 0
                          ? `${unreadCount} unread`
                          : "All caught up"}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => dispatch(markAllNotificationsAsRead())}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        <CheckCheck size={13} />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((notif) => {
                        const meta = getNotificationMeta(notif.type);
                        const Icon = meta.Icon;
                        return (
                          <button
                            key={notif.id}
                            type="button"
                            onClick={() => handleNotificationClick(notif)}
                            className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-slate-50 cursor-pointer ${
                              !notif.isRead ? "bg-indigo-50/40" : ""
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.iconBg}`}
                            >
                              <Icon size={15} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-slate-900 truncate">
                                  {notif.title}
                                </span>
                                {!notif.isRead && (
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                                )}
                              </div>
                              <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-2">
                                {notif.message}
                              </p>
                              <span className="mt-1 block text-[10px] text-slate-400">
                                {formatRelativeTime(notif.createdAt)}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center">
                    <Link
                      href="/dashboard/notifications"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      View All Notifications →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="dashboard-profile">
              <div className="dashboard-avatar">{initials}</div>
              <div className="dashboard-profile-info">
                <strong>{displayName}</strong>
                <span className="capitalize">{roleLabel.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content (Injected per page) */}
        <section className="dashboard-content">{children}</section>
      </main>
    </div>
  );
}
