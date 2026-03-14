import { useState, useRef, useCallback, useEffect } from "react";
import { Maximize2, Minimize2, Sword } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EaglerCraft() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    } else {
      await el.requestFullscreen().catch(() => {});
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-black shrink-0 z-10 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Sword className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">Dragon X V2</h1>
            <p className="text-[11px] text-white/40">EaglerCraft 1.8 Hack Client</p>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <Button
            onClick={handleFullscreen}
            variant="outline"
            size="sm"
            className="border-white/10 hover:bg-white/10 hover:border-white/20 text-white gap-2 rounded-xl"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline text-sm font-medium">
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </span>
          </Button>
        </div>
      </div>

      {/* Game container */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-black"
        style={{ willChange: "transform" }}
      >
        <iframe
          src="/dragonx-v2.html"
          className="absolute inset-0 w-full h-full border-0"
          style={{ display: "block" }}
          allow="fullscreen; autoplay; pointer-lock; encrypted-media; gyroscope; picture-in-picture; clipboard-read; clipboard-write"
          title="Dragon X V2 - EaglerCraft Hack Client"
        />
      </div>
    </div>
  );
}
