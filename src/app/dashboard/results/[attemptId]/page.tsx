'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Loader2 } from 'lucide-react';
import {
  dashboardService,
  formatDisplayDate,
  formatDurationSeconds,
  isEvaluationPendingError,
} from '../../../../services/dashboardService';
import type { AttemptResultDetail } from '../../../../types/dashboard';
import {
  getPerformanceBarClass,
  PerformanceStatusBadge,
} from '../../../../components/dashboard/StatusBadges';
import './resultInterface.css';

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [result, setResult] = useState<AttemptResultDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchResult = useCallback(async () => {
    if (!attemptId) return;
    try {
      const data = await dashboardService.getAttemptResult(attemptId);
      setPendingMessage(null);
      setError(null);
      setResult(data);
    } catch (err: unknown) {
      const pending = isEvaluationPendingError(err);
      if (pending.pending) {
        setPendingMessage(pending.message);
      } else {
        setError('Failed to fetch attempt result.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [attemptId]);

  const handleCheckAgain = () => {
    setIsLoading(true);
    setPendingMessage(null);
    setError(null);
    void fetchResult();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchResult();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchResult]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading your result...</p>
      </div>
    );
  }

  if (pendingMessage) {
    return (
      <div className="max-w-xl mx-auto py-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Clock size={28} />
          </div>
          <h2 className="text-lg font-bold text-amber-900">Evaluation Pending</h2>
          <p className="mt-2 text-sm text-amber-800">{pendingMessage}</p>
          <p className="mt-1 text-xs text-amber-700">
            Results will unlock automatically once evaluation is finalized.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={handleCheckAgain}
              className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer"
            >
              Check Again
            </button>
            <Link
              href="/dashboard/results"
              className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              Back to Results
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-xl mx-auto py-16">
        <div className="bg-rose-50 text-rose-700 p-6 rounded-2xl border border-rose-200 text-center">
          <h2 className="font-bold text-lg mb-2">Unable to Load Result</h2>
          <p className="text-sm">{error || 'Result not found.'}</p>
          <button
            type="button"
            onClick={() => router.push('/dashboard/results')}
            className="mt-4 bg-rose-100 text-rose-800 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-rose-200 cursor-pointer"
          >
            Back to Attempt History
          </button>
        </div>
      </div>
    );
  }

  const percentage = Number(result.percentage || 0);
  const scoreAngle = Math.min(360, Math.max(0, (percentage / 100) * 360));
  const completedDate = result.submittedAt
    ? new Date(result.submittedAt).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      })
    : formatDisplayDate(result.startedAt);

  return (
    <div className="text-[#172033]">
      <div className="mb-4">
        <Link
          href="/dashboard/results"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft size={14} /> Back to Attempt History
        </Link>
      </div>

      <main className="container">
        <div className="page-title">
          <h1>Test Result</h1>
          <p>Detailed performance evaluation for your submitted attempt.</p>
        </div>

        <section className="result-hero">
          <div className="score-section">
            <div
              className="score-circle"
              style={{
                background: `conic-gradient(#6366f1 0deg ${scoreAngle}deg, #eeeef4 ${scoreAngle}deg 360deg)`,
              }}
            >
              <div className="score-value">{Math.round(percentage)}%</div>
              <div className="score-label">Overall Score</div>
            </div>
            <div
              className={`result-status ${
                percentage >= 60 ? 'bg-[#eafaf4] text-[#079669]' : 'bg-[#fff1f1] text-[#e5484d]'
              }`}
            >
              {percentage >= 80
                ? '✓ Strong Performance'
                : percentage >= 60
                  ? '✓ Average Performance'
                  : 'Needs Improvement'}
            </div>
          </div>

          <div className="result-details">
            <h2>{result.testTitle}</h2>
            <p>
              {result.seriesTitle ? `${result.seriesTitle} • ` : ''}
              {result.subjectName ? `${result.subjectName} • ` : ''}
              Completed on {completedDate}
            </p>

            <div className="detail-grid">
              <div className="detail-box">
                <span>Marks</span>
                <strong>
                  {result.obtainedMarks} / {result.totalMarks}
                </strong>
              </div>
              <div className="detail-box">
                <span>Accuracy</span>
                <strong>{Number(result.accuracy).toFixed(1)}%</strong>
              </div>
              <div className="detail-box">
                <span>Time Spent</span>
                <strong>{formatDurationSeconds(result.timeSpentSeconds)}</strong>
              </div>
              <div className="detail-box">
                <span>{result.rank !== null && result.rank !== undefined ? 'Rank' : 'Status'}</span>
                <strong>
                  {result.rank !== null && result.rank !== undefined
                    ? `#${result.rank}`
                    : result.status}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon">✓</div>
            </div>
            <h3>{result.correctCount}</h3>
            <p>Correct Answers</p>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon">✕</div>
            </div>
            <h3>{result.wrongCount}</h3>
            <p>Wrong Answers</p>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon">○</div>
            </div>
            <h3>{result.skippedCount}</h3>
            <p>Skipped Questions</p>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon">◈</div>
            </div>
            <h3>{result.attemptedCount}</h3>
            <p>Attempted of {result.totalQuestions}</p>
          </div>
        </div>

        <div className="content-grid">
          <div>
            {/* Subject-wise Scores */}
            <div className="card">
              <div className="card-header">
                <h2>Subject-wise Scores</h2>
                <span>{result.subjectWiseScores.length} Subject(s)</span>
              </div>

              {result.subjectWiseScores.length === 0 ? (
                <div className="performance-row">
                  <span>📐</span>
                  <div>
                    <div className="subject-name">{result.subjectName || 'Overall Test'}</div>
                    <div className="performance-bar">
                      <div
                        className="performance-fill"
                        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                      />
                    </div>
                  </div>
                  <div className="performance-score">{percentage.toFixed(1)}%</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {result.subjectWiseScores.map((subj) => (
                    <div key={subj.subject} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-slate-800">{subj.subject}</span>
                        <div className="flex items-center gap-2">
                          <PerformanceStatusBadge status={subj.status} />
                          <span className="text-xs font-bold text-slate-800">
                            {Number(subj.percentage).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="performance-bar mb-2">
                        <div
                          className={`h-full rounded-full ${getPerformanceBarClass(subj.status)}`}
                          style={{ width: `${Math.min(100, Math.max(0, subj.percentage))}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
                        <span>
                          Marks: <strong>{subj.obtainedMarks}/{subj.totalMarks}</strong>
                        </span>
                        <span>
                          Correct: <strong className="text-emerald-700">{subj.correctCount}</strong>
                        </span>
                        <span>
                          Wrong: <strong className="text-rose-700">{subj.wrongCount}</strong>
                        </span>
                        <span>
                          Skipped: <strong>{subj.skippedCount}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Answer Summary */}
            <div className="card">
              <div className="card-header">
                <h2>Answer Summary</h2>
                <span>{result.totalQuestions} Questions</span>
              </div>
              <div className="answer-summary">
                <div className="answer-box correct">
                  <div className="answer-icon">✓</div>
                  <div className="answer-info">
                    <strong>{result.correctCount}</strong>
                    <span>Correct</span>
                  </div>
                </div>
                <div className="answer-box wrong">
                  <div className="answer-icon">✕</div>
                  <div className="answer-info">
                    <strong>{result.wrongCount}</strong>
                    <span>Incorrect</span>
                  </div>
                </div>
                <div className="answer-box skipped">
                  <div className="answer-icon">—</div>
                  <div className="answer-info">
                    <strong>{result.skippedCount}</strong>
                    <span>Skipped</span>
                  </div>
                </div>
                <div className="answer-box review">
                  <div className="answer-icon">★</div>
                  <div className="answer-info">
                    <strong>{result.attemptedCount}</strong>
                    <span>Total Attempted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="card-header">
                <h2>Score Breakdown</h2>
              </div>
              <div className="score-row">
                <span>Correct Answers</span>
                <strong>{result.correctCount}</strong>
              </div>
              <div className="score-row">
                <span>Wrong Answers</span>
                <strong>{result.wrongCount}</strong>
              </div>
              <div className="score-row">
                <span>Skipped</span>
                <strong>{result.skippedCount}</strong>
              </div>
              <div className="score-row">
                <span>Accuracy (excl. skipped)</span>
                <strong>{Number(result.accuracy).toFixed(1)}%</strong>
              </div>
              <div className="score-row total">
                <span>Total Marks</span>
                <strong>
                  {result.obtainedMarks} / {result.totalMarks}
                </strong>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Question Review &amp; Actions</h2>
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => router.push(`/dashboard/results/${attemptId}/review`)}
                >
                  Review Questions &amp; Explanations
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => router.push('/dashboard/tests')}
                >
                  Browse Tests
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Attempt Metadata</h2>
              </div>
              <div className="score-row">
                <span>Attempt ID</span>
                <strong>#{result.attemptId}</strong>
              </div>
              <div className="score-row">
                <span>Total Questions</span>
                <strong>{result.totalQuestions}</strong>
              </div>
              <div className="score-row">
                <span>Time Spent</span>
                <strong>{formatDurationSeconds(result.timeSpentSeconds)}</strong>
              </div>
              {result.percentile !== null && result.percentile !== undefined && (
                <div className="score-row">
                  <span>Percentile</span>
                  <strong>{Number(result.percentile).toFixed(1)}%</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
