'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { getData } from '../../../../../services/apiClient';
import { ENDPOINTS } from '../../../../../constants/apiEndpoints';
import {
  dashboardService,
  normalizeAvailableTestsArray,
} from '../../../../../services/dashboardService';
import type { AvailableTestItem, DashboardSummary } from '../../../../../types/dashboard';
import { TestCard } from '../../../../../components/dashboard/TestCard';
import { StartTestModal, useTestStarter } from '../../../../../components/dashboard/StartTestModal';
import './availableTests.css';

interface RawSubject {
  id?: string | number;
  _id?: string | number;
  name?: string;
}

type RawRecord = Record<string, unknown>;

export default function ExamTestsPage() {
  const params = useParams();
  const examId = params.examId as string;

  const [examTitle, setExamTitle] = useState<string>('Available Tests');
  const [tests, setTests] = useState<AvailableTestItem[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');

  const fetchExamTests = useCallback(async () => {
    if (!examId) return;
    try {
      const [examRes, subjectsRes, userTestsRes, summaryRes] = await Promise.allSettled([
        getData<RawRecord>(`${ENDPOINTS.EXAMS}/${examId}`),
        getData<RawSubject[]>(`${ENDPOINTS.EXAMS}/${examId}/subjects`),
        dashboardService.getAvailableTests({ examId }),
        dashboardService.getDashboardSummary(),
      ]);

      if (examRes.status === 'fulfilled' && examRes.value) {
        const name = examRes.value.name ?? examRes.value.title;
        if (typeof name === 'string' && name.trim()) {
          setExamTitle(name);
        }
      }

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value);
      }

      const userTestsList =
        userTestsRes.status === 'fulfilled' ? userTestsRes.value.all : [];
      const userTestsById = new Map<string, AvailableTestItem>(
        userTestsList.map((t) => [t.id, t]),
      );

      const subjectsList: RawSubject[] =
        subjectsRes.status === 'fulfilled' && Array.isArray(subjectsRes.value)
          ? subjectsRes.value
          : [];

      let resolvedTests: AvailableTestItem[] = [];

      if (subjectsList.length > 0) {
        const subjectTestsResults = await Promise.allSettled(
          subjectsList.map(async (subj) => {
            const subjId = String(subj.id ?? subj._id ?? '');
            if (!subjId) return [];
            const raw = await getData<unknown>(`${ENDPOINTS.SUBJECTS}/${subjId}/tests`);
            return normalizeAvailableTestsArray(raw, subj.name).map((normalized) => {
              const enriched = userTestsById.get(normalized.id);
              return enriched
                ? {
                    ...normalized,
                    ...enriched,
                    subjectName: enriched.subjectName || normalized.subjectName,
                  }
                : normalized;
            });
          }),
        );

        const seen = new Set<string>();
        for (const res of subjectTestsResults) {
          if (res.status === 'fulfilled') {
            for (const test of res.value) {
              if (test.id && !seen.has(test.id)) {
                seen.add(test.id);
                resolvedTests.push(test);
              }
            }
          }
        }
      }

      // Fallback to /api/user/tests filtered by examId or exam subjects if subject endpoints returned none
      if (resolvedTests.length === 0 && userTestsList.length > 0) {
        const subjectNames = new Set(
          subjectsList.map((s) => (s.name || '').toLowerCase()).filter(Boolean),
        );
        const byExamId = userTestsList.filter((t) => t.examId === examId);
        if (byExamId.length > 0) {
          resolvedTests = byExamId;
        } else if (subjectNames.size > 0) {
          const bySubject = userTestsList.filter((t) =>
            subjectNames.has(t.subjectName.toLowerCase()),
          );
          resolvedTests = bySubject;
        } else {
          resolvedTests = userTestsList;
        }
      }

      if (
        resolvedTests.length === 0 &&
        subjectsRes.status === 'rejected' &&
        userTestsRes.status === 'rejected'
      ) {
        throw new Error('Failed to fetch tests for this exam.');
      }

      setError(null);
      setTests(resolvedTests);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tests');
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    void fetchExamTests();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchExamTests();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchExamTests]);

  const {
    startingTestId,
    pendingTest,
    validationError,
    isAbandoning,
    handleTestAction,
    handleResumeConflict,
    handleAbandonAndStart,
    closeModal,
  } = useTestStarter(fetchExamTests);

  const subjects = Array.from(new Set(tests.map((t) => t.subjectName).filter(Boolean)));

  const filteredTests = tests.filter((test) => {
    const q = search.trim().toLowerCase();
    const matchesText =
      !q ||
      test.title.toLowerCase().includes(q) ||
      test.subjectName.toLowerCase().includes(q);
    const matchesSubject = subjectFilter === 'ALL' || test.subjectName === subjectFilter;
    return matchesText && matchesSubject;
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
          <ArrowLeft size={14} /> Back to Exam Details
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
          <h1>{examTitle}</h1>
          <p>Choose a test and start preparing for your exam.</p>
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
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
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
            className="at-filter-btn"
            onClick={() => {
              setSearch('');
              setSubjectFilter('ALL');
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
          <p>Try changing your search or subject filter, or check Available Tests.</p>
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
