'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { getData } from '../../../../../../services/apiClient';
import { ENDPOINTS } from '../../../../../../constants/apiEndpoints';
import {
  dashboardService,
  normalizeAvailableTestsArray,
} from '../../../../../../services/dashboardService';
import type { AvailableTestItem, DashboardSummary } from '../../../../../../types/dashboard';
import { TestCard } from '../../../../../../components/dashboard/TestCard';
import { StartTestModal, useTestStarter } from '../../../../../../components/dashboard/StartTestModal';
import './availableTests.css';

export default function SubjectTestsPage() {
  const params = useParams();
  const examId = params.examId as string;
  const subjectId = params.subjectId as string;

  const [tests, setTests] = useState<AvailableTestItem[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');

  const fetchTests = useCallback(async () => {
    if (!subjectId) return;
    try {
      const [subjectTestsRes, examTestsRes, userTestsRes, summaryRes] = await Promise.allSettled([
        getData<unknown>(`${ENDPOINTS.SUBJECTS}/${subjectId}/tests`),
        getData<unknown>(`${ENDPOINTS.EXAMS}/${examId}/tests`),
        dashboardService.getAvailableTests({ examId, subjectId }),
        dashboardService.getDashboardSummary(),
      ]);

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value);
      }

      const userTests = userTestsRes.status === 'fulfilled' ? userTestsRes.value.all : [];
      const userTestsById = new Map<string, AvailableTestItem>(
        userTests.map((t) => [t.id, t]),
      );

      let resolved: AvailableTestItem[] = [];
      if (subjectTestsRes.status === 'fulfilled') {
        resolved = normalizeAvailableTestsArray(subjectTestsRes.value).map((normalized) => {
          const enriched = userTestsById.get(normalized.id);
          return enriched
            ? {
                ...normalized,
                ...enriched,
                subjectName: enriched.subjectName || normalized.subjectName,
              }
            : normalized;
        });
      } else if (examTestsRes.status === 'fulfilled' && examTestsRes.value) {
        resolved = normalizeAvailableTestsArray(examTestsRes.value)
          .filter((t) => !t.subjectId || String(t.subjectId) === String(subjectId))
          .map((test) => {
            const enriched = userTestsById.get(test.id);
            return enriched ? { ...test, ...enriched } : test;
          });
      } else if (userTests.length > 0) {
        resolved = userTests;
      }

      // Filter tests by test.examId === examId.
      // A test linked to Exam A will never display under Exam B, even if both exams share the same subject.
      resolved = resolved.filter(
        (test) => test.examId === examId || (Boolean(test.examId) && String(test.examId) === String(examId)),
      );

      if (
        resolved.length === 0 &&
        subjectTestsRes.status === 'rejected' &&
        examTestsRes.status === 'rejected' &&
        userTestsRes.status === 'rejected'
      ) {
        throw new Error('Failed to fetch tests for this subject.');
      }

      setError(null);
      setTests(resolved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tests');
    } finally {
      setIsLoading(false);
    }
  }, [examId, subjectId]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    void fetchTests();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchTests();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTests]);

  const {
    startingTestId,
    pendingTest,
    validationError,
    isAbandoning,
    handleTestAction,
    handleResumeConflict,
    handleAbandonAndStart,
    closeModal,
  } = useTestStarter(fetchTests);

  const filteredTests = tests.filter((test) => {
    const q = search.trim().toLowerCase();
    const textMatches =
      !q ||
      test.title.toLowerCase().includes(q) ||
      test.subjectName.toLowerCase().includes(q);
    const diffMatches =
      difficultyFilter === 'ALL' ||
      (test.difficulty || '').toLowerCase() === difficultyFilter.toLowerCase();
    return textMatches && diffMatches;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="at-container">
        <Link
          href={`/dashboard/exams/${examId}/subjects`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mb-4"
        >
          <ArrowLeft size={14} /> Back to Exam Subjects
        </Link>
        <div className="text-rose-700 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <p className="text-sm font-semibold">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-3 rounded-xl bg-rose-100 px-4 py-2 text-xs font-semibold hover:bg-rose-200 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="at-container">
      <div className="mb-4">
        <Link
          href={`/dashboard/exams/${examId}/subjects`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft size={14} /> Back to Exam Subjects
        </Link>
      </div>

      {/* HERO */}
      <section className="at-hero flex-wrap gap-4">
        <div className="at-hero-content">
          <h1>Subject Tests</h1>
          <p>Choose a test and start preparing for your next exam.</p>
        </div>

        <div className="at-hero-stats">
          <div className="at-stat">
            <strong>{tests.length}</strong>
            <span>Available Tests</span>
          </div>
          <div className="at-stat">
            <strong>{summary?.testsAttempted ?? 0}</strong>
            <span>Completed</span>
          </div>
          <div className="at-stat">
            <strong>{Number(summary?.averageScore ?? 0).toFixed(0)}%</strong>
            <span>Avg. Score</span>
          </div>
        </div>
      </section>

      {/* FILTER BAR */}
      <div className="at-filter-bar flex-wrap">
        <div className="at-search">
          <Search size={15} className="at-search-icon" />
          <input
            type="text"
            placeholder="Search tests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="at-filter-select"
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
        >
          <option value="ALL">All Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        {(search || difficultyFilter !== 'ALL') && (
          <button
            type="button"
            className="at-filter-btn"
            onClick={() => {
              setSearch('');
              setDifficultyFilter('ALL');
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* SECTION HEADER */}
      <div className="at-section-header">
        <h2>Tests</h2>
        <span>{filteredTests.length} Tests</span>
      </div>

      {/* TEST GRID */}
      {filteredTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              isStarting={startingTestId === test.id}
              onAction={handleTestAction}
            />
          ))}
        </div>
      ) : (
        <div className="at-empty-state">
          <div className="at-empty-icon">🔍</div>
          <h3>No tests found</h3>
          <p>Try changing your search or filters.</p>
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
