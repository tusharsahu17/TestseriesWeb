'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { formatDisplayDate } from '../../services/dashboardService';
import type { YouTubeVideoItem } from '../../app/api/youtube/route';

export function YouTubeVideosSection() {
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/youtube')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load videos');
        return res.json();
      })
      .then((data: { videos?: YouTubeVideoItem[] }) => {
        if (!active) return;
        const list = data.videos ?? [];
        setVideos(list);
        if (list.length > 0) {
          setSelectedVideoId((prev) => prev ?? list[0].id);
        }
      })
      .catch(() => {
        if (active) setError('Unable to load channel videos right now.');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header flex-wrap gap-3">
        <div>
          <h3 className="inline-flex items-center gap-2">
            <Play size={16} className="text-rose-600" />
            Video Lectures &amp; Channel
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Watch the latest uploads and study sessions from @tushar17sahu06.
          </p>
        </div>
        <a
          href="https://www.youtube.com/@tushar17sahu06"
          target="_blank"
          rel="noopener noreferrer"
          className="dashboard-view-all inline-flex items-center gap-1"
        >
          Open YouTube Channel
          <ArrowRight size={13} />
        </a>
      </div>

      {error ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-xs text-slate-500">
          {error}
        </div>
      ) : videos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-xs text-slate-500">
          Loading channel videos...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 aspect-video">
            {selectedVideoId && (
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${selectedVideoId}`}
                title="YouTube video player - @tushar17sahu06"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
            {videos.map((video) => {
              const isSelected = video.id === selectedVideoId;
              return (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => setSelectedVideoId(video.id)}
                  className={`flex items-center gap-3 rounded-xl border p-2 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/70'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-14 w-24 shrink-0 rounded-lg object-cover bg-slate-100"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {video.title}
                    </p>
                    {video.published && (
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {formatDisplayDate(video.published)}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
