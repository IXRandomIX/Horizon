import { Globe, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";

export default function Browser() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleRefresh = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = currentSrc;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-black animate-in fade-in duration-700 relative">
      <div className="flex items-center justify-between p-3 border-b border-white/5 bg-black/50 backdrop-blur-md shrink-0 absolute top-0 w-full z-10 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
            <Globe className="w-4 h-4 text-primary" />
          </div>
          <span className="font-medium text-sm text-white/70">Scramjet Encrypted Tunnel</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="text-muted-foreground hover:text-white hover:bg-white/10"
          data-testid="button-browser-reload"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          Reload
        </Button>
      </div>

      <div className="flex-1 w-full relative bg-black">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-4 border-white/10 border-t-primary rounded-full animate-spin" />
              <p className="font-display tracking-widest text-primary font-bold animate-pulse">ESTABLISHING CONNECTION...</p>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src="/scramjet/"
          className={`w-full h-full border-0 transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          allow="fullscreen"
          onLoad={() => setIsLoading(false)}
          title="Scramjet Proxy"
          data-testid="iframe-browser"
        />
      </div>
    </div>
  );
}
