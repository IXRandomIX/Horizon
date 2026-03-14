import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronUp, ChevronDown, X, Search, Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Download, Plus, Trash2, Music2, ListMusic, Clock,
  Users, Loader2, MoreHorizontal, Check
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface SCTrack {
  id: number;
  title: string;
  permalink_url: string;
  duration: number;
  artwork_url: string | null;
  user: { id: number; username: string; avatar_url: string | null };
  playback_count?: number;
}

interface Playlist {
  id: string;
  name: string;
  tracks: SCTrack[];
  createdAt: number;
}

interface DownloadedTrack {
  track: SCTrack;
  downloadedAt: number;
}

interface ArtistStat {
  userId: number;
  username: string;
  avatar_url: string | null;
  playCount: number;
}

const LS_PLAYLISTS = "horizon_music_playlists";
const LS_DOWNLOADS = "horizon_music_downloads";
const LS_HISTORY = "horizon_music_history";

function loadLS<T>(key: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? def; } catch { return def; }
}
function saveLS(key: string, val: any) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function fmt(ms: number) {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}
function fmtSec(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}
function artwork(track: SCTrack) {
  return track.artwork_url ? track.artwork_url.replace("-large", "-t200x200") : null;
}

function TrackRow({
  track, onPlay, isActive, isPlaying, onDownload, downloading, onAddToPlaylist,
}: {
  track: SCTrack; onPlay: () => void; isActive: boolean; isPlaying: boolean;
  onDownload: () => void; downloading: boolean; onAddToPlaylist: () => void;
}) {
  const art = artwork(track);
  return (
    <div
      data-testid={`row-track-${track.id}`}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer group transition-colors ${isActive ? "bg-primary/20 border border-primary/30" : "hover:bg-white/5 border border-transparent"}`}
    >
      <button onClick={onPlay} className="relative flex-shrink-0 w-10 h-10 rounded-md overflow-hidden bg-white/10 flex items-center justify-center">
        {art ? <img src={art} alt="" className="w-full h-full object-cover" /> : <Music2 className="w-4 h-4 text-white/40" />}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          {isActive && isPlaying ? <Pause className="w-4 h-4 text-white fill-white" /> : <Play className="w-4 h-4 text-white fill-white" />}
        </div>
      </button>
      <div className="flex-1 min-w-0" onClick={onPlay}>
        <p className={`text-xs font-semibold truncate leading-snug ${isActive ? "text-primary" : "text-white"}`}>{track.title}</p>
        <p className="text-[10px] text-white/40 truncate">{track.user.username}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button data-testid={`button-add-playlist-${track.id}`} onClick={onAddToPlaylist} className="w-6 h-6 flex items-center justify-center rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors">
          <Plus className="w-3 h-3" />
        </button>
        <button data-testid={`button-download-${track.id}`} onClick={onDownload} disabled={downloading} className="w-6 h-6 flex items-center justify-center rounded text-white/40 hover:text-green-400 hover:bg-white/10 transition-colors">
          {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
        </button>
      </div>
      <span className="text-[10px] text-white/30 flex-shrink-0 ml-1">{fmt(track.duration)}</span>
    </div>
  );
}

export default function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"search" | "new" | "library" | "downloaded" | "artists">("search");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentTrack, setCurrentTrack] = useState<SCTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDur, setAudioDur] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [queue, setQueue] = useState<SCTrack[]>([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadLS(LS_PLAYLISTS, []));
  const [downloads, setDownloads] = useState<DownloadedTrack[]>(() => loadLS(LS_DOWNLOADS, []));
  const [history, setHistory] = useState<SCTrack[]>(() => loadLS(LS_HISTORY, []));
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<SCTrack | null>(null);
  const [openPlaylistId, setOpenPlaylistId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: searchResults = [], isLoading: searchLoading } = useQuery<SCTrack[]>({
    queryKey: ["/api/music/search", debouncedSearch],
    enabled: !!debouncedSearch,
    queryFn: async () => {
      const r = await fetch(`/api/music/search?q=${encodeURIComponent(debouncedSearch)}`, { credentials: "include" });
      if (!r.ok) throw new Error("Search failed");
      return r.json();
    },
  });

  const { data: newTracks = [], isLoading: newLoading } = useQuery<SCTrack[]>({
    queryKey: ["/api/music/new"],
    enabled: tab === "new" && isOpen,
  });

  const artistStats: ArtistStat[] = (() => {
    const map = new Map<number, ArtistStat>();
    for (const t of history) {
      const ex = map.get(t.user.id);
      if (ex) ex.playCount++;
      else map.set(t.user.id, { userId: t.user.id, username: t.user.username, avatar_url: t.user.avatar_url, playCount: 1 });
    }
    return [...map.values()].sort((a, b) => b.playCount - a.playCount);
  })();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = `/api/music/stream/${currentTrack.id}`;
    audio.load();
    audio.play().catch(() => {});
    setIsPlaying(true);
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => { setCurrentTime(audio.currentTime); setProgress(audio.duration ? audio.currentTime / audio.duration : 0); };
    const onDur = () => setAudioDur(audio.duration || 0);
    const onEnd = () => handleNextRef.current?.();
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDur);
    audio.addEventListener("ended", onEnd);
    return () => { audio.removeEventListener("timeupdate", onTime); audio.removeEventListener("durationchange", onDur); audio.removeEventListener("ended", onEnd); };
  }, []);

  const handleNext = useCallback(() => {
    if (!queue.length) return;
    const ni = (queueIdx + 1) % queue.length;
    setQueueIdx(ni);
    setCurrentTrack(queue[ni]);
  }, [queue, queueIdx]);
  const handleNextRef = useRef(handleNext);
  useEffect(() => { handleNextRef.current = handleNext; }, [handleNext]);

  const handlePrev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; return; }
    if (!queue.length) return;
    const pi = (queueIdx - 1 + queue.length) % queue.length;
    setQueueIdx(pi);
    setCurrentTrack(queue[pi]);
  }, [queue, queueIdx]);

  const playTrack = useCallback((track: SCTrack, list?: SCTrack[]) => {
    const tl = list || [track];
    const idx = tl.findIndex(t => t.id === track.id);
    setQueue(tl);
    setQueueIdx(idx >= 0 ? idx : 0);
    setCurrentTrack(track);
    setHistory(prev => { const next = [track, ...prev.filter(t => t.id !== track.id)].slice(0, 300); saveLS(LS_HISTORY, next); return next; });
  }, []);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  };

  const handleDownload = async (track: SCTrack) => {
    if (downloadingId === track.id) return;
    setDownloadingId(track.id);
    try {
      const a = document.createElement("a");
      a.href = `/api/music/download/${track.id}?title=${encodeURIComponent(track.title)}`;
      a.download = `${track.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloads(prev => { const next = [{ track, downloadedAt: Date.now() }, ...prev.filter(d => d.track.id !== track.id)]; saveLS(LS_DOWNLOADS, next); return next; });
      toast({ title: "Download started", description: track.title });
    } catch { toast({ title: "Download failed", variant: "destructive" }); }
    finally { setDownloadingId(null); }
  };

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const pl: Playlist = { id: crypto.randomUUID(), name: newPlaylistName.trim(), tracks: [], createdAt: Date.now() };
    setPlaylists(prev => { const next = [pl, ...prev]; saveLS(LS_PLAYLISTS, next); return next; });
    setNewPlaylistName(""); setShowNewPlaylist(false);
    toast({ title: "Playlist created", description: pl.name });
  };

  const addToPlaylist = (plId: string, track: SCTrack) => {
    setPlaylists(prev => {
      const next = prev.map(pl => pl.id !== plId ? pl : pl.tracks.find(t => t.id === track.id) ? pl : { ...pl, tracks: [...pl.tracks, track] });
      saveLS(LS_PLAYLISTS, next); return next;
    });
    setAddToPlaylistTrack(null);
    toast({ title: "Added to playlist" });
  };

  const removeFromPlaylist = (plId: string, trackId: number) => {
    setPlaylists(prev => { const next = prev.map(pl => pl.id !== plId ? pl : { ...pl, tracks: pl.tracks.filter(t => t.id !== trackId) }); saveLS(LS_PLAYLISTS, next); return next; });
  };

  const art = currentTrack ? artwork(currentTrack) : null;

  const TABS = [
    { key: "search", label: "Search", icon: Search },
    { key: "new", label: "New", icon: Clock },
    { key: "library", label: "Library", icon: ListMusic },
    { key: "downloaded", label: "Downloaded", icon: Download },
    { key: "artists", label: "Artists", icon: Users },
  ] as const;

  return (
    <>
      <audio ref={audioRef} preload="auto" />

      {/* Add to playlist modal */}
      {addToPlaylistTrack && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60" onClick={() => setAddToPlaylistTrack(null)}>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4 w-72 shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-bold text-white mb-3">Add to Playlist</p>
            <p className="text-xs text-white/50 mb-3 truncate">{addToPlaylistTrack.title}</p>
            {playlists.length === 0 && <p className="text-xs text-white/30 mb-3">No playlists yet. Create one first.</p>}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {playlists.map(pl => (
                <button key={pl.id} onClick={() => addToPlaylist(pl.id, addToPlaylistTrack)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-white transition-colors text-left">
                  <span className="truncate">{pl.name}</span>
                  {pl.tracks.find(t => t.id === addToPlaylistTrack.id) && <Check className="w-3 h-3 text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
            <button onClick={() => setAddToPlaylistTrack(null)} className="mt-3 w-full text-xs text-white/40 hover:text-white py-1 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Floating player panel */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2">
        {isOpen && (
          <div
            data-testid="panel-music-player"
            className="w-[360px] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "560px" }}
          >
            {/* Now Playing */}
            <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-white/8 bg-black/60">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                  {art ? <img src={art} alt="" className="w-full h-full object-cover" /> : <Music2 className="w-5 h-5 text-white/30" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{currentTrack ? currentTrack.title : "Nothing playing"}</p>
                  <p className="text-[10px] text-white/40 truncate">{currentTrack?.user.username || "—"}</p>
                </div>
                <button data-testid="button-close-music" onClick={() => setIsOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Seek bar */}
              <div data-testid="seekbar-music" onClick={handleSeek} className="relative h-1.5 bg-white/10 rounded-full cursor-pointer mb-2 group">
                <div className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2" style={{ left: `${progress * 100}%` }} />
              </div>
              <div className="flex justify-between text-[9px] text-white/30 mb-2">
                <span>{fmtSec(currentTime)}</span>
                <span>{audioDur ? fmtSec(audioDur) : currentTrack ? fmt(currentTrack.duration) : "0:00"}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button data-testid="button-mute" onClick={() => setIsMuted(m => !m)} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                    {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <input data-testid="slider-volume" type="range" min={0} max={1} step={0.02} value={isMuted ? 0 : volume} onChange={e => { setVolume(+e.target.value); setIsMuted(false); }} className="w-16 h-1 accent-primary cursor-pointer" />
                </div>
                <div className="flex items-center gap-2">
                  <button data-testid="button-prev" onClick={handlePrev} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                    <SkipBack className="w-4 h-4 fill-current" />
                  </button>
                  <button data-testid="button-play-pause" onClick={() => setIsPlaying(p => !p)} className="w-9 h-9 flex items-center justify-center rounded-full bg-primary hover:bg-primary/80 text-white transition-colors">
                    {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>
                  <button data-testid="button-next" onClick={handleNext} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                    <SkipForward className="w-4 h-4 fill-current" />
                  </button>
                </div>
                <div className="w-24" />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 flex border-b border-white/8 bg-black/40">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  data-testid={`tab-music-${key}`}
                  onClick={() => setTab(key)}
                  className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[9px] font-semibold uppercase tracking-wider transition-colors ${tab === key ? "text-primary border-b-2 border-primary" : "text-white/30 hover:text-white/60 border-b-2 border-transparent"}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: "260px" }}>

              {/* Search Tab */}
              {tab === "search" && (
                <div className="p-3 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <Input
                      data-testid="input-music-search"
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      placeholder="Search songs, artists..."
                      className="pl-8 h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-primary/40 rounded-lg"
                    />
                    {searchInput && (
                      <button onClick={() => setSearchInput("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {searchLoading && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>}
                  {!debouncedSearch && !searchLoading && (
                    <div className="flex flex-col items-center justify-center py-8 text-white/20">
                      <Music2 className="w-8 h-8 mb-2" />
                      <p className="text-xs">Search for any song</p>
                    </div>
                  )}
                  {searchResults.map(t => (
                    <TrackRow key={t.id} track={t} onPlay={() => playTrack(t, searchResults)} isActive={currentTrack?.id === t.id} isPlaying={isPlaying} onDownload={() => handleDownload(t)} downloading={downloadingId === t.id} onAddToPlaylist={() => setAddToPlaylistTrack(t)} />
                  ))}
                  {debouncedSearch && !searchLoading && searchResults.length === 0 && (
                    <p className="text-center text-xs text-white/30 py-6">No results found</p>
                  )}
                </div>
              )}

              {/* New Tab */}
              {tab === "new" && (
                <div className="p-3 space-y-1">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-2 px-1">Trending on SoundCloud</p>
                  {newLoading && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>}
                  {newTracks.map(t => (
                    <TrackRow key={t.id} track={t} onPlay={() => playTrack(t, newTracks)} isActive={currentTrack?.id === t.id} isPlaying={isPlaying} onDownload={() => handleDownload(t)} downloading={downloadingId === t.id} onAddToPlaylist={() => setAddToPlaylistTrack(t)} />
                  ))}
                </div>
              )}

              {/* Library Tab */}
              {tab === "library" && (
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Your Playlists</p>
                    <button data-testid="button-new-playlist" onClick={() => setShowNewPlaylist(v => !v)} className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-semibold transition-colors">
                      <Plus className="w-3 h-3" /> New
                    </button>
                  </div>
                  {showNewPlaylist && (
                    <div className="flex gap-2 mb-3">
                      <Input
                        data-testid="input-playlist-name"
                        value={newPlaylistName}
                        onChange={e => setNewPlaylistName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && createPlaylist()}
                        placeholder="Playlist name..."
                        className="h-7 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-primary/40 rounded-lg"
                        autoFocus
                      />
                      <button data-testid="button-create-playlist" onClick={createPlaylist} className="px-3 h-7 rounded-lg bg-primary hover:bg-primary/80 text-white text-xs font-bold transition-colors">Create</button>
                    </div>
                  )}
                  {playlists.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-white/20">
                      <ListMusic className="w-8 h-8 mb-2" />
                      <p className="text-xs">No playlists yet</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {playlists.map(pl => (
                      <div key={pl.id} className="border border-white/8 rounded-xl overflow-hidden">
                        <button
                          data-testid={`button-playlist-${pl.id}`}
                          onClick={() => setOpenPlaylistId(openPlaylistId === pl.id ? null : pl.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <ListMusic className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{pl.name}</p>
                            <p className="text-[10px] text-white/40">{pl.tracks.length} track{pl.tracks.length !== 1 ? "s" : ""}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {pl.tracks.length > 0 && (
                              <button data-testid={`button-play-playlist-${pl.id}`} onClick={e => { e.stopPropagation(); playTrack(pl.tracks[0], pl.tracks); }} className="w-6 h-6 flex items-center justify-center rounded bg-primary/20 hover:bg-primary/40 transition-colors">
                                <Play className="w-3 h-3 text-primary fill-current" />
                              </button>
                            )}
                            <button data-testid={`button-delete-playlist-${pl.id}`} onClick={e => { e.stopPropagation(); setPlaylists(prev => { const n = prev.filter(p => p.id !== pl.id); saveLS(LS_PLAYLISTS, n); return n; }); }} className="w-6 h-6 flex items-center justify-center rounded text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </button>
                        {openPlaylistId === pl.id && (
                          <div className="border-t border-white/5">
                            {pl.tracks.length === 0 && <p className="text-[10px] text-white/30 px-4 py-3">No tracks yet. Add some from Search or New.</p>}
                            {pl.tracks.map(t => (
                              <div key={t.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 group">
                                <button onClick={() => playTrack(t, pl.tracks)} className="flex-1 min-w-0 flex items-center gap-2 text-left">
                                  <span className="text-xs text-white/80 truncate">{t.title}</span>
                                </button>
                                <button onClick={() => removeFromPlaylist(pl.id, t.id)} className="w-5 h-5 flex items-center justify-center text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Downloaded Tab */}
              {tab === "downloaded" && (
                <div className="p-3">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-2 px-1">Downloaded Tracks</p>
                  {downloads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-white/20">
                      <Download className="w-8 h-8 mb-2" />
                      <p className="text-xs">No downloads yet</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    {downloads.map(({ track: t, downloadedAt }) => (
                      <div key={t.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 group transition-colors">
                        <button onClick={() => playTrack(t)} className="relative flex-shrink-0 w-9 h-9 rounded-md overflow-hidden bg-white/10 flex items-center justify-center">
                          {artwork(t) ? <img src={artwork(t)!} alt="" className="w-full h-full object-cover" /> : <Music2 className="w-4 h-4 text-white/40" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{t.title}</p>
                          <p className="text-[10px] text-white/40">{t.user.username} · {new Date(downloadedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleDownload(t)} disabled={downloadingId === t.id} className="w-6 h-6 flex items-center justify-center rounded text-green-400/60 hover:text-green-400 hover:bg-white/10 transition-colors" title="Re-download">
                            {downloadingId === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                          </button>
                          <button onClick={() => setDownloads(prev => { const n = prev.filter(d => d.track.id !== t.id); saveLS(LS_DOWNLOADS, n); return n; })} className="w-6 h-6 flex items-center justify-center rounded text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Artists Tab */}
              {tab === "artists" && (
                <div className="p-3">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-2 px-1">Most Listened Artists</p>
                  {artistStats.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-white/20">
                      <Users className="w-8 h-8 mb-2" />
                      <p className="text-xs">Play some music to see artists</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    {artistStats.slice(0, 30).map((a, i) => (
                      <div key={a.userId} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                        <span className="text-[10px] text-white/20 w-4 text-right flex-shrink-0">{i + 1}</span>
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                          {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-3.5 h-3.5 text-white/30" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{a.username}</p>
                        </div>
                        <span className="text-[10px] text-white/30 flex-shrink-0">{a.playCount} play{a.playCount !== 1 ? "s" : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating toggle button */}
        <button
          data-testid="button-music-player-toggle"
          onClick={() => setIsOpen(v => !v)}
          className="w-12 h-12 rounded-full bg-primary hover:bg-primary/80 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>
      </div>
    </>
  );
}
