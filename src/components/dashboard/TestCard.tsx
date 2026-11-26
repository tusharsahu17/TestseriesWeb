'use client';

import Link from 'next/link';
import { Clock, FileText, Loader2, Award, Calendar, Lock, Play, Eye } from 'lucide-react';
import type { AvailableTestItem } from '../../types/dashboard';
import { formatDisplayDate } from '../../services/dashboardService';

interface TestCardProps {
  test: AvailableTestItem;
  isStarting?: boolean;
  onAction: (test: AvailableTestItem) => void;
}

const getAttemptBadgeStyle = (status: string): string => {
  switch (status) {
    case 'EVALUATED':
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'IN_PROGRESS':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'PENDING_EVALUATION':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'UPCOMING':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'EXPIRED':
    case 'LIMIT_REACHED':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

const formatAttemptStatus = (status: string): string => {
  if (!status || status === 'NOT_STARTED') return 'Not Started';
  return status
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const formatTestType = (testType: string): string =>
  testType
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export function TestCard({ test, isStarting = false, onAction }: TestCardProps) {
  const isResumable = test.attemptStatus === 'IN_PROGRESS' && !!test.activeAttemptId;
  const canClickAction = test.canStart || isResumable || !!test.latestAttemptId;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-md">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
              {test.subjectName}
            </span>
            {test.testType && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                {formatTestType(test.testType)}
              </span>
            )}
            {test.isFree && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                Free
              </span>
            )}
          </div>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${getAttemptBadgeStyle(
              test.attemptStatus,
            )}`}
          >
            {formatAttemptStatus(test.attemptStatus)}
          </span>
        </div>

        <h3 className="text-base font-bold text-slate-900 leading-snug">{test.title}</h3>
        {test.seriesTitle && (
          <p className="mt-1 text-xs font-medium text-slate-500">Series: {test.seriesTitle}</p>
        )}
        {test.description && (
          <p className="mt-2 text-xs text-slate-500 line-clamp-2">{test.description}</p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-slate-800">
              <FileText size={12} className="text-indigo-500" />
              {test.totalQuestions}
            </div>
            <span className="text-[10px] text-slate-500">Questions</span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-slate-800">
              <Clock size={12} className="text-sky-500" />
              {test.durationMinutes}m
            </div>
            <span className="text-[10px] text-slate-500">Duration</span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-slate-800">
              <Award size={12} className="text-emerald-500" />
              {test.totalMarks}
            </div>
            <span className="text-[10px] text-slate-500">Marks</span>
          </div>
        </div>

        {(test.startTime || test.endTime || test.maxAttempts !== null) && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            {(test.startTime || test.endTime) && (
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} />
                {test.startTime ? formatDisplayDate(test.startTime) : 'Open'}
                {test.endTime ? ` – ${formatDisplayDate(test.endTime)}` : ''}
              </span>
            )}
            {test.maxAttempts !== null && test.maxAttempts !== undefined && (
              <span>
                Attempts: {test.attemptsUsed}/{test.maxAttempts}
              </span>
            )}
          </div>
        )}

        {!test.canStart && test.disabledReason && (
          <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">
            <Lock size={12} className="mt-0.5 shrink-0 text-slate-400" />
            <span>{test.disabledReason}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
        {test.latestAttemptId ? (
          <Link
            href={`/dashboard/results/${test.latestAttemptId}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <Eye size={13} />
            {test.latestScore !== null && test.latestScore !== undefined
              ? `Result (${Math.round(test.latestScore)}%)`
              : 'View Result'}
          </Link>
        ) : (
          <span className="text-[11px] text-slate-400">
            {test.attemptsUsed > 0 ? `${test.attemptsUsed} attempt(s)` : 'Ready'}
          </span>
        )}

        <button
          type="button"
          disabled={!canClickAction || isStarting}
          onClick={() => onAction(test)}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
            test.canStart || isResumable
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60'
              : test.latestAttemptId
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isStarting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Play size={13} />
          )}
          {test.actionLabel}
        </button>
      </div>
    </div>
  );
}

