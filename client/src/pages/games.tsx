import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useGames } from "@/hooks/use-games";
import { GameCard } from "@/components/game-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowLeft, Maximize2, Gamepad2, Loader2 } from "lucide-react";
import type { Game } from "@shared/routes";

const PAGE_SIZE = 60;

function DirectIframeFrame({ url, title }: { url: string; title: string }) {
  return (
    <iframe
      id="game-iframe"
      src={url}
      className="absolute inset-0 w-full h-full border-0 bg-black"
      allow="fullscreen; autoplay; encrypted-media; gyroscope; picture-in-picture; pointer-lock"
      title={title}
      sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation allow-top-navigation-by-user-activation"
    />
  );
}

function GameFrame({ url, title }: { url: string; title: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGame() {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load game content");
        let html = await response.text();
        
        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
        if (!html.includes('<base')) {
          html = html.replace('<head>', `<head><base href="${baseUrl}">`);
        }
        
        setContent(html);
      } catch (err) {
        console.error("Error loading game:", err);
        setError("Could not launch game. The connection was refused.");
      } finally {
        setLoading(false);
      }
    }

    fetchGame();
  }, [url]);

  if (loading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-primary font-display tracking-widest animate-pulse">INITIATING SEQUENCE...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-center p-6">
        <h3 className="text-2xl font-bold text-destructive mb-4 font-display">System Failure</h3>
        <p className="text-muted-foreground mb-8 max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Retry Connection</Button>
      </div>
    );
  }

  return (
    <iframe 
      id="game-iframe"
      srcDoc={content || ""} 
      className="absolute inset-0 w-full h-full border-0 bg-white" 
      allow="fullscreen; autoplay; encrypted-media; gyroscope; picture-in-picture; pointer-lock" 
      title={title}
      sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation allow-top-navigation-by-user-activation"
    />
  );
}

export default function Games() {
  const { data: games, isLoading, error } = useGames();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [playingGame, setPlayingGame] = useState<Game | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loaderRef = useRef<HTMLDivElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch]);

  const filteredGames = useMemo(() => {
    if (!games) return [];
    if (!debouncedSearch.trim()) return games;
    const q = debouncedSearch.toLowerCase();
    return games.filter(g => g.name.toLowerCase().includes(q));
  }, [games, debouncedSearch]);

  const visibleGames = useMemo(() => filteredGames.slice(0, visibleCount), [filteredGames, visibleCount]);

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredGames.length));
  }, [filteredGames.length]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleFullscreen = useCallback(() => {
    const el = gameContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {
        // Fallback: try the iframe directly
        const iframe = document.getElementById("game-iframe") as HTMLIFrameElement | null;
        iframe?.requestFullscreen?.().catch(() => {});
      });
    }
  }, []);

  if (playingGame) {
    const gameUrl = playingGame.url?.replace('{HTML_URL}', 'https://cdn.jsdelivr.net/gh/gn-math/html@main') || '';
    const isDirectIframe = (playingGame as any).directIframe === true;

    return (
      <div className="flex flex-col h-full w-full bg-black animate-in fade-in zoom-in-95 duration-500">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/5 bg-black shadow-md shrink-0 z-10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <Button 
              onClick={() => setPlayingGame(null)} 
              variant="ghost" 
              className="hover:bg-white/10 text-white gap-2 rounded-xl h-12 px-5"
            >
              <ArrowLeft className="w-5 h-5" /> 
              <span className="hidden sm:inline font-medium">Back to Portal</span>
            </Button>
            <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
            <h2 className="font-bold text-xl sm:text-2xl text-white tracking-wide truncate max-w-[200px] sm:max-w-md">
              {playingGame.name}
            </h2>
          </div>
          
          <Button 
            onClick={handleFullscreen}
            variant="outline" 
            className="border-white/10 hover:bg-white/10 hover:border-white/20 text-white gap-2 rounded-xl h-12 px-5 relative z-10"
          >
            <Maximize2 className="w-4 h-4" /> 
            <span className="hidden sm:inline font-medium">Fullscreen</span>
          </Button>
        </div>
        
        <div ref={gameContainerRef} className="flex-1 w-full bg-black relative">
          {isDirectIframe
            ? <DirectIframeFrame url={gameUrl} title={playingGame.name} />
            : <GameFrame url={gameUrl} title={playingGame.name} />
          }
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black overflow-y-auto custom-scrollbar relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none opacity-50" />

      <div className="p-6 md:p-8 lg:p-12 max-w-[1600px] mx-auto w-full relative z-10">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white mb-4 text-gradient-animated inline-block tracking-wide">
            Game Portal
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-2xl leading-relaxed">
            Immerse yourself in our premier collection of uninterrupted HTML5 experiences.
          </p>

          <div className="relative max-w-xl group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500" />
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search the horizon..."
                className="w-full pl-14 bg-black border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary/50 rounded-2xl h-16 text-lg shadow-inner shadow-black/50 transition-all"
              />
            </div>
          </div>
          {games && (
            <p className="text-xs text-white/30 mt-3">
              {debouncedSearch ? `${filteredGames.length} results` : `${games.length} games`}
              {visibleCount < filteredGames.length ? ` — showing ${visibleCount}` : ""}
            </p>
          )}
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center py-32 text-center border border-destructive/20 bg-destructive/5 rounded-3xl">
            <h3 className="text-2xl font-bold text-destructive mb-3 font-display">Communication Interrupted</h3>
            <p className="text-destructive/80 max-w-md">Failed to retrieve games from the external server. Please ensure the proxy is reachable.</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8">
            {[...Array(18)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-2xl bg-white/5 border border-white/5" />
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white/[0.02] border border-white/5 rounded-3xl">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Gamepad2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No Signals Found</h3>
            <p className="text-muted-foreground text-lg">No games match your current frequency.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8 pb-8">
              {visibleGames.map((game) => (
                <GameCard key={game.id ?? game.name} game={game} onClick={() => setPlayingGame(game)} />
              ))}
            </div>
            {visibleCount < filteredGames.length && (
              <div ref={loaderRef} className="flex justify-center py-8 pb-24">
                <Loader2 className="w-6 h-6 text-primary/50 animate-spin" />
              </div>
            )}
            {visibleCount >= filteredGames.length && <div className="pb-24" />}
          </>
        )}
      </div>
    </div>
  );
}
