import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronUp, ChevronDown, X, Search, Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Download, Plus, Trash2, Music2, ListMusic, Clock,
  Users, Loader2, Check, TrendingUp, Flame, Repeat, Upload, Lock, Globe
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth";

const GENRES = [
  { id: "all-music", label: "All" },
  { id: "hiphoprap", label: "Hip-Hop" },
  { id: "pop", label: "Pop" },
  { id: "danceedm", label: "Dance & EDM" },
  { id: "rbsoul", label: "R&B & Soul" },
  { id: "rock", label: "Rock" },
  { id: "electronic", label: "Electronic" },
  { id: "house", label: "House" },
  { id: "trap", label: "Trap" },
  { id: "indie", label: "Indie" },
  { id: "alternativerock", label: "Alt Rock" },
  { id: "dubstep", label: "Dubstep" },
  { id: "deephouse", label: "Deep House" },
  { id: "techno", label: "Techno" },
  { id: "trance", label: "Trance" },
  { id: "drumnbass", label: "Drum & Bass" },
  { id: "ambient", label: "Ambient" },
  { id: "classical", label: "Classical" },
  { id: "jazzblues", label: "Jazz" },
  { id: "country", label: "Country" },
  { id: "reggae", label: "Reggae" },
  { id: "latin", label: "Latin" },
  { id: "metal", label: "Metal" },
  { id: "disco", label: "Disco" },
  { id: "dancehall", label: "Dancehall" },
  { id: "triphop", label: "Trip Hop" },
  { id: "piano", label: "Piano" },
  { id: "folksingersongwriter", label: "Folk" },
  { id: "soundtracks", label: "Soundtracks" },
  { id: "world", label: "World" },
];

interface SCTrack {
  id: number;
  title: string;
  permalink_url: string;
  duration: number;
  artwork_url: string | null;
  user: { id: number; username: string; avatar_url: string | null };
  playback_count?: number;
  sourceUrl?: string;
}

interface UserTrack {
  id: number;
  username: string;
  name: string;
  filePath: string;
  fileType: string;
  isPublic: boolean;
  createdAt: string;
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
function slimTrack(t: SCTrack): SCTrack {
  return {
    id: t.id,
    title: t.title,
    artwork_url: t.artwork_url,
    duration: t.duration,
    permalink_url: t.permalink_url,
    sourceUrl: t.sourceUrl,
    user: t.user ? { id: t.user.id, username: t.user.username, avatar_url: t.user.avatar_url } : t.user,
  } as SCTrack;
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
        <p className="text-[10px] text-white/40 truncate">{track.user?.username ?? "Unknown Artist"}</p>
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
  const [tab, setTab] = useState<"search" | "new" | "library" | "downloaded" | "artists" | "upload">("search");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentTrack, setCurrentTrack] = useState<SCTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDur, setAudioDur] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [queue, setQueue] = useState<SCTrack[]>([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const raw = loadLS<Playlist[]>(LS_PLAYLISTS, []);
    const slim = raw.map(pl => ({ ...pl, tracks: pl.tracks.filter(t => t && t.user).map(slimTrack) }));
    saveLS(LS_PLAYLISTS, slim);
    return slim;
  });
  const [downloads, setDownloads] = useState<DownloadedTrack[]>(() => {
    const raw = loadLS<DownloadedTrack[]>(LS_DOWNLOADS, []);
    const slim = raw.filter(d => d.track && d.track.user).map(d => ({ ...d, track: slimTrack(d.track) }));
    saveLS(LS_DOWNLOADS, slim);
    return slim;
  });
  const [history, setHistory] = useState<SCTrack[]>(() => {
    const raw = loadLS<SCTrack[]>(LS_HISTORY, []);
    const slim = raw.filter(t => t && t.user).slice(0, 100).map(slimTrack);
    saveLS(LS_HISTORY, slim);
    return slim;
  });
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<SCTrack | null>(null);
  const [openPlaylistId, setOpenPlaylistId] = useState<string | null>(null);
  const [newGenre, setNewGenre] = useState("all-music");
  const [newKind, setNewKind] = useState<"trending" | "top">("trending");

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadIsPublic, setUploadIsPublic] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
    queryKey: ["/api/music/new", newGenre, newKind],
    enabled: tab === "new" && isOpen,
    queryFn: async () => {
      const r = await fetch(`/api/music/new?genre=${newGenre}&kind=${newKind}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
  });

  const { data: userTracks = [], isLoading: tracksLoading } = useQuery<UserTrack[]>({
    queryKey: ["/api/user-tracks"],
    enabled: tab === "upload" && isOpen,
    queryFn: async () => {
      const r = await fetch("/api/user-tracks", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const r = await fetch("/api/user-tracks", { method: "POST", body: formData, credentials: "include" });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Upload failed"); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-tracks"] });
      setUploadFile(null);
      setUploadName("");
      toast({ title: "Uploaded successfully" });
    },
    onError: (e: any) => toast({ title: "Upload failed", description: e.message, variant: "destructive" }),
  });

  const deleteTrackMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/user-tracks/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok && r.status !== 204) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-tracks"] });
      toast({ title: "Track deleted" });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const handleUpload = () => {
    if (!uploadFile || !uploadName.trim()) return;
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("name", uploadName);
    fd.append("isPublic", String(uploadIsPublic));
    uploadMutation.mutate(fd);
  };

  const playUserTrack = (ut: UserTrack) => {
    const fakeTrack: SCTrack = {
      id: -(ut.id),
      title: ut.name,
      permalink_url: `/api/user-tracks/file/${ut.id}`,
      duration: 0,
      artwork_url: null,
      user: { id: 0, username: ut.username, avatar_url: null },
      sourceUrl: `/api/user-tracks/file/${ut.id}`,
    };
    playTrack(fakeTrack, [fakeTrack]);
  };

  const artistStats: ArtistStat[] = (() => {
    const map = new Map<number, ArtistStat>();
    for (const t of history) {
      if (!t.user) continue;
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
    if (!audio) return;
    audio.loop = isLooping;
  }, [isLooping]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.sourceUrl || `/api/music/stream/${currentTrack.id}`;
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
    setHistory(prev => { const next = [slimTrack(track), ...prev.filter(t => t.id !== track.id)].slice(0, 100); saveLS(LS_HISTORY, next); return next; });
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
      setDownloads(prev => { const next = [{ track: slimTrack(track), downloadedAt: Date.now() }, ...prev.filter(d => d.track.id !== track.id)]; saveLS(LS_DOWNLOADS, next); return next; });
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
      const slim = slimTrack(track);
      const next = prev.map(pl => pl.id !== plId ? pl : pl.tracks.find(t => t.id === track.id) ? pl : { ...pl, tracks: [...pl.tracks, slim] });
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
    { key: "upload", label: "Upload", icon: Upload },
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
                  <p className="text-[10px] text-white/40 truncate">{currentTrack?.user?.username || "—"}</p>
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
                <div className="flex items-center justify-end w-24">
                  <button
                    data-testid="button-loop"
                    onClick={() => setIsLooping(l => !l)}
                    title={isLooping ? "Loop on" : "Loop off"}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${isLooping ? "text-primary bg-primary/15 hover:bg-primary/25" : "text-white/40 hover:text-white hover:bg-white/10"}`}
                  >
                    <Repeat className="w-3.5 h-3.5" />
                  </button>
                </div>
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
                <div>
                  {/* Kind toggle + Genre pills - sticky */}
                  <div className="sticky top-0 z-10 bg-zinc-950 border-b border-white/5">
                    <div className="flex gap-1 px-3 pt-2.5 pb-1.5">
                      <button
                        data-testid="button-kind-trending"
                        onClick={() => setNewKind("trending")}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${newKind === "trending" ? "bg-primary text-white" : "bg-white/8 text-white/40 hover:text-white hover:bg-white/12"}`}
                      >
                        <Flame className="w-2.5 h-2.5" /> Trending
                      </button>
                      <button
                        data-testid="button-kind-top"
                        onClick={() => setNewKind("top")}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${newKind === "top" ? "bg-primary text-white" : "bg-white/8 text-white/40 hover:text-white hover:bg-white/12"}`}
                      >
                        <TrendingUp className="w-2.5 h-2.5" /> Top Charts
                      </button>
                    </div>
                    <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-none">
                      {GENRES.map(g => (
                        <button
                          key={g.id}
                          data-testid={`button-genre-${g.id}`}
                          onClick={() => setNewGenre(g.id)}
                          className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors whitespace-nowrap ${newGenre === g.id ? "bg-primary/30 text-primary border border-primary/40" : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-transparent"}`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Tracks list */}
                  <div className="p-2 space-y-0.5">
                    {newLoading && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>}
                    {!newLoading && newTracks.length === 0 && <p className="text-center text-xs text-white/30 py-6">No tracks found</p>}
                    {newTracks.map((t, i) => (
                      <div key={t.id} className="flex items-center gap-1">
                        <span className="text-[9px] text-white/15 w-4 text-right flex-shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <TrackRow track={t} onPlay={() => playTrack(t, newTracks)} isActive={currentTrack?.id === t.id} isPlaying={isPlaying} onDownload={() => handleDownload(t)} downloading={downloadingId === t.id} onAddToPlaylist={() => setAddToPlaylistTrack(t)} />
                        </div>
                      </div>
                    ))}
                  </div>
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
                          <p className="text-[10px] text-white/40">{t.user?.username ?? "Unknown"} · {new Date(downloadedAt).toLocaleDateString()}</p>
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

              {/* Upload Tab */}
              {tab === "upload" && (
                <div className="p-3 space-y-3">
                  {user ? (
                    <>
                      {/* Upload form */}
                      <div className="bg-white/5 rounded-xl p-3 space-y-2.5 border border-white/8">
                        <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Upload Audio</p>
                        <label className="flex flex-col items-center justify-center gap-1.5 w-full h-16 rounded-lg border border-dashed border-white/15 hover:border-primary/50 bg-white/3 hover:bg-primary/5 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 text-white/30" />
                          <span className="text-[10px] text-white/40">{uploadFile ? uploadFile.name : "Click to select MP3, WAV, M4A…"}</span>
                          <input type="file" accept="audio/*,.mp3,.wav,.ogg,.flac,.aac,.m4a,.webm" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setUploadFile(f); if (!uploadName) setUploadName(f.name.replace(/\.[^.]+$/, "")); } }} />
                        </label>
                        <Input
                          data-testid="input-upload-name"
                          value={uploadName}
                          onChange={e => setUploadName(e.target.value)}
                          placeholder="Track name"
                          className="h-7 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-primary/40 rounded-lg"
                        />
                        <div className="flex items-center justify-between">
                          <button
                            data-testid="button-toggle-visibility"
                            onClick={() => setUploadIsPublic(v => !v)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${uploadIsPublic ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/8 text-white/40 border border-white/10"}`}
                          >
                            {uploadIsPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            {uploadIsPublic ? "Public" : "Private"}
                          </button>
                          <button
                            data-testid="button-upload-submit"
                            onClick={handleUpload}
                            disabled={!uploadFile || !uploadName.trim() || uploadMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold disabled:opacity-40 hover:bg-primary/80 transition-colors"
                          >
                            {uploadMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                            Upload
                          </button>
                        </div>
                      </div>

                      {/* Track list */}
                      <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold px-1">All Uploads</p>
                      {tracksLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>}
                      {!tracksLoading && userTracks.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-6 text-white/20">
                          <Music2 className="w-7 h-7 mb-1.5" />
                          <p className="text-xs">No uploads yet</p>
                        </div>
                      )}
                      <div className="space-y-0.5">
                        {userTracks.map(ut => (
                          <div key={ut.id} data-testid={`row-upload-${ut.id}`} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg group transition-colors hover:bg-white/5 ${currentTrack?.id === -(ut.id) ? "bg-primary/20 border border-primary/30" : "border border-transparent"}`}>
                            <button onClick={() => playUserTrack(ut)} className="w-8 h-8 flex-shrink-0 rounded-md bg-white/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                              {currentTrack?.id === -(ut.id) && isPlaying ? <Pause className="w-3.5 h-3.5 text-primary fill-primary" /> : <Play className="w-3.5 h-3.5 text-white/60 fill-white/60" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate ${currentTrack?.id === -(ut.id) ? "text-primary" : "text-white"}`}>{ut.name}</p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-white/40">{ut.username}</span>
                                {ut.isPublic ? <Globe className="w-2.5 h-2.5 text-green-400/60" /> : <Lock className="w-2.5 h-2.5 text-white/30" />}
                              </div>
                            </div>
                            {ut.username === user.username && (
                              <button
                                data-testid={`button-delete-upload-${ut.id}`}
                                onClick={() => deleteTrackMutation.mutate(ut.id)}
                                disabled={deleteTrackMutation.isPending}
                                className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-white/20">
                      <Upload className="w-8 h-8 mb-2" />
                      <p className="text-xs">Log in to upload audio</p>
                    </div>
                  )}
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
