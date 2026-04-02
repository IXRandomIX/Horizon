import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Volume2, VolumeX, Play, Square, ExternalLink, Loader2,
  ChevronLeft, ChevronRight, ListMusic, Plus, Check, Download,
  Trash2, X, GripVertical, PlayCircle,
} from "lucide-react";
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

const STORAGE_KEY = "horizon_sound_list";

function useSoundList() {
  const [list, setList] = useState<Sound[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, [list]);

  const add = useCallback((sound: Sound) => {
    setList((prev) => prev.find((s) => s.id === sound.id) ? prev : [...prev, sound]);
  }, []);

  const remove = useCallback((id: string) => {
    setList((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clear = useCallback(() => setList([]), []);

  const has = useCallback((id: string) => list.some((s) => s.id === id), [list]);

  return { list, add, remove, clear, has };
}

function downloadSound(sound: Sound) {
  const proxyUrl = `/api/soundboard/audio?url=${encodeURIComponent(sound.sound)}`;
  const a = document.createElement("a");
  a.href = proxyUrl;
  a.download = sound.name.replace(/[^a-z0-9\s-]/gi, "_") + ".mp3";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function SoundButton({
  sound, isMuted, onAdd, inList,
}: {
  sound: Sound;
  isMuted: boolean;
  onAdd: (s: Sound) => void;
  inList: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    downloadSound(sound);
    setTimeout(() => setDownloading(false), 1500);
  }, [sound]);

  const handleAdd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd(sound);
  }, [sound, onAdd]);

  const bg = sound.color || "#7c3aed";

  return (
    <div
      data-testid={`card-sound-${sound.id}`}
      className="group relative rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200 overflow-hidden flex flex-col"
      style={{ borderColor: playing ? bg : undefined }}
    >
      {sound.image && (
        <div className="w-full aspect-video overflow-hidden cursor-pointer" onClick={toggle}>
          <img
            src={`/api/soundboard/image?url=${encodeURIComponent(sound.image)}`}
            alt={sound.name}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
          />
        </div>
      )}

      <div className="flex-1 flex flex-col gap-2 p-3">
        <div className="flex items-start gap-2">
          <button
            data-testid={`button-play-sound-${sound.id}`}
            onClick={toggle}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80 cursor-pointer"
            style={{ backgroundColor: bg + "33", border: `1px solid ${bg}55` }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: bg }} />
            ) : playing ? (
              <Square className="w-3.5 h-3.5" style={{ color: bg }} />
            ) : (
              <Play className="w-3.5 h-3.5" style={{ color: bg }} />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold leading-tight line-clamp-2 cursor-pointer" onClick={toggle}>{sound.name}</p>
          </div>
        </div>

        {sound.tags && (
          <p className="text-white/30 text-[10px] truncate">{sound.tags}</p>
        )}

        <div className="flex items-center justify-between mt-1 gap-1">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ backgroundColor: bg + "22", color: bg }}
          >
            {sound.source}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <button
              data-testid={`button-add-to-list-${sound.id}`}
              onClick={handleAdd}
              title={inList ? "Already in Sound List" : "Add to Sound List"}
              className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                inList
                  ? "text-violet-400 hover:text-violet-300"
                  : "text-white/20 hover:text-violet-400"
              }`}
            >
              {inList ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            </button>
            <button
              data-testid={`button-download-sound-${sound.id}`}
              onClick={handleDownload}
              title="Download sound"
              className="w-6 h-6 flex items-center justify-center rounded text-white/20 hover:text-blue-400 transition-colors"
            >
              {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            </button>
            <a
              href={sound.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`link-sound-source-${sound.id}`}
              className="w-6 h-6 flex items-center justify-center rounded text-white/20 hover:text-white/60 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {playing && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 animate-pulse" style={{ backgroundColor: bg }} />
      )}
    </div>
  );
}

function SoundListItem({
  sound, isMuted, onRemove,
}: {
  sound: Sound;
  isMuted: boolean;
  onRemove: (id: string) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
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

  const handleDownload = useCallback(() => {
    setDownloading(true);
    downloadSound(sound);
    setTimeout(() => setDownloading(false), 1500);
  }, [sound]);

  const bg = sound.color || "#7c3aed";

  return (
    <div
      data-testid={`list-item-sound-${sound.id}`}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/8 transition-colors group"
      style={{ borderLeft: playing ? `2px solid ${bg}` : "2px solid transparent" }}
    >
      <GripVertical className="w-3.5 h-3.5 text-white/10 flex-shrink-0" />
      <button
        onClick={toggle}
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80"
        style={{ backgroundColor: bg + "33", border: `1px solid ${bg}55` }}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: bg }} />
        ) : playing ? (
          <Square className="w-3 h-3" style={{ color: bg }} />
        ) : (
          <Play className="w-3 h-3" style={{ color: bg }} />
        )}
      </button>
      <p className="flex-1 text-white text-xs font-medium truncate min-w-0">{sound.name}</p>
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: bg + "22", color: bg }}>
        {sound.source}
      </span>
      <button
        onClick={handleDownload}
        title="Download"
        className="w-6 h-6 flex items-center justify-center rounded text-white/20 hover:text-blue-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
      >
        {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
      </button>
      <button
        data-testid={`button-remove-from-list-${sound.id}`}
        onClick={() => onRemove(sound.id)}
        title="Remove from list"
        className="w-6 h-6 flex items-center justify-center rounded text-white/20 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

function SoundListPanel({
  list, isMuted, onRemove, onClear, onClose,
}: {
  list: Sound[];
  isMuted: boolean;
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full border-l border-white/10 bg-black/40 backdrop-blur-sm w-72 flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-violet-400" />
          <span className="text-white font-semibold text-sm">Sound List</span>
          {list.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-600/30 text-violet-300">
              {list.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {list.length > 0 && (
            <button
              data-testid="button-clear-sound-list"
              onClick={onClear}
              title="Clear all"
              className="w-6 h-6 flex items-center justify-center rounded text-white/20 hover:text-red-400 transition-colors text-[10px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            data-testid="button-close-sound-list"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded text-white/30 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 px-4 text-center">
            <PlayCircle className="w-8 h-8 text-white/10" />
            <p className="text-white/30 text-xs leading-relaxed">
              Your Sound List is empty.<br />Hit <Plus className="w-3 h-3 inline" /> on any sound to add it here.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {list.map((sound) => (
              <SoundListItem
                key={sound.id}
                sound={sound}
                isMuted={isMuted}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </div>

      {list.length > 0 && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-white/10 bg-black/20">
          <p className="text-white/30 text-[10px] text-center">{list.length} sound{list.length !== 1 ? "s" : ""} saved · persists between sessions</p>
        </div>
      )}
    </div>
  );
}

export default function SoundboardPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showList, setShowList] = useState(false);
  const debouncedSearch = useDebounce(search, 400);
  const { list, add, remove, clear, has } = useSoundList();

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
    <div className="flex h-full bg-background overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-3 mb-3">
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

          <div className="flex items-center gap-2 mb-3">
            <button
              data-testid="button-toggle-sound-list"
              onClick={() => setShowList((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                showList
                  ? "bg-violet-600/30 border-violet-500/50 text-violet-300"
                  : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              Sound List
              {list.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${showList ? "bg-violet-500/40 text-violet-200" : "bg-white/10 text-white/40"}`}>
                  {list.length}
                </span>
              )}
            </button>
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
                <SoundButton
                  key={sound.id}
                  sound={sound}
                  isMuted={isMuted}
                  onAdd={add}
                  inList={has(sound.id)}
                />
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

      {showList && (
        <SoundListPanel
          list={list}
          isMuted={isMuted}
          onRemove={remove}
          onClear={clear}
          onClose={() => setShowList(false)}
        />
      )}
    </div>
  );
}
