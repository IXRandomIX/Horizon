import { useState, useEffect } from "react";
import { Lock, ShieldAlert, Wifi, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GatekeepOS() {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(15);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  const SECRET_KEY = "WeAreGATEKEEPING777good7luck999";
  const LOCKOUT_DURATION = 56 * 60 * 60 * 1000; // 56 hours in ms

  useEffect(() => {
    const storedLockout = localStorage.getItem("gatekeep_lockout");
    if (storedLockout) {
      const time = parseInt(storedLockout);
      if (Date.now() < time + LOCKOUT_DURATION) {
        setLockoutTime(time);
      }
    }
    const storedAttempts = localStorage.getItem("gatekeep_attempts");
    if (storedAttempts) {
      setAttempts(parseInt(storedAttempts));
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime) return;

    if (password === SECRET_KEY) {
      setIsUnlocked(true);
      setError("");
      setAttempts(15);
      localStorage.removeItem("gatekeep_attempts");
    } else {
      const newAttempts = attempts - 1;
      setAttempts(newAttempts);
      localStorage.setItem("gatekeep_attempts", newAttempts.toString());
      
      if (newAttempts <= 0) {
        const time = Date.now();
        setLockoutTime(time);
        localStorage.setItem("gatekeep_lockout", time.toString());
        setError("LOCKOUT INITIATED. TRY AGAIN IN 56 HOURS.");
      } else {
        setError("ACCESS DENIED, stop trying");
      }
    }
  };

  const getTimeLeft = () => {
    if (!lockoutTime) return "";
    const remaining = (lockoutTime + LOCKOUT_DURATION) - Date.now();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
  };

  if (isUnlocked) {
    return (
      <div className="flex flex-col h-full bg-black animate-in fade-in duration-1000 relative">
        <div className="flex-1 w-full relative">
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black animate-out fade-out fill-mode-forwards duration-1000 delay-[2000ms] pointer-events-none">
            <h2 className="text-4xl md:text-7xl font-display font-black text-center px-6 leading-tight animate-glitch-gold shadow-gold">
              ACCESS GRANTED<br/>HAHAHAHHAHAH
            </h2>
          </div>
          <iframe
            src="https://unzip-helper--gatekeeplmao.replit.app/?scrlcbp=."
            className="w-full h-full border-0"
            allow="fullscreen; clipboard-read; clipboard-write"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.05)_0%,transparent_70%)]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-10 backdrop-blur-xl shadow-2xl text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8 border border-primary/20">
            {lockoutTime ? <ShieldAlert className="w-10 h-10 text-destructive animate-pulse" /> : <Lock className="w-10 h-10 text-primary" />}
          </div>
          
          <h1 className="text-3xl font-display font-black text-white mb-4 tracking-widest uppercase">
            Gatekeep LMAO OS
          </h1>
          
          <p className="text-muted-foreground mb-8">
            {lockoutTime ? `Unauthorized access detected.` : `Enter decryption key to bypass the horizon.`}
          </p>

          {lockoutTime ? (
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive font-bold">
                {error}
              </div>
              <p className="text-sm text-muted-foreground font-mono">{getTimeLeft()}</p>
            </div>
          ) : (
            <form onSubmit={handleUnlock} className="space-y-6">
              <div className="relative group">
                <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="AUTHORIZATION KEY"
                  className="bg-black/50 border-white/10 h-14 pl-12 rounded-xl text-white font-mono focus-visible:ring-primary"
                />
              </div>
              
              <AnimatePresence mode="wait">
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-destructive font-bold"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button 
                type="submit"
                className="w-full h-14 bg-primary hover:bg-primary-hover text-white font-display text-lg rounded-xl transition-all shadow-lg shadow-primary/20"
              >
                EXECUTE BYPASS
              </Button>
              
              <div className="flex items-center justify-center gap-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">
                <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Encrypted</span>
                <span>•</span>
                <span>{attempts} Attempts Remaining</span>
              </div>
            </form>
          )}
        </div>
      </motion.div>
      
      <style jsx global>{`
        @keyframes glitch-gold {
          0% { text-shadow: 2px 2px 0 #ffd700, -2px -2px 0 #000; transform: translate(0); }
          20% { text-shadow: -2px 2px 0 #ffd700, 2px -2px 0 #000; transform: translate(-2px, 2px); }
          40% { text-shadow: 2px -2px 0 #ffd700, -2px 2px 0 #000; transform: translate(2px, -2px); }
          60% { text-shadow: -2px -2px 0 #ffd700, 2px 2px 0 #000; transform: translate(-2px, -2px); }
          80% { text-shadow: 2px 2px 0 #ffd700, -2px -2px 0 #000; transform: translate(2px, 2px); }
          100% { text-shadow: -2px 2px 0 #ffd700, 2px -2px 0 #000; transform: translate(0); }
        }
        .animate-glitch-gold {
          color: #ffd700;
          animation: glitch-gold 0.3s infinite;
          font-family: var(--font-display);
        }
        .shadow-gold {
          filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.5));
        }
      `}</style>
    </div>
  );
}
