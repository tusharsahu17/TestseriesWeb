'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, Compass, Loader2, Search } from 'lucide-react';
import { dashboardService } from '../../../services/dashboardService';
import type { AvailableTestItem, AvailableTestsBuckets } from '../../../types/dashboard';
import { TestCard } from '../../../components/dashboard/TestCard';
import { StartTestModal, useTestStarter } from '../../../components/dashboard/StartTestModal';

type BucketTab =
  | 'all'
  | 'recommended'
  | 'newlyPublished'
  | 'fromPurchasedSeries'
  | 'freePractice'
  | 'upcoming';

const TABS: Array<{ key: BucketTab; label: string }> = [
  { key: 'all', label: 'All Tests' },
  { key: 'recommended', label: 'Recommended' },
  { key: 'newlyPublished', label: 'Newly Published' },
  { key: 'fromPurchasedSeries', label: 'From Purchased Series' },
  { key: 'freePractice', label: 'Free Practice' },
  { key: 'upcoming', label: 'Upcoming' },
];

const EMPTY_BUCKETS: AvailableTestsBuckets = {
  newlyPublished: [],
  upcoming: [],
  recommended: [],
  freePractice: [],
  fromPurchasedSeries: [],
  all: [],
};

function AvailableTestsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [buckets, setBuckets] = useState<AvailableTestsBuckets>(EMPTY_BUCKETS);
  const [activeTab, setActiveTab] = useState<BucketTab>('all');
  const [search, setSearch] = useState(initialSearch);
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTests = useCallback(async () => {
    try {
      const [bucketsRes, listRes] = await Promise.allSettled([
        dashboardService.getDashboardAvailableTests(),
        dashboardService.getAvailableTests(),
      ]);

      const next: AvailableTestsBuckets = { ...EMPTY_BUCKETS };
      if (bucketsRes.status === 'fulfilled') {
        next.newlyPublished = bucketsRes.value.newlyPublished;
        next.upcoming = bucketsRes.value.upcoming;
        next.recommended = bucketsRes.value.recommended;
        next.freePractice = bucketsRes.value.freePractice;
        next.fromPurchasedSeries = bucketsRes.value.fromPurchasedSeries;
        next.all = bucketsRes.value.all;
      }

      if (listRes.status === 'fulfilled' && listRes.value.all.length > 0) {
        const seen = new Set<string>();
        const merged: AvailableTestItem[] = [];
        for (const t of [...listRes.value.all, ...next.all]) {
          if (t.id && !seen.has(t.id)) {
            seen.add(t.id);
            merged.push(t);
          }
        }
        next.all = merged;
        if (next.newlyPublished.length === 0) next.newlyPublished = listRes.value.newlyPublished;
        if (next.upcoming.length === 0) next.upcoming = listRes.value.upcoming;
        if (next.recommended.length === 0) next.recommended = listRes.value.recommended;
        if (next.freePractice.length === 0) next.freePractice = listRes.value.freePractice;
        if (next.fromPurchasedSeries.length === 0) {
          next.fromPurchasedSeries = listRes.value.fromPurchasedSeries;
        }
      }

      if (bucketsRes.status === 'rejected' && listRes.status === 'rejected') {
        throw new Error('Failed to fetch available tests.');
      }

      setError(null);
      setBuckets(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to fetch tests.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    void loadTests();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadTests();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTests]);

  const {
    startingTestId,
    pendingTest,
    validationError,
    isAbandoning,
    handleTestAction,
    handleResumeConflict,
    handleAbandonAndStart,
    closeModal,
  } = useTestStarter(loadTests);

  const currentList = buckets[activeTab] || [];
  const subjects = Array.from(new Set(buckets.all.map((t) => t.subjectName).filter(Boolean)));

  const filtered = currentList.filter((test) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      test.title.toLowerCase().includes(q) ||
      test.subjectName.toLowerCase().includes(q) ||
      (test.seriesTitle || '').toLowerCase().includes(q);
    const matchesSubject = subjectFilter === 'ALL' || test.subjectName === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Discovering available tests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-welcome">
        <div>
          <h1>Available Tests</h1>
          <p>
            Browse recommended, newly published, purchased series, free practice, and upcoming tests.
          </p>
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

      {/* Bucket Tabs + Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const count = buckets[tab.key].length;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by test title, subject, or series..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:bg-white"
            />
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </select>

          {(search || subjectFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSubjectFilter('ALL');
              }}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <Compass size={36} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching tests</h3>
          <p className="mt-1 text-xs text-slate-500">
            Try switching test categories or adjusting your search filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              isStarting={startingTestId === test.id}
              onAction={handleTestAction}
            />
          ))}
        </div>
      )}

      <StartTestModal
        test={pendingTest}
        error={validationError}
        isAbandoning={isAbandoning}
        onResumeConflict={handleResumeConflict}
        onAbandonAndStart={handleAbandonAndStart}
        onClose={closeModal}
      />
    </div>
  );
}

export default function AvailableTestsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium text-slate-500">Loading available tests...</p>
        </div>
      }
    >
      <AvailableTestsContent />
    </Suspense>
  );
}
