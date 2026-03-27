import { useState, useEffect, useRef, useCallback } from "react";
import type React from "react";
import { Send, Hash, Settings, User, LogOut, Shield, Trash2, Plus, MessageSquare, Sparkles, Eye, MoreVertical, Reply, Edit2, Smile, X, Image as ImageIcon, Monitor, ExternalLink, Ban, Clock, Bot, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth, getSessionToken, authFetch } from "@/context/auth";
import { useNotifications } from "@/context/notifications";
import { ProfileModal } from "@/components/profile-modal";
import { EmojiPicker } from "@/components/emoji-picker";


// ── Username Gradient Colors ──────────────────────────────────────────────
const UGC_COLORS = [
  { key: "ugc:fire",       name: "🔥 Fire",        preview: "linear-gradient(to right,#ff2200,#ff6600,#ffcc00)" },
  { key: "ugc:ocean",      name: "🌊 Ocean",        preview: "linear-gradient(to right,#0033ff,#00aaff,#00ffee)" },
  { key: "ugc:royal",      name: "👑 Royal",        preview: "linear-gradient(to right,#7b2ff7,#aa55ff,#f5a623)" },
  { key: "ugc:toxic",      name: "☣️ Toxic",        preview: "linear-gradient(to right,#00ff41,#004400,#00ff41)" },
  { key: "ugc:midnight",   name: "🌙 Midnight",     preview: "linear-gradient(to right,#101585,#4040ff,#101585)" },
  { key: "ugc:rose",       name: "🌹 Rose",         preview: "linear-gradient(to right,#ff4488,#ff0066,#cc0044)" },
  { key: "ugc:ice",        name: "🧊 Ice",          preview: "linear-gradient(to right,#e0f7fa,#80deea,#b2ebf2)" },
  { key: "ugc:gold-black", name: "✨ Gold & Black", preview: "linear-gradient(to right,#ffd700,#1a1000,#ffd700)" },
  { key: "ugc:red-black",  name: "🔴 Red & Black",  preview: "linear-gradient(to right,#cc0000,#000000,#cc0000)" },
  { key: "ugc:neon",       name: "⚡ Neon",         preview: "linear-gradient(to right,#ff00ff,#00ffff,#ff00ff)" },
  { key: "ugc:sunset",     name: "🌅 Sunset",       preview: "linear-gradient(to right,#ff6b35,#f7c59f,#ee4266)" },
];

const RAINBOW_COLORS = [
  { key: "rainbow:smooth", name: "🌈 Rainbow Smooth", desc: "Slow flowing rainbow" },
  { key: "rainbow:spaz",   name: "⚡ Rainbow Spaz",   desc: "Lightning-fast rainbow cycle" },
];

// ── Username Effects ──────────────────────────────────────────────────────
const BORDER_BEAM_KEYS: Record<string, string[]> = {
  white:   ["#ffffff","#cccccc","#ffffff"],
  gold:    ["#ffd700","#ff8c00","#ffd700"],
  red:     ["#ff0000","#cc0000","#ff0000"],
  cyan:    ["#00ffff","#0080ff","#00ffff"],
  purple:  ["#aa00ff","#5500aa","#aa00ff"],
  green:   ["#00ff00","#008800","#00ff00"],
  fire:    ["#ff2200","#ff6600","#ffcc00","#ff6600","#ff2200"],
  ocean:   ["#0033ff","#00aaff","#00ffee","#00aaff","#0033ff"],
  rainbow: ["#ff0000","#ff8800","#ffff00","#00ff00","#0000ff","#8800ff","#ff0000"],
};

const USERNAME_EFFECTS = [
  { key: "efx:matrix",          name: "🟩 Matrix Green",   desc: "Green 1s & 0s rain down behind username" },
  { key: "efx:matrix:red",      name: "🔴 Matrix Red",     desc: "Red matrix rain" },
  { key: "efx:matrix:blue",     name: "🔵 Matrix Blue",    desc: "Blue matrix rain" },
  { key: "efx:matrix:gold",     name: "✨ Matrix Gold",    desc: "Golden matrix rain" },
  { key: "efx:matrix:purple",   name: "💜 Matrix Purple",  desc: "Purple matrix rain" },
  { key: "efx:matrix:cyan",     name: "🩵 Matrix Cyan",    desc: "Cyan matrix rain" },
  { key: "efx:matrix:white",    name: "⬜ Matrix White",   desc: "White matrix rain" },
  { key: "efx:matrix:pink",     name: "💗 Matrix Pink",    desc: "Pink matrix rain" },
  { key: "efx:glitch-text",     name: "👾 Glitch Text",    desc: "Letters randomly flip to crazy symbols" },
  { key: "efx:galaxy",          name: "🌌 Galaxy",         desc: "Stars and nebula behind the username" },
  { key: "efx:blackhole",       name: "🕳️ Black Hole",     desc: "Spinning black hole sucking in stars" },
  { key: "efx:rainbow",         name: "🌈 Rainbow Flow",   desc: "Full rainbow sweeping through text" },
  { key: "efx:border:white",    name: "□ Border White",    desc: "Glowing white border beam" },
  { key: "efx:border:gold",     name: "□ Border Gold",     desc: "Golden beam racing the border" },
  { key: "efx:border:red",      name: "□ Border Red",      desc: "Red beam racing the border" },
  { key: "efx:border:cyan",     name: "□ Border Cyan",     desc: "Cyan neon border beam" },
  { key: "efx:border:purple",   name: "□ Border Purple",   desc: "Purple border beam" },
  { key: "efx:border:green",    name: "□ Border Green",    desc: "Green border beam" },
  { key: "efx:border:fire",     name: "□ Border Fire",     desc: "Fire gradient border beam" },
  { key: "efx:border:ocean",    name: "□ Border Ocean",    desc: "Ocean gradient border beam" },
  { key: "efx:border:rainbow",  name: "□ Border Rainbow",  desc: "Rainbow border beam" },
];

const MATRIX_COLORS: Record<string, string> = {
  "efx:matrix":        "#00ff41",
  "efx:matrix:red":    "#ff2222",
  "efx:matrix:blue":   "#0088ff",
  "efx:matrix:gold":   "#ffd700",
  "efx:matrix:purple": "#bb00ff",
  "efx:matrix:cyan":   "#00ffff",
  "efx:matrix:white":  "#ffffff",
  "efx:matrix:pink":   "#ff44cc",
};

const AVAILABLE_FONTS: { key: string; name: string; family: string; category: string }[] = [
  // Default
  { key: "sans",              name: "Default",           family: "inherit",                             category: "Default" },
  // Sans-serif
  { key: "Roboto",            name: "Roboto",            family: "'Roboto', sans-serif",                category: "Sans" },
  { key: "Open Sans",         name: "Open Sans",         family: "'Open Sans', sans-serif",             category: "Sans" },
  { key: "Poppins",           name: "Poppins",           family: "'Poppins', sans-serif",               category: "Sans" },
  { key: "Montserrat",        name: "Montserrat",        family: "'Montserrat', sans-serif",            category: "Sans" },
  { key: "Raleway",           name: "Raleway",           family: "'Raleway', sans-serif",               category: "Sans" },
  { key: "Nunito",            name: "Nunito",            family: "'Nunito', sans-serif",                category: "Sans" },
  { key: "Comfortaa",         name: "Comfortaa",         family: "'Comfortaa', cursive",                category: "Sans" },
  { key: "Fredoka",           name: "Fredoka",           family: "'Fredoka', sans-serif",               category: "Sans" },
  { key: "Outfit",            name: "Outfit",            family: "'Outfit', sans-serif",                category: "Sans" },
  { key: "DM Sans",           name: "DM Sans",           family: "'DM Sans', sans-serif",               category: "Sans" },
  { key: "Space Grotesk",     name: "Space Grotesk",     family: "'Space Grotesk', sans-serif",         category: "Sans" },
  { key: "Josefin Sans",      name: "Josefin Sans",      family: "'Josefin Sans', sans-serif",          category: "Sans" },
  { key: "Oswald",            name: "Oswald",            family: "'Oswald', sans-serif",                category: "Sans" },
  { key: "Exo 2",             name: "Exo 2",             family: "'Exo 2', sans-serif",                 category: "Sans" },
  { key: "Kanit",             name: "Kanit",             family: "'Kanit', sans-serif",                 category: "Sans" },
  { key: "Ubuntu",            name: "Ubuntu",            family: "'Ubuntu', sans-serif",                category: "Sans" },
  { key: "Rajdhani",          name: "Rajdhani",          family: "'Rajdhani', sans-serif",              category: "Sans" },
  { key: "Titillium Web",     name: "Titillium Web",     family: "'Titillium Web', sans-serif",         category: "Sans" },
  // Serif
  { key: "Playfair Display",  name: "Playfair Display",  family: "'Playfair Display', serif",           category: "Serif" },
  { key: "Merriweather",      name: "Merriweather",      family: "'Merriweather', serif",               category: "Serif" },
  { key: "Libre Baskerville", name: "Libre Baskerville", family: "'Libre Baskerville', serif",          category: "Serif" },
  { key: "Lora",              name: "Lora",              family: "'Lora', serif",                       category: "Serif" },
  { key: "Cinzel",            name: "Cinzel",            family: "'Cinzel', serif",                     category: "Serif" },
  // Display
  { key: "Bebas Neue",        name: "Bebas Neue",        family: "'Bebas Neue', sans-serif",            category: "Display" },
  { key: "Orbitron",          name: "Orbitron",          family: "'Orbitron', sans-serif",              category: "Display" },
  { key: "Righteous",         name: "Righteous",         family: "'Righteous', sans-serif",             category: "Display" },
  { key: "Russo One",         name: "Russo One",         family: "'Russo One', sans-serif",             category: "Display" },
  { key: "Audiowide",         name: "Audiowide",         family: "'Audiowide', sans-serif",             category: "Display" },
  { key: "Oxanium",           name: "Oxanium",           family: "'Oxanium', sans-serif",               category: "Display" },
  { key: "Syne",              name: "Syne",              family: "'Syne', sans-serif",                  category: "Display" },
  { key: "Abril Fatface",     name: "Abril Fatface",     family: "'Abril Fatface', cursive",            category: "Display" },
  { key: "Bangers",           name: "Bangers",           family: "'Bangers', cursive",                  category: "Display" },
  // Handwriting
  { key: "Dancing Script",    name: "Dancing Script",    family: "'Dancing Script', cursive",           category: "Hand" },
  { key: "Pacifico",          name: "Pacifico",          family: "'Pacifico', cursive",                 category: "Hand" },
  { key: "Caveat",            name: "Caveat",            family: "'Caveat', cursive",                   category: "Hand" },
  { key: "Permanent Marker",  name: "Permanent Marker",  family: "'Permanent Marker', cursive",         category: "Hand" },
  { key: "Architects Daughter", name: "Architects Daughter", family: "'Architects Daughter', cursive", category: "Hand" },
  { key: "Lobster",           name: "Lobster",           family: "'Lobster', cursive",                  category: "Hand" },
  { key: "Satisfy",           name: "Satisfy",           family: "'Satisfy', cursive",                  category: "Hand" },
  { key: "Great Vibes",       name: "Great Vibes",       family: "'Great Vibes', cursive",              category: "Hand" },
  // Sans — already in HTML, now wired up
  { key: "Inter",             name: "Inter",             family: "'Inter', sans-serif",                 category: "Sans" },
  { key: "Plus Jakarta Sans", name: "Plus Jakarta",      family: "'Plus Jakarta Sans', sans-serif",     category: "Sans" },
  { key: "IBM Plex Sans",     name: "IBM Plex Sans",     family: "'IBM Plex Sans', sans-serif",         category: "Sans" },
  { key: "Geist",             name: "Geist",             family: "'Geist', sans-serif",                 category: "Sans" },
  { key: "Work Sans",         name: "Work Sans",         family: "'Work Sans', sans-serif",             category: "Sans" },
  { key: "Barlow",            name: "Barlow",            family: "'Barlow', sans-serif",                category: "Sans" },
  { key: "Manrope",           name: "Manrope",           family: "'Manrope', sans-serif",               category: "Sans" },
  { key: "Figtree",           name: "Figtree",           family: "'Figtree', sans-serif",               category: "Sans" },
  { key: "Prompt",            name: "Prompt",            family: "'Prompt', sans-serif",                category: "Sans" },
  // Serif — already in HTML, now wired up
  { key: "Source Serif 4",    name: "Source Serif 4",    family: "'Source Serif 4', serif",             category: "Serif" },
  // Display
  { key: "Anton",             name: "Anton",             family: "'Anton', sans-serif",                 category: "Display" },
  { key: "Barlow Condensed",  name: "Barlow Condensed",  family: "'Barlow Condensed', sans-serif",      category: "Display" },
  { key: "Teko",              name: "Teko",              family: "'Teko', sans-serif",                  category: "Display" },
  { key: "Saira Condensed",   name: "Saira Condensed",   family: "'Saira Condensed', sans-serif",       category: "Display" },
  { key: "Secular One",       name: "Secular One",       family: "'Secular One', sans-serif",           category: "Display" },
  { key: "Yeseva One",        name: "Yeseva One",        family: "'Yeseva One', serif",                 category: "Display" },
  // Handwriting — extra
  { key: "Boogaloo",          name: "Boogaloo",          family: "'Boogaloo', cursive",                 category: "Hand" },
  { key: "Lilita One",        name: "Lilita One",        family: "'Lilita One', cursive",               category: "Hand" },
  { key: "Passion One",       name: "Passion One",       family: "'Passion One', cursive",              category: "Hand" },
  // Monospace / Code
  { key: "JetBrains Mono",    name: "JetBrains Mono",    family: "'JetBrains Mono', monospace",         category: "Code" },
  { key: "Fira Code",         name: "Fira Code",         family: "'Fira Code', monospace",              category: "Code" },
  { key: "Source Code Pro",   name: "Source Code Pro",   family: "'Source Code Pro', monospace",        category: "Code" },
  { key: "Space Mono",        name: "Space Mono",        family: "'Space Mono', monospace",             category: "Code" },
  { key: "IBM Plex Mono",     name: "IBM Plex Mono",     family: "'IBM Plex Mono', monospace",          category: "Code" },
  { key: "Roboto Mono",       name: "Roboto Mono",       family: "'Roboto Mono', monospace",            category: "Code" },
  { key: "Geist Mono",        name: "Geist Mono",        family: "'Geist Mono', monospace",             category: "Code" },
  { key: "Share Tech Mono",   name: "Share Tech Mono",   family: "'Share Tech Mono', monospace",        category: "Code" },
  // Gaming / Pixel
  { key: "Press Start 2P",    name: "Press Start 2P",    family: "'Press Start 2P', monospace",         category: "Gaming" },
  { key: "VT323",             name: "VT323",             family: "'VT323', monospace",                  category: "Gaming" },
  { key: "Chakra Petch",      name: "Chakra Petch",      family: "'Chakra Petch', sans-serif",          category: "Gaming" },
  { key: "Bungee",            name: "Bungee",            family: "'Bungee', sans-serif",                category: "Gaming" },
  { key: "Bungee Shade",      name: "Bungee Shade",      family: "'Bungee Shade', sans-serif",          category: "Gaming" },
  { key: "Black Han Sans",    name: "Black Han Sans",    family: "'Black Han Sans', sans-serif",        category: "Gaming" },
  { key: "Creepster",         name: "Creepster",         family: "'Creepster', cursive",                category: "Gaming" },
  { key: "Special Elite",     name: "Special Elite",     family: "'Special Elite', cursive",            category: "Gaming" },
  { key: "Rye",               name: "Rye",               family: "'Rye', serif",                        category: "Gaming" },
  { key: "League Gothic",     name: "League Gothic",     family: "'League Gothic', sans-serif",         category: "Display" },
  // Zalgo / cursed text (Unicode combining marks — not a real font)
  { key: "zalgo:low",  name: "Z̧̮a̺l̡g̯o̕ (Low)",   family: "inherit", category: "Special" },
  { key: "zalgo:mid",  name: "Z̴̛͔a̵͚̕l͖̕g̡͔o̡̗ (Mid)",   family: "inherit", category: "Special" },
  { key: "zalgo:high", name: "Z̷̢̨̛͍͓͓͕̝͔̠̮͕̝̰̅̿̒̿̃͌̅̉̌̀̐a̵̧͍͎̝̘͔̤̫̝̣͍̅͂̾̑̃̾l̷̢̡̨̧͚̯͎̫̬̝͕̦̤̙͚̩͓̅̐̐̿͂̐̾̊̑̀̃g̵̡̡̛̛͓̬̣̮͎̱̮͖͚̱̭͈̫̪̲̞̱͈̟̭̖̀̂͋͂̈́̑͑̑̊̂̽͌̂̆̀̇̉̃̈́́̓̊͂̓̚͝o̷̢̤̠̟̙̬̝͓̦͍̦̬͔͓͖̍̽̑̈́͒̑̒̿̋̑͛̎̀̽͋ (High)", family: "inherit", category: "Special" },
  // FontLibrary.org — open-source originals
  { key: "GlacialIndifferenceRegular", name: "Glacial Indiff.",      family: "'GlacialIndifferenceRegular', sans-serif", category: "FLB" },
  { key: "OstrichSansRegular",         name: "Ostrich Sans",         family: "'OstrichSansRegular', sans-serif",         category: "FLB" },
  { key: "ChunkFiveExRegular",         name: "Chunk Five",           family: "'ChunkFiveExRegular', serif",              category: "FLB" },
  { key: "LeagueGothicRegular",        name: "League Gothic",        family: "'LeagueGothicRegular', sans-serif",        category: "FLB" },
  { key: "AllerRegular",               name: "Aller",                family: "'AllerRegular', sans-serif",               category: "FLB" },
  { key: "ProcionoRegular",            name: "Prociono",             family: "'ProcionoRegular', serif",                 category: "FLB" },
  { key: "BergamoStdRegular",          name: "Bergamo",              family: "'BergamoStdRegular', serif",               category: "FLB" },
];

// ── Zalgo text transform ───────────────────────────────────────────────────
const ZALGO_UP = ['\u0300','\u0301','\u0302','\u0303','\u0304','\u0305','\u0306','\u0307','\u0308','\u0309','\u030a','\u030b','\u030c','\u030d','\u030e','\u030f','\u0310','\u0311','\u0312','\u0313','\u0314','\u0315','\u031a','\u031b','\u033d','\u033e','\u033f','\u0340','\u0341','\u0346','\u034a','\u034b','\u034c','\u0350','\u0351','\u0352','\u0357','\u035b','\u0363','\u0364','\u0365','\u0366','\u0367','\u0368','\u0369','\u036a','\u036b','\u036c','\u036d','\u036e','\u036f'];
const ZALGO_MID = ['\u0315','\u031b','\u0300','\u0301','\u0302','\u0303','\u0304','\u0305','\u0306','\u0307','\u0308','\u0309','\u030a','\u030b','\u030c','\u030d','\u030e','\u031a','\u0338','\u0322','\u0323','\u0324','\u0325','\u0326','\u0327','\u0328','\u0329','\u032a','\u032b','\u032c','\u032d','\u032e','\u032f','\u0330','\u0331','\u0332','\u0333','\u0339','\u033a','\u033b','\u033c','\u0345'];
const ZALGO_DOWN = ['\u0316','\u0317','\u0318','\u0319','\u031c','\u031d','\u031e','\u031f','\u0320','\u0321','\u0322','\u0323','\u0324','\u0325','\u0326','\u0327','\u0328','\u0329','\u032a','\u032b','\u032c','\u032d','\u032e','\u032f','\u0330','\u0331','\u0332','\u0333','\u0339','\u033a','\u033b','\u033c','\u0345','\u0347','\u0348','\u0349','\u034d','\u034e','\u0353','\u0354','\u0355','\u0356','\u0359','\u035a','\u035c','\u035d','\u035e','\u035f','\u0360','\u0361','\u0362','\u0489'];
// Deterministic zalgo: uses charCode as seed so the same text always produces the same result
function applyZalgo(text: string, intensity: "low" | "mid" | "high" = "mid"): string {
  const ups  = intensity === "low" ? 1 : intensity === "mid" ? 3 : 6;
  const mids = intensity === "low" ? 0 : intensity === "mid" ? 1 : 2;
  const downs = intensity === "low" ? 1 : intensity === "mid" ? 2 : 4;
  let result = "";
  for (let ci = 0; ci < text.length; ci++) {
    const ch = text[ci];
    const code = ch.charCodeAt(0);
    result += ch;
    for (let i = 0; i < ups;   i++) result += ZALGO_UP  [(code * (i + 1) * 13 + ci * 7)  % ZALGO_UP.length];
    for (let i = 0; i < mids;  i++) result += ZALGO_MID [(code * (i + 3) * 17 + ci * 11) % ZALGO_MID.length];
    for (let i = 0; i < downs; i++) result += ZALGO_DOWN[(code * (i + 2) * 19 + ci * 5)  % ZALGO_DOWN.length];
  }
  return result;
}

// ── Helper components ─────────────────────────────────────────────────────
function GlitchTextUsername({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const [display, setDisplay] = useState(text);
  const SYMS = '!@#$%^&*{}[]<>?/\\|~`░▒▓█▄▀■□▪▫Δ∑Ω≈∞';
  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>;
    const glitch = () => {
      let count = 0;
      const frame = () => {
        const chars = text.split('');
        const n = Math.floor(Math.random() * (chars.length)) + 1;
        for (let i = 0; i < n; i++) {
          chars[Math.floor(Math.random() * chars.length)] = SYMS[Math.floor(Math.random() * SYMS.length)];
        }
        setDisplay(chars.join(''));
        count++;
        if (count < 8) tid = setTimeout(frame, 60);
        else { setDisplay(text); tid = setTimeout(glitch, 1500 + Math.random() * 2000); }
      };
      frame();
    };
    const init = setTimeout(glitch, 500 + Math.random() * 1500);
    return () => { clearTimeout(init); clearTimeout(tid); };
  }, [text]);
  return <span className={className} style={style} data-text={text}>{display}</span>;
}

function BorderBeamUsername({ text, borderKey, className, style }: { text: string; borderKey: string; className?: string; style?: React.CSSProperties }) {
  const cols = BORDER_BEAM_KEYS[borderKey] ?? BORDER_BEAM_KEYS.white;
  const conicGrad = `conic-gradient(from 0deg, ${cols.join(", ")}, ${cols[0]})`;
  return (
    <span style={{ position: "relative", display: "inline-block", padding: "1px 5px", borderRadius: "4px", overflow: "hidden" }}>
      <span aria-hidden style={{ position: "absolute", inset: "-40px", background: conicGrad, animation: "borderBeamSpin 2s linear infinite", borderRadius: "4px" }} />
      <span aria-hidden style={{ position: "absolute", inset: "1.5px", background: "#000", borderRadius: "3px", zIndex: 1 }} />
      <span className={className} style={{ position: "relative", zIndex: 2, ...style }}>{text}</span>
    </span>
  );
}

// ── Canvas-based username effect components ────────────────────────────────
function MatrixCanvas({ color }: { color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 130, H = 36;
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const sz = 8, cols = Math.floor(W / sz);
    // Each column: current row position
    const drops: number[] = Array.from({ length: cols }, () => -Math.floor(Math.random() * 10));
    // Track opacity per cell for fade trail without opaque background
    const opacities: number[][] = Array.from({ length: cols }, () => Array(Math.ceil(H / sz) + 1).fill(0));
    let animId: number, tick = 0;
    const frame = () => {
      tick++;
      if (tick % 3 === 0) {
        // Fade existing opacities (transparent trail effect without black bg)
        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i < cols; i++) {
          for (let row = 0; row < opacities[i].length; row++) {
            if (opacities[i][row] > 0) {
              opacities[i][row] = Math.max(0, opacities[i][row] - 0.18);
              const y = row * sz;
              if (opacities[i][row] > 0.05) {
                ctx.globalAlpha = opacities[i][row];
                ctx.fillStyle = color;
                ctx.font = `bold ${sz}px monospace`;
                ctx.fillText(Math.random() > 0.5 ? '1' : '0', i * sz + 1, y + sz);
              }
            }
          }
          // Draw head character
          const headY = drops[i];
          if (headY >= 0 && headY < opacities[i].length) {
            opacities[i][headY] = 1;
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${sz}px monospace`;
            ctx.fillText(Math.random() > 0.5 ? '1' : '0', i * sz + 1, headY * sz + sz);
          }
          drops[i]++;
          if (drops[i] * sz > H && Math.random() > 0.94) drops[i] = -Math.floor(Math.random() * 8);
        }
        ctx.globalAlpha = 1;
      }
      animId = requestAnimationFrame(frame);
    };
    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [color]);
  return <canvas ref={canvasRef} width={W} height={H} style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none', borderRadius:3, zIndex:0 }} />;
}

function GalaxyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 130, H = 36;
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    type GStar = { x: number; y: number; r: number; phase: number; spd: number; big: boolean };
    const stars: GStar[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      phase: Math.random() * Math.PI * 2,
      spd: 0.8 + Math.random() * 1.2,
      big: Math.random() > 0.82,
    }));
    let t = 0, animId: number;
    const frame = () => {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      const glow = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.55);
      glow.addColorStop(0, 'rgba(90,0,210,0.10)');
      glow.addColorStop(0.5, 'rgba(0,20,160,0.06)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
      for (const s of stars) {
        const op = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.spd + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${op * 0.95})`;
        ctx.fill();
        if (s.big && op > 0.7) {
          ctx.strokeStyle = `rgba(190,170,255,${op * 0.55})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(s.x - s.r * 3.5, s.y); ctx.lineTo(s.x + s.r * 3.5, s.y);
          ctx.moveTo(s.x, s.y - s.r * 3.5); ctx.lineTo(s.x, s.y + s.r * 3.5);
          ctx.stroke();
        }
      }
      animId = requestAnimationFrame(frame);
    };
    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, []);
  return <canvas ref={canvasRef} width={W} height={H} style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:0 }} />;
}

function BlackholeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 130, H = 36;
  const CX = W / 2, CY = H / 2, BH_R = 6;
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    type BHStar = { angle: number; dist: number; spd: number; op: number };
    const stars: BHStar[] = Array.from({ length: 30 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: 18 + Math.random() * 68,
      spd: 0.003 + Math.random() * 0.005,
      op: 0.5 + Math.random() * 0.5,
    }));
    let rot = 0, animId: number;
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      rot += 0.018;
      // outer glow
      const glow = ctx.createRadialGradient(CX, CY, BH_R, CX, CY, 32);
      glow.addColorStop(0, 'rgba(90,0,150,0.45)'); glow.addColorStop(0.5, 'rgba(40,0,80,0.15)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
      // accretion disc rings
      ctx.save(); ctx.translate(CX, CY); ctx.rotate(rot * 0.4);
      for (let i = 0; i < 3; i++) {
        const r = BH_R + 5 + i * 5;
        const g = ctx.createLinearGradient(-r * 1.8, 0, r * 1.8, 0);
        g.addColorStop(0, `rgba(255,${120 - i * 25},0,${0.75 - i * 0.17})`);
        g.addColorStop(0.5, `rgba(180,80,255,${0.5 - i * 0.1})`);
        g.addColorStop(1, `rgba(255,${120 - i * 25},0,${0.75 - i * 0.17})`);
        ctx.beginPath(); ctx.ellipse(0, 0, r * 1.8, r * 0.38, 0, 0, Math.PI * 2);
        ctx.strokeStyle = g; ctx.lineWidth = 2.2 - i * 0.4; ctx.stroke();
      }
      ctx.restore();
      // black hole disc
      const bhg = ctx.createRadialGradient(CX, CY, 0, CX, CY, BH_R);
      bhg.addColorStop(0, '#000'); bhg.addColorStop(0.85, '#000'); bhg.addColorStop(1, 'rgba(60,0,90,0.7)');
      ctx.beginPath(); ctx.arc(CX, CY, BH_R, 0, Math.PI * 2); ctx.fillStyle = bhg; ctx.fill();
      // infalling stars
      for (const s of stars) {
        s.angle += s.spd * (60 / Math.max(s.dist, 5));
        s.dist -= 0.18;
        if (s.dist < BH_R) { s.dist = 22 + Math.random() * 60; s.angle = Math.random() * Math.PI * 2; s.op = 0.5 + Math.random() * 0.5; }
        const sx = CX + Math.cos(s.angle) * s.dist;
        const sy = CY + Math.sin(s.angle) * s.dist * 0.33;
        const fade = Math.min(1, (s.dist - BH_R) / 14);
        ctx.beginPath(); ctx.arc(sx, sy, 0.85, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${fade * s.op})`; ctx.fill();
      }
      animId = requestAnimationFrame(frame);
    };
    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, []);
  return <canvas ref={canvasRef} width={W} height={H} style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:0 }} />;
}

// ── Color / class helpers ─────────────────────────────────────────────────
function getColorInfo(roleColor: string, animation: string): { colorClass: string; colorStyle?: React.CSSProperties } {
  if (roleColor?.startsWith("ugc:")) return { colorClass: `ugc-${roleColor.slice(4)}` };
  if (roleColor === "rainbow:smooth") return { colorClass: "username-rainbow-smooth" };
  if (roleColor === "rainbow:spaz")   return { colorClass: "username-rainbow-spaz" };
  if (roleColor === "gradient") {
    if (animation.startsWith("efx:")) return { colorClass: "", colorStyle: { color: "#ffffff" } };
    const gradients = ["grad-magenta-blue","grad-red-orange","grad-cyan-purple","grad-wasabi-charcoal"];
    const idx = parseInt(animation.split("-")[1] ?? "0");
    return { colorClass: gradients[idx % gradients.length] ?? "" };
  }
  return { colorClass: "", colorStyle: roleColor ? { color: roleColor } : undefined };
}

// returns preview swatch style for a ugc: or rainbow: color key
function getUgcSwatchStyle(key: string): React.CSSProperties {
  const found = UGC_COLORS.find(c => c.key === key);
  if (found) return { background: found.preview };
  if (key === "rainbow:smooth" || key === "rainbow:spaz")
    return { background: "linear-gradient(to right,#f00,#f80,#ff0,#0f0,#00f,#80f)" };
  return { background: "#9ca3af" };
}

// role color: return className + optional inline style for rendering role badge/text
function getRoleColorInfo(color: string): { cls: string; style?: React.CSSProperties } {
  if (!color) return { cls: "", style: { color: "#9ca3af" } };
  if (color.startsWith("ugc:"))       return { cls: `ugc-${color.slice(4)}` };
  if (color === "rainbow:smooth")     return { cls: "username-rainbow-smooth" };
  if (color === "rainbow:spaz")       return { cls: "username-rainbow-spaz" };
  return { cls: "", style: { color } };
}

type Message = {
  id: number;
  channelId: number;
  username: string;
  content: string;
  role: string;
  roleColor: string;
  timestamp: string;
  isEdited?: boolean;
  replyToId?: number;
  replyToUsername?: string;
  replyToContent?: string;
  reactions?: any[];
};

type Channel = {
  id: number;
  name: string;
};

export default function Chat() {
  const { user: authUser, updateUser: updateAuthUser } = useAuth();
  const [user, setUser] = useState<{ username: string; role: string; isAdmin: boolean; roles?: string[]; roleColor?: string; font?: string; animation?: string } | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [banStatus, setBanStatus] = useState<{ banned: boolean; ban: { reason: string; bannedBy: string; expiresAt: string | null } | null; timedOut: boolean; timeout: { expiresAt: string } | null } | null>(null);
  const [cmdPickerIndex, setCmdPickerIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [diesInCoolWay, setDiesInCoolWay] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showChannelsPanel, setShowChannelsPanel] = useState(false);
  const [showRolesPanel, setShowRolesPanel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowedUsers, setAllowedUsers] = useState("");
  const [readOnlyPublic, setReadOnlyPublic] = useState(false);
  const [proxies, setProxies] = useState<any[]>([]);
  const [editingProxy, setEditingProxy] = useState<{ id: number; name: string; url: string } | null>(null);
  const [webviewUrl, setWebviewUrl] = useState<string | null>(null);
  // XP Giver & Remover panel
  const [showXPPanel, setShowXPPanel] = useState(false);
  const [xpUsername, setXpUsername] = useState("");
  const [xpAmount, setXpAmount] = useState("");
  const [xpAction, setXpAction] = useState<"add" | "remove">("add");
  const [xpLoading, setXpLoading] = useState(false);
  const [xpResult, setXpResult] = useState<{ newXP: number; username: string } | null>(null);
  // Admin appearance panel
  const [apTarget, setApTarget] = useState("");
  const [apColor, setApColor] = useState("#9ca3af");
  const [apEffects, setApEffects] = useState<string[]>([]);
  const [apFont, setApFont] = useState("sans");
  const [apColorTab, setApColorTab] = useState<"solid" | "gradient" | "rainbow">("solid");
  const [apShowEffects, setApShowEffects] = useState(false);
  const [apShowFonts, setApShowFonts] = useState(false);
  const [apFontCategory, setApFontCategory] = useState("All");
  const [roles, setRoles] = useState<any[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleColor, setNewRoleColor] = useState("#9ca3af");
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [assignUsername, setAssignUsername] = useState("");
  const [selectedRolesForUser, setSelectedRolesForUser] = useState<string[]>([]);
  const [rolesByName, setRolesByName] = useState<{ [key: string]: any[] }>({});
  const [showRoleSidebar, setShowRoleSidebar] = useState(true);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [rulesAccepted, setRulesAccepted] = useState(() => localStorage.getItem("horizon_rules_accepted") === "true");
  const [hasVisitedRules, setHasVisitedRules] = useState(() => localStorage.getItem("horizon_visited_rules") === "true");
  const [showEnjoy, setShowEnjoy] = useState(false);
  const { toast } = useToast();
  const { markChatRead } = useNotifications();

  const AVAILABLE_PERMISSIONS = ["admin_panel", "manage_channels", "server_settings", "manage_roles", "talk_in_private", "manage_proxies"];
  const PERMISSION_LABELS: Record<string, string> = {
    admin_panel: "Admin Panel",
    manage_channels: "Manage Channels",
    server_settings: "Server Settings",
    manage_roles: "Manage Roles",
    talk_in_private: "Talk in Private/Restricted Channels",
    manage_proxies: "Manage Proxies",
  };

  const isChannelReadOnly = (channel: any): boolean => {
    if (!channel) return false;
    if (channel.readOnlyPublic) return true;
    return false;
  };

  const canPostInChannel = (channel: any): boolean => {
    if (!channel) return false;
    if (!user) return false;
    if (channel.isLogs) return false;
    if (user.username === "RandomIX" || user.isAdmin) return true;
    if (userHasPermission("talk_in_private")) return true;
    if (channel.readOnlyPublic) return false;
    return true;
  };

  const userHasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.isAdmin || user.username === "RandomIX") return true; // Admin/Owner have all permissions
    if (!user.roles || user.roles.length === 0) return false;
    const userRoles = roles.filter(r => user.roles!.includes(r.name));
    const allPerms = userRoles.flatMap((r: any) => r.permissions || []);
    if (allPerms.includes("admin_panel")) return true; // Full access for CO OWNER / admin_panel holders
    return allPerms.includes(permission);
  };

  const MOD_TIMES_BAN = ["1 minute","3 minutes","1 hour","10 hours","1 day","2 days","3 days","10 days","1 month","2 months","3 months","1 year","2 years","3 years","10 years"];
  const MOD_TIMES_TIMEOUT = ["30 seconds","1 minute","3 minutes","1 hour","10 hours","1 day","2 days","3 days","10 days","1 month","2 months","3 months","1 year","2 years","3 years","10 years"];
  const isBanCapable = user?.username === "RandomIX" || (user?.roles ?? []).some((r: string) => ["Owner", "CO OWNER"].includes(r));
  const MOD_COMMANDS = [
    ...(isBanCapable ? [
      { cmd: "/ban",   syntax: "/ban <username> <time> [reason]", icon: "🔨", desc: "Temporarily or permanently ban a user from chat.", needsTime: "ban" as const, needsReason: true },
      { cmd: "/unban", syntax: "/unban <username>",               icon: "✅", desc: "Lift an active ban and let the user chat again.",  needsTime: null,           needsReason: false },
    ] : []),
    { cmd: "/timeout",  syntax: "/timeout <username> <time>",    icon: "⏱️", desc: "Silence a user for a set period — they can still read chat.", needsTime: "timeout" as const, needsReason: false },
    { cmd: "/untimeout",syntax: "/untimeout <username>",          icon: "🔊", desc: "Remove an active timeout and restore posting privileges.",    needsTime: null,                needsReason: false },
  ];
  const showCmdPicker = userHasPermission("admin_panel") && newMessage.startsWith("/") && !newMessage.includes("\n");
  const cmdQuery = showCmdPicker ? newMessage.split(" ")[0].toLowerCase() : "";
  const filteredCmds = showCmdPicker ? MOD_COMMANDS.filter(c => c.cmd.startsWith(cmdQuery)) : [];
  const activeCmd = showCmdPicker && filteredCmds.length === 0 && newMessage.includes(" ")
    ? MOD_COMMANDS.find(c => c.cmd === newMessage.split(" ")[0].toLowerCase()) ?? null
    : null;
  const cmdParts = newMessage.trim().split(/\s+/);
  const hintCmd = activeCmd || filteredCmds[0] || null;

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const justSentRef = useRef(false);

  const scrollToBottom = useCallback((force = false) => {
    if (!messagesContainerRef.current) return;
    const el = messagesContainerRef.current;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (force || !isUserScrolling || isNearBottom) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [isUserScrolling]);

  useEffect(() => {
    if (authUser) {
      setUser({
        username: authUser.username,
        role: authUser.role,
        isAdmin: authUser.isAdmin,
        roles: authUser.roles,
        roleColor: authUser.roleColor,
        font: authUser.font,
        animation: authUser.animation,
      });
    } else {
      setUser(null);
    }
  }, [authUser]);

  useEffect(() => {
    fetchChannels();
    initializeReadOnlyChannels();
    markChatRead();
  }, []);

  const initializeReadOnlyChannels = async () => {
    // Ensure announcements and rules channels exist
    const res = await fetch("/api/chat/channels");
    const channels = await res.json();
    const channelArr = Array.isArray(channels) ? channels : [];
    const hasAnnouncements = channelArr.some((ch: any) => ch.name === "announcements");
    const hasRules = channelArr.some((ch: any) => ch.name === "rules");
    
    if (!hasAnnouncements) {
      await fetch("/api/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "announcements", isPrivate: false, allowedUsers: [] }),
      });
    }
    if (!hasRules) {
      await fetch("/api/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "rules", isPrivate: false, allowedUsers: [] }),
      });
    }
  };

  useEffect(() => {
    if (activeChannel) {
      setMessages([]);
      lastMessageIdRef.current = 0;
      fetchMessages(activeChannel.id);
    }
  }, [activeChannel]);

  useEffect(() => {
    if (justSentRef.current) {
      justSentRef.current = false;
      scrollToBottom(true);
    } else {
      scrollToBottom(false);
    }
  }, [messages]);

  // Real-time polling for new messages (incremental - only fetches new ones)
  useEffect(() => {
    if (!activeChannel) return;
    const interval = setInterval(() => {
      fetchMessages(activeChannel.id, true);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeChannel]);

  // Ban status check
  const fetchBanStatus = useCallback(async () => {
    const token = getSessionToken();
    if (!token) return;
    const res = await fetch("/api/chat/ban-status", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setBanStatus(await res.json());
  }, []);

  useEffect(() => {
    if (user) {
      fetchBanStatus();
      const interval = setInterval(fetchBanStatus, 15000);
      return () => clearInterval(interval);
    }
  }, [user, fetchBanStatus]);

  // Real-time polling for roles
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchRoles();
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch users by role for sidebar
  useEffect(() => {
    const fetchRoleUsers = async () => {
      const roleMap: { [key: string]: any[] } = {};
      for (const role of roles) {
        const res = await fetch(`/api/chat/roles/${role.name}/users`);
        if (res.ok) {
          const users = await res.json();
          roleMap[role.name] = users;
        }
      }
      setRolesByName(roleMap);
    };
    if (roles.length > 0) fetchRoleUsers();
  }, [roles]);

  const fetchChannels = async () => {
    const usernameParam = user ? `?username=${user.username}` : "";
    const res = await fetch(`/api/chat/channels${usernameParam}`);
    const data = await res.json();
    const channelList = Array.isArray(data) ? data : [];
    setChannels(channelList);
    if (channelList.length > 0 && !activeChannel) setActiveChannel(channelList[0]);
  };

  const fetchRoles = async () => {
    const res = await fetch("/api/chat/roles");
    const data = await res.json();
    setRoles(data);
  };

  const fetchProxies = async () => {
    const res = await fetch("/api/proxies");
    if (res.ok) setProxies(await res.json());
  };

  const resetUserAppearance = async () => {
    const target = apTarget.trim() || user?.username;
    if (!target) return;
    const updates = { roleColor: "#9ca3af", animation: "none", font: "sans" };
    const res = await authFetch(`/api/chat/users/${target}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      toast({ title: `Reset ${target} to defaults` });
      setApColor("#9ca3af");
      setApEffects([]);
      setApFont("sans");
      setApColorTab("solid");
      if (target === user?.username) {
        const updated = await res.json();
        const merged = { ...user, ...updated };
        setUser(merged);
        updateAuthUser(updated);
        localStorage.setItem("horizon_chat_user", JSON.stringify(merged));
      }
    } else {
      toast({ title: "Failed to reset", variant: "destructive" });
    }
  };

  const applyUserAppearance = async () => {
    const target = apTarget.trim() || user?.username;
    if (!target) return;
    const animStr = apEffects.length > 0 ? apEffects.join("|") : "none";
    const updates: any = { roleColor: apColor, animation: animStr, font: apFont };
    const res = await authFetch(`/api/chat/users/${target}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      toast({ title: `Appearance updated for ${target}` });
      if (target === user?.username) {
        const updated = await res.json();
        const merged = { ...user, ...updated };
        setUser(merged);
        updateAuthUser(updated);
        localStorage.setItem("horizon_chat_user", JSON.stringify(merged));
      }
    } else {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreateChannel = async () => {
    const res = await authFetch("/api/chat/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name: newChannelName, 
        isPrivate, 
        allowedUsers: allowedUsers.split(",").map(u => u.trim()).filter(u => u),
        readOnlyPublic: !isPrivate && readOnlyPublic,
      }),
    });
    if (res.ok) {
      const newChannel = await res.json();
      toast({ title: "Channel created" });
      setNewChannelName("");
      setIsPrivate(false);
      setAllowedUsers("");
      setReadOnlyPublic(false);
      await fetchChannels();
      setActiveChannel(newChannel);
    }
  };

  const handleDeleteChannel = async (id: number) => {
    const token = getSessionToken();
    if (!token) return;
    const res = await fetch(`/api/chat/channels/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (res.ok) {
      toast({ title: "Channel deleted" });
      fetchChannels();
    }
  };

  const handleClearMessages = async (channelId: number) => {
    const token = getSessionToken();
    if (!token) return;
    const res = await fetch(`/api/chat/channels/${channelId}/messages`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (res.ok) {
      toast({ title: "All messages cleared" });
      if (activeChannel?.id === channelId) fetchMessages(channelId);
    } else {
      toast({ title: "Failed to clear messages", variant: "destructive" });
    }
  };

  const handleCreateRole = async () => {
    const res = await authFetch("/api/chat/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newRoleName, color: newRoleColor, permissions: rolePermissions }),
    });
    if (res.ok) {
      toast({ title: "Role created" });
      setNewRoleName("");
      setRolePermissions([]);
      fetchRoles();
    }
  };

  const handleAssignRolesToUser = async () => {
    if (!assignUsername || selectedRolesForUser.length === 0) {
      toast({ title: "Please enter username and select roles", variant: "destructive" });
      return;
    }
    const res = await authFetch(`/api/chat/users/${assignUsername}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles: selectedRolesForUser }),
    });
    if (res.ok) {
      toast({ title: `Roles assigned to ${assignUsername}` });
      setAssignUsername("");
      setSelectedRolesForUser([]);
    } else {
      toast({ title: "Failed to assign roles", variant: "destructive" });
    }
  };

  const lastMessageIdRef = useRef<number>(0);

  const fetchMessages = async (channelId: number, incremental = false) => {
    const sinceParam = incremental && lastMessageIdRef.current > 0
      ? `?since=${lastMessageIdRef.current}`
      : "";
    const res = await fetch(`/api/chat/channels/${channelId}/messages${sinceParam}`);
    const data = await res.json();
    if (!Array.isArray(data)) return;
    if (incremental) {
      if (data.length === 0) return;
      setMessages(prev => {
        const existingIds = new Set(prev.map((m: any) => m.id));
        const newMsgs = data.filter((m: any) => !existingIds.has(m.id));
        if (newMsgs.length === 0) return prev;
        const maxId = Math.max(...newMsgs.map((m: any) => m.id));
        if (maxId > lastMessageIdRef.current) lastMessageIdRef.current = maxId;
        return [...prev, ...newMsgs];
      });
    } else {
      setMessages(data);
      const maxId = data.length > 0 ? Math.max(...data.map((m: any) => m.id), 0) : 0;
      lastMessageIdRef.current = maxId;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      const { sessionToken, ...userData } = data;
      setUser(userData);
      localStorage.setItem("horizon_chat_user", JSON.stringify(userData));
      localStorage.setItem("horizon_user", JSON.stringify(userData));
      if (sessionToken) localStorage.setItem("horizon_session_token", sessionToken);
      toast({ title: "Welcome to HORIZON CHAT" });
    } else {
      toast({ title: data.message, variant: "destructive" });
    }
  };

  const startCooldown = (seconds: number) => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activeChannel || cooldown > 0) return;
    const token = getSessionToken();
    if (!token) return;

    const res = await fetch(`/api/chat/channels/${activeChannel.id}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        content: newMessage,
        replyToId: replyingTo?.id,
        replyToUsername: replyingTo?.username,
        replyToContent: replyingTo?.content
      }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.commandHandled) {
        setNewMessage("");
        if (data.error) {
          toast({ title: data.message, className: "bg-red-900/80 border-red-500/30 text-red-200" });
        } else {
          toast({ title: data.message, className: "bg-green-900/80 border-green-500/30 text-green-200" });
          fetchBanStatus();
        }
      } else {
        setNewMessage("");
        setReplyingTo(null);
        justSentRef.current = true;
        fetchMessages(activeChannel.id);
      }
    } else if (res.status === 429) {
      const data = await res.json().catch(() => ({ remaining: 5 }));
      if (data.timedOut) {
        setBanStatus(prev => prev ? { ...prev, timedOut: true, timeout: { expiresAt: data.expiresAt } } : null);
        await fetchBanStatus();
      } else {
        startCooldown(data.remaining ?? 5);
      }
    } else if (res.status === 403) {
      const data = await res.json().catch(() => ({}));
      if (data.banned) await fetchBanStatus();
    }
  };

  const handleEditMessage = async (id: number) => {
    const res = await authFetch(`/api/chat/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    if (res.ok) {
      setEditingMessageId(null);
      setEditContent("");
      if (activeChannel) fetchMessages(activeChannel.id);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    const res = await authFetch(`/api/chat/messages/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDeleteConfirmId(null);
      if (activeChannel) fetchMessages(activeChannel.id);
    }
  };

  const handleAddReaction = async (messageId: number, emoji: string) => {
    if (!user) return;
    const res = await fetch(`/api/chat/messages/${messageId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user.username, emoji }),
    });
    if (res.ok) {
      if (activeChannel) fetchMessages(activeChannel.id);
    }
  };

  const renderContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        if (part.match(/\.(jpeg|jpg|gif|png|webp)$/i) || part.includes("giphy.com") || part.includes("tenor.com")) {
          return <img key={i} src={part} alt="chat" className="max-w-xs rounded-lg mt-2 border border-white/10" />;
        }
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{part}</a>;
      }
      return part;
    });
  };

  const handleAcceptRules = () => {
    setShowEnjoy(true);
    setTimeout(() => {
      setShowEnjoy(false);
      localStorage.setItem("horizon_rules_accepted", "true");
      setRulesAccepted(true);
    }, 2500);
  };

  if (!rulesAccepted) {
    return (
      <div className="flex h-full bg-black items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-black to-blue-900/10 pointer-events-none" />

        {showEnjoy ? (
          <div className="flex flex-col items-center justify-center gap-4 z-10">
            <div
              className="anim-glitch font-display text-6xl md:text-8xl font-black text-white tracking-widest uppercase"
              data-text="ENJOY"
              style={{ color: "white" }}
            >
              ENJOY
            </div>
          </div>
        ) : (
          <div className="relative z-10 max-w-md w-full mx-4 text-center space-y-8">
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📋</span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-black text-white tracking-widest uppercase">
                Welcome to Horizon Chat
              </h2>
              <p className="text-white/60 text-sm md:text-base leading-relaxed">
                Please go to the <strong className="text-primary">Chat Rules</strong> section in the website before you start chatting.
              </p>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
              {!hasVisitedRules && (
                <p className="text-yellow-400/80 text-xs tracking-wide">
                  You must visit the <strong>Chat Rules</strong> section first before you can proceed.
                </p>
              )}
              {hasVisitedRules && (
                <p className="text-green-400/80 text-xs tracking-wide">
                  Rules section visited. You may now proceed.
                </p>
              )}
              <button
                onClick={() => {
                  if (hasVisitedRules) handleAcceptRules();
                  else {
                    const stored = localStorage.getItem("horizon_visited_rules") === "true";
                    if (stored) {
                      setHasVisitedRules(true);
                    }
                  }
                }}
                disabled={!hasVisitedRules}
                className={`w-full py-3 px-6 rounded-xl font-bold text-base tracking-widest uppercase transition-all duration-200 ${
                  hasVisitedRules
                    ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 cursor-pointer"
                    : "bg-white/5 text-white/20 cursor-not-allowed border border-white/10"
                }`}
              >
                I've Read the Rules
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full bg-black">
        {/* Channels Sidebar (Visible even when not logged in) */}
        <div className="w-64 border-r border-white/5 bg-black/50 flex flex-col hidden md:flex">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-display font-bold text-lg tracking-widest text-gradient-animated uppercase">CHANNELS</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {channels.map((ch) => (
                <button 
                  key={ch.id} 
                  onClick={() => setActiveChannel(ch)} 
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${activeChannel?.id === ch.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
                >
                  <Hash className="w-4 h-4" />
                  <span className="font-medium">{ch.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Login Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          {/* Channel Preview in Background */}
          {activeChannel && (
            <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
               <div className="p-6 space-y-4">
                 <h2 className="text-4xl font-black opacity-20">#{activeChannel.name}</h2>
                 <div className="space-y-2">
                   <div className="h-4 w-3/4 bg-white/20 rounded" />
                   <div className="h-4 w-1/2 bg-white/20 rounded" />
                   <div className="h-4 w-2/3 bg-white/20 rounded" />
                 </div>
               </div>
            </div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-xl z-10">
            <h1 className="text-4xl font-display font-black text-center mb-8 text-gradient-animated tracking-widest uppercase">HORIZON CHAT</h1>
            <form onSubmit={handleLogin} className="space-y-6">
              <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-black/50 border-white/10 h-12" required />
              <Input type="password" placeholder="Password (Optional for Users)" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-black/50 border-white/10 h-12" />
              <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-display text-lg rounded-xl">SIGN IN</Button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  const getFontStyle = (fontKey: string): React.CSSProperties => {
    const found = AVAILABLE_FONTS.find(f => f.key === fontKey);
    if (!found || found.family === "inherit") return {};
    return { fontFamily: found.family };
  };

  const getAnimationClass = (animName: string) => {
    if (!animName || animName.startsWith("efx:")) return ""; // efx: handled by renderUsername
    if (animName.startsWith("gradient-")) {
      const idx = parseInt(animName.split("-")[1]);
      const gradients = ["grad-magenta-blue", "grad-red-orange", "grad-cyan-purple", "grad-wasabi-charcoal"];
      return gradients[idx % gradients.length];
    }
    switch (animName) {
      case "Glitch Reveal": return "anim-glitch";
      case "Neon Glow": return "anim-neon";
      case "Wave/Wavy Movement": return "anim-wavy";
      default: return "";
    }
  };

  const renderUsername = (text: string, roleColor: string, animation: string, font: string) => {
    const { colorClass, colorStyle } = getColorInfo(roleColor, animation);
    const fontStyle = getFontStyle(font);
    const base = `font-black tracking-wide`;
    // Apply zalgo text transform if selected
    const intensity = font === "zalgo:low" ? "low" : font === "zalgo:high" ? "high" : "mid";
    const displayText = font.startsWith("zalgo:") ? applyZalgo(text, intensity) : text;

    // Parse pipe-separated effects (e.g. "efx:matrix|efx:galaxy|efx:border:gold")
    const effects = (!animation || animation === "none") ? [] : animation.split("|").filter(e => e && e !== "none");

    const borderEffect = effects.find(e => e.startsWith("efx:border:"));
    const hasGlitch   = effects.includes("efx:glitch-text");
    const matrixEffect = effects.find(e => e.startsWith("efx:matrix"));
    const hasGalaxy   = effects.includes("efx:galaxy");
    const hasBlackhole = effects.includes("efx:blackhole");
    const hasRainbow  = effects.includes("efx:rainbow");

    // rainbow flow class (text gradient)
    const rainbowCls = hasRainbow ? "efx-rainbow" : "";
    // galaxy glow class (text-shadow)
    const galaxyCls  = hasGalaxy  ? "efx-galaxy"  : "";
    const textClass = `${base} ${colorClass} ${rainbowCls} ${galaxyCls}`.trim();
    // merge font + color styles (font first so color can override)
    const mergedStyle: React.CSSProperties = { ...fontStyle, ...colorStyle };
    const finalStyle = Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined;

    // Build base text node (glitch vs plain)
    const textNode = hasGlitch
      ? <GlitchTextUsername text={displayText} className={textClass} style={finalStyle} />
      : <span className={textClass} style={finalStyle} data-text={displayText}>{displayText}</span>;

    // If any background canvas effect is needed, wrap in a relative container
    const needsCanvasWrap = matrixEffect || hasGalaxy || hasBlackhole;
    const matrixColor = matrixEffect ? (MATRIX_COLORS[matrixEffect] ?? "#00ff41") : "#00ff41";

    let inner: React.ReactNode = needsCanvasWrap ? (
      <span style={{ position:'relative', display:'inline-flex', alignItems:'center', verticalAlign:'middle' }}>
        {hasBlackhole  && <BlackholeCanvas />}
        {hasGalaxy     && <GalaxyCanvas />}
        {matrixEffect  && <MatrixCanvas color={matrixColor} />}
        <span style={{ position:'relative', zIndex:2 }}>{textNode}</span>
      </span>
    ) : textNode;

    // Wrap with border beam if present (outermost layer)
    if (borderEffect) {
      const bk = borderEffect.slice("efx:border:".length);
      const cols = BORDER_BEAM_KEYS[bk] ?? BORDER_BEAM_KEYS.white;
      const conicGrad = `conic-gradient(from 0deg, ${cols.join(", ")}, ${cols[0]})`;
      return (
        <span style={{ position:'relative', display:'inline-flex', alignItems:'center', padding:'1px 5px', borderRadius:'4px', overflow:'hidden' }}>
          <span aria-hidden style={{ position:'absolute', inset:'-40px', background:conicGrad, animation:'borderBeamSpin 2s linear infinite', borderRadius:'4px' }} />
          <span aria-hidden style={{ position:'absolute', inset:'1.5px', background:'#000', borderRadius:'3px', zIndex:1 }} />
          <span style={{ position:'relative', zIndex:2 }}>{inner}</span>
        </span>
      );
    }

    return inner;
  };

  return (
    <div className="flex h-full bg-black text-white overflow-hidden relative">
      {/* Webview Overlay */}
      {webviewUrl && (
        <div className="absolute inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-black/80">
            <Monitor className="w-4 h-4 text-primary" />
            <span className="text-white text-sm truncate flex-1">{webviewUrl}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white shrink-0" onClick={() => window.open(webviewUrl, '_blank')}>
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white shrink-0" onClick={() => setWebviewUrl(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <iframe src={webviewUrl} className="flex-1 w-full border-0" title="Proxy Webview" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals" />
        </div>
      )}
      {/* Ban Overlay */}
      {banStatus?.banned && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full mx-6 text-center space-y-8">
            <div className="space-y-3">
              <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto">
                <Ban className="w-9 h-9 text-red-500" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-[0.15em] uppercase">YOU HAVE BEEN BANNED</h1>
              <p className="text-white/30 text-xs tracking-widest uppercase">from Horizon Chat</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-red-500/60">Banned by</p>
                <p className="text-white font-bold text-lg">{banStatus.ban?.bannedBy}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-red-500/60">Ban expires</p>
                <p className="text-white font-semibold">{banStatus.ban?.expiresAt ? new Date(banStatus.ban.expiresAt).toLocaleString() : "Never — Permanent Ban"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-red-500/60">Reason</p>
                <p className="text-white/70 text-sm leading-relaxed italic">"{banStatus.ban?.reason || "No reason provided"}"</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Channels Sidebar */}
      <div className="w-64 border-r border-white/5 bg-black/50 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg tracking-widest text-gradient-animated">CHANNELS</h2>
          {userHasPermission("manage_channels") && (
            <Dialog open={showChannelsPanel} onOpenChange={setShowChannelsPanel}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white"><Plus className="w-4 h-4" /></Button>
              </DialogTrigger>
              <DialogContent className="bg-black border-white/10">
                <DialogHeader><DialogTitle className="text-white">Manage Channels</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Input placeholder="Channel Name" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} className="bg-white/5 border-white/10" />
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="private" checked={isPrivate} onChange={(e) => { setIsPrivate(e.target.checked); if (e.target.checked) setReadOnlyPublic(false); }} />
                      <label htmlFor="private" className="text-sm text-white">Private Channel</label>
                    </div>
                    {isPrivate && (
                      <Input placeholder="Allowed Users (comma separated)" value={allowedUsers} onChange={(e) => setAllowedUsers(e.target.value)} className="bg-white/5 border-white/10" />
                    )}
                    {!isPrivate && (
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="readOnlyPublic" checked={readOnlyPublic} onChange={(e) => setReadOnlyPublic(e.target.checked)} />
                        <label htmlFor="readOnlyPublic" className="text-sm text-white">View-only (everyone can see, only staff can post)</label>
                      </div>
                    )}
                    <Button onClick={handleCreateChannel} className="w-full">Create Channel</Button>
                  </div>
                  <div className="border-t border-white/10 pt-4 space-y-2">
                    {channels.map(ch => (
                      <div key={ch.id} className="flex items-center justify-between p-2 rounded bg-white/5">
                        <span className="text-white">#{ch.name}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteChannel(ch.id)} className="text-red-500 hover:text-red-400 h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {channels.map((ch) => (
              <div key={ch.id} className="group flex items-center gap-1">
                <button onClick={() => setActiveChannel(ch)} className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${activeChannel?.id === ch.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}>
                  {(ch as any).isLogs ? <Bot className="w-4 h-4 text-blue-400 flex-shrink-0" /> : <Hash className="w-4 h-4 flex-shrink-0" />}
                  <span className="font-medium">{ch.name}</span>
                  {(ch as any).isLogs && <span className="ml-auto text-[9px] font-black text-blue-400/70 tracking-widest">BOT</span>}
                </button>
                {userHasPermission("manage_channels") && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-black border-white/10 text-white">
                      <DropdownMenuItem
                        className="focus:bg-white/10 cursor-pointer text-red-400 focus:text-red-300"
                        onClick={() => handleClearMessages(ch.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Clear all messages
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-white/5 bg-black/80">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-primary/20 border border-primary/30 ${user.isAdmin ? 'animate-pulse' : ''}`}>
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold truncate ${user.isAdmin ? 'text-gradient-animated' : 'text-white'}`}>{user.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user.role}</p>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => { authUser && (window.location.href = "/"); }}><LogOut className="w-4 h-4" /></Button>
          </div>
          {userHasPermission("admin_panel") && (
            <Button variant="outline" className="w-full mt-4 border-primary/30 hover:bg-primary/10 text-primary gap-2" onClick={() => setShowAdminPanel(!showAdminPanel)}>
              <Shield className="w-4 h-4" /> Admin Panel
            </Button>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-black relative">
        <header className="h-16 border-b border-white/5 flex items-center px-6 justify-between bg-black/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-bold text-xl">{activeChannel?.name || "Select a channel"}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground">LIVE</span>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => setShowRoleSidebar(!showRoleSidebar)}>
              <Shield className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden flex">
          {/* Roles Sidebar - Right Panel */}
          {showRoleSidebar && (
            <div className="w-72 border-l border-white/5 bg-black/50 flex flex-col hidden lg:flex">
              <div className="p-4 border-b border-white/5">
                <h2 className="font-display font-bold text-lg tracking-widest text-gradient-animated uppercase">ROLES</h2>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  {roles
                    .filter(role => role.displayOnBoard)
                    .sort((a, b) => {
                      const orderMap: { [key: string]: number } = {
                        "Owner": 0,
                        "CO OWNER": 1,
                        "Admin": 2,
                        "Mod": 3,
                        "Server Settings": 4,
                        "Manage Channels": 5,
                        "Manage Roles": 6,
                      };
                      return (orderMap[a.name] ?? 99) - (orderMap[b.name] ?? 99);
                    })
                    .map(role => {
                      const { cls: roleCls, style: roleStyle } = getRoleColorInfo(role.color);
                      return (
                      <div key={role.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-bold text-sm uppercase tracking-widest ${roleCls}`} style={!roleCls ? roleStyle : undefined}>
                            {role.name}
                          </h3>
                          <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded">
                            {rolesByName[role.name]?.length || 0}
                          </span>
                        </div>
                        <div className="space-y-1 bg-white/[0.02] rounded p-2">
                          {(rolesByName[role.name] || []).map(u => (
                            <div key={u.username} className={`text-xs hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5 ${roleCls}`} style={!roleCls ? roleStyle : undefined}>
                              {u.username}
                            </div>
                          ))}
                          {(!rolesByName[role.name] || rolesByName[role.name].length === 0) && (
                            <div className="text-xs text-muted-foreground/50 px-2 py-1 italic">No users</div>
                          )}
                        </div>
                      </div>
                    );
                    })}
                </div>
              </ScrollArea>
            </div>
          )}

          <div
            className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar"
            ref={messagesContainerRef}
            onScroll={() => {
              const el = messagesContainerRef.current;
              if (el) {
                const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
                setIsUserScrolling(!isAtBottom);
              }
            }}
          >
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className="group flex flex-col gap-1 hover:bg-white/[0.02] -mx-6 px-6 py-2 transition-all relative">
                  {msg.replyToUsername && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 mb-1 ml-4 border-l-2 border-white/10 pl-2">
                      <Reply className="w-3 h-3" />
                      <span>replied to <span className="font-bold">{msg.replyToUsername}</span>:</span>
                      <span className="truncate max-w-[200px] italic">"{msg.replyToContent}"</span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-3 flex-wrap">
                    {renderUsername(msg.username, msg.roleColor, msg.animation || "none", msg.font || "sans")}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(msg.roles && msg.roles.length > 0) ? (
                        msg.roles.map((roleName: string) => {
                          const roleData = roles.find(r => r.name === roleName);
                          const rc = roleData?.color || "#9ca3af";
                          const { cls: rCls, style: rStyle } = getRoleColorInfo(rc);
                          // Pick a border colour: use first hex from ugc preview, else plain + alpha
                          const ugcEntry = UGC_COLORS.find(c => c.key === rc);
                          const borderC = ugcEntry
                            ? (ugcEntry.preview.match(/#[0-9a-fA-F]{6}/)?.[0] ?? "#ffffff") + "80"
                            : rc.startsWith("rainbow:") ? "#ff880080"
                            : rc + "60";
                          return (
                            <span 
                              key={roleName}
                              className="text-[10px] px-2 py-0.5 rounded bg-white/5 border uppercase tracking-widest whitespace-nowrap"
                              style={{ borderColor: borderC }}
                            >
                              <span className={rCls} style={!rCls ? rStyle : undefined}>{roleName}</span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/5 text-muted-foreground uppercase tracking-widest">User</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 font-mono ml-auto">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="w-3 h-3" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-black border-white/10 text-white">
                          <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={() => setReplyingTo(msg)}><Reply className="w-4 h-4 mr-2" /> Reply</DropdownMenuItem>
                          {user && msg.username === user.username && (
                            <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={() => { setEditingMessageId(msg.id); setEditContent(msg.content); }}><Edit2 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                          )}
                          {user && (msg.username === user.username || user.username === "RandomIX") && (
                            <DropdownMenuItem className="focus:bg-white/10 cursor-pointer text-red-500 focus:text-red-400" onClick={() => setDeleteConfirmId(msg.id)}><Trash2 className="w-4 h-4 mr-2" /> Delete Message</DropdownMenuItem>
                          )}
                          <Popover>
                            <PopoverTrigger asChild>
                              <div className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-white/10 cursor-pointer rounded-sm">
                                <Smile className="w-4 h-4 mr-2" /> React
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-transparent border-0 shadow-none">
                              <EmojiPicker onSelect={(emoji) => handleAddReaction(msg.id, emoji)} />
                            </PopoverContent>
                          </Popover>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {editingMessageId === msg.id ? (
                    <div className="space-y-2 mt-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm focus:outline-none focus:border-primary/50 text-white"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleEditMessage(msg.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingMessageId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-white/90 leading-relaxed font-sans break-words whitespace-pre-wrap max-w-2xl word-break overflow-hidden" style={{ wordBreak: 'break-word' }}>
                      {renderContent(msg.content)}
                      {msg.isEdited && <span className="text-[10px] text-muted-foreground/40 ml-2">(message edited)</span>}
                    </div>
                  )}

                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 ml-4">
                      {Object.entries(
                        msg.reactions.reduce((acc: any, curr: any) => {
                          acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([emoji, count]: [string, any]) => (
                        <button
                          key={emoji}
                          onClick={() => handleAddReaction(msg.id, emoji)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] border border-white/5 bg-white/5 hover:border-primary/50 transition-all ${
                            user && msg.reactions?.some(r => r.username === user.username && r.emoji === emoji) ? 'bg-primary/20 border-primary/50' : ''
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <AnimatePresence>
                    {deleteConfirmId === msg.id && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 bg-black/80 flex items-center justify-center rounded-lg border border-red-500/20">
                        <div className="text-center p-4">
                          <p className="text-sm font-bold mb-4">are you sure you want to delete this message, this can't be undone</p>
                          <div className="flex gap-4 justify-center">
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteMessage(msg.id)}>Yes</Button>
                            <Button variant="outline" size="sm" onClick={() => {
                              setDiesInCoolWay(true);
                              setTimeout(() => {
                                setDiesInCoolWay(false);
                                setDeleteConfirmId(null);
                              }, 2000);
                            }}>No</Button>
                          </div>
                          {diesInCoolWay && <p className="mt-2 text-xs italic text-red-400 animate-pulse">*dies in a cool way*</p>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Message Input - Fixed at Bottom */}
        <div className="border-t border-white/5 bg-black/50 backdrop-blur-md p-6">
          {replyingTo && (
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-t-xl px-4 py-2 text-xs text-muted-foreground animate-in slide-in-from-bottom-1 mb-2">
              <div className="flex items-center gap-2">
                <Reply className="w-3 h-3" />
                <span>replying to <span className="text-white font-bold">{replyingTo.username}</span>: <span className="truncate max-w-[300px] italic">"{replyingTo.content}"</span></span>
              </div>
              <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setReplyingTo(null)}><X className="w-3 h-3" /></Button>
            </div>
          )}
          {/* Command Picker */}
          <AnimatePresence>
            {showCmdPicker && (filteredCmds.length > 0 || activeCmd) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="mb-2 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl shadow-black/60 flex flex-col max-h-72 overflow-hidden"
              >
                {/* Header */}
                <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
                  <Shield className="w-3 h-3 text-primary/60" />
                  <span className="text-[10px] font-black tracking-widest text-primary/60 uppercase">Owner & CO OWNER Commands</span>
                </div>

                {/* Command list */}
                {filteredCmds.length > 0 && (
                  <div className="divide-y divide-white/[0.04] overflow-y-auto">
                    {filteredCmds.map((c, i) => (
                      <button
                        key={c.cmd}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setNewMessage(c.cmd + " ");
                          setCmdPickerIndex(i);
                          inputRef.current?.focus();
                        }}
                        className={`w-full text-left px-4 py-3 transition-all flex items-start gap-3 group ${i === cmdPickerIndex ? "bg-primary/10" : "hover:bg-white/[0.04]"}`}
                      >
                        <span className="text-xl leading-none mt-0.5">{c.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className={`font-black text-sm ${i === cmdPickerIndex ? "text-primary" : "text-white"}`}>{c.cmd}</span>
                            <span className="text-xs font-mono text-white/30">{c.syntax.slice(c.cmd.length)}</span>
                          </div>
                          <p className="text-xs text-white/40 mt-0.5 leading-snug">{c.desc}</p>
                          {c.needsTime && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {(c.needsTime === "timeout" ? MOD_TIMES_TIMEOUT : MOD_TIMES_BAN).map(t => (
                                <span key={t} className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/5">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        {i === cmdPickerIndex && <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest self-center ml-2 shrink-0">TAB</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Active command full hint */}
                {activeCmd && (
                  <div className="overflow-y-auto px-4 py-3 flex items-start gap-3">
                    <span className="text-xl leading-none mt-0.5">{activeCmd.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-black text-sm text-primary">{activeCmd.cmd}</span>
                        <span className="text-xs font-mono text-white/30">{activeCmd.syntax.slice(activeCmd.cmd.length)}</span>
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">{activeCmd.desc}</p>
                      {activeCmd.needsTime && cmdParts.length >= 2 && (
                        <div className="mt-2">
                          <p className="text-[10px] font-black tracking-widest text-white/20 uppercase mb-1.5">Time Options</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(activeCmd.needsTime === "timeout" ? MOD_TIMES_TIMEOUT : MOD_TIMES_BAN).map(t => {
                              const isSelected = cmdParts[2] === t || (cmdParts.slice(2).join(" ") === t);
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    const base = cmdParts.slice(0, 2).join(" ");
                                    const afterTime = activeCmd.needsReason ? " " : "";
                                    setNewMessage(base + " " + t + afterTime);
                                    inputRef.current?.focus();
                                  }}
                                  className={`text-[10px] font-bold tracking-wide px-2 py-1 rounded-full border transition-all ${isSelected ? "bg-primary/20 text-primary border-primary/30" : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white"}`}
                                >
                                  {t}
                                </button>
                              );
                            })}
                          </div>
                          {activeCmd.needsReason && cmdParts.length >= 4 && (
                            <p className="text-[10px] text-white/30 mt-2">Now type your reason after the time (optional)</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSendMessage} className={`flex gap-3 ${replyingTo ? 'rounded-b-xl' : 'rounded-xl'} bg-white/[0.02] border border-white/10 p-2 focus-within:border-primary/50 transition-all`}>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-white" disabled={activeChannel && !canPostInChannel(activeChannel)}><Smile className="w-5 h-5" /></Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-transparent border-0 shadow-none">
                <EmojiPicker onSelect={(emoji) => setNewMessage(prev => prev + emoji)} />
              </PopoverContent>
            </Popover>

            <Dialog open={showImageUpload} onOpenChange={setShowImageUpload}>
              <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-white" disabled={activeChannel && !canPostInChannel(activeChannel)}><ImageIcon className="w-5 h-5" /></Button>
              </DialogTrigger>
              <DialogContent className="bg-black border-white/10">
                <DialogHeader><DialogTitle className="text-white">Send Image or GIF</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <Input 
                    placeholder="Paste image or GIF URL (jpg, png, gif, webp)" 
                    value={imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                  {imageUrl && (
                    <div className="rounded-lg overflow-hidden border border-white/10">
                      <img src={imageUrl} alt="preview" className="max-w-sm max-h-64 object-contain" onError={() => toast({ title: "Failed to load image", variant: "destructive" })} />
                    </div>
                  )}
                  <Button 
                    onClick={() => {
                      if (imageUrl.trim()) {
                        setNewMessage(prev => prev + (prev ? ' ' : '') + imageUrl);
                        setImageUrl("");
                        setShowImageUpload(false);
                        toast({ title: "Image URL added to message" });
                      }
                    }}
                    className="w-full"
                  >
                    Add to Message
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Input 
              ref={inputRef}
              placeholder={
                banStatus?.timedOut
                  ? `You are timed out until ${banStatus.timeout ? new Date(banStatus.timeout.expiresAt).toLocaleTimeString() : "..."}`
                  : cooldown > 0
                    ? `Slow down! Wait ${cooldown}s...`
                    : activeChannel
                      ? (!canPostInChannel(activeChannel) ? `#${activeChannel.name} - ${(activeChannel as any).isLogs ? "Bot only" : "View only"}` : `Message #${activeChannel.name}`)
                      : "Select a channel"
              }
              value={newMessage} 
              onChange={(e) => { setNewMessage(e.target.value); setCmdPickerIndex(0); }}
              onKeyDown={(e) => {
                if (!showCmdPicker || filteredCmds.length === 0) return;
                if (e.key === "ArrowUp") { e.preventDefault(); setCmdPickerIndex(i => (i - 1 + filteredCmds.length) % filteredCmds.length); }
                if (e.key === "ArrowDown") { e.preventDefault(); setCmdPickerIndex(i => (i + 1) % filteredCmds.length); }
                if (e.key === "Tab" || (e.key === "Enter" && filteredCmds.length > 1)) {
                  e.preventDefault();
                  setNewMessage(filteredCmds[cmdPickerIndex].cmd + " ");
                }
                if (e.key === "Escape") { e.preventDefault(); setNewMessage(""); }
              }}
              className={`bg-transparent border-none focus-visible:ring-0 text-lg h-10 ${banStatus?.timedOut ? "placeholder:text-orange-400/70" : cooldown > 0 ? "placeholder:text-red-400/70" : ""}`}
              disabled={!activeChannel || !canPostInChannel(activeChannel) || cooldown > 0 || !!banStatus?.timedOut}
            />
            <Button
              type="submit"
              size="icon"
              className={`text-white shadow-lg transition-all ${banStatus?.timedOut ? "bg-orange-500/60 hover:bg-orange-500/60 shadow-orange-500/10 w-10 min-w-[2.5rem]" : cooldown > 0 ? "bg-red-500/60 hover:bg-red-500/60 shadow-red-500/10 w-10 min-w-[2.5rem]" : "bg-primary hover:bg-primary/90 shadow-primary/20"}`}
              disabled={!newMessage.trim() || !activeChannel || !canPostInChannel(activeChannel) || cooldown > 0 || !!banStatus?.timedOut}
            >
              {banStatus?.timedOut ? <Clock className="w-4 h-4" /> : cooldown > 0 ? <span className="text-xs font-black">{cooldown}s</span> : <Send className="w-5 h-5" />}
            </Button>
          </form>
        </div>

        <AnimatePresence>
          {showAdminPanel && (
            <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className="w-80 border-l border-white/5 bg-black/90 backdrop-blur-xl absolute right-0 inset-y-0 z-20 shadow-2xl p-6 overflow-y-auto">
                <h3 className="font-display font-black text-xl mb-6 text-gradient-animated tracking-widest">MASTER CONTROL</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Management</label>
                    {userHasPermission("manage_channels") && (
                    <Dialog open={showChannelsPanel} onOpenChange={setShowChannelsPanel}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-3 border-white/10 hover:bg-white/5"><MessageSquare className="w-4 h-4" /> Manage Channels</Button>
                      </DialogTrigger>
                    </Dialog>
                    )}
                    {userHasPermission("server_settings") && (
                    <Button variant="outline" className="w-full justify-start gap-3 border-white/10 hover:bg-white/5"><Settings className="w-4 h-4" /> Server Settings</Button>
                    )}
                    {userHasPermission("manage_roles") && (
                    <Dialog open={showRolesPanel} onOpenChange={setShowRolesPanel}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-3 border-white/10 hover:bg-white/5"><Shield className="w-4 h-4" /> Roles & Permissions</Button>
                      </DialogTrigger>
                      <DialogContent className="bg-black border-white/10 max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle className="text-white">Roles & Permissions</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          {/* Create Role Section */}
                          <div className="space-y-2">
                            <h4 className="text-white text-sm font-bold">Create New Role</h4>
                            <Input placeholder="Role Name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="bg-white/5 border-white/10" />
                            <div className="space-y-1">
                              <label className="text-white/50 text-xs">Role Color</label>
                              <Input type="color" value={newRoleColor.startsWith("ugc:") || newRoleColor.startsWith("rainbow:") ? "#9ca3af" : newRoleColor} onChange={(e) => setNewRoleColor(e.target.value)} className="h-10 w-full bg-transparent p-0 border-none" />
                              <p className="text-white/40 text-[10px]">Or pick a gradient / rainbow below:</p>
                              <div className="grid grid-cols-6 gap-1">
                                {UGC_COLORS.map(c => (
                                  <button key={c.key} title={c.name} onClick={() => setNewRoleColor(c.key)} className={`h-6 w-full rounded border ${newRoleColor === c.key ? "border-white" : "border-transparent"}`} style={{ background: c.preview }} />
                                ))}
                                {RAINBOW_COLORS.map(c => (
                                  <button key={c.key} title={c.name} onClick={() => setNewRoleColor(c.key)} className={`h-6 w-full rounded border text-[8px] font-bold ${newRoleColor === c.key ? "border-white" : "border-transparent"}`} style={{ background: "linear-gradient(to right,#f00,#f80,#ff0,#0f0,#00f,#80f)" }} />
                                ))}
                              </div>
                              {(newRoleColor.startsWith("ugc:") || newRoleColor.startsWith("rainbow:")) && (
                                <p className="text-primary text-[10px]">Selected: {UGC_COLORS.find(c=>c.key===newRoleColor)?.name ?? newRoleColor}</p>
                              )}
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-white text-xs">
                              {AVAILABLE_PERMISSIONS.map(perm => (
                                <div key={perm} className="flex items-center gap-2">
                                  <input type="checkbox" checked={rolePermissions.includes(perm)} onChange={(e) => {
                                    if (e.target.checked) setRolePermissions([...rolePermissions, perm]);
                                    else setRolePermissions(rolePermissions.filter(p => p !== perm));
                                  }} />
                                  <label>{PERMISSION_LABELS[perm] ?? perm.replace(/_/g, " ")}</label>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id="displayOnBoard" defaultChecked={true} onChange={(e) => {}} className="w-4 h-4" />
                              <label htmlFor="displayOnBoard" className="text-white text-xs cursor-pointer">Display on Board</label>
                            </div>
                            <Button onClick={async () => {
                              const displayOnBoard = (document.getElementById("displayOnBoard") as HTMLInputElement)?.checked ?? true;
                              await authFetch("/api/chat/roles", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name: newRoleName, color: newRoleColor, permissions: rolePermissions, displayOnBoard }),
                              });
                              setNewRoleName("");
                              setNewRoleColor("#9ca3af");
                              setRolePermissions([]);
                              fetchRoles();
                            }} className="w-full">Create Role</Button>
                          </div>

                          {/* Assign Roles Section */}
                          <div className="border-t border-white/10 pt-4 space-y-2">
                            <h4 className="text-white text-sm font-bold">Assign Roles to User</h4>
                            <Input placeholder="Username" value={assignUsername} onChange={(e) => setAssignUsername(e.target.value)} className="bg-white/5 border-white/10" />
                            <div className="space-y-2 bg-white/5 p-3 rounded border border-white/10 max-h-48 overflow-y-auto">
                              {roles.filter(role => {
                                const isOwnerUser = user?.isAdmin || (user?.roles ?? []).includes("Owner");
                                const isCoOwnerUser = !isOwnerUser && (user?.roles ?? []).includes("CO OWNER");
                                const isAdminUser = !isOwnerUser && !isCoOwnerUser && (user?.roles ?? []).includes("Admin");
                                if (isAdminUser && (role.name === "CO OWNER" || role.name === "Owner")) return false;
                                if (isCoOwnerUser && role.name === "Owner") return false;
                                return true;
                              }).map(role => (
                                <div key={role.id} className="flex items-center gap-2">
                                  <input 
                                    type="checkbox" 
                                    id={`role-${role.id}`}
                                    checked={selectedRolesForUser.includes(role.name)} 
                                    onChange={(e) => {
                                      if (e.target.checked) setSelectedRolesForUser([...selectedRolesForUser, role.name]);
                                      else setSelectedRolesForUser(selectedRolesForUser.filter(r => r !== role.name));
                                    }} 
                                  />
                                  <label htmlFor={`role-${role.id}`} className="text-white text-sm cursor-pointer flex-1" style={{ color: role.color }}>
                                    {role.name}
                                  </label>
                                </div>
                              ))}
                            </div>
                            <Button onClick={handleAssignRolesToUser} className="w-full bg-primary hover:bg-primary/90">Assign Roles</Button>
                          </div>

                          {/* Roles List Section */}
                          <div className="border-t border-white/10 pt-4 space-y-2">
                            <h4 className="text-white text-sm font-bold">All Roles</h4>
                            {roles.map(role => (
                              <div key={role.id} className="flex items-center justify-between p-2 rounded bg-white/5">
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span style={{ color: role.color }} className="font-bold text-xs">{role.name}</span>
                                    {role.displayOnBoard && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">PUBLIC</span>
                                    )}
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={async () => {
                                  const newDisplay = !role.displayOnBoard;
                                  await authFetch(`/api/chat/roles/${role.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ displayOnBoard: newDisplay }),
                                  });
                                  fetchRoles();
                                }} className="text-white/50 hover:text-white h-8 w-8" title="Toggle display">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={async () => {
                                  await authFetch(`/api/chat/roles/${role.id}`, { method: "DELETE" });
                                  fetchRoles();
                                }} className="text-red-500 hover:text-red-400 h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    )}
                  </div>

                  {/* XP Giver & Remover Section */}
                  {userHasPermission("admin_panel") && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">XP Management</label>
                    <Dialog open={showXPPanel} onOpenChange={(o) => { setShowXPPanel(o); if (!o) { setXpResult(null); setXpUsername(""); setXpAmount(""); } }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-3 border-white/10 hover:bg-white/5" data-testid="button-open-xp-panel"><Zap className="w-4 h-4" /> XP Giver &amp; Remover</Button>
                      </DialogTrigger>
                      <DialogContent className="bg-black border-white/10 w-[380px]">
                        <DialogHeader><DialogTitle className="text-white flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> XP Giver &amp; Remover</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="flex gap-1 p-1 bg-white/5 rounded">
                            <button onClick={() => { setXpAction("add"); setXpResult(null); }} className={`flex-1 text-sm py-2 rounded transition-colors font-bold ${xpAction === "add" ? "bg-green-500/20 text-green-400 border border-green-500/40" : "text-white/40 hover:text-white/70"}`}>
                              + Give XP
                            </button>
                            <button onClick={() => { setXpAction("remove"); setXpResult(null); }} className={`flex-1 text-sm py-2 rounded transition-colors font-bold ${xpAction === "remove" ? "bg-red-500/20 text-red-400 border border-red-500/40" : "text-white/40 hover:text-white/70"}`}>
                              − Remove XP
                            </button>
                          </div>
                          <div className="space-y-1">
                            <label className="text-white/50 text-xs">Username</label>
                            <Input placeholder="Enter username" value={xpUsername} onChange={e => setXpUsername(e.target.value)} className="bg-white/5 border-white/10 text-white" data-testid="input-xp-username" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-white/50 text-xs">Amount of XP</label>
                            <Input type="number" min="1" placeholder="e.g. 5000" value={xpAmount} onChange={e => setXpAmount(e.target.value)} className="bg-white/5 border-white/10 text-white" data-testid="input-xp-amount" />
                          </div>
                          {xpResult && (
                            <div className="rounded bg-primary/10 border border-primary/20 p-3 text-center">
                              <p className="text-white/50 text-xs mb-1">New XP total for <span className="text-white font-bold">@{xpResult.username}</span></p>
                              <p className="text-primary font-black text-2xl">{xpResult.newXP.toLocaleString()} XP</p>
                            </div>
                          )}
                          <Button
                            disabled={xpLoading || !xpUsername.trim() || !xpAmount.trim()}
                            onClick={async () => {
                              setXpLoading(true);
                              setXpResult(null);
                              try {
                                const res = await authFetch("/api/admin/xp", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ username: xpUsername.trim(), amount: xpAmount, action: xpAction }),
                                });
                                const data = await res.json();
                                if (!res.ok) {
                                  toast({ title: data.message || "Failed", variant: "destructive" });
                                } else {
                                  setXpResult({ newXP: data.newXP, username: xpUsername.trim() });
                                  const amt = parseInt(xpAmount).toLocaleString();
                                  toast({ title: xpAction === "add" ? `+${amt} XP given to @${xpUsername}!` : `−${amt} XP removed from @${xpUsername}.` });
                                  window.dispatchEvent(new Event("xp-updated"));
                                }
                              } finally {
                                setXpLoading(false);
                              }
                            }}
                            className={`w-full text-white font-bold ${xpAction === "remove" ? "bg-red-600 hover:bg-red-700 border-red-600" : "bg-green-600 hover:bg-green-700 border-green-600"}`}
                            data-testid="button-xp-submit"
                          >
                            {xpLoading ? "Processing..." : xpAction === "add" ? "Give XP" : "Remove XP"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  )}

                  {/* User Appearance Section */}
                  {userHasPermission("admin_panel") && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">User Appearance</label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-3 border-white/10 hover:bg-white/5"><Sparkles className="w-4 h-4" /> Username Customizer</Button>
                      </DialogTrigger>
                      <DialogContent className="bg-black border-white/10 max-h-[90vh] overflow-y-auto w-[420px]">
                        <DialogHeader><DialogTitle className="text-white">Username Appearance</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-1">
                            <label className="text-white/50 text-xs">Target Username (leave blank for yourself)</label>
                            <Input placeholder={user?.username || "username"} value={apTarget} onChange={e => setApTarget(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                          </div>

                          {/* Color Tabs */}
                          <div className="space-y-2">
                            <label className="text-white/50 text-xs">Color</label>
                            <div className="flex gap-1 p-1 bg-white/5 rounded">
                              {(["solid","gradient","rainbow"] as const).map(t => (
                                <button key={t} onClick={() => setApColorTab(t)} className={`flex-1 text-xs py-1 rounded capitalize transition-colors ${apColorTab === t ? "bg-primary text-white" : "text-white/40 hover:text-white/70"}`}>{t}</button>
                              ))}
                            </div>
                            {apColorTab === "solid" && (
                              <div className="space-y-1">
                                <Input type="color" value={apColor.startsWith("ugc:") || apColor.startsWith("rainbow:") ? "#9ca3af" : apColor} onChange={e => setApColor(e.target.value)} className="h-10 w-full bg-transparent p-0 border-none" />
                                <p className="text-white/40 text-[10px]">Hex color for the username</p>
                              </div>
                            )}
                            {apColorTab === "gradient" && (
                              <div className="grid grid-cols-4 gap-2">
                                {UGC_COLORS.map(c => (
                                  <button key={c.key} title={c.name} onClick={() => setApColor(c.key)} className={`h-8 rounded border-2 flex items-end justify-center pb-0.5 transition-all ${apColor === c.key ? "border-white scale-105" : "border-transparent"}`} style={{ background: c.preview }}>
                                    <span className="text-[8px] font-bold text-white drop-shadow">{c.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            {apColorTab === "rainbow" && (
                              <div className="grid grid-cols-2 gap-2">
                                {RAINBOW_COLORS.map(c => (
                                  <button key={c.key} title={c.name} onClick={() => setApColor(c.key)} className={`h-8 rounded border-2 flex items-center justify-center transition-all ${apColor === c.key ? "border-white scale-105" : "border-transparent"}`} style={{ background: "linear-gradient(to right,#f00,#f80,#ff0,#0f0,#00f,#80f)" }}>
                                    <span className="text-[9px] font-bold text-white drop-shadow">{c.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Font picker */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <button onClick={() => setApShowFonts(v => !v)} className="text-white/50 text-xs flex items-center gap-1 hover:text-white transition-colors">
                                <span className="text-sm leading-none">Aa</span> Fonts {apShowFonts ? "▲" : "▼"}
                              </button>
                              {apFont !== "sans" && (
                                <button onClick={() => setApFont("sans")} className="text-[10px] text-red-400 hover:text-red-300 transition-colors">Reset font</button>
                              )}
                            </div>
                            {apShowFonts && (
                              <div className="space-y-2">
                                {/* Category filter */}
                                <div className="flex flex-wrap gap-1">
                                  {["All", "Sans", "Serif", "Display", "Hand", "Code", "Gaming", "Special", "FLB"].map(cat => (
                                    <button key={cat} onClick={() => setApFontCategory(cat)} className={`text-[10px] px-2 py-0.5 rounded border transition-all ${apFontCategory === cat ? "border-primary bg-primary/20 text-primary" : "border-white/10 text-white/40 hover:text-white/70"}`}>{cat}</button>
                                  ))}
                                </div>
                                {/* Font grid — each button renders in its own typeface */}
                                <div className="grid grid-cols-2 gap-1 max-h-56 overflow-y-auto pr-1">
                                  {AVAILABLE_FONTS.filter(f => apFontCategory === "All" || f.category === apFontCategory).map(f => {
                                    const active = apFont === f.key;
                                    return (
                                      <button
                                        key={f.key}
                                        onClick={() => setApFont(f.key)}
                                        title={f.name}
                                        style={{ fontFamily: f.family }}
                                        className={`text-sm px-2 py-1.5 rounded border text-left truncate transition-all ${active ? "border-primary bg-primary/20 text-white" : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"}`}
                                      >
                                        {f.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {!apShowFonts && apFont !== "sans" && (
                              <p className="text-primary text-[10px]">Font: <span style={{ fontFamily: AVAILABLE_FONTS.find(f => f.key === apFont)?.family }}>{AVAILABLE_FONTS.find(f => f.key === apFont)?.name}</span></p>
                            )}
                          </div>

                          {/* Effect picker - multi-select */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <button onClick={() => setApShowEffects(v => !v)} className="text-white/50 text-xs flex items-center gap-1 hover:text-white transition-colors">
                                <Sparkles className="w-3 h-3" /> Visual Effects {apShowEffects ? "▲" : "▼"}
                              </button>
                              {apEffects.length > 0 && (
                                <button onClick={() => setApEffects([])} className="text-[10px] text-red-400 hover:text-red-300 transition-colors">Clear all</button>
                              )}
                            </div>
                            {apShowEffects && (
                              <div className="grid grid-cols-2 gap-1 max-h-52 overflow-y-auto pr-1">
                                {USERNAME_EFFECTS.map(e => {
                                  const active = apEffects.includes(e.key);
                                  return (
                                    <button
                                      key={e.key}
                                      onClick={() => setApEffects(prev => active ? prev.filter(x => x !== e.key) : [...prev, e.key])}
                                      className={`text-[10px] px-2 py-1.5 rounded border text-left transition-all ${active ? "border-primary bg-primary/20 text-primary" : "border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"}`}
                                    >
                                      {active ? "✓ " : ""}{e.name}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            {apEffects.length > 0 && (
                              <p className="text-primary text-[10px]">Active: {apEffects.map(k => USERNAME_EFFECTS.find(e => e.key === k)?.name ?? k).join(" + ")}</p>
                            )}
                          </div>

                          {/* Live Preview */}
                          <div className="border border-white/10 rounded p-3 space-y-1">
                            <label className="text-white/40 text-[10px] uppercase tracking-widest">Preview</label>
                            <div className="flex items-center gap-2 min-h-[32px]">
                              {renderUsername(apTarget.trim() || user?.username || "Preview", apColor, apEffects.length > 0 ? apEffects.join("|") : "none", apFont)}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={applyUserAppearance} className="flex-1 bg-primary hover:bg-primary/90">Apply Appearance</Button>
                            <Button onClick={resetUserAppearance} variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-400 px-3" title="Reset color, effects and font to defaults">Reset</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  )}

                  {userHasPermission("manage_proxies") && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Proxies</label>
                    <Dialog onOpenChange={(open) => { if (open) fetchProxies(); if (!open) setEditingProxy(null); }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-3 border-white/10 hover:bg-white/5"><Settings className="w-4 h-4" /> Manage Proxies</Button>
                      </DialogTrigger>
                      <DialogContent className="bg-black border-white/10 max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle className="text-white">Manage Proxies</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          {/* Add Proxy */}
                          <div className="space-y-2">
                            <h4 className="text-white text-sm font-bold">Add New Proxy</h4>
                            <Input placeholder="Proxy Name" id="proxyName" className="bg-white/5 border-white/10" />
                            <Input placeholder="Proxy URL" id="proxyUrl" className="bg-white/5 border-white/10" />
                            <Button onClick={async () => {
                              const name = (document.getElementById("proxyName") as HTMLInputElement)?.value;
                              const url = (document.getElementById("proxyUrl") as HTMLInputElement)?.value;
                              if (!name || !url) {
                                toast({ title: "Please fill in all fields", variant: "destructive" });
                                return;
                              }
                              const res = await authFetch("/api/proxies", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name, url, useWebview: true }),
                              });
                              if (res.ok) {
                                toast({ title: "Proxy added" });
                                (document.getElementById("proxyName") as HTMLInputElement).value = "";
                                (document.getElementById("proxyUrl") as HTMLInputElement).value = "";
                                fetchProxies();
                              } else {
                                toast({ title: "Failed to add proxy", variant: "destructive" });
                              }
                            }} className="w-full">Add Proxy</Button>
                          </div>
                          {/* Existing Proxies List */}
                          <div className="border-t border-white/10 pt-4 space-y-2">
                            <h4 className="text-white text-sm font-bold">Existing Proxies</h4>
                            {proxies.length === 0 && <p className="text-white/40 text-xs">No proxies yet.</p>}
                            {proxies.map((proxy: any) => (
                              <div key={proxy.id} className="rounded bg-white/5 p-2 space-y-2">
                                {editingProxy?.id === proxy.id ? (
                                  <div className="space-y-2">
                                    <Input
                                      value={editingProxy.name}
                                      onChange={(e) => setEditingProxy({ ...editingProxy, name: e.target.value })}
                                      className="bg-white/5 border-white/10 text-sm"
                                      placeholder="Proxy Name"
                                    />
                                    <Input
                                      value={editingProxy.url}
                                      onChange={(e) => setEditingProxy({ ...editingProxy, url: e.target.value })}
                                      className="bg-white/5 border-white/10 text-sm"
                                      placeholder="Proxy URL"
                                    />
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={async () => {
                                        const res = await authFetch(`/api/proxies/${proxy.id}`, {
                                          method: "PATCH",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ name: editingProxy.name, url: editingProxy.url }),
                                        });
                                        if (res.ok) { toast({ title: "Proxy updated" }); setEditingProxy(null); fetchProxies(); }
                                        else toast({ title: "Failed to update", variant: "destructive" });
                                      }} className="flex-1">Save</Button>
                                      <Button size="sm" variant="ghost" onClick={() => setEditingProxy(null)} className="text-white/50">Cancel</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{proxy.name}</p>
                                        <p className="text-white/40 text-xs truncate">{proxy.url}</p>
                                      </div>
                                      <div className="flex gap-1 shrink-0">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white" onClick={() => setEditingProxy({ id: proxy.id, name: proxy.name, url: proxy.url })}>
                                          <Edit2 className="w-3 h-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-400" onClick={async () => {
                                          const res = await authFetch(`/api/proxies/${proxy.id}`, { method: "DELETE" });
                                          if (res.ok) { toast({ title: "Proxy deleted" }); fetchProxies(); }
                                          else toast({ title: "Failed to delete", variant: "destructive" });
                                        }}>
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1 border-white/10 hover:bg-white/5" onClick={() => setWebviewUrl(proxy.url)}>
                                        <Monitor className="w-3 h-3" /> Webview
                                      </Button>
                                      <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1 border-white/10 hover:bg-white/5" onClick={() => window.open(proxy.url, '_blank')}>
                                        <ExternalLink className="w-3 h-3" /> New Tab
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

      </div>
    </div>
  );
}
