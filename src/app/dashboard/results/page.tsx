'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Search,
} from 'lucide-react';
import {
  dashboardService,
  formatDisplayDate,
  formatDurationSeconds,
} from '../../../services/dashboardService';
import type { PaginationMeta, RecentAttemptItem } from '../../../types/dashboard';

const PAGE_SIZE = 10;

export default function ResultsHistoryPage() {
  const router = useRouter();
  const [attempts, setAttempts] = useState<RecentAttemptItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAttempts = useCallback(async () => {
    try {
      const res = await dashboardService.getAllAttempts({
        page,
        limit: PAGE_SIZE,
        search: searchQuery || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        subject: subjectFilter !== 'ALL' ? subjectFilter : undefined,
      });
      setError(null);
      setAttempts(res.attempts);
      setPagination(res.pagination);
    } catch {
      setError('Failed to load your test attempt history.');
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, statusFilter, subjectFilter]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    void loadAttempts();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAttempts();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadAttempts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  // Client-side fallback filter if backend ignores search/subject query params
  const visibleAttempts = attempts.filter((att) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      att.testTitle.toLowerCase().includes(q) ||
      att.subjectName.toLowerCase().includes(q) ||
      (att.seriesTitle || '').toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === 'ALL' ||
      att.status === statusFilter ||
      att.evaluationStatus === statusFilter;
    const matchesSubject = subjectFilter === 'ALL' || att.subjectName === subjectFilter;
    return matchesSearch && matchesStatus && matchesSubject;
  });

  const subjects = Array.from(new Set(attempts.map((a) => a.subjectName).filter(Boolean)));

  const renderStatusBadge = (attempt: RecentAttemptItem) => {
    const st = (attempt.evaluationStatus || attempt.status).toUpperCase();
    if (st === 'PENDING_EVALUATION' || st === 'EVALUATION_PENDING') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
          <Clock size={10} /> Pending Evaluation
        </span>
      );
    }
    if (st === 'IN_PROGRESS') {
      return (
        <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-[10px] font-semibold text-sky-700">
          In Progress
        </span>
      );
    }
    if (st === 'ABANDONED' || st === 'CANCELLED' || st === 'INVALID') {
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
          {st}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
        Evaluated
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="dashboard-welcome">
        <div>
          <h1>Attempts &amp; Results</h1>
          <p>Review your evaluated test attempts, marks, accuracy, and detailed explanations.</p>
        </div>
        <Link
          href="/dashboard/performance"
          className="dashboard-date-btn font-semibold text-indigo-600 no-underline hover:bg-slate-50"
        >
          Performance Analytics →
        </Link>
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search test title, subject, or series..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400"
          >
            <option value="ALL">All Evaluated</option>
            <option value="EVALUATED">Evaluated</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING_EVALUATION">Pending Evaluation</option>
          </select>

          {subjects.length > 0 && (
            <select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          )}

          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
          >
            Apply
          </button>

          {(searchQuery || statusFilter !== 'ALL' || subjectFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
                setStatusFilter('ALL');
                setSubjectFilter('ALL');
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Reset
            </button>
          )}
        </form>
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

      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h3>Attempt History</h3>
          <span className="text-xs text-slate-400">{pagination.total} total</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs text-slate-500">Loading test history...</p>
          </div>
        ) : visibleAttempts.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <p className="text-sm font-semibold text-slate-700">No attempts found</p>
            <p className="mt-1 text-xs text-slate-400">
              Take an available test to build your evaluated attempt history.
            </p>
            <button
              type="button"
              onClick={() => router.push('/dashboard/tests')}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
            >
              Browse Available Tests
            </button>
          </div>
        ) : (
          <div className="dashboard-recent-wrapper" style={{ overflowX: 'auto' }}>
            <table className="dashboard-recent-table">
              <thead>
                <tr>
                  <th>TEST</th>
                  <th>SUBJECT</th>
                  <th>SUBMITTED</th>
                  <th>MARKS</th>
                  <th>SCORE</th>
                  <th>ACCURACY</th>
                  <th>TIME</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {visibleAttempts.map((attempt) => {
                  const pct = Number(attempt.percentage);
                  const scoreBadgeClass =
                    pct >= 80
                      ? 'dashboard-high-score'
                      : pct >= 50
                        ? 'dashboard-medium-score'
                        : 'dashboard-low-score';
                  const isInProgress = attempt.status === 'IN_PROGRESS';
                  return (
                    <tr key={attempt.id}>
                      <td className="dashboard-test-name">
                        {attempt.testTitle}
                        {attempt.seriesTitle && (
                          <span className="block text-[10px] font-normal text-slate-400">
                            {attempt.seriesTitle}
                          </span>
                        )}
                      </td>
                      <td>{attempt.subjectName}</td>
                      <td className="dashboard-test-date">
                        {formatDisplayDate(attempt.submittedAt || attempt.startedAt)}
                      </td>
                      <td>
                        {attempt.obtainedMarks} / {attempt.totalMarks}
                      </td>
                      <td>
                        <span className={`dashboard-score-badge ${scoreBadgeClass}`}>
                          {pct.toFixed(1)}%
                        </span>
                      </td>
                      <td>{Number(attempt.accuracy).toFixed(1)}%</td>
                      <td>{formatDurationSeconds(attempt.timeSpentSeconds)}</td>
                      <td>{renderStatusBadge(attempt)}</td>
                      <td>
                        {isInProgress && attempt.testId ? (
                          <Link
                            href={`/dashboard/tests/${attempt.testId}?attemptId=${attempt.attemptId}`}
                            className="dashboard-view-all"
                          >
                            Resume →
                          </Link>
                        ) : (
                          <Link
                            href={`/dashboard/results/${attempt.attemptId}`}
                            className="dashboard-view-all"
                          >
                            View Result →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs">
          <span className="text-slate-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} results)
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
