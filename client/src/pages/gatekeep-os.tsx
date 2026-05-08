import { useState, useEffect, useRef } from "react";
import { Lock, ShieldAlert, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSessionToken } from "@/context/auth";

type Stage = "loading" | "gate" | "locked" | "success_flash" | "unlocked";

const MATRIX_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*<>?/|\\~`{}[]ΨΩΦΔΛΞℕℤ░▒▓█▄▀■□▪▫";

function formatTimeLeft(ms: number) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m remaining`;
}

function useMatrixReveal(target: string, speed = 40) {
  const [display, setDisplay] = useState(() => Array(target.length).fill("█").join(""));
  const [done, setDone] = useState(false);
  const revealed = useRef<boolean[]>(Array(target.length).fill(false));

  useEffect(() => {
    revealed.current = Array(target.length).fill(false);
    setDone(false);
    setDisplay(Array(target.length).fill("█").join(""));

    let frame = 0;
    const totalFrames = target.length * 8;

    const id = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const revealCount = Math.floor(progress * target.length);

      const indices = [...Array(target.length).keys()].sort(() => Math.random() - 0.5);
      for (let i = 0; i < revealCount; i++) {
        revealed.current[indices[i]] = true;
      }

      const newDisplay = target.split("").map((char, i) => {
        if (char === " ") return " ";
        if (revealed.current[i]) return char;
        return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
      }).join("");

      setDisplay(newDisplay);

      if (frame >= totalFrames) {
        setDisplay(target);
        setDone(true);
        clearInterval(id);
      }
    }, speed);

    return () => clearInterval(id);
  }, [target]);

  return { display, done };
}

function GlitchScramble({ text, className, intensity = 0.12, interval = 60 }: {
  text: string; className?: string; intensity?: number; interval?: number;
}) {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    const id = setInterval(() => {
      setDisplay(text.split("").map(c =>
        c !== " " && Math.random() < intensity
          ? MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
          : c
      ).join(""));
    }, interval);
    return () => clearInterval(id);
  }, [text, intensity, interval]);
  return <span className={className}>{display}</span>;
}

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const cols = Math.floor(canvas.width / 16);
    const drops = Array(cols).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(168,85,247,0.4)";
      ctx.font = "12px monospace";
      drops.forEach((y, i) => {
        const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        ctx.fillText(char, i * 16, y * 16);
        if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    };

    const id = setInterval(draw, 50);
    return () => clearInterval(id);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" />;
}

function SuccessFlash() {
  const line1 = "WELCOME!";
  const line2 = "YOU HAVE BEEN GRANTED ACCESS";
  const line3 = "TO THE PROXIES TO YOURSELF!";
  const line4 = "GATEKEEP IT OR I'LL FIND YOU!";

  const { display: d1 } = useMatrixReveal(line1, 25);
  const { display: d2, done: done1 } = useMatrixReveal(line2, 30);
  const { display: d3, done: done2 } = useMatrixReveal(line3, 35);
  const { display: d4, done: done3 } = useMatrixReveal(line4, 20);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 overflow-hidden">
      <MatrixRain />
      <style>{`
        @keyframes scary-flicker {
          0%, 18%, 22%, 25%, 53%, 57%, 100% { opacity: 1; }
          20%, 24%, 55% { opacity: 0; }
        }
        @keyframes scary-shake {
          0%, 100% { transform: translate(0,0) skew(0deg) scale(1); }
          5%  { transform: translate(-4px, 3px) skew(-2deg) scale(1.01); }
          10% { transform: translate(5px, -3px) skew(3deg) scale(0.99); }
          15% { transform: translate(-3px, 4px) skew(-1deg) scale(1.02); }
          20% { transform: translate(6px, -2px) skew(2deg) scale(0.98); }
          25% { transform: translate(-5px, 1px) skew(-3deg) scale(1.01); }
          30% { transform: translate(3px, 5px) skew(1deg) scale(0.99); }
          35% { transform: translate(-6px, -3px) skew(2deg) scale(1.02); }
          40% { transform: translate(4px, 2px) skew(-2deg) scale(0.98); }
          50% { transform: translate(0,0) skew(0deg) scale(1); }
        }
        @keyframes rgb-split {
          0%   { text-shadow: 3px 0 #ff0000, -3px 0 #00ffff, 0 3px #ff00ff; }
          25%  { text-shadow: -4px 0 #00ffff, 4px 0 #ff0000, 0 -3px #ffff00; }
          50%  { text-shadow: 2px -2px #ff00ff, -2px 2px #00ff00, 3px 0 #ff0000; }
          75%  { text-shadow: -3px 3px #ffff00, 3px -3px #00ffff, 0 0 #ff00ff; }
          100% { text-shadow: 4px 0 #ff0000, -4px 0 #00ffff, 0 4px #ff00ff; }
        }
        .glitch-line-1 {
          font-family: 'Courier New', monospace;
          font-weight: 900;
          letter-spacing: 0.25em;
          color: #ff2200;
          animation: scary-flicker 0.15s infinite, rgb-split 0.08s infinite, scary-shake 0.1s infinite;
        }
        .glitch-line-2 {
          font-family: 'Courier New', monospace;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: #ff6600;
          animation: scary-flicker 0.2s infinite 0.05s, rgb-split 0.12s infinite reverse, scary-shake 0.08s infinite 0.03s;
        }
        .glitch-line-3 {
          font-family: 'Courier New', monospace;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #ffaa00;
          animation: scary-flicker 0.18s infinite 0.1s, rgb-split 0.1s infinite, scary-shake 0.12s infinite 0.06s;
        }
        .glitch-line-4 {
          font-family: 'Courier New', monospace;
          font-weight: 900;
          letter-spacing: 0.12em;
          color: #ff0055;
          animation: scary-flicker 0.12s infinite 0.02s, rgb-split 0.06s infinite reverse, scary-shake 0.07s infinite;
          font-size: 1.1em;
        }
      `}</style>

      <div className="relative z-10 text-center px-6 space-y-6 max-w-3xl">
        <div className="text-4xl md:text-6xl glitch-line-1">{d1}</div>
        <div className="text-xl md:text-3xl glitch-line-2">{d2}</div>
        <div className="text-xl md:text-3xl glitch-line-3">{d3}</div>
        <div className="text-2xl md:text-4xl glitch-line-4">{d4}</div>
        <motion.div
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 0.4, repeat: Infinity }}
          className="text-purple-400/50 font-mono text-xs uppercase tracking-[0.5em] mt-8"
        >
          initializing launcher...
        </motion.div>
      </div>
    </div>
  );
}

export default function GatekeepOS() {
  const [stage, setStage] = useState<Stage>("loading");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(15);
  const [lockoutMs, setLockoutMs] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const { display: titleDisplay } = useMatrixReveal("THE LAUNCHER", 35);

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    if (stage !== "locked" || !lockoutMs) return;
    setTimeLeft(lockoutMs - Date.now());
    const id = setInterval(() => {
      const remaining = lockoutMs - Date.now();
      if (remaining <= 0) {
        setStage("gate");
        setLockoutMs(null);
        setAttemptsLeft(15);
      } else {
        setTimeLeft(remaining);
      }
    }, 30000);
    return () => clearInterval(id);
  }, [stage, lockoutMs]);

  const checkStatus = async () => {
    const token = getSessionToken();
    if (!token) { setStage("gate"); return; }
    try {
      const res = await fetch("/api/gatekeep/status", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.unlocked) {
        setStage("unlocked");
      } else if (data.locked) {
        setLockoutMs(data.lockedUntilMs);
        setTimeLeft(data.lockedUntilMs - Date.now());
        setStage("locked");
      } else {
        setAttemptsLeft(data.attemptsLeft ?? 15);
        setStage("gate");
      }
    } catch {
      setStage("gate");
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getSessionToken();
    if (!token) { setStage("gate"); return; }

    const res = await fetch("/api/gatekeep/verify", {
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
      setTimeout(() => setStage("unlocked"), 5500);
      setError("");
    } else if (res.status === 423 || data.locked) {
      setLockoutMs(data.lockedUntilMs);
      setTimeLeft(data.lockedUntilMs - Date.now());
      setStage("locked");
      setError("LOCKOUT INITIATED. TRY AGAIN IN 56 HOURS.");
    } else {
      setAttemptsLeft(data.attemptsLeft ?? 0);
      setError("ACCESS DENIED, stop trying");
    }
  };

  if (stage === "loading") {
    return (
      <div className="flex flex-col h-full bg-black items-center justify-center">
        <div className="w-6 h-6 border border-purple-500/40 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (stage === "success_flash") {
    return <SuccessFlash />;
  }

  if (stage === "unlocked") {
    return (
      <div className="flex flex-col h-full bg-black animate-in fade-in duration-700 relative">
        <div className="flex-1 w-full relative">
          <iframe
            src="https://the-launcher--nkchknc.replit.app/"
            className="w-full h-full border-0"
            allow="fullscreen; clipboard-read; clipboard-write"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black items-center justify-center p-6 relative overflow-hidden">
      <MatrixRain />

      <style>{`
        @keyframes title-glitch {
          0%   { text-shadow: 3px 0 #ff00c1, -3px 0 #00fff9, 0 0 rgba(168,85,247,0.8); transform: translate(0) skew(0deg); }
          10%  { text-shadow: -4px 0 #ff00c1, 4px 0 #00fff9; transform: translate(-2px, 1px) skew(-1deg); }
          20%  { text-shadow: 4px 2px #ff00c1, -4px -2px #00fff9; transform: translate(2px, -1px) skew(1deg); }
          30%  { text-shadow: -2px -3px #ff00c1, 2px 3px #00fff9; transform: translate(-1px, 2px) skew(-0.5deg); }
          40%  { text-shadow: 5px 0 #ff00c1, -5px 0 #00fff9; transform: translate(3px, 0) skew(2deg); }
          50%  { text-shadow: 0 0 30px rgba(168,85,247,0.9), 3px 0 #ff00c1, -3px 0 #00fff9; transform: translate(0) skew(0deg); }
          60%  { text-shadow: -3px 1px #ff00c1, 3px -1px #00fff9; transform: translate(-2px, -1px) skew(1deg); }
          70%  { text-shadow: 4px -2px #ff00c1, -4px 2px #00fff9; transform: translate(1px, 2px) skew(-1deg); }
          80%  { text-shadow: -5px 0 #ff00c1, 5px 0 #00fff9; transform: translate(-3px, 0) skew(-2deg); }
          90%  { text-shadow: 2px 3px #ff00c1, -2px -3px #00fff9; transform: translate(2px, -2px) skew(0.5deg); }
          100% { text-shadow: 3px 0 #ff00c1, -3px 0 #00fff9, 0 0 rgba(168,85,247,0.8); transform: translate(0) skew(0deg); }
        }
        @keyframes flicker-hard {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
          20%, 24%, 55% { opacity: 0.1; }
        }
        @keyframes border-glitch {
          0%, 100% { border-color: rgba(168,85,247,0.2); box-shadow: 0 0 15px rgba(168,85,247,0.1); }
          25% { border-color: rgba(0,255,249,0.4); box-shadow: 0 0 25px rgba(0,255,249,0.2), inset 0 0 15px rgba(0,255,249,0.05); }
          50% { border-color: rgba(255,0,193,0.4); box-shadow: 0 0 20px rgba(255,0,193,0.2); }
          75% { border-color: rgba(168,85,247,0.5); box-shadow: 0 0 30px rgba(168,85,247,0.3); }
        }
        .launcher-title {
          font-family: 'Courier New', monospace;
          font-weight: 900;
          color: #fff;
          letter-spacing: 0.3em;
          animation: title-glitch 0.15s infinite, flicker-hard 4s infinite;
        }
        .launcher-card {
          animation: border-glitch 2s infinite;
        }
        @keyframes sub-distort {
          0%, 100% { letter-spacing: 0.15em; opacity: 0.5; }
          30% { letter-spacing: 0.3em; opacity: 0.3; }
          60% { letter-spacing: 0.1em; opacity: 0.6; }
        }
        .sub-distort { animation: sub-distort 3s infinite; }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-10 backdrop-blur-xl shadow-2xl text-center launcher-card">

          <div className="w-20 h-20 rounded-full bg-purple-900/20 flex items-center justify-center mx-auto mb-8 border border-purple-500/20"
            style={{ animation: "border-glitch 1.5s infinite" }}>
            {stage === "locked"
              ? <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
              : <Lock className="w-10 h-10 text-purple-400" />}
          </div>

          <h1 className="text-3xl md:text-4xl launcher-title mb-2">
            {titleDisplay}
          </h1>

          <p className="text-white/30 mb-8 font-mono text-xs sub-distort uppercase tracking-widest">
            <GlitchScramble
              text={stage === "locked" ? "UNAUTHORIZED ACCESS DETECTED" : "ENTER DECRYPTION KEY TO BYPASS"}
              intensity={0.06}
              interval={120}
            />
          </p>

          {stage === "locked" ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-950/30 border border-red-700/30 rounded-xl text-red-400 font-mono font-bold text-sm"
                style={{ animation: "flicker-hard 0.8s infinite" }}>
                <GlitchScramble text={error || "LOCKOUT INITIATED. TRY AGAIN IN 56 HOURS."} intensity={0.15} interval={80} />
              </div>
              <p className="text-sm text-white/20 font-mono">{lockoutMs ? formatTimeLeft(timeLeft) : ""}</p>
            </div>
          ) : (
            <form onSubmit={handleUnlock} className="space-y-6">
              <div className="relative group">
                <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500/50 group-focus-within:text-purple-400 transition-colors" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="LAUNCHER"
                  className="bg-black/60 border-purple-900/40 h-14 pl-12 rounded-xl text-white font-mono focus-visible:ring-purple-500 focus-visible:border-purple-500/60 placeholder:text-white/15 placeholder:tracking-[0.3em]"
                  data-testid="input-gatekeep-password"
                />
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10, x: -5 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 font-mono font-bold text-sm"
                    style={{ animation: "flicker-hard 0.5s infinite" }}
                  >
                    <GlitchScramble text={error} intensity={0.2} interval={60} />
                  </motion.p>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                data-testid="button-gatekeep-submit"
                className="w-full h-14 bg-purple-900/50 hover:bg-purple-800/60 border border-purple-600/40 hover:border-purple-500/60 text-white font-mono text-base rounded-xl transition-all tracking-widest uppercase"
                style={{ animation: "border-glitch 2s infinite" }}
              >
                <GlitchScramble text="EXECUTE BYPASS" intensity={0.05} interval={200} />
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs font-mono text-white/20 uppercase tracking-widest">
                <GlitchScramble text="Encrypted" intensity={0.04} interval={300} />
                <span>•</span>
                <GlitchScramble text={`${attemptsLeft} Attempts Remaining`} intensity={0.03} interval={400} />
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
