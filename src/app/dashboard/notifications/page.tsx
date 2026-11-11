'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Megaphone,
  Send,
} from 'lucide-react';
import { selectAuthUser } from '../../auth/authSlice';
import {
  fetchAllNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  selectNotifications,
  selectNotificationsLoading,
  selectNotificationsPagination,
  selectUnreadNotificationsCount,
} from '../../../store/slices/notificationsSlice';
import type { AppDispatch } from '../../../store/store';
import { dashboardService } from '../../../services/dashboardService';
import type { NotificationType, UserNotification } from '../../../types/dashboard';
import {
  formatRelativeTime,
  getNotificationMeta,
} from '../../../components/dashboard/notificationMeta';

type TypeFilter = 'ALL' | NotificationType;

const TYPE_OPTIONS: Array<{ value: TypeFilter; label: string }> = [
  { value: 'ALL', label: 'All Types' },
  { value: 'NEW_TEST', label: 'New Tests' },
  { value: 'RESULT_PUBLISHED', label: 'Results Published' },
  { value: 'SERIES_EXPIRING', label: 'Series Expiring' },
  { value: 'PAYMENT_CONFIRMED', label: 'Payments' },
  { value: 'ANNOUNCEMENT', label: 'Announcements' },
];

export default function NotificationsPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector(selectAuthUser);
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadNotificationsCount);
  const pagination = useSelector(selectNotificationsPagination);
  const isLoading = useSelector(selectNotificationsLoading);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Admin announcement state (shown only for admin accounts)
  const isAdmin = String(authUser?.role || '').toUpperCase() === 'ADMIN';
  const [showComposer, setShowComposer] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annType, setAnnType] = useState<NotificationType>('ANNOUNCEMENT');
  const [isSendingAnn, setIsSendingAnn] = useState(false);
  const [annFeedback, setAnnFeedback] = useState<string | null>(null);

  const loadList = useCallback(() => {
    dispatch(
      fetchAllNotifications({
        page,
        limit: 15,
        type: typeFilter,
        unreadOnly,
      }),
    );
  }, [dispatch, page, typeFilter, unreadOnly]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleNotificationClick = async (notif: UserNotification) => {
    if (!notif.isRead) {
      await dispatch(markNotificationAsRead(notif.id));
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;
    try {
      setIsSendingAnn(true);
      setAnnFeedback(null);
      await dashboardService.createAdminNotification({
        title: annTitle.trim(),
        message: annMessage.trim(),
        type: annType,
      });
      setAnnTitle('');
      setAnnMessage('');
      setShowComposer(false);
      setAnnFeedback('Notification published successfully.');
      loadList();
    } catch {
      setAnnFeedback('Failed to publish notification.');
    } finally {
      setIsSendingAnn(false);
    }
  };

  const displayed = notifications.filter((n) => {
    const matchesType = typeFilter === 'ALL' || n.type === typeFilter;
    const matchesUnread = !unreadOnly || !n.isRead;
    return matchesType && matchesUnread;
  });

  return (
    <div className="space-y-6">
      <div className="dashboard-welcome">
        <div>
          <h1>Notifications</h1>
          <p>
            Updates for new tests, published results, payment confirmations, 7-day expiry reminders,
            and announcements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => dispatch(markAllNotificationsAsRead())}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
            >
              <CheckCheck size={14} />
              Mark All Read ({unreadCount})
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowComposer((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer"
            >
              <Megaphone size={14} />
              {showComposer ? 'Close Composer' : 'Send Announcement'}
            </button>
          )}
        </div>
      </div>

      {annFeedback && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs font-medium text-indigo-800">
          {annFeedback}
        </div>
      )}

      {isAdmin && showComposer && (
        <form
          onSubmit={handleCreateAnnouncement}
          className="rounded-2xl border border-indigo-200 bg-white p-5 space-y-3"
        >
          <h3 className="text-sm font-bold text-slate-900">Publish Dashboard Notification</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Notification title"
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              className="sm:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-400"
            />
            <select
              value={annType}
              onChange={(e) => setAnnType(e.target.value as NotificationType)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-400"
            >
              <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
              <option value="NEW_TEST">NEW_TEST</option>
              <option value="RESULT_PUBLISHED">RESULT_PUBLISHED</option>
              <option value="SERIES_EXPIRING">SERIES_EXPIRING</option>
              <option value="PAYMENT_CONFIRMED">PAYMENT_CONFIRMED</option>
            </select>
          </div>
          <textarea
            required
            rows={3}
            placeholder="Message body..."
            value={annMessage}
            onChange={(e) => setAnnMessage(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-400"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSendingAnn}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
            >
              {isSendingAnn ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Publish Notification
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setTypeFilter(opt.value);
                setPage(1);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                typeFilter === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => {
              setUnreadOnly(e.target.checked);
              setPage(1);
            }}
            className="rounded border-slate-300 text-indigo-600"
          />
          Unread only
        </label>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs text-slate-500">Loading notifications...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-16 text-center">
            <Bell size={34} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No notifications found</h3>
            <p className="mt-1 text-xs text-slate-500">
              {unreadOnly
                ? 'You have no unread notifications right now.'
                : 'Notifications will appear here when tests, results, or reminders arrive.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayed.map((notif) => {
              const meta = getNotificationMeta(notif.type);
              const Icon = meta.Icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start justify-between gap-4 p-5 transition-colors cursor-pointer hover:bg-slate-50 ${
                    !notif.isRead ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.iconBg}`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                        {!notif.isRead && (
                          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            New
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1.5 text-sm font-bold text-slate-900">{notif.title}</h3>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(markNotificationAsRead(notif.id));
                      }}
                      className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs">
          <span className="text-slate-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-50 cursor-pointer"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-50 cursor-pointer"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

