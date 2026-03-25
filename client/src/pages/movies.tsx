import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Maximize2, Minimize2, Play, Film, Tv, Star, Clock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const TMDB_IMG = "https://image.tmdb.org/t/p/w342";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w780";
const STORAGE_KEY = "horizon-continue-watching";

type TabType = "movies" | "shows" | "anime";

interface Media {
  id: number;
  title?: string;
  name?: string;
  media_type: "movie" | "tv";
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  popularity: number;
}

interface ContinueItem {
  id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  updatedAt: number;
}

interface PageData {
  results: Media[];
  total_pages: number;
  page: number;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function getTitle(m: Media) {
  return m.title || m.name || "Unknown";
}

function getYear(m: Media) {
  const d = m.release_date || m.first_air_date || "";
  return d ? d.substring(0, 4) : "";
}

const SOURCES = [
  { id: "vidify",   label: "Vidify"     },
  { id: "vidsrc2",  label: "VidSrc 2"   },
  { id: "vidsrcco", label: "VidSrc.co"  },
  { id: "autoembed",label: "AutoEmbed"  },
  { id: "vidsrcicu",label: "VidSrc ICU" },
  { id: "moviekex", label: "MovieKex"   },
  { id: "vidsrccc", label: "VidSrc CC"  },
  { id: "moviesapi",label: "MoviesAPI"  },
  { id: "vidlink",  label: "VidLink"    },
  { id: "embedsu",  label: "Embed.su"   },
  { id: "vidora",   label: "Vidora"     },
] as const;
type SourceId = typeof SOURCES[number]["id"];

function getEmbedUrl(m: Media, season: number, episode: number, source: SourceId) {
  const id = String(m.id);
  const s = String(season);
  const e = String(episode);
  const isTV = m.media_type === "tv";

  // Sources that work as direct iframes (no server proxy needed) — same approach as DocumenTV
  switch (source) {
    case "vidify":
      return isTV
        ? `https://player.vidify.top/embed/tv/${id}/${s}/${e}?autoplay=false&poster=true&chromecast=true&servericon=false&setting=true&pip=true&download=true`
        : `https://player.vidify.top/embed/movie/${id}?autoplay=false&poster=true&chromecast=true&servericon=false&setting=true&pip=true&download=true`;
    case "vidsrc2":
      return isTV
        ? `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
        : `https://vidsrc.xyz/embed/movie?tmdb=${id}`;
    case "vidsrcco":
      return isTV
        ? `https://player.vidsrc.co/embed/tv/${id}/${s}/${e}?server=2`
        : `https://player.vidsrc.co/embed/movie/${id}?server=2`;
    case "autoembed":
      return isTV
        ? `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`
        : `https://player.autoembed.cc/embed/movie/${id}?server=1`;
    case "vidsrcicu":
      return isTV
        ? `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`
        : `https://vidsrc.icu/embed/movie/${id}`;
    case "moviekex":
      return isTV
        ? `https://moviekex.online/embed/tv/${id}/${s}/${e}`
        : `https://moviekex.online/embed/movie/${id}`;
    case "vidsrccc":
      return isTV
        ? `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`
        : `https://vidsrc.cc/v2/embed/movie/${id}`;
    case "moviesapi":
      return isTV
        ? `https://moviesapi.club/tv/${id}-${s}-${e}`
        : `https://moviesapi.club/movie/${id}`;
    case "vidlink":
      return isTV
        ? `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=false&poster=true&primaryColor=00c1db`
        : `https://vidlink.pro/movie/${id}?autoplay=true&poster=true&primaryColor=00c1db`;
    case "embedsu":
      return isTV
        ? `https://embed.su/embed/tv/${id}/${s}/${e}`
        : `https://embed.su/embed/movie/${id}`;
    case "vidora":
    default:
      return isTV
        ? `https://vidora.su/tv/${id}/${s}/${e}?colour=dba4b2&autoplay=true`
        : `https://vidora.su/movie/${id}?colour=dba4b2&autoplay=true`;
  }
}

function saveToHistory(m: Media) {
  try {
    const existing: ContinueItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const updated = [
      { id: m.id, media_type: m.media_type, title: getTitle(m), poster_path: m.poster_path, updatedAt: Date.now() },
      ...existing.filter(i => !(i.id === m.id && i.media_type === m.media_type)),
    ].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

function MediaCard({ m, onClick }: { m: Media; onClick: () => void }) {
  const poster = m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null;
  const year = getYear(m);
  const rating = m.vote_average ? m.vote_average.toFixed(1) : null;

  return (
    <button
      data-testid={`card-media-${m.id}`}
      onClick={onClick}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-white/5 border border-white/8 hover:border-primary/40 hover:bg-white/8 transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-primary/50"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-white/5">
        {poster ? (
          <img
            src={poster}
            alt={getTitle(m)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            {m.media_type === "tv" ? <Tv className="w-10 h-10" /> : <Film className="w-10 h-10" />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
          <div className="flex items-center gap-2 bg-primary text-white rounded-full px-4 py-2 text-sm font-bold shadow-lg">
            <Play className="w-4 h-4 fill-current" />
            Watch Now
          </div>
        </div>
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
            m.media_type === "tv"
              ? "bg-blue-600/90 text-white"
              : "bg-purple-600/90 text-white"
          }`}>
            {m.media_type === "tv" ? "TV" : "Film"}
          </span>
        </div>
        {rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5">
            <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
            <span className="text-[10px] font-bold text-white">{rating}</span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {getTitle(m)}
        </p>
        {year && <p className="text-[11px] text-white/40">{year}</p>}
      </div>
    </button>
  );
}


function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white/5 border border-white/5 overflow-hidden animate-pulse">
          <div className="aspect-[2/3] bg-white/10" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-white/10 rounded-full w-4/5" />
            <div className="h-2.5 bg-white/5 rounded-full w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface SeasonInfo {
  number: number;
  name: string;
  episodeCount: number;
}

function IframePlayer({ embedUrl, backdrop }: { embedUrl: string; backdrop: string | null }) {
  return (
    <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%", minHeight: 280 }}>
      <iframe
        key={embedUrl}
        src={embedUrl}
        className="absolute inset-0 w-full h-full border-0"
        allowFullScreen
        allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
        data-testid="iframe-player"
      />
    </div>
  );
}

function PlayerModal({ media, onClose }: { media: Media; onClose: () => void }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [source, setSource] = useState<SourceId>("vidify");
  const containerRef = useRef<HTMLDivElement>(null);
  const isTV = media.media_type === "tv";

  const { data: seasons = [] } = useQuery<SeasonInfo[]>({
    queryKey: ["/api/movies/tv", media.id, "seasons"],
    queryFn: async () => {
      const res = await fetch(`/api/movies/tv/${media.id}/seasons`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isTV,
  });

  const currentSeason = seasons.find(s => s.number === season);
  const maxEpisodes = currentSeason?.episodeCount || 24;
  const embedUrl = getEmbedUrl(media, season, episode, source);

  useEffect(() => {
    saveToHistory(media);
  }, [media]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const backdrop = media.backdrop_path ? `${TMDB_BACKDROP}${media.backdrop_path}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-4">
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
        style={{ maxHeight: "95vh" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-black/95 border-b border-white/5 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold truncate text-sm">{getTitle(media)}</p>
            <p className="text-white/40 text-xs">
              {getYear(media)} · {isTV ? `TV Series · S${season} E${episode}` : "Movie"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              data-testid="button-fullscreen"
              onClick={toggleFullscreen}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              data-testid="button-close-player"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-red-500/30 text-white hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Season / Episode picker for TV */}
        {isTV && (
          <div className="flex items-center gap-3 px-4 py-2 bg-black/80 border-b border-white/5 flex-shrink-0 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-white/40 uppercase tracking-widest">Season</label>
              <select
                data-testid="select-season"
                value={season}
                onChange={e => { setSeason(Number(e.target.value)); setEpisode(1); }}
                className="bg-white/10 border border-white/15 text-white text-sm rounded-lg px-2 py-1 focus:outline-none focus:border-primary/50"
              >
                {seasons.length > 0
                  ? seasons.map(s => (
                      <option key={s.number} value={s.number} className="bg-black">{s.name || `Season ${s.number}`}</option>
                    ))
                  : Array.from({ length: 10 }, (_, i) => (
                      <option key={i + 1} value={i + 1} className="bg-black">Season {i + 1}</option>
                    ))
                }
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-white/40 uppercase tracking-widest">Episode</label>
              <select
                data-testid="select-episode"
                value={episode}
                onChange={e => setEpisode(Number(e.target.value))}
                className="bg-white/10 border border-white/15 text-white text-sm rounded-lg px-2 py-1 focus:outline-none focus:border-primary/50"
              >
                {Array.from({ length: maxEpisodes }, (_, i) => (
                  <option key={i + 1} value={i + 1} className="bg-black">Episode {i + 1}</option>
                ))}
              </select>
            </div>
            {episode < maxEpisodes && (
              <button
                data-testid="button-next-episode"
                onClick={() => setEpisode(e => e + 1)}
                className="ml-auto text-xs bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 px-3 py-1 rounded-lg transition-colors font-semibold"
              >
                Next Ep →
              </button>
            )}
          </div>
        )}

        {/* Player */}
        <IframePlayer embedUrl={embedUrl} backdrop={backdrop} />

        {/* Source switcher strip */}
        <div className="px-4 py-3 bg-black/80 border-t border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] text-white/50 font-semibold uppercase tracking-widest">Switch Server</span>
            <span className="text-[10px] text-amber-400/80">— if video says "Not Available", tap another</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {SOURCES.map(src => (
              <button
                key={src.id}
                data-testid={`button-source-${src.id}`}
                onClick={() => setSource(src.id)}
                className={`text-xs px-3 py-1 rounded-lg border transition-colors font-medium ${
                  source === src.id
                    ? "bg-primary/30 border-primary/60 text-primary"
                    : "bg-white/5 border-white/15 text-white/55 hover:text-white hover:bg-white/10 hover:border-white/30"
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>
          {media.overview && (
            <p className="text-white/35 text-[11px] line-clamp-2 leading-relaxed mt-2">{media.overview}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function InfiniteTab({ active, category, onSelect }: { active: boolean; category: string; onSelect: (m: Media) => void }) {
  const [pages, setPages] = useState<Media[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: firstPage, isLoading } = useQuery<PageData>({
    queryKey: ["/api/movies/category", category, 1],
    queryFn: async () => {
      const res = await fetch(`/api/movies/category/${category}?page=1`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: active,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (firstPage) {
      setPages(firstPage.results || []);
      setTotalPages(firstPage.total_pages || 1);
      setCurrentPage(1);
    }
  }, [firstPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || currentPage >= totalPages) return;
    setLoadingMore(true);
    try {
      const next = currentPage + 1;
      const res = await fetch(`/api/movies/category/${category}?page=${next}`, { credentials: "include" });
      if (!res.ok) return;
      const data: PageData = await res.json();
      setPages(prev => [...prev, ...(data.results || [])]);
      setCurrentPage(next);
    } catch {}
    finally { setLoadingMore(false); }
  }, [loadingMore, currentPage, totalPages, category]);

  useEffect(() => {
    if (!active) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: "300px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [active, loadMore]);

  if (!active) return null;
  if (isLoading) return <SkeletonGrid />;
  if (!pages.length) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {pages.map(m => (
          <MediaCard key={`${m.id}-${m.media_type}`} m={m} onClick={() => onSelect(m)} />
        ))}
      </div>
      <div ref={sentinelRef} className="flex justify-center py-6">
        {loadingMore && (
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading more…
          </div>
        )}
        {!loadingMore && currentPage < totalPages && (
          <button
            onClick={loadMore}
            className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}

const TAB_CONFIG: { id: TabType; label: string; icon: any; searchType: string }[] = [
  { id: "movies", label: "Movies", icon: Film, searchType: "movie" },
  { id: "shows", label: "Shows", icon: Tv, searchType: "tv" },
  { id: "anime", label: "Anime", icon: Star, searchType: "anime" },
];

export default function MoviesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("movies");
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<Media | null>(null);
  const [continueWatching, setContinueWatching] = useState<ContinueItem[]>([]);
  const debouncedSearch = useDebounce(searchInput, 400);

  const currentTabConfig = TAB_CONFIG.find(t => t.id === activeTab)!;

  useEffect(() => {
    try {
      const items: ContinueItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setContinueWatching(items.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch {}
  }, [selected]);

  const { data: searchResults = [], isLoading: loadingSearch } = useQuery<Media[]>({
    queryKey: ["/api/movies/search", debouncedSearch, currentTabConfig.searchType],
    enabled: !!debouncedSearch,
    queryFn: async () => {
      const res = await fetch(
        `/api/movies/search/${encodeURIComponent(debouncedSearch)}?type=${currentTabConfig.searchType}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
  });

  const removeContinueItem = (id: number, media_type: string) => {
    try {
      const items: ContinueItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const updated = items.filter(i => !(i.id === id && i.media_type === media_type));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setContinueWatching(updated);
    } catch {}
  };

  return (
    <div className="h-full overflow-y-auto bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/5">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 max-w-7xl mx-auto">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 flex-shrink-0">
              {TAB_CONFIG.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    data-testid={`tab-${tab.id}`}
                    onClick={() => { setActiveTab(tab.id); setSearchInput(""); }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold tracking-wide transition-all ${
                      active
                        ? "bg-primary text-white shadow-lg"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                data-testid="input-movie-search"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder={`Search ${currentTabConfig.label.toLowerCase()}...`}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-primary/50 focus-visible:border-primary/30 rounded-xl"
              />
              {searchInput && (
                <button
                  data-testid="button-clear-search"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">
        {/* Continue Watching */}
        {!debouncedSearch && continueWatching.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-white tracking-wide">Continue Watching</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {continueWatching.map(item => (
                <div key={`${item.id}-${item.media_type}`} className="relative flex-shrink-0 w-28 group">
                  <button
                    data-testid={`card-continue-${item.id}`}
                    onClick={() => setSelected({ ...item, vote_average: 0, overview: "", popularity: 0, backdrop_path: null } as Media)}
                    className="w-full rounded-xl overflow-hidden border border-white/10 hover:border-primary/40 transition-all"
                  >
                    {item.poster_path ? (
                      <img
                        src={`${TMDB_IMG}${item.poster_path}`}
                        alt={item.title}
                        className="w-full aspect-[2/3] object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center">
                        <Film className="w-8 h-8 text-white/20" />
                      </div>
                    )}
                  </button>
                  <button
                    data-testid={`button-remove-continue-${item.id}`}
                    onClick={() => removeContinueItem(item.id, item.media_type)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/50"
                  >
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                  <p className="text-[10px] text-white/50 mt-1.5 px-0.5 truncate">{item.title}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Search Results */}
        {debouncedSearch ? (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-white tracking-wide">
                Results for <span className="text-primary">"{debouncedSearch}"</span>
              </h2>
              {!loadingSearch && (
                <span className="text-xs text-white/30 ml-1">
                  {searchResults.length} title{searchResults.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {loadingSearch ? (
              <SkeletonGrid />
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-white/30">
                <Film className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-base font-semibold">No results found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {searchResults.map(m => (
                  <MediaCard key={`${m.id}-${m.media_type}`} m={m} onClick={() => setSelected(m)} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <InfiniteTab active={activeTab === "movies"} category="movies" onSelect={setSelected} />
            <InfiniteTab active={activeTab === "shows"} category="shows" onSelect={setSelected} />
            <InfiniteTab active={activeTab === "anime"} category="anime" onSelect={setSelected} />
          </>
        )}
      </div>

      {selected && (
        <PlayerModal media={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
