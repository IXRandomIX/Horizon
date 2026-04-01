import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Volume2, VolumeX, Play, Square, ExternalLink, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Sound {
  id: string;
  name: string;
  sound: string;
  color: string;
  image: string | null;
  tags: string;
  source: string;
  sourceUrl: string;
}

interface SoundResponse {
  sounds: Sound[];
  next: boolean;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function SoundButton({ sound, isMuted }: { sound: Sound; isMuted: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = useCallback(() => {
    if (playing) {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      setPlaying(false);
      return;
    }
    setLoading(true);
    const proxyUrl = `/api/soundboard/audio?url=${encodeURIComponent(sound.sound)}`;
    const audio = new Audio(proxyUrl);
    audio.muted = isMuted;
    audioRef.current = audio;
    audio.oncanplaythrough = () => setLoading(false);
    audio.onended = () => { setPlaying(false); setLoading(false); };
    audio.onerror = () => { setPlaying(false); setLoading(false); };
    audio.play().then(() => setPlaying(true)).catch(() => { setPlaying(false); setLoading(false); });
  }, [playing, sound.sound, isMuted]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  const bg = sound.color || "#7c3aed";

  return (
    <div
      data-testid={`card-sound-${sound.id}`}
      className="group relative rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col"
      onClick={toggle}
      style={{ borderColor: playing ? bg : undefined }}
    >
      {sound.image && (
        <div className="w-full aspect-video overflow-hidden">
          <img src={`/api/soundboard/image?url=${encodeURIComponent(sound.image)}`} alt={sound.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
        </div>
      )}
      <div className="flex-1 flex flex-col gap-2 p-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: bg + "33", border: `1px solid ${bg}55` }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: bg }} />
          ) : playing ? (
            <Square className="w-3.5 h-3.5" style={{ color: bg }} />
          ) : (
            <Play className="w-3.5 h-3.5" style={{ color: bg }} />
          )}
        </div>
        <p className="text-white text-xs font-semibold leading-tight line-clamp-2 flex-1">{sound.name}</p>
        {sound.tags && (
          <p className="text-white/30 text-[10px] truncate">{sound.tags}</p>
        )}
        <div className="flex items-center justify-between mt-1">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: bg + "22", color: bg }}
          >
            {sound.source}
          </span>
          <a
            href={sound.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`link-sound-source-${sound.id}`}
            className="text-white/20 hover:text-white/60 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
      {playing && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 animate-pulse" style={{ backgroundColor: bg }} />
      )}
    </div>
  );
}

export default function SoundboardPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const endpoint = debouncedSearch.trim()
    ? `/api/soundboard/search?q=${encodeURIComponent(debouncedSearch.trim())}&page=${page}`
    : `/api/soundboard/popular?page=${page}`;

  const { data, isLoading, isError } = useQuery<SoundResponse>({
    queryKey: ["soundboard", debouncedSearch.trim(), page],
    queryFn: () => fetch(endpoint).then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
            <Volume2 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">Soundboard</h1>
            <p className="text-white/40 text-xs mt-0.5">1,800+ sounds from MyInstants</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              data-testid="button-toggle-mute"
              onClick={() => setIsMuted((m) => !m)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              title={isMuted ? "Unmute" : "Mute all"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <Input
            data-testid="input-soundboard-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 1,800+ sounds… (vine boom, bruh, fart, wow…)"
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-violet-500/50"
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-xs"
              onClick={() => setSearch("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading && (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
          </div>
        )}
        {isError && (
          <div className="flex items-center justify-center h-48">
            <p className="text-white/40 text-sm">Failed to load sounds. Try again.</p>
          </div>
        )}
        {!isLoading && !isError && data?.sounds.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <p className="text-white/40 text-sm">No sounds found for "{debouncedSearch}"</p>
            <button className="text-violet-400 text-xs hover:underline" onClick={() => setSearch("")}>Clear search</button>
          </div>
        )}
        {!isLoading && data && data.sounds.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {data.sounds.map((sound) => (
              <SoundButton key={sound.id} sound={sound} isMuted={isMuted} />
            ))}
          </div>
        )}
      </div>

      {data && (data.sounds.length > 0 || page > 1) && (
        <div className="flex-shrink-0 flex items-center justify-center gap-3 px-6 py-3 border-t border-white/5 bg-black/10">
          <Button
            data-testid="button-soundboard-prev"
            variant="outline"
            size="sm"
            onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
            disabled={page === 1 || isLoading}
            className="border-white/10 text-white/60 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Prev
          </Button>
          <span className="text-white/40 text-sm">Page {page}</span>
          <Button
            data-testid="button-soundboard-next"
            variant="outline"
            size="sm"
            onClick={() => { setPage((p) => p + 1); window.scrollTo(0, 0); }}
            disabled={!data.next || isLoading}
            className="border-white/10 text-white/60 hover:text-white hover:bg-white/10"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
