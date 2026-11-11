import type { PerformanceStatus, TestSeriesStatus } from '../../types/dashboard';

export function SeriesStatusBadge({ status }: { status: TestSeriesStatus }) {
  const styles: Record<TestSeriesStatus, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    EXPIRED: 'bg-slate-100 text-slate-600 border-slate-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export function PerformanceStatusBadge({ status }: { status: PerformanceStatus }) {
  const styles: Record<PerformanceStatus, { pill: string; bar: string }> = {
    Strong: {
      pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      bar: 'bg-emerald-500',
    },
    Average: {
      pill: 'bg-amber-50 text-amber-700 border-amber-200',
      bar: 'bg-amber-500',
    },
    'Needs improvement': {
      pill: 'bg-rose-50 text-rose-700 border-rose-200',
      bar: 'bg-rose-500',
    },
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${styles[status].pill}`}
    >
      {status}
    </span>
  );
}

export function getPerformanceBarClass(status: PerformanceStatus): string {
  switch (status) {
    case 'Strong':
      return 'bg-emerald-500';
    case 'Average':
      return 'bg-amber-500';
    case 'Needs improvement':
    default:
      return 'bg-rose-500';
  }
}

