import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Maximize2, Minimize2, Play, Film, Tv, Star, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const TMDB_IMG = "https://image.tmdb.org/t/p/w342";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w780";
const STORAGE_KEY = "horizon-continue-watching";

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

function getEmbedUrl(m: Media) {
  const slug = getTitle(m).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `https://bcine.app/${m.media_type}/${m.id}-${slug}`;
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

const BLOCKED_DOMAINS = ["youtube.com", "youtu.be", "www.youtube.com", "m.youtube.com"];

function isBlockedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return BLOCKED_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith("." + d));
  } catch {
    return false;
  }
}

function PlayerModal({ media, onClose }: { media: Media; onClose: () => void }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const url = getEmbedUrl(media);

  useEffect(() => {
    saveToHistory(media);
  }, [media]);

  useEffect(() => {
    const origOpen = window.open;
    window.open = (urlArg?: string | URL, ...rest: any[]) => {
      const urlStr = urlArg ? String(urlArg) : "";
      if (isBlockedUrl(urlStr)) return null;
      return origOpen(urlArg as any, ...rest);
    };
    return () => { window.open = origOpen; };
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data && typeof e.data === "string" && isBlockedUrl(e.data)) return;
      if (e.data && typeof e.data === "object" && e.data.url && isBlockedUrl(e.data.url)) return;
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

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

  const backdrop = media.backdrop_path
    ? `${TMDB_BACKDROP}${media.backdrop_path}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-black to-transparent absolute top-0 left-0 right-0 z-10"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold truncate text-sm">{getTitle(media)}</p>
            <p className="text-white/40 text-xs">{getYear(media)} · {media.media_type === "tv" ? "TV Series" : "Movie"}</p>
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

        {/* Iframe */}
        <div className="relative w-full" style={{ paddingBottom: "56.25%", minHeight: 300 }}>
          {backdrop && (
            <img
              src={backdrop}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
          )}
          <iframe
            ref={iframeRef}
            src={url}
            title={getTitle(media)}
            className="absolute inset-0 w-full h-full border-0"
            allowFullScreen
            allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
            data-testid="iframe-player"
          />
        </div>

        {/* Info strip */}
        <div className="px-4 py-3 bg-black/80 border-t border-white/5 flex items-start gap-3">
          {media.poster_path && (
            <img
              src={`${TMDB_IMG}${media.poster_path}`}
              alt=""
              className="w-10 h-15 rounded-lg object-cover flex-shrink-0 hidden sm:block"
              style={{ height: "60px" }}
            />
          )}
          <div className="flex-1 min-w-0">
            {media.overview && (
              <p className="text-white/50 text-xs line-clamp-2 leading-relaxed">{media.overview}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {media.vote_average > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-yellow-400">
                  <Star className="w-3 h-3 fill-current" />
                  {media.vote_average.toFixed(1)}
                </span>
              )}
              <span className="text-[10px] text-white/30">Powered by bCine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MoviesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<Media | null>(null);
  const [continueWatching, setContinueWatching] = useState<ContinueItem[]>([]);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    try {
      const items: ContinueItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setContinueWatching(items.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch {}
  }, [selected]);

  const { data: trending = [], isLoading: loadingTrending } = useQuery<Media[]>({
    queryKey: ["/api/movies/trending"],
    enabled: !debouncedSearch,
  });

  const { data: searchResults = [], isLoading: loadingSearch } = useQuery<Media[]>({
    queryKey: ["/api/movies/search", debouncedSearch],
    enabled: !!debouncedSearch,
    queryFn: async () => {
      const res = await fetch(`/api/movies/search/${encodeURIComponent(debouncedSearch)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
  });

  const displayList = debouncedSearch ? searchResults : trending;
  const isLoading = debouncedSearch ? loadingSearch : loadingTrending;

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
      {/* Hero Header */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 flex-1">
            <Film className="w-6 h-6 text-primary flex-shrink-0" />
            <div>
              <h1 className="text-xl font-black tracking-wide text-white">Movies</h1>
              <p className="text-[11px] text-white/30 tracking-wider">Powered by bCine</p>
            </div>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              data-testid="input-movie-search"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search movies & TV shows..."
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

        {/* Section header */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            {debouncedSearch ? (
              <>
                <Search className="w-4 h-4 text-primary" />
                <h2 className="text-base font-bold text-white tracking-wide">
                  Results for <span className="text-primary">"{debouncedSearch}"</span>
                </h2>
              </>
            ) : (
              <>
                <Star className="w-4 h-4 text-yellow-400" />
                <h2 className="text-base font-bold text-white tracking-wide">Trending Today</h2>
              </>
            )}
            {!isLoading && (
              <span className="text-xs text-white/30 ml-1">
                {displayList.length} title{displayList.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-white/5 border border-white/5 overflow-hidden animate-pulse">
                  <div className="aspect-[2/3] bg-white/10" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-white/10 rounded-full w-4/5" />
                    <div className="h-2.5 bg-white/5 rounded-full w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-white/30">
              <Film className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-base font-semibold">No results found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {displayList.map(m => (
                <MediaCard key={`${m.id}-${m.media_type}`} m={m} onClick={() => setSelected(m)} />
              ))}
            </div>
          )}
        </section>
      </div>

      {selected && (
        <PlayerModal media={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
