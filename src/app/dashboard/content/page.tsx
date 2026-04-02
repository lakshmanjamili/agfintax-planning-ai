"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Play,
  Clock,
  Filter,
  Video,
  ArrowRight,
  ChevronLeft,
  X,
  TrendingUp,
  BookOpen,
  ListVideo,
} from "lucide-react";
import {
  VIDEOS,
  VIDEO_CATEGORIES,
  VIDEO_SERIES,
  type VideoContent,
  type VideoCategory,
} from "@/lib/content/video-data";
import { MASTER_STRATEGIES } from "@/lib/tax/smart-plan-strategies";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const catColorMap: Record<string, string> = {};
for (const c of VIDEO_CATEGORIES) catColorMap[c.id] = c.color;

function categoryColor(cat: VideoCategory): string {
  return catColorMap[cat] ?? "#FFB596";
}

function categoryLabel(cat: VideoCategory): string {
  return VIDEO_CATEGORIES.find((c) => c.id === cat)?.label ?? cat;
}

// Placeholder thumbnail with gradient + text
function VideoThumbnail({ video, size = "md" }: { video: VideoContent; size?: "sm" | "md" | "lg" }) {
  const h = size === "lg" ? "h-56" : size === "md" ? "h-40" : "h-32";
  return (
    <div className={`relative ${h} rounded-xl bg-gradient-to-br from-[#1F1F25] to-[#0D0D10] border border-white/5 overflow-hidden group`}>
      {/* Decorative gradient */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `linear-gradient(135deg, ${categoryColor(video.category)}20, transparent 60%)`,
        }}
      />
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white/20 text-center whitespace-pre-line leading-tight">
          {video.thumbnailText}
        </span>
      </div>
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 rounded-full bg-[#DC5700] flex items-center justify-center shadow-lg shadow-[#DC5700]/30">
          <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
        </div>
      </div>
      {/* Duration badge */}
      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-mono text-white">
        {video.duration}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ContentPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | "all">("all");
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let vids = VIDEOS;
    if (selectedSeries) {
      vids = vids.filter((v) => v.series === selectedSeries);
    }
    if (selectedCategory !== "all") {
      vids = vids.filter((v) => v.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      vids = vids.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return vids;
  }, [search, selectedCategory, selectedSeries]);

  const featured = VIDEOS.filter((v) => v.featured);

  // Single video view
  if (selectedVideo) {
    return <VideoDetailView video={selectedVideo} onBack={() => setSelectedVideo(null)} onSelectVideo={setSelectedVideo} />;
  }

  return (
    <div className="min-h-screen bg-[#131318] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-[#DC5700]/20">
              <Video className="w-5 h-5 text-[#FFB596]" />
            </div>
            <h1 className="text-2xl font-bold text-[#E4E1E9]">Content & Videos</h1>
          </div>
          <p className="text-sm text-[#C7C5D3] ml-12">
            Watch strategy explainers, tax tips, and webinars from the AG FinTax team. Linked to your Smart Plan recommendations.
          </p>
        </div>

        {/* Video Series */}
        {!search && selectedCategory === "all" && !selectedSeries && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-[#C7C5D3] uppercase tracking-wider mb-4 flex items-center gap-2">
              <ListVideo className="w-4 h-4" />
              Video Series
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {VIDEO_SERIES.map((series) => {
                const count = VIDEOS.filter((v) => v.series === series.id).length;
                return (
                  <button
                    key={series.id}
                    onClick={() => setSelectedSeries(series.id)}
                    className="text-left rounded-2xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/5 p-5 hover:border-[#DC5700]/30 transition-all group"
                  >
                    <h3 className="text-base font-bold text-[#E4E1E9] group-hover:text-[#FFB596] transition-colors mb-1">
                      {series.title}
                    </h3>
                    <p className="text-xs text-[#C7C5D3] leading-relaxed mb-3">
                      {series.description}
                    </p>
                    <span className="text-[10px] font-medium text-[#DC5700]">
                      {count} video{count !== 1 ? "s" : ""} <ArrowRight className="w-3 h-3 inline" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Featured Videos */}
        {featured.length > 0 && selectedCategory === "all" && !search && !selectedSeries && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-[#C7C5D3] uppercase tracking-wider mb-4">Featured Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featured.map((video) => (
                <button
                  key={video.slug}
                  onClick={() => setSelectedVideo(video)}
                  className="text-left rounded-2xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/5 overflow-hidden hover:border-[#DC5700]/30 transition-all group"
                >
                  <VideoThumbnail video={video} />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${categoryColor(video.category)}15`, color: categoryColor(video.category) }}
                      >
                        {categoryLabel(video.category)}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#E4E1E9] group-hover:text-[#FFB596] transition-colors leading-tight mb-1">
                      {video.title}
                    </h3>
                    <p className="text-xs text-[#C7C5D3] line-clamp-2">{video.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C7C5D3]" />
            <input
              type="text"
              placeholder="Search videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[rgba(31,31,37,0.6)] border border-white/10 text-sm text-[#E4E1E9] placeholder:text-[#C7C5D3]/50 focus:outline-none focus:border-[#DC5700]/40"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <Filter className="w-4 h-4 text-[#C7C5D3] shrink-0" />
            {selectedSeries && (
              <button
                onClick={() => setSelectedSeries(null)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-[#DC5700]/20 text-[#FFB596] hover:bg-[#DC5700]/30 transition"
              >
                <X className="w-3 h-3" />
                {VIDEO_SERIES.find((s) => s.id === selectedSeries)?.title}
              </button>
            )}
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-[#DC5700] text-white"
                  : "bg-white/5 text-[#C7C5D3] hover:bg-white/10"
              }`}
            >
              All
            </button>
            {VIDEO_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "text-white"
                    : "bg-white/5 text-[#C7C5D3] hover:bg-white/10"
                }`}
                style={selectedCategory === cat.id ? { backgroundColor: cat.color } : {}}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Video Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Video className="w-10 h-10 text-[#C7C5D3]/30 mx-auto mb-3" />
            <p className="text-sm text-[#C7C5D3]">No videos found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((video) => (
              <button
                key={video.slug}
                onClick={() => setSelectedVideo(video)}
                className="text-left rounded-2xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/5 overflow-hidden hover:border-[#DC5700]/30 transition-all group"
              >
                <VideoThumbnail video={video} size="sm" />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${categoryColor(video.category)}15`, color: categoryColor(video.category) }}
                    >
                      {categoryLabel(video.category)}
                    </span>
                    <span className="text-[10px] text-[#C7C5D3] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {video.duration}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#E4E1E9] group-hover:text-[#FFB596] transition-colors leading-tight mb-1">
                    {video.title}
                  </h3>
                  <p className="text-xs text-[#C7C5D3] line-clamp-2">{video.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single Video View
// ---------------------------------------------------------------------------
function VideoDetailView({
  video,
  onBack,
  onSelectVideo,
}: {
  video: VideoContent;
  onBack: () => void;
  onSelectVideo: (v: VideoContent) => void;
}) {
  const relatedStrategies = video.relatedStrategyIds
    .map((id) => MASTER_STRATEGIES.find((s) => s.id === id))
    .filter(Boolean);

  // Related videos (same series or same strategy IDs)
  const relatedVideos = VIDEOS.filter(
    (v) =>
      v.slug !== video.slug &&
      (v.series === video.series ||
        v.relatedStrategyIds.some((id) => video.relatedStrategyIds.includes(id)))
  ).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#131318] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[#C7C5D3] hover:text-white transition mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Videos
        </button>

        {/* Video player area */}
        <div className="rounded-2xl bg-[rgba(31,31,37,0.6)] border border-white/5 overflow-hidden mb-6">
          {video.videoUrl ? (
            <div className="aspect-video">
              <iframe
                src={video.videoUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={video.title}
              />
            </div>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-[#1F1F25] to-[#0D0D10] flex flex-col items-center justify-center relative">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: `linear-gradient(135deg, ${categoryColor(video.category)}30, transparent 60%)`,
                }}
              />
              <div className="w-20 h-20 rounded-full bg-[#DC5700]/20 flex items-center justify-center mb-4 cursor-pointer hover:bg-[#DC5700]/30 transition">
                <Play className="w-8 h-8 text-[#FFB596] ml-1" />
              </div>
              <p className="text-sm text-[#C7C5D3]">Video coming soon</p>
              <p className="text-xs text-[#C7C5D3]/50 mt-1">Duration: {video.duration}</p>
            </div>
          )}
        </div>

        {/* Video info */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
              style={{ backgroundColor: `${categoryColor(video.category)}15`, color: categoryColor(video.category) }}
            >
              {categoryLabel(video.category)}
            </span>
            {video.series && (
              <span className="text-xs text-[#C7C5D3] flex items-center gap-1">
                <ListVideo className="w-3 h-3" />
                {VIDEO_SERIES.find((s) => s.id === video.series)?.title}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#E4E1E9] leading-tight mb-3">{video.title}</h1>
          <div className="flex items-center gap-3 text-sm text-[#C7C5D3] mb-4">
            <span>{video.presenter}</span>
            <span className="text-white/20">|</span>
            <span>{new Date(video.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{video.duration}</span>
          </div>
          <p className="text-[15px] text-[#C7C5D3] leading-relaxed">{video.description}</p>
        </div>

        {/* Related Strategies */}
        {relatedStrategies.length > 0 && (
          <div className="mb-8 pt-6 border-t border-white/10">
            <h3 className="text-sm font-semibold text-[#C7C5D3] uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FFB596]" />
              Strategies Covered in This Video
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedStrategies.map((strategy) => strategy && (
                <Link
                  key={strategy.id}
                  href="/dashboard/strategies"
                  className="rounded-xl bg-[rgba(31,31,37,0.6)] border border-white/5 p-4 hover:border-[#4CD6FB]/30 transition-all group"
                >
                  <p className="text-sm font-semibold text-[#E4E1E9] group-hover:text-[#4CD6FB] transition-colors">
                    {strategy.title}
                  </p>
                  <p className="text-xs text-[#C7C5D3] mt-1">
                    Saves {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(strategy.typicalSavingsRange.min)}
                    –{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(strategy.typicalSavingsRange.max)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Videos */}
        {relatedVideos.length > 0 && (
          <div className="mb-8 pt-6 border-t border-white/10">
            <h3 className="text-sm font-semibold text-[#C7C5D3] uppercase tracking-wider mb-4">Up Next</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedVideos.map((v) => (
                <button
                  key={v.slug}
                  onClick={() => onSelectVideo(v)}
                  className="text-left flex gap-3 rounded-xl bg-[rgba(31,31,37,0.6)] border border-white/5 p-3 hover:border-[#DC5700]/30 transition-all group"
                >
                  <div className="w-28 shrink-0">
                    <VideoThumbnail video={v} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[#E4E1E9] group-hover:text-[#FFB596] transition-colors leading-tight line-clamp-2 mb-1">
                      {v.title}
                    </h4>
                    <p className="text-[10px] text-[#C7C5D3]">{v.duration} &middot; {v.presenter}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-r from-[#DC5700]/20 to-[#DC5700]/5 border border-[#DC5700]/20 p-6 text-center">
          <BookOpen className="w-8 h-8 text-[#FFB596] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#E4E1E9] mb-2">See These Strategies in Action</h3>
          <p className="text-sm text-[#C7C5D3] mb-4 max-w-md mx-auto">
            Get a personalized Smart Plan that shows exactly which strategies apply to you and how much you can save.
          </p>
          <Link
            href="/dashboard/smart-plan"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#DC5700] hover:bg-[#DC5700]/80 text-white rounded-xl text-sm font-semibold transition"
          >
            Build My Smart Plan <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
