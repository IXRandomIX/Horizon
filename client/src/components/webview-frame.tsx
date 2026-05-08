import { useState, useEffect } from "react";
import { ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WebviewFrameProps {
  src: string;
  className?: string;
  allow?: string;
  title?: string;
  sandbox?: string;
}

export function WebviewFrame({ src, className = "w-full h-full border-0", allow, title, sandbox }: WebviewFrameProps) {
  const [status, setStatus] = useState<"checking" | "ok" | "blocked">("checking");

  useEffect(() => {
    if (!src) return;
    setStatus("checking");
    fetch(`/api/can-embed?url=${encodeURIComponent(src)}`)
      .then(r => r.json())
      .then(data => setStatus(data.canEmbed ? "ok" : "blocked"))
      .catch(() => setStatus("ok"));
  }, [src]);

  if (status === "checking") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black gap-5 p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500/70" />
        </div>
        <div>
          <p className="text-white/80 font-semibold text-lg mb-1">Can't embed this site</p>
          <p className="text-white/30 text-sm max-w-xs">This site blocks being displayed inside another page. Open it in a new tab instead.</p>
        </div>
        <Button
          onClick={() => window.open(src, "_blank")}
          className="gap-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary"
        >
          <ExternalLink className="w-4 h-4" />
          Open in New Tab
        </Button>
      </div>
    );
  }

  return (
    <iframe
      src={src}
      className={className}
      allow={allow}
      title={title}
      sandbox={sandbox}
    />
  );
}
