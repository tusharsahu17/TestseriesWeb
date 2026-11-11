'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Loader2,
  Lock,
  Search,
} from 'lucide-react';
import { dashboardService, formatDisplayDate } from '../../../services/dashboardService';
import type { StudentTestSeries, TestSeriesStatus } from '../../../types/dashboard';
import { SeriesStatusBadge } from '../../../components/dashboard/StatusBadges';

type FilterStatus = 'ALL' | TestSeriesStatus;

const STATUS_FILTERS: FilterStatus[] = ['ALL', 'ACTIVE', 'EXPIRED', 'PENDING', 'CANCELLED'];

export default function MyTestSeriesPage() {
  const [seriesList, setSeriesList] = useState<StudentTestSeries[]>([]);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSeries = useCallback(async () => {
    try {
      const data = await dashboardService.getAllTestSeries();
      setError(null);
      setSeriesList(data);
    } catch {
      setError('Failed to load your test series.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    void loadSeries();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSeries();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadSeries]);

  const filtered = seriesList.filter((item) => {
    const matchesStatus =
      statusFilter === 'ALL' || item.effectiveStatus === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.examName.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const activeCount = seriesList.filter((s) => s.canAttempt).length;
  const expiredCount = seriesList.filter((s) => s.effectiveStatus === 'EXPIRED').length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading your test series...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-welcome">
        <div>
          <h1>My Test Series</h1>
          <p>
            Track progress across enrolled series. Progress is calculated from evaluated tests;
            expired series remain visible in your history.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 font-semibold text-emerald-700">
            {activeCount} Active
          </span>
          <span className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-1.5 font-semibold text-slate-600">
            {expiredCount} Expired
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          <span className="inline-flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </span>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold hover:bg-rose-200 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((status) => {
            const count =
              status === 'ALL'
                ? seriesList.length
                : seriesList.filter((s) => s.effectiveStatus === status).length;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'ALL' ? 'All Series' : status} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search series..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:bg-white"
          />
        </div>
      </div>

      {/* Series Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <Layers size={36} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No test series found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {seriesList.length === 0
              ? 'You are not enrolled in any test series yet.'
              : 'No test series match your current filters.'}
          </p>
          <Link
            href="/dashboard/tests"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Browse Free Practice Tests
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((series) => (
            <div
              key={series.id}
              className={`flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                series.canAttempt
                  ? 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md'
                  : 'border-slate-200 bg-slate-50/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                    {series.examName || series.category || 'Series'}
                  </span>
                  <SeriesStatusBadge status={series.effectiveStatus} />
                </div>

                <h2 className="text-base font-bold text-slate-900">{series.title}</h2>
                {series.description && (
                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
                    {series.description}
                  </p>
                )}

                <div className="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      {series.completedTests} / {series.totalTests} Evaluated
                    </span>
                    <span className="font-bold text-slate-900">{series.progress}%</span>
                  </div>
                  <div className="dashboard-bar">
                    <div
                      className={`h-full rounded-full ${
                        series.canAttempt ? 'bg-indigo-600' : 'bg-slate-400'
                      }`}
                      style={{ width: `${series.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3.5 space-y-1.5 text-[11px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} /> Payment Status
                    </span>
                    <span className="font-semibold text-slate-700">{series.paymentStatus}</span>
                  </div>
                  {series.expiresAt && (
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> Enrollment Expiry
                      </span>
                      <span className="font-semibold text-slate-700">
                        {formatDisplayDate(series.expiresAt)}
                      </span>
                    </div>
                  )}
                  {series.endDate && (
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} /> Series End Date
                      </span>
                      <span className="font-semibold text-slate-700">
                        {formatDisplayDate(series.endDate)}
                      </span>
                    </div>
                  )}
                </div>

                {!series.canAttempt && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
                    <Lock size={13} className="mt-0.5 shrink-0 text-slate-400" />
                    <span>
                      {series.disabledReason ||
                        'New attempts are disabled. Past test results remain accessible.'}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  {series.canAttempt ? 'Attempts Enabled' : 'History Only'}
                </span>
                <Link
                  href={`/dashboard/test-series/${series.id}`}
                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  {series.canAttempt ? 'Open Series →' : 'View History →'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
