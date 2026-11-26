'use client';

import { YouTubeVideosSection } from '../../../components/dashboard/YouTubeVideosSection';

export default function DashboardVideosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Videos</h1>
        <p className="text-xs text-slate-500 mt-1">
          Watch video lectures and recent uploads from @tushar17sahu06.
        </p>
      </div>

      <YouTubeVideosSection />
    </div>
  );
}
