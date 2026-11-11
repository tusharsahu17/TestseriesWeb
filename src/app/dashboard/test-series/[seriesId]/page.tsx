'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
} from 'lucide-react';
import { dashboardService, formatDisplayDate } from '../../../../services/dashboardService';
import type { StudentTestSeries } from '../../../../types/dashboard';
import { SeriesStatusBadge } from '../../../../components/dashboard/StatusBadges';
import { TestCard } from '../../../../components/dashboard/TestCard';
import { StartTestModal, useTestStarter } from '../../../../components/dashboard/StartTestModal';

export default function TestSeriesDetailPage() {
  const params = useParams();
  const seriesId = params.seriesId as string;

  const [series, setSeries] = useState<StudentTestSeries | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!seriesId) return;
    try {
      const data = await dashboardService.getTestSeriesDetail(seriesId);
      setError(null);
      setSeries(data);
    } catch {
      setError('Failed to load test series details.');
    } finally {
      setIsLoading(false);
    }
  }, [seriesId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDetail();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDetail]);

  const {
    startingTestId,
    pendingTest,
    validationError,
    isAbandoning,
    handleTestAction,
    handleResumeConflict,
    handleAbandonAndStart,
    closeModal,
  } = useTestStarter(loadDetail);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading series details...</p>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/test-series"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline"
        >
          <ArrowLeft size={14} /> Back to My Test Series
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
          <AlertCircle size={24} className="mx-auto mb-2" />
          <p className="text-sm font-semibold">{error || 'Series not found'}</p>
        </div>
      </div>
    );
  }

  const tests = (series.tests || []).map((t) =>
    series.canAttempt
      ? t
      : {
          ...t,
          canStart: false,
          actionLabel: t.latestAttemptId ? 'View Result' : 'Expired',
          disabledReason:
            t.disabledReason ||
            series.disabledReason ||
            'Series is no longer active for new attempts.',
        },
  );

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/test-series"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
      >
        <ArrowLeft size={14} /> Back to My Test Series
      </Link>

      {/* Series Summary Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {series.examName && (
                <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-semibold text-indigo-700">
                  {series.examName}
                </span>
              )}
              <SeriesStatusBadge status={series.effectiveStatus} />
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                Payment: {series.paymentStatus}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{series.title}</h1>
            {series.description && (
              <p className="mt-2 text-sm text-slate-600 max-w-3xl">{series.description}</p>
            )}
          </div>

          <div className="w-full sm:w-64 rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Evaluated Progress
              </span>
              <span className="font-bold text-slate-900">{series.progress}%</span>
            </div>
            <div className="dashboard-bar mb-2">
              <div
                className={`h-full rounded-full ${
                  series.canAttempt ? 'bg-indigo-600' : 'bg-slate-400'
                }`}
                style={{ width: `${series.progress}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500">
              {series.completedTests} of {series.totalTests} tests completed
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-6 border-t border-slate-100 pt-4 text-xs text-slate-600">
          {series.startDate && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              Started: <strong>{formatDisplayDate(series.startDate)}</strong>
            </span>
          )}
          {series.endDate && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              Series Ends: <strong>{formatDisplayDate(series.endDate)}</strong>
            </span>
          )}
          {series.expiresAt && (
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              Enrollment Valid Until: <strong>{formatDisplayDate(series.expiresAt)}</strong>
            </span>
          )}
        </div>

        {!series.canAttempt && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <Lock size={15} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <strong>Attempt Access Disabled (History Mode):</strong>{' '}
              {series.disabledReason ||
                'This test series enrollment is expired, pending, or cancelled. You can still review past evaluated results.'}
            </div>
          </div>
        )}
      </div>

      {/* Tests in this series */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Tests in This Series ({tests.length})
          </h2>
        </div>

        {tests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-xs text-slate-500">
            No tests published in this series yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                isStarting={startingTestId === test.id}
                onAction={handleTestAction}
              />
            ))}
          </div>
        )}
      </div>

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
