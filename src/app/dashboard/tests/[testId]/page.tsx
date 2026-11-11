'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Ban, Loader2, PlayCircle, RotateCcw } from 'lucide-react';
import { getData, postData } from '../../../../services/apiClient';
import { ENDPOINTS } from '../../../../constants/apiEndpoints';
import {
  dashboardService,
  extractStartValidationError,
} from '../../../../services/dashboardService';
import type { StartTestValidationError } from '../../../../types/dashboard';
import './testInterface.css';

interface TestOptionItem {
  id?: string | number;
  _id?: string | number;
  text?: string;
  option_text?: string;
}

interface TestQuestionItem {
  id?: string | number;
  _id?: string | number;
  text?: string;
  question_text?: string;
  question?: string;
  options?: Array<TestOptionItem | string>;
}

interface TestMeta {
  title: string;
  subjectName: string;
  durationMinutes: number;
  marksPerQuestion: number;
  negativeMarks: number;
}

function QuizInterfaceContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = params.testId as string;
  const queryAttemptId = searchParams.get('attemptId');

  const [attemptId, setAttemptId] = useState<string | null>(queryAttemptId);
  const [questions, setQuestions] = useState<TestQuestionItem[]>([]);
  const [testMeta, setTestMeta] = useState<TestMeta>({
    title: `Test #${testId}`,
    subjectName: 'Assessment',
    durationMinutes: 60,
    marksPerQuestion: 4,
    negativeMarks: 1,
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [totalSeconds, setTotalSeconds] = useState(60 * 60);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [validationError, setValidationError] = useState<StartTestValidationError | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hasAutoSubmittedRef = useRef(false);

  const loadQuestionsAndAttempt = useCallback(
    async (explicitAttemptId?: string | null) => {
      try {
        hasAutoSubmittedRef.current = false;

        let resolvedAttemptId = explicitAttemptId || null;
        let savedAnswers: Array<{ questionId: string; optionId: string }> = [];
        let preloadedQuestions: TestQuestionItem[] | undefined;

        if (!resolvedAttemptId) {
          const started = await dashboardService.startTest(testId);
          resolvedAttemptId = started.attemptId;
          savedAnswers = started.savedAnswers || [];
          preloadedQuestions = started.questions as TestQuestionItem[] | undefined;

          if (started.test) {
            const dur = started.test.durationMinutes || 60;
            setTestMeta({
              title: started.test.title || `Test #${testId}`,
              subjectName: started.test.subjectName || 'Assessment',
              durationMinutes: dur,
              marksPerQuestion: started.test.marksPerQuestion ?? 4,
              negativeMarks: started.test.negativeMarks ?? 1,
            });
            setTotalSeconds(started.remainingSeconds ?? dur * 60);
          } else if (started.remainingSeconds) {
            setTotalSeconds(started.remainingSeconds);
          }
        }

        setValidationError(null);
        setAttemptId(resolvedAttemptId);

        let loadedQuestions = preloadedQuestions;
        if (!loadedQuestions || loadedQuestions.length === 0) {
          const qRaw = await getData<
            TestQuestionItem[] | { questions?: TestQuestionItem[]; test?: Record<string, unknown> }
          >(`${ENDPOINTS.TESTS}/${testId}/questions`);

          if (Array.isArray(qRaw)) {
            loadedQuestions = qRaw;
          } else {
            loadedQuestions = qRaw.questions || [];
            if (qRaw.test) {
              const dur = Number(qRaw.test.duration_minutes ?? qRaw.test.durationMinutes ?? 60);
              setTestMeta((prev) => ({
                title: String(qRaw.test?.title ?? qRaw.test?.name ?? prev.title),
                subjectName: String(
                  qRaw.test?.subject_name ?? qRaw.test?.subjectName ?? prev.subjectName,
                ),
                durationMinutes: dur,
                marksPerQuestion: Number(
                  qRaw.test?.marks_per_question ??
                    qRaw.test?.marksPerQuestion ??
                    prev.marksPerQuestion,
                ),
                negativeMarks: Number(
                  qRaw.test?.negative_marks ?? qRaw.test?.negativeMarks ?? prev.negativeMarks,
                ),
              }));
              if (!explicitAttemptId) {
                setTotalSeconds(dur * 60);
              }
            }
          }
        }

        const safeQuestions = loadedQuestions || [];
        setQuestions(safeQuestions);

        if (savedAnswers.length > 0 && safeQuestions.length > 0) {
          const restored: Record<number, number> = {};
          safeQuestions.forEach((q, qIdx) => {
            const qId = String(q.id ?? q._id ?? '');
            const match = savedAnswers.find((a) => a.questionId === qId);
            if (match && Array.isArray(q.options)) {
              const optIdx = q.options.findIndex((opt, oIdx) => {
                const oId =
                  typeof opt === 'string'
                    ? String(oIdx)
                    : String(opt.id ?? opt._id ?? oIdx);
                return oId === match.optionId;
              });
              if (optIdx >= 0) restored[qIdx] = optIdx;
            }
          });
          setSelectedAnswers(restored);
        }
      } catch (err: unknown) {
        setValidationError(extractStartValidationError(err));
      } finally {
        setIsLoading(false);
      }
    },
    [testId],
  );

  useEffect(() => {
    if (!testId) return;
    const timer = setTimeout(() => {
      void loadQuestionsAndAttempt(queryAttemptId);
    }, 0);
    return () => clearTimeout(timer);
  }, [loadQuestionsAndAttempt, queryAttemptId, testId]);

  const submitAttempt = useCallback(
    async (skipConfirm = false) => {
      if (!attemptId || isSubmitting) return;
      if (!skipConfirm) {
        const answered = Object.keys(selectedAnswers).length;
        const confirmed = confirm(
          `You have answered ${answered} out of ${questions.length} questions.\n\nAre you sure you want to submit?`,
        );
        if (!confirmed) return;
      }

      setIsSubmitting(true);
      setSubmitError(null);
      try {
        await postData(`${ENDPOINTS.ATTEMPTS}/${attemptId}/submit`, {});
        router.push(`/dashboard/results/${attemptId}`);
      } catch {
        setSubmitError('Failed to submit test. Please try again.');
        setIsSubmitting(false);
      }
    },
    [attemptId, isSubmitting, questions.length, router, selectedAnswers],
  );

  // Countdown timer
  useEffect(() => {
    if (isLoading || isSubmitting || questions.length === 0 || validationError) return;

    const interval = setInterval(() => {
      setTotalSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!hasAutoSubmittedRef.current) {
            hasAutoSubmittedRef.current = true;
            void submitAttempt(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, isSubmitting, questions.length, submitAttempt, validationError]);

  const handleOptionSelect = async (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));

    if (attemptId) {
      try {
        const qData = questions[questionIndex];
        const option = qData.options?.[optionIndex];
        const optionId =
          typeof option === 'string'
            ? option
            : option?.id ?? option?._id ?? optionIndex;
        await postData(`${ENDPOINTS.ATTEMPTS}/${attemptId}/answer`, {
          questionId: qData.id ?? qData._id,
          optionId,
        });
      } catch (err) {
        console.error('Failed to save answer', err);
      }
    }
  };

  const handleAbandonCurrentAttempt = async () => {
    if (!attemptId) return;
    if (!confirm('Are you sure you want to abandon this active attempt? Your progress will not be evaluated.')) {
      return;
    }
    try {
      setIsAbandoning(true);
      await dashboardService.abandonAttempt(attemptId);
      router.push('/dashboard/tests');
    } catch {
      setSubmitError('Failed to abandon attempt.');
      setIsAbandoning(false);
    }
  };

  const handleAbandonConflictingAttempt = async () => {
    if (!validationError?.activeAttemptId) return;
    try {
      setIsAbandoning(true);
      await dashboardService.abandonAttempt(validationError.activeAttemptId);
      setIsLoading(true);
      await loadQuestionsAndAttempt(null);
    } catch (err: unknown) {
      setValidationError(extractStartValidationError(err));
    } finally {
      setIsAbandoning(false);
    }
  };

  const handleResumeConflictingAttempt = () => {
    if (!validationError?.activeAttemptId) return;
    const targetTestId = validationError.conflictingTestId || testId;
    const targetAttemptId = validationError.activeAttemptId;
    if (targetTestId === testId) {
      setIsLoading(true);
      void loadQuestionsAndAttempt(targetAttemptId);
    } else {
      router.push(`/dashboard/tests/${targetTestId}?attemptId=${targetAttemptId}`);
    }
  };

  const toggleMark = () => {
    setMarkedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion)) next.delete(currentQuestion);
      else next.add(currentQuestion);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Validating &amp; preparing your test...</p>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="max-w-lg mx-auto py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm text-center">
          <div
            className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
              validationError.isConflict
                ? 'bg-amber-50 text-amber-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            {validationError.isConflict ? <AlertTriangle size={24} /> : <Ban size={24} />}
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {validationError.isConflict ? 'Active Attempt In Progress' : 'Unable to Start Test'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{validationError.message}</p>

          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              onClick={() => router.push('/dashboard/tests')}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Back to Available Tests
            </button>

            {validationError.isConflict && validationError.activeAttemptId && (
              <>
                <button
                  type="button"
                  onClick={handleResumeConflictingAttempt}
                  disabled={isAbandoning}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                >
                  <PlayCircle size={15} /> Resume Active
                </button>
                <button
                  type="button"
                  onClick={handleAbandonConflictingAttempt}
                  disabled={isAbandoning}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60 cursor-pointer"
                >
                  {isAbandoning ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RotateCcw size={14} />
                  )}
                  Abandon &amp; Start Fresh
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center text-slate-500">
        No questions available for this test.
      </div>
    );
  }

  const qData = questions[currentQuestion];
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isMarked = markedQuestions.has(currentQuestion);

  return (
    <div className="max-w-[1350px] mx-auto pt-2">
      <header className="test-header">
        <div className="test-brand">
          <div className="test-logo">Q</div>
          <div className="test-brand-info">
            <h2>{testMeta.title}</h2>
            <span>{testMeta.subjectName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {attemptId && (
            <button
              type="button"
              onClick={handleAbandonCurrentAttempt}
              disabled={isAbandoning || isSubmitting}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
            >
              {isAbandoning ? 'Abandoning...' : 'Abandon Test'}
            </button>
          )}
          <div className="test-timer">
            <div className="test-timer-icon">⏱</div>
            <div className="test-timer-info">
              <span>Time Remaining</span>
              <strong>{timeString}</strong>
            </div>
          </div>
        </div>
      </header>

      {submitError && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          {submitError}
        </div>
      )}

      <main className="test-main">
        <section className="test-question-card">
          <div className="test-question-top">
            <div className="test-question-number">
              Question{' '}
              <strong>
                {currentQuestion + 1} of {questions.length}
              </strong>
            </div>
            <div className="test-question-type">Single Choice</div>
          </div>

          <h1 className="test-question-text">
            {qData.text || qData.question_text || qData.question}
          </h1>

          <div className="test-options">
            {qData.options?.map((option, optIndex) => {
              const isSelected = selectedAnswers[currentQuestion] === optIndex;
              const letter = String.fromCharCode(65 + optIndex);
              const optionLabel =
                typeof option === 'string'
                  ? option
                  : option.text || option.option_text || '';

              return (
                <div
                  key={optIndex}
                  className={`test-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(currentQuestion, optIndex)}
                >
                  <div className="test-option-letter">{letter}</div>
                  <div className="test-option-text">{optionLabel}</div>
                </div>
              );
            })}
          </div>

          <div className="test-question-footer">
            <button
              type="button"
              className={`test-mark-btn ${isMarked ? 'marked' : ''}`}
              onClick={toggleMark}
            >
              {isMarked ? '★ Marked for Review' : '☆ Mark for Review'}
            </button>
            <div className="test-actions">
              <button
                type="button"
                className="test-btn"
                onClick={() => setCurrentQuestion((p) => Math.max(0, p - 1))}
              >
                ← Previous
              </button>
              <button
                type="button"
                className="test-btn primary"
                onClick={() =>
                  setCurrentQuestion((p) => Math.min(questions.length - 1, p + 1))
                }
              >
                Save &amp; Next →
              </button>
              <button
                type="button"
                className="test-btn submit"
                onClick={() => submitAttempt(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </section>

        <aside className="test-sidebar">
          <div className="test-side-card">
            <div className="test-side-title">
              <h3>Test Progress</h3>
              <span>
                {answeredCount} / {questions.length}
              </span>
            </div>
            <div className="test-progress">
              <div
                className="test-progress-bar"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="test-progress-text">
              <span>{answeredCount} Answered</span>
              <span>{questions.length - answeredCount} Remaining</span>
            </div>
          </div>

          <div className="test-side-card">
            <div className="test-side-title">
              <h3>Questions</h3>
              <span>{questions.length} Total</span>
            </div>

            <div className="test-question-grid">
              {questions.map((_, idx) => {
                const answered = selectedAnswers[idx] !== undefined;
                const marked = markedQuestions.has(idx);
                const current = currentQuestion === idx;

                let classes = 'test-q-number';
                if (answered) classes += ' answered';
                if (marked) classes += ' marked';
                if (current) classes += ' current';

                return (
                  <div
                    key={idx}
                    className={classes}
                    onClick={() => setCurrentQuestion(idx)}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>

            <div className="test-legend">
              <div className="test-legend-item">
                <span className="test-legend-dot answered" /> Answered
              </div>
              <div className="test-legend-item">
                <span className="test-legend-dot" /> Not Answered
              </div>
              <div className="test-legend-item">
                <span className="test-legend-dot marked" /> Review
              </div>
              <div className="test-legend-item">
                <span className="test-legend-dot current" /> Current
              </div>
            </div>
          </div>

          <div className="test-side-card">
            <div className="test-side-title">
              <h3>Test Information</h3>
            </div>
            <div className="test-subject-row">
              <span>Subject</span>
              <strong>{testMeta.subjectName}</strong>
            </div>
            <div className="test-subject-row">
              <span>Questions</span>
              <strong>{questions.length}</strong>
            </div>
            <div className="test-subject-row">
              <span>Duration</span>
              <strong>{testMeta.durationMinutes} Minutes</strong>
            </div>
            <div className="test-subject-row">
              <span>Marks</span>
              <strong>
                +{testMeta.marksPerQuestion} / -{testMeta.negativeMarks}
              </strong>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default function QuizInterfacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading test interface...</p>
        </div>
      }
    >
      <QuizInterfaceContent />
    </Suspense>
  );
}
