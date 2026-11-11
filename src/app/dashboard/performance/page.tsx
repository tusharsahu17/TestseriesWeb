'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  Loader2,
  Target,
  TrendingUp,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import { dashboardService, formatDurationSeconds } from '../../../services/dashboardService';
import type { PerformanceAnalytics, PerformanceStatus } from '../../../types/dashboard';
import { ScoreTrendChart } from '../../../components/dashboard/ScoreTrendChart';
import {
  getPerformanceBarClass,
  PerformanceStatusBadge,
} from '../../../components/dashboard/StatusBadges';

type SubjectFilter = 'ALL' | PerformanceStatus;

export default function PerformancePage() {
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [statusFilter, setStatusFilter] = useState<SubjectFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPerformance = useCallback(async () => {
    try {
      const data = await dashboardService.getPerformanceAnalytics();
      setError(null);
      setAnalytics(data);
    } catch {
      setError('Failed to load performance analytics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    void loadPerformance();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadPerformance();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadPerformance]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading performance analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
        <AlertCircle size={24} className="mx-auto mb-2" />
        <p className="text-sm font-semibold">{error || 'Unable to load analytics.'}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-3 rounded-xl bg-rose-100 px-4 py-2 text-xs font-semibold hover:bg-rose-200 cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { metrics, scoreTrend, subjectWisePerformance } = analytics;
  const totalQuestions =
    metrics.totalCorrect + metrics.totalIncorrect + metrics.totalSkipped;
  const filteredSubjects = subjectWisePerformance.filter(
    (s) => statusFilter === 'ALL' || s.status === statusFilter,
  );

  return (
    <div className="space-y-6">
      <div className="dashboard-welcome">
        <div>
          <h1>Performance Analytics</h1>
          <p>
            Insights across your evaluated attempts, score trend (T1–T10), and subject mastery.
          </p>
        </div>
        <Link
          href="/dashboard/results"
          className="dashboard-date-btn font-semibold text-indigo-600 no-underline hover:bg-slate-50"
        >
          View Attempt History →
        </Link>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon dashboard-purple">
              <Award size={20} />
            </div>
            <span className="dashboard-trend">Peak</span>
          </div>
          <h2>{Number(metrics.highestScore).toFixed(1)}%</h2>
          <p>Highest Score</p>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon dashboard-blue">
              <TrendingUp size={20} />
            </div>
            <span className="dashboard-trend">{metrics.totalEvaluatedTests} tests</span>
          </div>
          <h2>{Number(metrics.averageScore).toFixed(1)}%</h2>
          <p>Average Score</p>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon dashboard-green">
              <Target size={20} />
            </div>
            <span className="dashboard-trend">Excl. skipped</span>
          </div>
          <h2>{Number(metrics.overallAccuracy).toFixed(1)}%</h2>
          <p>Overall Accuracy</p>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon dashboard-orange">
              <Clock size={20} />
            </div>
            <span className="dashboard-trend">Per Test</span>
          </div>
          <h2>{formatDurationSeconds(metrics.averageTimePerTestSeconds)}</h2>
          <p>Average Time Spent</p>
        </div>
      </div>

      {/* Score Trend + Question Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h3>Score Trend (T1–T10)</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Latest 10 completed & evaluated attempts normalized to 0–100%.
              </p>
            </div>
          </div>
          <ScoreTrendChart points={scoreTrend} height={240} />
        </div>

        <div className="dashboard-card flex flex-col justify-between">
          <div>
            <div className="dashboard-card-header">
              <h3>Answer Breakdown</h3>
              <span className="text-xs text-slate-400">{totalQuestions} Total Qs</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 border border-emerald-100 p-3.5">
                <div className="flex items-center gap-2.5 text-emerald-700">
                  <CheckCircle2 size={18} />
                  <span className="text-xs font-semibold">Correct Answers</span>
                </div>
                <strong className="text-base font-bold text-emerald-800">
                  {metrics.totalCorrect}
                </strong>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-rose-50/70 border border-rose-100 p-3.5">
                <div className="flex items-center gap-2.5 text-rose-700">
                  <XCircle size={18} />
                  <span className="text-xs font-semibold">Incorrect Answers</span>
                </div>
                <strong className="text-base font-bold text-rose-800">
                  {metrics.totalIncorrect}
                </strong>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-100 border border-slate-200 p-3.5">
                <div className="flex items-center gap-2.5 text-slate-600">
                  <MinusCircle size={18} />
                  <span className="text-xs font-semibold">Skipped Questions</span>
                </div>
                <strong className="text-base font-bold text-slate-800">
                  {metrics.totalSkipped}
                </strong>
              </div>
            </div>
          </div>

          {totalQuestions > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="bg-emerald-500"
                  style={{ width: `${(metrics.totalCorrect / totalQuestions) * 100}%` }}
                  title={`Correct: ${metrics.totalCorrect}`}
                />
                <div
                  className="bg-rose-500"
                  style={{ width: `${(metrics.totalIncorrect / totalQuestions) * 100}%` }}
                  title={`Incorrect: ${metrics.totalIncorrect}`}
                />
                <div
                  className="bg-slate-400"
                  style={{ width: `${(metrics.totalSkipped / totalQuestions) * 100}%` }}
                  title={`Skipped: ${metrics.totalSkipped}`}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                <span>
                  {Math.round((metrics.totalCorrect / totalQuestions) * 100)}% Correct
                </span>
                <span>
                  {Math.round((metrics.totalIncorrect / totalQuestions) * 100)}% Incorrect
                </span>
                <span>
                  {Math.round((metrics.totalSkipped / totalQuestions) * 100)}% Skipped
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subject-wise Performance */}
      <div className="dashboard-card">
        <div className="dashboard-card-header flex-wrap gap-3">
          <div>
            <h3>Subject-wise Performance</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Strong (≥ 80%) • Average (60–79.99%) • Needs improvement (&lt; 60%)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'Strong', 'Average', 'Needs improvement'] as SubjectFilter[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Subjects' : st}
              </button>
            ))}
          </div>
        </div>

        {filteredSubjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-xs text-slate-500">
            No subject performance data matches the selected filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSubjects.map((subj) => (
              <div
                key={subj.subject}
                className="rounded-2xl border border-slate-200 p-4 hover:border-indigo-200 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold text-slate-900">{subj.subject}</h4>
                  <PerformanceStatusBadge status={subj.status} />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                  <span>Score / Mastery</span>
                  <strong className="text-slate-900">{Number(subj.percentage).toFixed(1)}%</strong>
                </div>
                <div className="dashboard-bar mb-3">
                  <div
                    className={`h-full rounded-full ${getPerformanceBarClass(subj.status)}`}
                    style={{ width: `${Math.min(100, Math.max(0, subj.percentage))}%` }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 text-center rounded-xl bg-slate-50 p-2.5 text-[11px]">
                  <div>
                    <strong className="block text-emerald-700">{subj.correctCount}</strong>
                    <span className="text-slate-400">Correct</span>
                  </div>
                  <div>
                    <strong className="block text-rose-700">{subj.wrongCount}</strong>
                    <span className="text-slate-400">Wrong</span>
                  </div>
                  <div>
                    <strong className="block text-slate-700">{subj.skippedCount}</strong>
                    <span className="text-slate-400">Skipped</span>
                  </div>
                  <div>
                    <strong className="block text-indigo-700">
                      {Number(subj.accuracy).toFixed(0)}%
                    </strong>
                    <span className="text-slate-400">Accuracy</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
