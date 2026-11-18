'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Ban, Loader2, PlayCircle, RotateCcw } from 'lucide-react';
import {
  dashboardService,
  extractStartValidationError,
} from '../../services/dashboardService';
import type { AvailableTestItem, StartTestValidationError } from '../../types/dashboard';

export interface TestStarterState {
  startingTestId: string | null;
  pendingTest: AvailableTestItem | null;
  validationError: StartTestValidationError | null;
  isAbandoning: boolean;
}

export function useTestStarter(onAfterAbandon?: () => void) {
  const router = useRouter();
  const [startingTestId, setStartingTestId] = useState<string | null>(null);
  const [pendingTest, setPendingTest] = useState<AvailableTestItem | null>(null);
  const [validationError, setValidationError] = useState<StartTestValidationError | null>(null);
  const [isAbandoning, setIsAbandoning] = useState(false);

  const handleTestAction = useCallback(
    async (test: AvailableTestItem) => {
      if (test.attemptStatus === 'IN_PROGRESS' && test.activeAttemptId) {
        router.push(`/dashboard/tests/${test.id}?attemptId=${test.activeAttemptId}`);
        return;
      }

      if (!test.canStart) {
        if (test.latestAttemptId && test.attemptStatus !== 'PENDING_EVALUATION') {
          router.push(`/dashboard/results/${test.latestAttemptId}`);
          return;
        }
        setPendingTest(test);
        setValidationError({
          status: 403,
          code: test.attemptStatus || 'UNAVAILABLE',
          message:
            test.disabledReason ||
            'You cannot start this test right now. Please check enrollment or schedule.',
          isConflict: false,
        });
        return;
      }

      try {
        setStartingTestId(test.id);
        setValidationError(null);
        const started = await dashboardService.startTest(test.id);
        const query = started.attemptId ? `?attemptId=${started.attemptId}` : '';
        router.push(`/dashboard/tests/${test.id}${query}`);
      } catch (err: unknown) {
        setPendingTest(test);
        setValidationError(extractStartValidationError(err));
      } finally {
        setStartingTestId(null);
      }
    },
    [router],
  );

  const handleResumeConflict = useCallback(() => {
    if (!validationError?.activeAttemptId) return;
    const targetTestId = validationError.conflictingTestId || pendingTest?.id;
    if (!targetTestId) return;
    const attemptId = validationError.activeAttemptId;
    setValidationError(null);
    setPendingTest(null);
    router.push(`/dashboard/tests/${targetTestId}?attemptId=${attemptId}`);
  }, [pendingTest, router, validationError]);

  const handleAbandonAndStart = useCallback(async () => {
    if (!validationError?.activeAttemptId || !pendingTest) return;
    try {
      setIsAbandoning(true);
      await dashboardService.abandonAttempt(validationError.activeAttemptId);
      onAfterAbandon?.();
      const started = await dashboardService.startTest(pendingTest.id);
      setValidationError(null);
      setPendingTest(null);
      const query = started.attemptId ? `?attemptId=${started.attemptId}` : '';
      router.push(`/dashboard/tests/${pendingTest.id}${query}`);
    } catch (err: unknown) {
      setValidationError(extractStartValidationError(err));
    } finally {
      setIsAbandoning(false);
    }
  }, [onAfterAbandon, pendingTest, router, validationError]);

  const closeModal = useCallback(() => {
    setValidationError(null);
    setPendingTest(null);
  }, []);

  return {
    startingTestId,
    pendingTest,
    validationError,
    isAbandoning,
    handleTestAction,
    handleResumeConflict,
    handleAbandonAndStart,
    closeModal,
  };
}

interface StartTestModalProps {
  test: AvailableTestItem | null;
  error: StartTestValidationError | null;
  isAbandoning: boolean;
  onResumeConflict: () => void;
  onAbandonAndStart: () => void;
  onClose: () => void;
}

export function StartTestModal({
  test,
  error,
  isAbandoning,
  onResumeConflict,
  onAbandonAndStart,
  onClose,
}: StartTestModalProps) {
  const router = useRouter();
  if (!error) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              error.isConflict
                ? 'bg-amber-50 text-amber-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            {error.isConflict ? <AlertTriangle size={22} /> : <Ban size={22} />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900">
              {error.isConflict
                ? 'Active Attempt In Progress'
                : 'Cannot Start Test'}
            </h3>
            {test && (
              <p className="mt-0.5 text-xs font-medium text-indigo-600 truncate">
                {test.title}
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed">{error.message}</p>

        {error.isConflict && error.conflictingTestTitle && (
          <div className="mt-3 rounded-xl bg-amber-50/70 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-900">
            Active test: <strong>{error.conflictingTestTitle}</strong>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isAbandoning}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>

          {error.isConflict && error.activeAttemptId ? (
            <>
              {(error.conflictingTestId || test?.id) && (
                <button
                  type="button"
                  onClick={onResumeConflict}
                  disabled={isAbandoning}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                >
                  <PlayCircle size={15} />
                  Resume Active
                </button>
              )}
              <button
                type="button"
                onClick={onAbandonAndStart}
                disabled={isAbandoning}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60 cursor-pointer"
              >
                {isAbandoning ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <RotateCcw size={15} />
                )}
                Abandon & Start Fresh
              </button>
            </>
          ) : (
            <>
              {test?.latestAttemptId && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/dashboard/results/${test.latestAttemptId}`);
                  }}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                >
                  View Latest Result
                </button>
              )}
              {!test?.latestAttemptId && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push('/dashboard/tests');
                  }}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                >
                  Available Tests
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

