'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  HardDrive,
  Layers,
  Loader2,
  Play,
  RefreshCw,
  Target,
  TrendingUp,
} from 'lucide-react';
import { selectAuthUser, setAuthUser } from '../auth/authSlice';
import {
  markNotificationAsRead,
  selectNotifications,
  selectUnreadNotificationsCount,
  setNotificationsSnapshot,
} from '../../store/slices/notificationsSlice';
import type { AppDispatch } from '../../store/store';
import {
  dashboardService,
  formatDisplayDate,
  formatDurationSeconds,
} from '../../services/dashboardService';
import type {
  AvailableTestItem,
  AvailableTestsBuckets,
  DashboardSummary,
  PerformanceAnalytics,
  RecentAttemptItem,
} from '../../types/dashboard';
import { ScoreTrendChart } from '../../components/dashboard/ScoreTrendChart';
import { TestCard } from '../../components/dashboard/TestCard';
import { YouTubeVideosSection } from '../../components/dashboard/YouTubeVideosSection';
import { StartTestModal, useTestStarter } from '../../components/dashboard/StartTestModal';
import { PdfViewerModal } from '../../components/pdf/PdfViewerModal';
import { formatFileSize, pdfService } from '../../services/pdfService';
import type { PdfDocument } from '../../types/pdf';
import {
  getPerformanceBarClass,
  PerformanceStatusBadge,
} from '../../components/dashboard/StatusBadges';
import { formatRelativeTime, getNotificationMeta } from '../../components/dashboard/notificationMeta';

type BucketKey =
  | 'recommended'
  | 'newlyPublished'
  | 'fromPurchasedSeries'
  | 'freePractice'
  | 'upcoming';

const BUCKET_TABS: Array<{ key: BucketKey; label: string }> = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'newlyPublished', label: 'Newly Published' },
  { key: 'fromPurchasedSeries', label: 'From My Series' },
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

const EMPTY_PERFORMANCE: PerformanceAnalytics = {
  scoreTrend: [],
  subjectWisePerformance: [],
  metrics: {
    highestScore: 0,
    averageScore: 0,
    overallAccuracy: 0,
    averageTimePerTestSeconds: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    totalSkipped: 0,
    totalEvaluatedTests: 0,
  },
};

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector(selectAuthUser);
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadNotificationsCount);

  const [summary, setSummary] = useState<DashboardSummary>({
    testsAttempted: 0,
    averageScore: 0,
    accuracy: 0,
    activeTestSeries: 0,
  });
  const [availableTests, setAvailableTests] = useState<AvailableTestsBuckets>(EMPTY_BUCKETS);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttemptItem[]>([]);
  const [performance, setPerformance] = useState<PerformanceAnalytics>(EMPTY_PERFORMANCE);
  const [recentPdfs, setRecentPdfs] = useState<PdfDocument[]>([]);
  const [previewPdf, setPreviewPdf] = useState<PdfDocument | null>(null);

  const [activeBucket, setActiveBucket] = useState<BucketKey>('recommended');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(
    async () => {
      try {
        try {
          const combined = await dashboardService.getCombinedDashboard();
          if (combined.user && !authUser) {
            dispatch(setAuthUser({ id: combined.user.id ?? 'me', ...combined.user }));
          }
          setError(null);
          setSummary(combined.summary);
          setAvailableTests(combined.availableTests);
          setRecentAttempts(combined.recentAttempts.slice(0, 5));
          setPerformance(combined.performance);
          dispatch(setNotificationsSnapshot(combined.notifications));

          // Auto-select first non-empty bucket if recommended is empty
          if (combined.availableTests.recommended.length === 0) {
            const firstNonEmpty = BUCKET_TABS.find(
              (tab) => combined.availableTests[tab.key].length > 0,
            );
            if (firstNonEmpty) setActiveBucket(firstNonEmpty.key);
          }
        } catch {
          // Fallback to individual dashboard endpoints if combined endpoint is unavailable
          const [summaryRes, testsRes, attemptsRes, perfRes, notifRes] =
            await Promise.allSettled([
              dashboardService.getDashboardSummary(),
              dashboardService.getDashboardAvailableTests(),
              dashboardService.getRecentAttempts(),
              dashboardService.getPerformanceAnalytics(),
              dashboardService.getDashboardNotifications(),
            ]);

          const allRejected = [
            summaryRes,
            testsRes,
            attemptsRes,
            perfRes,
            notifRes,
          ].every((r) => r.status === 'rejected');

          if (allRejected) {
            throw new Error('Failed to load dashboard data from server.');
          }

          setError(null);
          if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
          if (testsRes.status === 'fulfilled') {
            setAvailableTests(testsRes.value);
            if (testsRes.value.recommended.length === 0) {
              const firstNonEmpty = BUCKET_TABS.find(
                (tab) => testsRes.value[tab.key].length > 0,
              );
              if (firstNonEmpty) setActiveBucket(firstNonEmpty.key);
            }
          }
          if (attemptsRes.status === 'fulfilled') {
            setRecentAttempts(attemptsRes.value.slice(0, 5));
          }
          if (perfRes.status === 'fulfilled') setPerformance(perfRes.value);
          if (notifRes.status === 'fulfilled') {
            dispatch(setNotificationsSnapshot(notifRes.value));
          }
        }

        // Fetch recent study documents (non-blocking)
        try {
          const pdfRes = await pdfService.getAllPdfs({ limit: 4, sortBy: 'created_at', order: 'DESC' });
          setRecentPdfs(pdfRes.data.slice(0, 4));
        } catch {
          // Keep empty if none or endpoint unreachable
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [authUser, dispatch],
  );

  const handleRefreshDashboard = useCallback(() => {
    setIsRefreshing(true);
    void loadDashboard();
  }, [loadDashboard]);

  const handleRetryDashboard = useCallback(() => {
    setIsLoading(true);
    setError(null);
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDashboard]);

  const {
    startingTestId,
    pendingTest,
    validationError,
    isAbandoning,
    handleTestAction,
    handleResumeConflict,
    handleAbandonAndStart,
    closeModal,
  } = useTestStarter(handleRefreshDashboard);

  const greetingName =
    authUser?.name || authUser?.fullName || authUser?.username || 'Student';
  const todayLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Determine hero highlight test (in-progress first, then recommended, then purchased, then free)
  const inProgressTest: AvailableTestItem | undefined = availableTests.all.find(
    (t) => t.attemptStatus === 'IN_PROGRESS' && t.activeAttemptId,
  );
  const featuredTest: AvailableTestItem | undefined =
    inProgressTest ||
    availableTests.recommended[0] ||
    availableTests.fromPurchasedSeries[0] ||
    availableTests.freePractice[0] ||
    availableTests.newlyPublished[0];

  const activeBucketTests = availableTests[activeBucket] || [];
  const unreadHighlights = notifications.filter((n) => !n.isRead).slice(0, 2);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRetryDashboard}
            className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-200 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Unread Notification Highlights (e.g., 7-day expiry reminders, new tests, results) */}
      {unreadHighlights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {unreadHighlights.map((notif) => {
            const meta = getNotificationMeta(notif.type);
            const Icon = meta.Icon;
            return (
              <div
                key={notif.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.iconBg}`}>
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    <h4 className="mt-1 text-xs font-bold text-slate-900 truncate">
                      {notif.title}
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">{notif.message}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {notif.link && (
                    <Link
                      href={notif.link}
                      onClick={() => dispatch(markNotificationAsRead(notif.id))}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Open
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => dispatch(markNotificationAsRead(notif.id))}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OVERVIEW CARDS */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon dashboard-purple">
              <CheckCircle2 size={20} />
            </div>
            <span className="dashboard-trend">Evaluated</span>
          </div>
          <h2>{summary.testsAttempted}</h2>
          <p>Tests Attempted</p>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon dashboard-blue">
              <TrendingUp size={20} />
            </div>
            <span className="dashboard-trend">Score</span>
          </div>
          <h2>{Number(summary.averageScore).toFixed(1)}%</h2>
          <p>Average Score</p>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon dashboard-green">
              <Target size={20} />
            </div>
            <span className="dashboard-trend">Excl. skipped</span>
          </div>
          <h2>{Number(summary.accuracy).toFixed(1)}%</h2>
          <p>Overall Accuracy</p>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon dashboard-orange">
              <Layers size={20} />
            </div>
            <span className="dashboard-trend">Enrolled</span>
          </div>
          <h2>{summary.activeTestSeries}</h2>
          <p>Active Test Series</p>
        </div>
      </div>

      {/* ROW 1: FEATURED / CONTINUE TEST + SUBJECT-WISE PERFORMANCE */}
      <div className="dashboard-grid-layout">
        {/* Featured / Continue Test + Score Trend */}
        <div className="space-y-5">
          <div className="dashboard-card dashboard-learning-card">
            <div className="dashboard-card-header">
              <h3>{inProgressTest ? 'Resume Active Attempt' : 'Recommended Next Test'}</h3>
              <Link href="/dashboard/tests" className="dashboard-view-all">
                Browse All Tests
              </Link>
            </div>

            {featuredTest ? (
              <div className="dashboard-learning-content">
                <div className="min-w-0 pr-4">
                  <div className="dashboard-learning-label">
                    {featuredTest.subjectName}
                    {featuredTest.seriesTitle ? ` • ${featuredTest.seriesTitle}` : ''}
                  </div>
                  <h2 className="truncate">{featuredTest.title}</h2>
                  <p>
                    {featuredTest.totalQuestions} questions • {featuredTest.durationMinutes} min •{' '}
                    {featuredTest.totalMarks} marks
                  </p>
                  <button
                    type="button"
                    disabled={startingTestId === featuredTest.id}
                    onClick={() => handleTestAction(featuredTest)}
                    className="dashboard-continue-btn inline-flex items-center gap-2 disabled:opacity-60"
                  >
                    {startingTestId === featuredTest.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    {featuredTest.actionLabel} →
                  </button>
                </div>
                <div className="dashboard-quiz-illustration shrink-0">
                  <BookOpen size={36} className="text-indigo-600" />
                </div>
              </div>
            ) : (
              <div className="relative z-10 flex items-center justify-between gap-4 py-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Ready for your next challenge?</h2>
                  <p className="mt-1 text-xs text-slate-600">
                    Explore available tests or check your enrolled test series to get started.
                  </p>
                  <Link
                    href="/dashboard/tests"
                    className="dashboard-continue-btn inline-flex items-center gap-1.5 no-underline"
                  >
                    Explore Available Tests <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="dashboard-quiz-illustration shrink-0">
                  <Award size={36} className="text-indigo-600" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subject-wise Performance + Notifications Summary */}
        <div className="space-y-5">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>Subject Performance</h3>
              <Link href="/dashboard/performance" className="dashboard-view-all">
                Details
              </Link>
            </div>

            {performance.subjectWisePerformance.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                <p className="text-xs font-medium text-slate-500">
                  No subject analytics available yet.
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Attempt a test to view Strong, Average, and Needs improvement insights.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {performance.subjectWisePerformance.slice(0, 6).map((subj) => (
                  <div key={subj.subject}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {subj.subject}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <PerformanceStatusBadge status={subj.status} />
                        <span className="text-xs font-bold text-slate-700">
                          {Number(subj.percentage).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="dashboard-bar">
                      <div
                        className={`h-full rounded-full ${getPerformanceBarClass(subj.status)}`}
                        style={{ width: `${Math.min(100, Math.max(0, subj.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Performance Quick Aggregates */}
          {/* <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>Performance Snapshot</h3>
              <span className="text-[11px] text-slate-400">
                Avg time: {formatDurationSeconds(performance.metrics.averageTimePerTestSeconds)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-xl bg-emerald-50/70 p-3">
                <strong className="block text-base font-bold text-emerald-700">
                  {performance.metrics.totalCorrect}
                </strong>
                <span className="text-[10px] font-medium text-emerald-600">Correct</span>
              </div>
              <div className="rounded-xl bg-rose-50/70 p-3">
                <strong className="block text-base font-bold text-rose-700">
                  {performance.metrics.totalIncorrect}
                </strong>
                <span className="text-[10px] font-medium text-rose-600">Incorrect</span>
              </div>
              <div className="rounded-xl bg-slate-100 p-3">
                <strong className="block text-base font-bold text-slate-700">
                  {performance.metrics.totalSkipped}
                </strong>
                <span className="text-[10px] font-medium text-slate-500">Skipped</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Bell size={14} className="text-indigo-500" />
                {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
              </span>
              <Link href="/dashboard/notifications" className="font-semibold text-indigo-600 hover:text-indigo-800">
                Inbox →
              </Link>
            </div>
          </div> */}
        </div>
      </div>

      {/* Score Trend (T1..T10) */}
      <div className="dashboard-card w-full">
        <div className="dashboard-card-header">
          <div>
            <h3>Score Trend (Latest 10 Attempts)</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Normalized 0–100% across T1–T10 • Highest:{' '}
              {Number(performance.metrics.highestScore).toFixed(1)}%
            </p>
          </div>
          <Link href="/dashboard/performance" className="dashboard-view-all">
            Full Analytics
          </Link>
        </div>
        <ScoreTrendChart points={performance.scoreTrend} height={190} />
      </div>

      {/* AVAILABLE TESTS DISCOVERY BUCKETS */}
      <div className="dashboard-card">
        <div className="dashboard-card-header flex-wrap gap-3">
          <div>
            <h3>Available Tests</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Discover newly published, recommended, free practice, and series tests.
            </p>
          </div>
          <Link href="/dashboard/tests" className="dashboard-view-all">
            Explore All Tests
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {BUCKET_TABS.map((tab) => {
            const count = availableTests[tab.key].length;
            const active = activeBucket === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveBucket(tab.key)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {activeBucketTests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-xs text-slate-500">
            No tests currently in this category. Try another category or browse all tests.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeBucketTests.slice(0, 6).map((test) => (
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

      {/* RECENT EVALUATED ATTEMPTS (LATEST 5) */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h3>Recent Attempts</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Your latest 5 evaluated attempts ordered by submission date.
            </p>
          </div>
          <Link href="/dashboard/results" className="dashboard-view-all">
            View Full History
          </Link>
        </div>

        {recentAttempts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-xs text-slate-500">
            No evaluated attempts yet. Start a test above to see your results here.
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
                  <th>TIME SPENT</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {recentAttempts.map((attempt) => {
                  const pct = Number(attempt.percentage);
                  const badgeClass =
                    pct >= 80
                      ? 'dashboard-high-score'
                      : pct >= 50
                        ? 'dashboard-medium-score'
                        : 'dashboard-low-score';
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
                        <span className={`dashboard-score-badge ${badgeClass}`}>
                          {pct.toFixed(1)}%
                        </span>
                      </td>
                      <td>{formatDurationSeconds(attempt.timeSpentSeconds)}</td>
                      <td>
                        <Link
                          href={`/dashboard/results/${attempt.attemptId}`}
                          className="dashboard-view-all"
                        >
                          View Result →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* YOUTUBE CHANNEL VIDEOS */}
      <YouTubeVideosSection />

      {/* Start validation / conflict modal */}
      <StartTestModal
        test={pendingTest}
        error={validationError}
        isAbandoning={isAbandoning}
        onResumeConflict={handleResumeConflict}
        onAbandonAndStart={handleAbandonAndStart}
        onClose={closeModal}
      />

      {/* PDF preview modal */}
      <PdfViewerModal
        pdf={previewPdf}
        isOpen={Boolean(previewPdf)}
        onClose={() => setPreviewPdf(null)}
      />
    </div>
  );
}
