import {
  Bell,
  FilePlus2,
  Award,
  ClockAlert,
  CreditCard,
  Megaphone,
} from 'lucide-react';
import type { NotificationType } from '../../types/dashboard';

export function getNotificationMeta(type: NotificationType) {
  switch (type) {
    case 'NEW_TEST':
      return {
        label: 'New Test',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        iconBg: 'bg-indigo-100 text-indigo-600',
        Icon: FilePlus2,
      };
    case 'RESULT_PUBLISHED':
      return {
        label: 'Result Published',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconBg: 'bg-emerald-100 text-emerald-600',
        Icon: Award,
      };
    case 'SERIES_EXPIRING':
      return {
        label: 'Expiring Soon',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        iconBg: 'bg-amber-100 text-amber-600',
        Icon: ClockAlert,
      };
    case 'PAYMENT_CONFIRMED':
      return {
        label: 'Payment Confirmed',
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
        iconBg: 'bg-teal-100 text-teal-600',
        Icon: CreditCard,
      };
    case 'ANNOUNCEMENT':
    default:
      return {
        label: 'Announcement',
        badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
        iconBg: 'bg-violet-100 text-violet-600',
        Icon: Megaphone || Bell,
      };
  }
}

export function formatRelativeTime(isoDate: string): string {
  const time = new Date(isoDate).getTime();
  if (Number.isNaN(time)) return '';
  const diffSec = Math.floor((Date.now() - time) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

