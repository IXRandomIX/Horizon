import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { toast({ title: "Username required", variant: "destructive" }); return; }
    setLoading(true);
    try {
      if (tab === "login") {
        await login(username.trim(), password);
        toast({ title: `Welcome back, ${username.trim()}!` });
      } else {
        if (!password) { toast({ title: "Password required to register", variant: "destructive" }); setLoading(false); return; }
        await register(username.trim(), password);
        toast({ title: `Account created! Welcome, ${username.trim()}!` });
      }
    } catch (err: any) {
      toast({ title: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4"
      >
        <div className="text-center mb-10">
          <h1 className="font-display text-6xl font-black text-gradient-animated tracking-widest uppercase mb-2">
            HORIZON
          </h1>
          <p className="text-white/30 text-sm tracking-widest uppercase">Your gateway to everything</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          <div className="flex gap-2 mb-8 bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setTab("login")}
              data-testid="tab-login"
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold tracking-widest uppercase transition-all ${tab === "login" ? "bg-primary text-white shadow-lg" : "text-white/40 hover:text-white/70"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab("register")}
              data-testid="tab-register"
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold tracking-widest uppercase transition-all ${tab === "register" ? "bg-primary text-white shadow-lg" : "text-white/40 hover:text-white/70"}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">Username</label>
              <Input
                data-testid="input-username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black/50 border-white/10 h-12 text-white placeholder:text-white/20 focus:border-primary/50"
                required
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">
                Password {tab === "login" ? <span className="text-white/20 normal-case">(required for accounts with one)</span> : ""}
              </label>
              <Input
                data-testid="input-password"
                type="password"
                placeholder={tab === "register" ? "Create a password" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/50 border-white/10 h-12 text-white placeholder:text-white/20 focus:border-primary/50"
              />
            </div>
            <Button
              data-testid="button-submit"
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-display text-base rounded-xl mt-2 tracking-widest uppercase"
            >
              {loading ? "..." : tab === "login" ? "Enter Horizon" : "Create Account"}
            </Button>
          </form>

          {tab === "login" && (
            <p className="text-center text-white/20 text-xs mt-5">
              Don't have an account?{" "}
              <button onClick={() => setTab("register")} className="text-primary hover:underline">Register here</button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
