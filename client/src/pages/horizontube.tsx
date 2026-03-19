import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, X, Play, Youtube, TrendingUp, Clock, Zap, History,
  ChevronLeft, ChevronRight, SlidersHorizontal, Eye, Check,
  Maximize2, Minimize2, Users, Video, Calendar, ArrowLeft, ChevronDown
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface YTVideo {
  id: string;
  kind: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  uploadedDate: string;
  viewCount: string | null;
  likeCount: string | null;
  duration: number | null;
}

interface YTChannel {
  id: string;
  title: string;
  description: string;
  customUrl: string;
  thumbnail: string;
  banner: string;
  subscriberCount: string;
  videoCount: string;
  publishedAt: string;
}

interface PagedVideos {
  videos: YTVideo[];
  nextPageToken?: string;
}

interface PagedChannels {
  videos: YTVideo[];
  channels: YTChannel[];
  nextPageToken?: string;
}

interface Filters {
  type: string;
  duration: string;
  uploadDate: string;
  prioritize: string;
  features: string[];
}

const TYPE_OPTIONS = ["All", "Videos", "Shorts", "Channels", "Playlists", "Movies"];
const DURATION_OPTIONS = ["Any", "Under 3 minutes", "3-20 minutes", "Over 20 minutes"];
const UPLOAD_DATE_OPTIONS = ["Anytime", "Today", "This week", "This month", "This year"];
const PRIORITIZE_OPTIONS = ["Relevance", "Popularity"];
const FEATURE_OPTIONS = ["Live", "4K", "HD", "Subtitles/CC", "Creative Commons", "360", "VR180", "3D", "HDR", "Location", "Purchased"];

function formatViews(v: string | null): string {
  if (!v) return "";
  const n = parseInt(v);
  if (isNaN(n)) return "";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B views`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
}

function formatSubs(v: string): string {
  const n = parseInt(v);
  if (isNaN(n)) return "0";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function formatDuration(secs: number | null): string {
  if (!secs || secs <= 0) return "";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

function useInfiniteScroll(callback: () => void, hasMore: boolean) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) callback(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [callback, hasMore]);
  return sentinelRef;
}

function VideoCard({ video, onClick, onChannelClick }: { video: YTVideo; onClick: () => void; onChannelClick?: (id: string) => void }) {
  const dur = formatDuration(video.duration);
  return (
    <div className="group flex flex-col text-left w-full">
      <button
        data-testid={`card-video-${video.id}`}
        onClick={onClick}
        className="relative rounded-xl overflow-hidden bg-white/5 border border-white/8 group-hover:border-red-500/40 transition-all duration-300 aspect-video w-full"
      >
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Youtube className="w-8 h-8 text-white/20" /></div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-white fill-current ml-0.5" />
          </div>
        </div>
        {dur && <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{dur}</div>}
      </button>
      <div className="pt-2 px-0.5">
        <button onClick={onClick} className="text-sm font-semibold text-white leading-snug line-clamp-2 hover:text-red-400 transition-colors text-left w-full">
          {video.title}
        </button>
        <button
          onClick={() => onChannelClick?.(video.channelId)}
          className="text-[11px] text-white/40 mt-1 truncate hover:text-red-400/70 transition-colors text-left w-full"
        >
          {video.channelTitle}
        </button>
        <div className="flex items-center gap-2 mt-0.5">
          {video.viewCount && <span className="text-[11px] text-white/30 flex items-center gap-1"><Eye className="w-2.5 h-2.5" />{formatViews(video.viewCount)}</span>}
          {video.uploadedDate && <span className="text-[11px] text-white/25">{video.uploadedDate}</span>}
        </div>
      </div>
    </div>
  );
}

function ChannelCard({ channel, onClick }: { channel: YTChannel; onClick: () => void }) {
  return (
    <button
      data-testid={`card-channel-${channel.id}`}
      onClick={onClick}
      className="group flex flex-col items-center text-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/8 hover:border-red-500/40 transition-all duration-300 w-full"
    >
      <div className="relative">
        {channel.thumbnail ? (
          <img src={channel.thumbnail} alt={channel.title} className="w-20 h-20 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-red-500/40 transition-all" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center ring-2 ring-white/10">
            <Youtube className="w-8 h-8 text-white/30" />
          </div>
        )}
      </div>
      <div className="min-w-0 w-full">
        <p className="font-bold text-white text-sm group-hover:text-red-400 transition-colors truncate">{channel.title}</p>
        {channel.customUrl && <p className="text-xs text-white/40 truncate">{channel.customUrl}</p>}
        <div className="flex items-center justify-center gap-3 mt-2 text-[11px] text-white/40">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{formatSubs(channel.subscriberCount)} subscribers</span>
          <span className="flex items-center gap-1"><Video className="w-3 h-3" />{parseInt(channel.videoCount || "0").toLocaleString()} videos</span>
        </div>
        {channel.description && (
          <p className="text-[11px] text-white/30 mt-2 line-clamp-2">{channel.description}</p>
        )}
      </div>
    </button>
  );
}

function ShortCard({ video, onClick }: { video: YTVideo; onClick: () => void }) {
  return (
    <button
      data-testid={`card-short-${video.id}`}
      onClick={onClick}
      className="group relative flex-shrink-0 w-full focus:outline-none"
    >
      <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/8 group-hover:border-red-500/50 transition-all duration-300" style={{ aspectRatio: "9/16" }}>
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black"><Youtube className="w-10 h-10 text-white/20" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-xl">
            <Play className="w-6 h-6 text-white fill-current ml-1" />
          </div>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{video.title}</p>
          <p className="text-[11px] text-white/60 mt-0.5 truncate">{video.channelTitle}</p>
          {video.viewCount && <p className="text-[11px] text-white/40 flex items-center gap-1 mt-0.5"><Eye className="w-2.5 h-2.5" />{formatViews(video.viewCount)}</p>}
        </div>
      </div>
    </button>
  );
}

function HScrollSection({ title, icon, videos, isLoading, onVideoClick, onChannelClick }: {
  title: string; icon: React.ReactNode; videos: YTVideo[];
  isLoading: boolean; onVideoClick: (v: YTVideo) => void; onChannelClick?: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
  };
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">{icon}<h2 className="text-base font-bold text-white tracking-wide">{title}</h2></div>
        <div className="flex items-center gap-1">
          <button data-testid={`button-scroll-left-${title}`} onClick={() => scroll("left")} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"><ChevronLeft className="w-4 h-4" /></button>
          <button data-testid={`button-scroll-right-${title}`} onClick={() => scroll("right")} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-56 animate-pulse">
              <div className="aspect-video rounded-xl bg-white/5 border border-white/5" />
              <div className="mt-2 space-y-1.5 px-0.5"><div className="h-3 bg-white/5 rounded-full w-4/5" /><div className="h-2.5 bg-white/5 rounded-full w-2/5" /></div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-white/20"><Youtube className="w-8 h-8 mr-2" /><span className="text-sm">No videos found</span></div>
      ) : (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-1 scroll-smooth" style={{ scrollbarWidth: "none" }}>
          {videos.map(v => (
            <div key={v.id} className="flex-shrink-0 w-56">
              <VideoCard video={v} onClick={() => onVideoClick(v)} onChannelClick={onChannelClick} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function VideoPlayerModal({ video, onClose }: { video: YTVideo; onClose: () => void }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isShort = video.duration !== null && video.duration <= 180;
  const embedUrl = `/api/yt-embed/${video.id}`;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, [isFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={containerRef} className={`relative bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col ${isShort ? "w-full max-w-sm" : "w-full max-w-5xl"}`} style={{ height: "92vh" }}>
        <div className="flex items-center gap-3 px-4 py-3 bg-black/90 border-b border-white/5 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold truncate text-sm">{video.title}</p>
            <p className="text-white/40 text-xs truncate">{video.channelTitle}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button data-testid="button-fullscreen-yt" onClick={toggleFullscreen} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button data-testid="button-close-yt-player" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-red-500/30 text-white hover:text-red-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden" style={isShort ? { aspectRatio: "9/16", maxWidth: "100%", alignSelf: "center" } : {}}>
          <iframe
            src={embedUrl}
            title={video.title}
            className="w-full h-full border-0 block"
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write"
            data-testid="iframe-yt-player"
          />
        </div>
      </div>
    </div>
  );
}

function ChannelView({ channel, onClose, onVideoPlay }: { channel: YTChannel; onClose: () => void; onVideoPlay: (v: YTVideo) => void }) {
  const [tab, setTab] = useState<"latest" | "oldest" | "shorts" | "all">("latest");
  const [showFullBio, setShowFullBio] = useState(false);

  const tabOrder: Record<typeof tab, string> = { all: "viewCount", latest: "date", oldest: "date", shorts: "date" };

  const channelBaseUrl = tab === "shorts"
    ? `/api/youtube/channel/${channel.id}/shorts`
    : `/api/youtube/channel/${channel.id}/videos?order=${tabOrder[tab]}`;

  const { videos, isLoading, isFetchingMore, hasMore, fetchMore } = usePagedFetch(channelBaseUrl);
  const sentinelRef = useInfiniteScroll(fetchMore, hasMore && !isFetchingMore);

  const TABS: { key: typeof tab; label: string }[] = [
    { key: "latest", label: "Latest" },
    { key: "oldest", label: "Oldest" },
    { key: "shorts", label: "Shorts" },
    { key: "all", label: "Most Viewed" },
  ];

  const joinedYear = channel.publishedAt ? new Date(channel.publishedAt).getFullYear() : null;

  return (
    <div className="h-full overflow-y-auto bg-black text-white">
      {/* Back button */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button data-testid="button-channel-back" onClick={onClose} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="w-px h-4 bg-white/10" />
        <span className="text-white/60 text-sm truncate">{channel.title}</span>
      </div>

      {/* Banner */}
      {channel.banner ? (
        <div className="w-full h-32 sm:h-48 overflow-hidden bg-white/5">
          <img src={channel.banner} alt="Channel banner" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-20 bg-gradient-to-r from-red-900/30 via-purple-900/20 to-black" />
      )}

      {/* Channel info */}
      <div className="px-6 pt-4 pb-6 border-b border-white/5">
        <div className="flex items-start gap-4">
          {channel.thumbnail ? (
            <img src={channel.thumbnail} alt={channel.title} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-red-500/30 flex-shrink-0 -mt-2" />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Youtube className="w-8 h-8 text-white/30" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-white tracking-tight">{channel.title}</h2>
            {channel.customUrl && <p className="text-sm text-white/40 mt-0.5">{channel.customUrl}</p>}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-white/50">
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-red-400" /><strong className="text-white">{formatSubs(channel.subscriberCount)}</strong> subscribers</span>
              <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-blue-400" /><strong className="text-white">{parseInt(channel.videoCount || "0").toLocaleString()}</strong> videos</span>
              {joinedYear && <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-purple-400" />Joined {joinedYear}</span>}
            </div>
            {channel.description && (
              <div className="mt-3">
                <p className={`text-sm text-white/50 leading-relaxed ${showFullBio ? "" : "line-clamp-2"}`}>{channel.description}</p>
                {channel.description.length > 120 && (
                  <button data-testid="button-channel-bio-toggle" onClick={() => setShowFullBio(v => !v)} className="text-xs text-red-400 hover:text-red-300 mt-1 flex items-center gap-1 transition-colors">
                    {showFullBio ? "Show less" : "Show more"} <ChevronDown className={`w-3 h-3 transition-transform ${showFullBio ? "rotate-180" : ""}`} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video tabs */}
      <div className="sticky top-[53px] z-10 bg-black/90 backdrop-blur-xl border-b border-white/5 px-6 py-2 flex gap-1">
        {TABS.map(t => (
          <button
            key={t.key}
            data-testid={`button-channel-tab-${t.key}`}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "bg-red-600 text-white" : "text-white/40 hover:text-white hover:bg-white/5"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Videos grid */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse"><div className="aspect-video rounded-xl bg-white/5" /><div className="mt-2 space-y-1.5"><div className="h-3 bg-white/5 rounded-full w-4/5" /><div className="h-2.5 bg-white/5 rounded-full w-2/5" /></div></div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/30">
            <Youtube className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-base font-semibold">No videos found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {videos.map(v => <VideoCard key={v.id} video={v} onClick={() => onVideoPlay(v)} />)}
            </div>
            <div ref={sentinelRef} className="h-8 mt-4" />
            {isFetchingMore && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse"><div className="aspect-video rounded-xl bg-white/5" /></div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilterPanel({ filters, onChange, onClose }: { filters: Filters; onChange: (f: Filters) => void; onClose: () => void }) {
  const setRadio = (key: keyof Omit<Filters, "features">, val: string) => onChange({ ...filters, [key]: val });
  const toggleFeature = (feat: string) => {
    const has = filters.features.includes(feat);
    onChange({ ...filters, features: has ? filters.features.filter(f => f !== feat) : [...filters.features, feat] });
  };

  const GroupLabel = ({ label }: { label: string }) => <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">{label}</p>;

  const RadioBtn = ({ val, current, group }: { val: string; current: string; group: keyof Omit<Filters, "features"> }) => (
    <button data-testid={`filter-${group}-${val.toLowerCase().replace(/\s+/g, "-")}`} onClick={() => setRadio(group, val)}
      className={`flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg text-sm transition-all ${current === val ? "bg-red-600/20 text-red-400 border border-red-600/30" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${current === val ? "border-red-500 bg-red-500" : "border-white/20"}`}>
        {current === val && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
      {val}
    </button>
  );

  return (
    <div className="absolute top-full right-0 mt-2 z-40 w-72 bg-[#0e0e18] border border-white/10 rounded-2xl shadow-2xl p-4 space-y-4 max-h-[80vh] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white">Search Filters</span>
        <button data-testid="button-close-filters" onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div><GroupLabel label="Type" /><div className="space-y-0.5">{TYPE_OPTIONS.map(o => <RadioBtn key={o} val={o} current={filters.type} group="type" />)}</div></div>
      <div className="border-t border-white/5 pt-3"><GroupLabel label="Duration" /><div className="space-y-0.5">{DURATION_OPTIONS.map(o => <RadioBtn key={o} val={o} current={filters.duration} group="duration" />)}</div></div>
      <div className="border-t border-white/5 pt-3"><GroupLabel label="Upload Date" /><div className="space-y-0.5">{UPLOAD_DATE_OPTIONS.map(o => <RadioBtn key={o} val={o} current={filters.uploadDate} group="uploadDate" />)}</div></div>
      <div className="border-t border-white/5 pt-3"><GroupLabel label="Prioritize" /><div className="space-y-0.5">{PRIORITIZE_OPTIONS.map(o => <RadioBtn key={o} val={o} current={filters.prioritize} group="prioritize" />)}</div></div>
      <div className="border-t border-white/5 pt-3">
        <GroupLabel label="Features" />
        <div className="flex flex-wrap gap-1.5">
          {FEATURE_OPTIONS.map(f => {
            const active = filters.features.includes(f);
            return (
              <button key={f} data-testid={`filter-feature-${f.toLowerCase().replace(/\s+/g, "-")}`} onClick={() => toggleFeature(f)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-all border ${active ? "bg-red-600/20 text-red-400 border-red-600/30" : "text-white/50 hover:text-white hover:bg-white/5 border-white/10"}`}>
                {active && <Check className="w-3 h-3" />}{f}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function usePagedFetch(baseUrl: string) {
  const [videos, setVideos] = useState<YTVideo[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setVideos([]);
    setIsLoading(true);
    setHasMore(false);
    setNextToken(undefined);
    setError(null);
    fetch(baseUrl, { credentials: "include" })
      .then(r => r.json())
      .then((data: PagedVideos & { message?: string }) => {
        if (cancelled) return;
        if (data.message) { setError(data.message); setIsLoading(false); return; }
        setVideos(data.videos || []);
        setNextToken(data.nextPageToken);
        setHasMore(!!data.nextPageToken);
        setIsLoading(false);
      })
      .catch(() => { if (!cancelled) { setError("Failed to load videos"); setIsLoading(false); } });
    return () => { cancelled = true; };
  }, [baseUrl]);

  const fetchMore = useCallback(() => {
    if (!nextToken || isFetchingMore) return;
    setIsFetchingMore(true);
    const sep = baseUrl.includes("?") ? "&" : "?";
    fetch(`${baseUrl}${sep}pageToken=${nextToken}`, { credentials: "include" })
      .then(r => r.json())
      .then((data: PagedVideos) => {
        setVideos(prev => {
          const seen = new Set(prev.map(v => v.id));
          const fresh = (data.videos || []).filter(v => !seen.has(v.id));
          return [...prev, ...fresh];
        });
        setNextToken(data.nextPageToken);
        setHasMore(!!data.nextPageToken);
        setIsFetchingMore(false);
      })
      .catch(() => setIsFetchingMore(false));
  }, [baseUrl, nextToken, isFetchingMore]);

  return { videos, isLoading, isFetchingMore, hasMore, fetchMore, error };
}

function InfiniteVideoGrid({ baseUrl, onVideoClick, onChannelClick, emptyText }: {
  baseUrl: string;
  onVideoClick: (v: YTVideo) => void;
  onChannelClick?: (id: string) => void;
  emptyText?: string;
}) {
  const { videos, isLoading, isFetchingMore, hasMore, fetchMore, error } = usePagedFetch(baseUrl);
  const sentinelRef = useInfiniteScroll(fetchMore, hasMore && !isFetchingMore);

  if (isLoading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse"><div className="aspect-video rounded-xl bg-white/5" /><div className="mt-2 space-y-1.5"><div className="h-3 bg-white/5 rounded-full w-4/5" /><div className="h-2.5 bg-white/5 rounded-full w-2/5" /></div></div>
      ))}
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 text-white/30">
      <Youtube className="w-12 h-12 mb-4 opacity-50" />
      <p className="text-base font-semibold">YouTube API limit reached</p>
      <p className="text-sm mt-1 text-white/20">Quota resets daily — check back soon</p>
    </div>
  );

  if (videos.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-white/30">
      <Youtube className="w-12 h-12 mb-4 opacity-50" />
      <p className="text-base font-semibold">{emptyText || "No videos found"}</p>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {videos.map(v => <VideoCard key={v.id} video={v} onClick={() => onVideoClick(v)} onChannelClick={onChannelClick} />)}
      </div>
      <div ref={sentinelRef} className="h-8 mt-4" />
      {isFetchingMore && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse"><div className="aspect-video rounded-xl bg-white/5" /></div>
          ))}
        </div>
      )}
    </>
  );
}

export default function HorizonTubePage() {
  const [searchInput, setSearchInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({ type: "All", duration: "Any", uploadDate: "Anytime", prioritize: "Relevance", features: [] });
  const [selectedVideo, setSelectedVideo] = useState<YTVideo | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<YTChannel | null>(null);
  const [fetchedChannel, setFetchedChannel] = useState<YTChannel | null>(null);
  const debouncedSearch = useDebounce(searchInput, 500);
  const shortsScrollRef = useRef<HTMLDivElement>(null);
  const [shortIndex, setShortIndex] = useState(0);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilters(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isChannelSearch = filters.type === "Channels";

  const [searchVideos, setSearchVideos] = useState<YTVideo[]>([]);
  const [searchChannels, setSearchChannels] = useState<YTChannel[]>([]);
  const [searchNextToken, setSearchNextToken] = useState<string | undefined>(undefined);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [fetchingMoreSearch, setFetchingMoreSearch] = useState(false);
  const [hasMoreSearch, setHasMoreSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const buildSearchUrl = useCallback((pageToken?: string) => {
    const params = new URLSearchParams({ q: debouncedSearch, type: filters.type, duration: filters.duration, uploadDate: filters.uploadDate, prioritize: filters.prioritize });
    if (filters.features.length) params.set("features", filters.features.join(","));
    if (pageToken) params.set("pageToken", pageToken);
    return `/api/youtube/search?${params.toString()}`;
  }, [debouncedSearch, filters]);

  useEffect(() => {
    if (!debouncedSearch) {
      setSearchVideos([]);
      setSearchChannels([]);
      setHasMoreSearch(false);
      setSearchError(null);
      return;
    }
    let cancelled = false;
    setSearchVideos([]);
    setSearchChannels([]);
    setLoadingSearch(true);
    setHasMoreSearch(false);
    setSearchError(null);
    fetch(buildSearchUrl(), { credentials: "include" })
      .then(async r => {
        const data = await r.json();
        if (cancelled) return;
        if (!r.ok || data.message) {
          const msg: string = data.message || `Error ${r.status}`;
          if (msg.includes("403") || msg.toLowerCase().includes("quota")) {
            setSearchError("YouTube search quota reached — try again tomorrow or adjust your filters");
          } else {
            setSearchError(msg);
          }
          setLoadingSearch(false);
          return;
        }
        setSearchVideos(data.videos || []);
        setSearchChannels(data.channels || []);
        setSearchNextToken(data.nextPageToken);
        setHasMoreSearch(!!data.nextPageToken);
        setLoadingSearch(false);
      })
      .catch(() => { if (!cancelled) { setSearchError("Network error — please try again"); setLoadingSearch(false); } });
    return () => { cancelled = true; };
  }, [debouncedSearch, filters]);

  const fetchMoreSearchFn = useCallback(() => {
    if (!searchNextToken || fetchingMoreSearch) return;
    setFetchingMoreSearch(true);
    fetch(buildSearchUrl(searchNextToken), { credentials: "include" })
      .then(r => r.json())
      .then((data: PagedChannels) => {
        setSearchVideos(prev => [...prev, ...(data.videos || [])]);
        setSearchChannels(prev => [...prev, ...(data.channels || [])]);
        setSearchNextToken(data.nextPageToken);
        setHasMoreSearch(!!data.nextPageToken);
        setFetchingMoreSearch(false);
      })
      .catch(() => setFetchingMoreSearch(false));
  }, [searchNextToken, fetchingMoreSearch, buildSearchUrl]);

  const searchSentinelRef = useInfiniteScroll(fetchMoreSearchFn, hasMoreSearch && !fetchingMoreSearch);

  const { data: shortsData, isLoading: loadingShorts } = useQuery<{ videos: YTVideo[] }>({
    queryKey: ["/api/youtube/shorts"],
    enabled: !debouncedSearch && !selectedChannel,
  });
  const shorts = shortsData?.videos ?? [];

  const scrollShort = (dir: "up" | "down") => {
    if (!shortsScrollRef.current) return;
    const newIndex = dir === "down" ? Math.min(shortIndex + 1, shorts.length - 1) : Math.max(shortIndex - 1, 0);
    setShortIndex(newIndex);
    const cards = shortsScrollRef.current.querySelectorAll("[data-short-card]");
    if (cards[newIndex]) cards[newIndex].scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const activeFiltersCount =
    (filters.type !== "All" ? 1 : 0) +
    (filters.duration !== "Any" ? 1 : 0) +
    (filters.uploadDate !== "Anytime" ? 1 : 0) +
    (filters.prioritize !== "Relevance" ? 1 : 0) +
    filters.features.length;

  const handleChannelClick = async (channelId: string) => {
    try {
      const res = await fetch(`/api/youtube/channel/${channelId}`, { credentials: "include" });
      if (res.ok) {
        const ch = await res.json();
        setFetchedChannel(ch);
        setSelectedChannel(ch);
      }
    } catch {}
  };

  const handleChannelFromSearch = (ch: YTChannel) => {
    setSelectedChannel(ch);
    setFetchedChannel(ch);
  };

  if (selectedChannel) {
    return (
      <>
        <ChannelView
          channel={selectedChannel}
          onClose={() => setSelectedChannel(null)}
          onVideoPlay={setSelectedVideo}
        />
        {selectedVideo && <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
      </>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-black text-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0"><Youtube className="w-4 h-4 text-white" /></div>
            <div className="hidden sm:block">
              <h1 className="text-base font-black tracking-widest text-white uppercase">HorizonTube</h1>
              <p className="text-[9px] text-white/25 tracking-wider">Powered by YouTube</p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                data-testid="input-yt-search"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search videos, channels..."
                className="pl-9 pr-9 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-red-500/50 focus-visible:border-red-500/30 rounded-xl"
              />
              {searchInput && (
                <button data-testid="button-clear-yt-search" onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
              )}
            </div>
            <div className="relative flex-shrink-0" ref={filterRef}>
              <button
                data-testid="button-yt-filters"
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${showFilters || activeFiltersCount > 0 ? "bg-red-600/20 border-red-600/30 text-red-400" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/8"}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">{activeFiltersCount}</span>}
              </button>
              {showFilters && <FilterPanel filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-10">
        {debouncedSearch ? (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-red-500" />
              <h2 className="text-base font-bold text-white tracking-wide">
                Results for <span className="text-red-400">"{debouncedSearch}"</span>
              </h2>
              {!loadingSearch && !searchError && (
                <span className="text-xs text-white/30 ml-1">
                  {isChannelSearch ? searchChannels.length : searchVideos.length} result{(isChannelSearch ? searchChannels.length : searchVideos.length) !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {loadingSearch ? (
              <div className={`grid gap-4 ${isChannelSearch ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}`}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    {isChannelSearch ? <div className="rounded-2xl bg-white/5 h-44" /> : <><div className="aspect-video rounded-xl bg-white/5" /><div className="mt-2 space-y-1.5"><div className="h-3 bg-white/5 rounded-full w-4/5" /><div className="h-2.5 bg-white/5 rounded-full w-2/5" /></div></>}
                  </div>
                ))}
              </div>
            ) : isChannelSearch ? (
              searchChannels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-white/30">
                  <Users className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-base font-semibold">No channels found</p>
                  <p className="text-sm mt-1">Try a different channel name</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {searchChannels.map(ch => <ChannelCard key={ch.id} channel={ch} onClick={() => handleChannelFromSearch(ch)} />)}
                  </div>
                  <div ref={searchSentinelRef} className="h-8 mt-4" />
                  {fetchingMoreSearch && <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>}
                </>
              )
            ) : searchError ? (
              <div className="flex flex-col items-center justify-center py-24 text-white/30">
                <Youtube className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-base font-semibold text-yellow-400/80">Search unavailable</p>
                <p className="text-sm mt-1 text-center max-w-sm">{searchError}</p>
              </div>
            ) : searchVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-white/30">
                <Youtube className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-base font-semibold">No results found</p>
                <p className="text-sm mt-1">Try a different search term or adjust your filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {searchVideos.map(v => <VideoCard key={v.id} video={v} onClick={() => setSelectedVideo(v)} onChannelClick={handleChannelClick} />)}
                </div>
                <div ref={searchSentinelRef} className="h-8 mt-4" />
                {fetchingMoreSearch && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-pulse"><div className="aspect-video rounded-xl bg-white/5" /></div>)}
                  </div>
                )}
              </>
            )}
          </section>
        ) : (
          <>
            {/* Most Popular — infinite scroll */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <h2 className="text-base font-bold text-white tracking-wide">Most Popular</h2>
              </div>
              <InfiniteVideoGrid
                baseUrl="/api/youtube/popular"
                onVideoClick={setSelectedVideo}
                onChannelClick={handleChannelClick}
              />
            </section>

            {/* News */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-blue-400" />
                <h2 className="text-base font-bold text-white tracking-wide">News & Politics</h2>
              </div>
              <InfiniteVideoGrid
                baseUrl="/api/youtube/latest"
                onVideoClick={setSelectedVideo}
                onChannelClick={handleChannelClick}
              />
            </section>

            {/* Gaming */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-yellow-400" />
                <h2 className="text-base font-bold text-white tracking-wide">Gaming</h2>
              </div>
              <InfiniteVideoGrid
                baseUrl="/api/youtube/newer"
                onVideoClick={setSelectedVideo}
                onChannelClick={handleChannelClick}
              />
            </section>

            {/* Music */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-purple-400" />
                <h2 className="text-base font-bold text-white tracking-wide">Music</h2>
              </div>
              <InfiniteVideoGrid
                baseUrl="/api/youtube/oldest"
                onVideoClick={setSelectedVideo}
                onChannelClick={handleChannelClick}
              />
            </section>

            {/* Shorts */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded bg-red-600 flex items-center justify-center flex-shrink-0"><Play className="w-3 h-3 text-white fill-current" /></div>
                <h2 className="text-base font-bold text-white tracking-wide">Shorts</h2>
                <span className="text-xs text-white/30 ml-1">Scroll to explore</span>
              </div>
              {loadingShorts ? (
                <div className="flex gap-4 overflow-hidden">
                  {Array.from({ length: 5 }).map((_, i) => <div key={i} className="flex-shrink-0 w-44 animate-pulse"><div className="rounded-2xl bg-white/5 border border-white/5" style={{ aspectRatio: "9/16" }} /></div>)}
                </div>
              ) : shorts.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-white/20 border border-white/5 rounded-2xl"><Youtube className="w-8 h-8 mr-2" /><span className="text-sm">No shorts found</span></div>
              ) : (
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <button data-testid="button-shorts-prev" onClick={() => scrollShort("up")} disabled={shortIndex === 0} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
                    <button data-testid="button-shorts-next" onClick={() => scrollShort("down")} disabled={shortIndex >= shorts.length - 1} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
                    <span className="text-xs text-white/25">{shortIndex + 1} / {shorts.length}</span>
                  </div>
                  <div ref={shortsScrollRef} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                    {shorts.map(s => (
                      <div key={s.id} data-short-card className="flex-shrink-0" style={{ width: "clamp(160px, 20vw, 220px)" }}>
                        <ShortCard video={s} onClick={() => setSelectedVideo(s)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {selectedVideo && <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
    </div>
  );
}
