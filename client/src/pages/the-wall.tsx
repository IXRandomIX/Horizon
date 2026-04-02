import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Shield, Wifi, WifiOff, Loader2, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getSessionToken } from "@/context/auth";

const LINK_CREATOR_SRC = "https://domain-linker--zacharygoulden.replit.app";

function formatTimeLeft(ms: number) {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${days}d ${hours}h ${mins}m`;
}

const GLITCH_CHARS = "!@#$%^&*<>?/|\\~`{}[]";
function randomGlitch(text: string, intensity: number) {
  return text.split("").map(c =>
    Math.random() < intensity ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)] : c
  ).join("");
}

function GlitchText({ text, className, intensity = 0.08, interval = 80 }: { text: string; className?: string; intensity?: number; interval?: number }) {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    const id = setInterval(() => setDisplay(randomGlitch(text, intensity)), interval);
    return () => clearInterval(id);
  }, [text, intensity, interval]);
  return <span className={className} data-text={text}>{display}</span>;
}

function DemonText({ text, className }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    const id = setInterval(() => setDisplay(randomGlitch(text, 0.18)), 50);
    return () => clearInterval(id);
  }, [text]);
  return <span className={`demon-text ${className ?? ""}`} data-text={text}>{display}</span>;
}

function VpnSection() {
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [ip, setIp] = useState<string | null>(null);
  const [hasProxy, setHasProxy] = useState(false);

  const fetchStatus = useCallback(async () => {
    const token = getSessionToken();
    if (!token) return;
    try {
      const res = await fetch("/api/vpn/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setEnabled(data.enabled);
      setIp(data.ip);
      setHasProxy(data.hasProxy);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const toggle = useCallback(async () => {
    const token = getSessionToken();
    if (!token || toggling) return;
    setToggling(true);
    setIp(null);
    try {
      const res = await fetch("/api/vpn/toggle", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setEnabled(data.enabled);
      setIp(data.ip);
      setHasProxy(data.hasProxy);
    } catch {}
    setToggling(false);
  }, [toggling]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
      <Card className="bg-white/[0.03] border-white/10 overflow-hidden relative">
        <div className={`absolute inset-0 pointer-events-none transition-all duration-1000 ${enabled ? "bg-gradient-to-br from-green-900/15 to-transparent" : "bg-gradient-to-br from-red-950/10 to-transparent"}`} />
        {enabled && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-green-500/5 to-transparent" />
          </div>
        )}
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
              enabled
                ? "bg-green-900/30 border-green-600/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                : "bg-red-950/20 border-red-900/30"
            }`}>
              {loading ? (
                <Loader2 className="w-7 h-7 text-white/30 animate-spin" />
              ) : enabled ? (
                <Wifi className="w-7 h-7 text-green-400" />
              ) : (
                <WifiOff className="w-7 h-7 text-red-500/60" />
              )}
            </div>
            <div>
              <CardTitle className="text-3xl text-white font-display tracking-widest flex items-center gap-3">
                VPN
                {!loading && (
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded tracking-widest border ${
                    enabled
                      ? "text-green-400 bg-green-900/30 border-green-700/40"
                      : "text-red-500/70 bg-red-950/20 border-red-900/30"
                  }`}>
                    {enabled ? "● ACTIVE" : "● OFF"}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Route proxy traffic through a secure IP — protects against IP bans on proxied content
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/8 bg-black/30 px-4 py-3 flex items-center gap-3">
              <Globe className="w-4 h-4 text-white/30 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-0.5">Server IP</p>
                {loading || (toggling && !ip) ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-white/30" />
                    <span className="text-white/20 font-mono text-xs">resolving…</span>
                  </div>
                ) : (
                  <p className={`font-mono text-sm font-bold tracking-wider ${enabled ? "text-green-400" : "text-white/60"}`}>
                    {ip || "—"}
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-white/8 bg-black/30 px-4 py-3 flex items-center gap-3">
              <Lock className="w-4 h-4 text-white/30 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-0.5">Upstream Proxy</p>
                <p className={`font-mono text-xs font-semibold ${hasProxy ? "text-green-400" : "text-red-500/60"}`}>
                  {hasProxy ? "Configured ✓" : "Not configured"}
                </p>
              </div>
            </div>
          </div>

          <button
            data-testid="button-vpn-toggle"
            onClick={toggle}
            disabled={loading || toggling}
            className={`w-full h-16 rounded-2xl font-black text-xl tracking-widest border transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden ${
              enabled
                ? "bg-green-900/40 border-green-600/50 text-green-300 hover:bg-green-900/60 shadow-[0_0_30px_rgba(34,197,94,0.25)] hover:shadow-[0_0_40px_rgba(34,197,94,0.4)]"
                : "bg-red-950/30 border-red-900/40 text-red-400/80 hover:bg-red-950/50 hover:border-red-800/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {toggling ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <GlitchText text={enabled ? "DEACTIVATING…" : "ACTIVATING…"} intensity={0.12} interval={60} />
              </>
            ) : enabled ? (
              <>
                <Wifi className="w-5 h-5" />
                <GlitchText text="VPN: ON — CLICK TO DISABLE" intensity={0.04} interval={200} />
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5" />
                <GlitchText text="VPN: OFF — CLICK TO ENABLE" intensity={0.04} interval={200} />
              </>
            )}
          </button>

          {!hasProxy && (
            <p className="text-white/20 font-mono text-[10px] text-center leading-relaxed">
              Set a <span className="text-white/40">PROXY_URL</span> secret to route traffic through a different IP.<br />
              Without it, VPN mode still shows this server's address.
            </p>
          )}
          <p className="text-white/15 font-mono text-[10px] text-center">
            VPN affects proxy & media traffic routed through HORIZON's server · does not affect direct browser connections
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

type Stage = "loading" | "gate" | "denied" | "success_flash" | "unlocked" | "locked_out";

export default function TheWall() {
  const [stage, setStage] = useState<Stage>("loading");
  const [password, setPassword] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(2);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = getSessionToken();
    if (!token) { setStage("gate"); return; }

    fetch("/api/wall/status", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.unlocked) {
          setStage("unlocked");
        } else if (data.locked) {
          setTimeLeft(data.lockedUntilMs - Date.now());
          setStage("locked_out");
        } else {
          setAttemptsLeft(data.attemptsLeft ?? 2);
          setStage("gate");
        }
      })
      .catch(() => setStage("gate"));
  }, []);

  useEffect(() => {
    if (stage !== "locked_out") return;
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          setStage("gate");
          setAttemptsLeft(2);
          return 0;
        }
        return prev - 30000;
      });
    }, 30000);
    return () => clearInterval(id);
  }, [stage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getSessionToken();
    if (!token) { setStage("gate"); return; }

    const res = await fetch("/api/wall/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    setPassword("");

    if (res.ok && data.success) {
      setStage("success_flash");
      setTimeout(() => setStage("unlocked"), 4000);
    } else if (res.status === 423 || data.locked) {
      setTimeLeft(data.lockedUntilMs - Date.now());
      setStage("locked_out");
    } else {
      setAttemptsLeft(data.attemptsLeft ?? 0);
      setStage("denied");
      setTimeout(() => setStage("gate"), 3500);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black overflow-y-auto custom-scrollbar relative">
      <style>{`
        @keyframes demon-flicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
            text-shadow: 0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 40px #ff0000, 0 0 80px #ff4400, 0 0 120px #ff2200;
          }
          20%, 24%, 55% { text-shadow: none; }
        }
        @keyframes demon-shake {
          0%, 100% { transform: translate(0,0) skew(0deg); }
          10% { transform: translate(-3px, 2px) skew(-1deg); }
          20% { transform: translate(3px, -2px) skew(1deg); }
          30% { transform: translate(-4px, 1px) skew(-2deg); }
          40% { transform: translate(4px, -1px) skew(2deg); }
          50% { transform: translate(-2px, 3px) skew(-1deg); }
          60% { transform: translate(2px, -3px) skew(1deg); }
          70% { transform: translate(-3px, 0) skew(0deg); }
          80% { transform: translate(3px, 1px) skew(-1deg); }
          90% { transform: translate(-1px, -2px) skew(1deg); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .demon-text {
          color: #ff2200;
          animation: demon-flicker 0.3s infinite, demon-shake 0.1s infinite;
          font-family: 'Cinzel Decorative', cursive;
          position: relative;
        }
        .demon-text::before {
          content: attr(data-text);
          position: absolute;
          top: 0; left: 2px;
          color: #00ffff;
          opacity: 0.6;
          animation: demon-shake 0.08s infinite;
        }
        .demon-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0; left: -2px;
          color: #ff00ff;
          opacity: 0.6;
          animation: demon-shake 0.12s reverse infinite;
        }
        .wall-glitch-title {
          position: relative;
          font-family: 'Cinzel Decorative', cursive;
          color: #fff;
          text-shadow: 0 0 30px rgba(168,85,247,0.8), 0 0 60px rgba(168,85,247,0.4);
        }
        .wall-glitch-title::before {
          content: attr(data-text);
          position: absolute;
          top: 0; left: 3px;
          color: #ff00c1;
          opacity: 0.7;
          animation: glitch-anim 3s infinite linear;
          clip-path: polygon(0 30%, 100% 30%, 100% 50%, 0 50%);
        }
        .wall-glitch-title::after {
          content: attr(data-text);
          position: absolute;
          top: 0; left: -3px;
          color: #00fff9;
          opacity: 0.7;
          animation: glitch-anim2 2s infinite linear alternate-reverse;
          clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%);
        }
        .sub-glitch {
          font-family: 'Cormorant', serif;
          color: rgba(255,255,255,0.7);
          letter-spacing: 0.15em;
          position: relative;
        }
        .sub-glitch::before {
          content: attr(data-text);
          position: absolute;
          top: 0; left: 1px;
          color: #ff00c1;
          opacity: 0.4;
          animation: glitch-anim 4s infinite linear;
          clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%);
        }
        .scanline-overlay {
          pointer-events: none;
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 1;
        }
        .scanline-overlay::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 3px;
          background: rgba(255,255,255,0.03);
          animation: scanline 4s linear infinite;
        }
        .wall-input {
          background: rgba(255,255,255,0.03) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: #fff !important;
          font-family: 'Courier New', monospace !important;
          letter-spacing: 0.2em !important;
          font-size: 1rem !important;
          height: 3.5rem !important;
          text-align: center !important;
        }
        .wall-input:focus {
          border-color: rgba(168,85,247,0.6) !important;
          box-shadow: 0 0 20px rgba(168,85,247,0.2) !important;
          outline: none !important;
        }
        .access-denied-text {
          font-family: 'Cinzel Decorative', cursive;
          color: #ff0000;
          text-shadow: 0 0 20px #ff0000, 0 0 40px #ff4400;
          animation: demon-flicker 0.5s infinite;
          letter-spacing: 0.1em;
        }
        @keyframes glitch-anim2 {
          0% { clip: rect(15px, 9999px, 52px, 0); }
          25% { clip: rect(70px, 9999px, 20px, 0); }
          50% { clip: rect(30px, 9999px, 80px, 0); }
          75% { clip: rect(55px, 9999px, 10px, 0); }
          100% { clip: rect(5px, 9999px, 65px, 0); }
        }
      `}</style>

      <div className="scanline-overlay" />

      <div className="relative z-10 flex flex-col items-center justify-start min-h-full px-6 py-16 md:py-24">
        <AnimatePresence mode="wait">

          {stage === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 text-white/30 font-mono text-xs uppercase tracking-widest">
              <div className="w-6 h-6 border border-purple-500/40 border-t-purple-500 rounded-full animate-spin" />
              <span>Verifying access...</span>
            </motion.div>
          )}

          {stage === "locked_out" && (
            <motion.div key="locked_out" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-8 max-w-xl w-full text-center">
              <div className="wall-glitch-title text-5xl md:text-7xl font-black uppercase mb-4" data-text="THE WALL">THE WALL</div>
              <div className="w-24 h-1 bg-gradient-to-r from-red-800 via-red-500 to-red-800 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
              <div className="mt-8 space-y-6">
                <p className="access-denied-text text-2xl md:text-3xl">ACCESS DENIED</p>
                <p className="text-red-400/80 font-mono text-sm uppercase tracking-widest">You are locked out.</p>
                <div className="px-6 py-5 rounded-2xl border border-red-900/40 bg-red-950/20">
                  <p className="text-white/60 text-sm mb-2 font-mono uppercase tracking-widest">Time remaining</p>
                  <p className="text-red-400 font-mono text-2xl font-bold">{formatTimeLeft(timeLeft)}</p>
                </div>
                <p className="text-white/30 text-xs font-mono">You had your chance.</p>
              </div>
            </motion.div>
          )}

          {stage === "denied" && (
            <motion.div key="denied" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-6 max-w-2xl w-full text-center">
              <motion.div animate={{ x: [0, -8, 8, -8, 8, -5, 5, 0] }} transition={{ duration: 0.4, repeat: 3 }}>
                <p className="access-denied-text text-3xl md:text-5xl leading-tight">
                  ACCESS DENIED<br />YOU ARE NEVER GETTING PASSED
                </p>
              </motion.div>
              <div className="w-full h-0.5 bg-red-900/50 mt-4" />
              <p className="text-red-400/50 font-mono text-xs uppercase tracking-widest">
                {attemptsLeft} attempt(s) remaining
              </p>
            </motion.div>
          )}

          {stage === "success_flash" && (
            <motion.div key="success_flash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-8 max-w-3xl w-full text-center px-4">
              <motion.div animate={{ scale: [1, 1.05, 0.97, 1.03, 1] }} transition={{ duration: 0.5, repeat: 5 }}
                className="text-3xl md:text-5xl leading-tight">
                <DemonText text="WELCOME GATEKEEPER" className="block mb-4 text-4xl md:text-6xl" />
                <DemonText text="HAHAHAHAHAHHAHHAHAHA" className="block text-2xl md:text-4xl" />
              </motion.div>
              <motion.div animate={{ opacity: [1, 0, 1, 0.5, 1] }} transition={{ duration: 0.2, repeat: 15 }}
                className="text-red-500/40 font-mono text-xs uppercase tracking-[0.4em]">
                initializing access...
              </motion.div>
            </motion.div>
          )}

          {stage === "gate" && (
            <motion.div key="gate" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-10 max-w-xl w-full text-center">
              <div>
                <div className="wall-glitch-title text-6xl md:text-8xl font-black uppercase tracking-widest mb-6" data-text="THE WALL">THE WALL</div>
                <div className="w-32 h-1 mx-auto bg-gradient-to-r from-purple-900 via-purple-500 to-purple-900 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
              </div>
              <div className="max-w-lg">
                <p className="sub-glitch text-lg md:text-xl italic leading-relaxed" data-text="you will never know what is behind this wall">
                  <GlitchText text="you will never know what is behind this wall" className="sub-glitch" intensity={0.06} interval={120} />
                </p>
              </div>
              <div className="w-full max-w-md space-y-4">
                <div className="flex items-center gap-3 justify-center mb-2">
                  <Shield className="w-4 h-4 text-purple-500/60" />
                  <span className="text-white/30 font-mono text-xs uppercase tracking-widest">Enter Access Code</span>
                  <Shield className="w-4 h-4 text-purple-500/60" />
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    ref={inputRef}
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="wall-input rounded-2xl"
                    placeholder="••••••••••••••••"
                    autoComplete="off"
                    data-testid="input-wall-password"
                  />
                  <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl font-bold text-lg bg-purple-900/60 hover:bg-purple-800/80 border border-purple-700/40 text-white shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all"
                    data-testid="button-wall-submit"
                  >
                    <GlitchText text="ENTER THE WALL" intensity={0.04} interval={200} />
                  </Button>
                </form>
                <p className="text-white/20 font-mono text-xs mt-4">
                  2 attempts allowed · failure locks you out for 20 days
                </p>
              </div>
            </motion.div>
          )}

          {stage === "unlocked" && (
            <motion.div key="unlocked" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
              className="w-full max-w-4xl space-y-10">
              <div className="text-center">
                <div className="wall-glitch-title text-5xl md:text-7xl font-black uppercase tracking-widest mb-3" data-text="THE WALL">THE WALL</div>
                <div className="w-32 h-1 mx-auto bg-gradient-to-r from-purple-900 via-purple-500 to-purple-900 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.5)] mb-4" />
                <p className="text-purple-400/60 font-mono text-xs uppercase tracking-[0.3em]">Access Granted — Welcome, Gatekeeper</p>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="bg-white/[0.03] border-white/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent pointer-events-none" />
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-purple-900/20 flex items-center justify-center border border-purple-700/30">
                        <ExternalLink className="w-8 h-8 text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-3xl text-white font-display tracking-widest">Link Creator</CardTitle>
                        <CardDescription className="text-lg text-muted-foreground">Create and manage custom domain links</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2 pb-0">
                    <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: "640px" }}>
                      <iframe
                        src={LINK_CREATOR_SRC}
                        className="w-full h-full"
                        sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
                        referrerPolicy="no-referrer"
                        title="Link Creator"
                        data-testid="iframe-link-creator-wall"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <VpnSection />

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center py-10">
                <p className="sub-glitch text-base md:text-lg text-white/40 italic tracking-widest" data-text="The wall will bring more stuff soon...">
                  <GlitchText text="The wall will bring more stuff soon..." intensity={0.04} interval={150} className="font-cormorant italic" />
                </p>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
