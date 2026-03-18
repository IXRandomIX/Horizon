import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, X, Play, Youtube, TrendingUp, Clock, Zap, History,
  ChevronLeft, ChevronRight, SlidersHorizontal, Eye, Check, Maximize2, Minimize2
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
  viewCount: string | null;
  likeCount: string | null;
  duration: string | null;
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
const FEATURE_OPTIONS = [
  "Live", "4K", "HD", "Subtitles/CC", "Creative Commons",
  "360", "VR180", "3D", "HDR", "Location", "Purchased",
];

function formatViews(v: string | null): string {
  if (!v) return "";
  const n = parseInt(v);
  if (isNaN(n)) return "";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B views`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

function VideoCard({ video, onClick }: { video: YTVideo; onClick: () => void }) {
  return (
    <button
      data-testid={`card-video-${video.id}`}
      onClick={onClick}
      className="group flex flex-col text-left focus:outline-none w-full"
    >
      <div className="relative rounded-xl overflow-hidden bg-white/5 border border-white/8 group-hover:border-primary/40 transition-all duration-300 aspect-video">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Youtube className="w-8 h-8 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-white fill-current ml-0.5" />
          </div>
        </div>
      </div>
      <div className="pt-2 px-0.5">
        <p className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-red-400 transition-colors">
          {video.title}
        </p>
        <p className="text-[11px] text-white/40 mt-1 truncate">{video.channelTitle}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {video.viewCount && (
            <span className="text-[11px] text-white/30 flex items-center gap-1">
              <Eye className="w-2.5 h-2.5" />
              {formatViews(video.viewCount)}
            </span>
          )}
          {video.publishedAt && (
            <span className="text-[11px] text-white/25">{timeAgo(video.publishedAt)}</span>
          )}
        </div>
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
      <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/8 group-hover:border-red-500/50 transition-all duration-300"
        style={{ aspectRatio: "9/16" }}>
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <Youtube className="w-10 h-10 text-white/20" />
          </div>
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
          {video.viewCount && (
            <p className="text-[11px] text-white/40 flex items-center gap-1 mt-0.5">
              <Eye className="w-2.5 h-2.5" />
              {formatViews(video.viewCount)}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function HScrollSection({
  title, icon, videos, isLoading, onVideoClick
}: {
  title: string;
  icon: React.ReactNode;
  videos: YTVideo[];
  isLoading: boolean;
  onVideoClick: (v: YTVideo) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-base font-bold text-white tracking-wide">{title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            data-testid={`button-scroll-left-${title}`}
            onClick={() => scroll("left")}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            data-testid={`button-scroll-right-${title}`}
            onClick={() => scroll("right")}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-56 animate-pulse">
              <div className="aspect-video rounded-xl bg-white/5 border border-white/5" />
              <div className="mt-2 space-y-1.5 px-0.5">
                <div className="h-3 bg-white/5 rounded-full w-4/5" />
                <div className="h-2.5 bg-white/5 rounded-full w-2/5" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-white/20">
          <Youtube className="w-8 h-8 mr-2" />
          <span className="text-sm">No videos found</span>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-1 scroll-smooth"
          style={{ scrollbarWidth: "none" }}
        >
          {videos.map(v => (
            <div key={v.id} className="flex-shrink-0 w-56">
              <VideoCard video={v} onClick={() => onVideoClick(v)} />
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

  const isShort = video.kind === "youtube#short";
  const embedUrl = `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={containerRef}
        className={`relative bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col ${
          isShort ? "w-full max-w-sm" : "w-full max-w-5xl"
        }`}
        style={{ maxHeight: "92vh" }}
      >
        <div className="flex items-center gap-3 px-4 py-3 bg-black/90 border-b border-white/5 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold truncate text-sm">{video.title}</p>
            <p className="text-white/40 text-xs truncate">{video.channelTitle}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              data-testid="button-fullscreen-yt"
              onClick={toggleFullscreen}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              data-testid="button-close-yt-player"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-red-500/30 text-white hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div
          className="relative w-full"
          style={isShort ? { paddingBottom: "177.78%" } : { paddingBottom: "56.25%", minHeight: 280 }}
        >
          <iframe
            src={embedUrl}
            title={video.title}
            className="absolute inset-0 w-full h-full border-0"
            allowFullScreen
            allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
            data-testid="iframe-yt-player"
          />
        </div>
      </div>
    </div>
  );
}

function FilterPanel({
  filters,
  onChange,
  onClose,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onClose: () => void;
}) {
  const setRadio = (key: keyof Omit<Filters, "features">, val: string) =>
    onChange({ ...filters, [key]: val });

  const toggleFeature = (feat: string) => {
    const has = filters.features.includes(feat);
    onChange({
      ...filters,
      features: has ? filters.features.filter(f => f !== feat) : [...filters.features, feat],
    });
  };

  const GroupLabel = ({ label }: { label: string }) => (
    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">{label}</p>
  );

  const RadioBtn = ({
    val, current, group
  }: { val: string; current: string; group: keyof Omit<Filters, "features"> }) => (
    <button
      data-testid={`filter-${group}-${val.toLowerCase().replace(/\s+/g, "-")}`}
      onClick={() => setRadio(group, val)}
      className={`flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg text-sm transition-all ${
        current === val
          ? "bg-red-600/20 text-red-400 border border-red-600/30"
          : "text-white/50 hover:text-white hover:bg-white/5"
      }`}
    >
      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
        current === val ? "border-red-500 bg-red-500" : "border-white/20"
      }`}>
        {current === val && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
      {val}
    </button>
  );

  const FeatureBtn = ({ feat }: { feat: string }) => {
    const active = filters.features.includes(feat);
    return (
      <button
        data-testid={`filter-feature-${feat.toLowerCase().replace(/\s+/g, "-")}`}
        onClick={() => toggleFeature(feat)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-all border ${
          active
            ? "bg-red-600/20 text-red-400 border-red-600/30"
            : "text-white/50 hover:text-white hover:bg-white/5 border-white/10"
        }`}
      >
        {active && <Check className="w-3 h-3" />}
        {feat}
      </button>
    );
  };

  return (
    <div className="absolute top-full right-0 mt-2 z-40 w-72 bg-[#0e0e18] border border-white/10 rounded-2xl shadow-2xl p-4 space-y-4 max-h-[80vh] overflow-y-auto"
      style={{ scrollbarWidth: "none" }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white">Search Filters</span>
        <button
          data-testid="button-close-filters"
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <GroupLabel label="Type" />
        <div className="space-y-0.5">
          {TYPE_OPTIONS.map(o => <RadioBtn key={o} val={o} current={filters.type} group="type" />)}
        </div>
      </div>

      <div className="border-t border-white/5 pt-3">
        <GroupLabel label="Duration" />
        <div className="space-y-0.5">
          {DURATION_OPTIONS.map(o => <RadioBtn key={o} val={o} current={filters.duration} group="duration" />)}
        </div>
      </div>

      <div className="border-t border-white/5 pt-3">
        <GroupLabel label="Upload Date" />
        <div className="space-y-0.5">
          {UPLOAD_DATE_OPTIONS.map(o => <RadioBtn key={o} val={o} current={filters.uploadDate} group="uploadDate" />)}
        </div>
      </div>

      <div className="border-t border-white/5 pt-3">
        <GroupLabel label="Prioritize" />
        <div className="space-y-0.5">
          {PRIORITIZE_OPTIONS.map(o => <RadioBtn key={o} val={o} current={filters.prioritize} group="prioritize" />)}
        </div>
      </div>

      <div className="border-t border-white/5 pt-3">
        <GroupLabel label="Features" />
        <div className="flex flex-wrap gap-1.5">
          {FEATURE_OPTIONS.map(f => <FeatureBtn key={f} feat={f} />)}
        </div>
      </div>
    </div>
  );
}

export default function HorizonTubePage() {
  const [searchInput, setSearchInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    type: "All",
    duration: "Any",
    uploadDate: "Anytime",
    prioritize: "Relevance",
    features: [],
  });
  const [selectedVideo, setSelectedVideo] = useState<YTVideo | null>(null);
  const debouncedSearch = useDebounce(searchInput, 500);
  const shortsScrollRef = useRef<HTMLDivElement>(null);
  const [shortIndex, setShortIndex] = useState(0);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buildSearchUrl = () => {
    if (!debouncedSearch) return null;
    const params = new URLSearchParams({
      q: debouncedSearch,
      type: filters.type,
      duration: filters.duration,
      uploadDate: filters.uploadDate,
      prioritize: filters.prioritize,
    });
    if (filters.features.length) params.set("features", filters.features.join(","));
    return `/api/youtube/search?${params.toString()}`;
  };

  const { data: popular = [], isLoading: loadingPopular } = useQuery<YTVideo[]>({
    queryKey: ["/api/youtube/popular"],
    enabled: !debouncedSearch,
  });

  const { data: latest = [], isLoading: loadingLatest } = useQuery<YTVideo[]>({
    queryKey: ["/api/youtube/latest"],
    enabled: !debouncedSearch,
  });

  const { data: newer = [], isLoading: loadingNewer } = useQuery<YTVideo[]>({
    queryKey: ["/api/youtube/newer"],
    enabled: !debouncedSearch,
  });

  const { data: oldest = [], isLoading: loadingOldest } = useQuery<YTVideo[]>({
    queryKey: ["/api/youtube/oldest"],
    enabled: !debouncedSearch,
  });

  const { data: shorts = [], isLoading: loadingShorts } = useQuery<YTVideo[]>({
    queryKey: ["/api/youtube/shorts"],
    enabled: !debouncedSearch,
  });

  const searchUrl = buildSearchUrl();
  const { data: searchResults = [], isLoading: loadingSearch } = useQuery<YTVideo[]>({
    queryKey: ["/api/youtube/search", debouncedSearch, filters],
    enabled: !!searchUrl,
    queryFn: async () => {
      const res = await fetch(searchUrl!, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Search failed");
      }
      return res.json();
    },
  });

  const scrollShort = (dir: "up" | "down") => {
    if (!shortsScrollRef.current) return;
    const newIndex = dir === "down"
      ? Math.min(shortIndex + 1, shorts.length - 1)
      : Math.max(shortIndex - 1, 0);
    setShortIndex(newIndex);
    const cards = shortsScrollRef.current.querySelectorAll("[data-short-card]");
    if (cards[newIndex]) {
      cards[newIndex].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const activeFiltersCount =
    (filters.type !== "All" ? 1 : 0) +
    (filters.duration !== "Any" ? 1 : 0) +
    (filters.uploadDate !== "Anytime" ? 1 : 0) +
    (filters.prioritize !== "Relevance" ? 1 : 0) +
    filters.features.length;

  return (
    <div className="h-full overflow-y-auto bg-black text-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
              <Youtube className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-black tracking-widest text-white uppercase">HorizonTube</h1>
              <p className="text-[9px] text-white/25 tracking-wider">Powered by YouTube</p>
            </div>
          </div>

          {/* Search bar centered */}
          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                data-testid="input-yt-search"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search YouTube..."
                className="pl-9 pr-9 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-red-500/50 focus-visible:border-red-500/30 rounded-xl"
              />
              {searchInput && (
                <button
                  data-testid="button-clear-yt-search"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter button */}
            <div className="relative flex-shrink-0" ref={filterRef}>
              <button
                data-testid="button-yt-filters"
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                  showFilters || activeFiltersCount > 0
                    ? "bg-red-600/20 border-red-600/30 text-red-400"
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/8"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              {showFilters && (
                <FilterPanel
                  filters={filters}
                  onChange={setFilters}
                  onClose={() => setShowFilters(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-10">
        {debouncedSearch ? (
          /* Search results */
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-red-500" />
              <h2 className="text-base font-bold text-white tracking-wide">
                Results for <span className="text-red-400">"{debouncedSearch}"</span>
              </h2>
              {!loadingSearch && (
                <span className="text-xs text-white/30 ml-1">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</span>
              )}
            </div>
            {loadingSearch ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-video rounded-xl bg-white/5" />
                    <div className="mt-2 space-y-1.5">
                      <div className="h-3 bg-white/5 rounded-full w-4/5" />
                      <div className="h-2.5 bg-white/5 rounded-full w-2/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-white/30">
                <Youtube className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-base font-semibold">No results found</p>
                <p className="text-sm mt-1">Try a different search term or adjust your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {searchResults.map(v => (
                  <VideoCard key={v.id} video={v} onClick={() => setSelectedVideo(v)} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Most Popular */}
            <HScrollSection
              title="Most Popular"
              icon={<TrendingUp className="w-4 h-4 text-red-500" />}
              videos={popular}
              isLoading={loadingPopular}
              onVideoClick={setSelectedVideo}
            />

            {/* Latest */}
            <HScrollSection
              title="Latest"
              icon={<Clock className="w-4 h-4 text-blue-400" />}
              videos={latest}
              isLoading={loadingLatest}
              onVideoClick={setSelectedVideo}
            />

            {/* Newer */}
            <HScrollSection
              title="Newer"
              icon={<Zap className="w-4 h-4 text-yellow-400" />}
              videos={newer}
              isLoading={loadingNewer}
              onVideoClick={setSelectedVideo}
            />

            {/* Oldest */}
            <HScrollSection
              title="Oldest"
              icon={<History className="w-4 h-4 text-purple-400" />}
              videos={oldest}
              isLoading={loadingOldest}
              onVideoClick={setSelectedVideo}
            />

            {/* Shorts Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded bg-red-600 flex items-center justify-center flex-shrink-0">
                  <Play className="w-3 h-3 text-white fill-current" />
                </div>
                <h2 className="text-base font-bold text-white tracking-wide">Shorts</h2>
                <span className="text-xs text-white/30 ml-1">Scroll to explore</span>
              </div>

              {loadingShorts ? (
                <div className="flex gap-4 overflow-hidden">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-44 animate-pulse">
                      <div className="rounded-2xl bg-white/5 border border-white/5" style={{ aspectRatio: "9/16" }} />
                    </div>
                  ))}
                </div>
              ) : shorts.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-white/20 border border-white/5 rounded-2xl">
                  <Youtube className="w-8 h-8 mr-2" />
                  <span className="text-sm">No shorts found</span>
                </div>
              ) : (
                <div className="relative">
                  {/* Navigation arrows for shorts */}
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      data-testid="button-shorts-prev"
                      onClick={() => scrollShort("up")}
                      disabled={shortIndex === 0}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      data-testid="button-shorts-next"
                      onClick={() => scrollShort("down")}
                      disabled={shortIndex >= shorts.length - 1}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-white/25">{shortIndex + 1} / {shorts.length}</span>
                  </div>

                  {/* Scrollable shorts container */}
                  <div
                    ref={shortsScrollRef}
                    className="flex gap-4 overflow-x-auto pb-2"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {shorts.map((s) => (
                      <div
                        key={s.id}
                        data-short-card
                        className="flex-shrink-0"
                        style={{ width: "clamp(160px, 20vw, 220px)" }}
                      >
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

      {selectedVideo && (
        <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </div>
  );
}
