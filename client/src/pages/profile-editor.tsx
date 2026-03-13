import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, User, Palette, Type } from "lucide-react";

const DISPLAY_FONTS = [
  { name: "Default (Sans)", value: "sans" },
  { name: "Playfair Display", value: "Playfair Display" },
  { name: "EB Garamond", value: "EB Garamond" },
  { name: "Bodoni Moda", value: "Bodoni Moda" },
  { name: "Cormorant", value: "Cormorant" },
  { name: "Instrument Serif", value: "Instrument Serif" },
  { name: "Parisienne", value: "Parisienne" },
  { name: "Libre Baskerville", value: "Libre Baskerville" },
];

const FONT_CLASSES: Record<string, string> = {
  "Playfair Display": "font-playfair",
  "EB Garamond": "font-garamond",
  "Bodoni Moda": "font-bodoni",
  "Cormorant": "font-cormorant",
  "Instrument Serif": "font-instrument",
  "Parisienne": "font-adios",
  "Libre Baskerville": "font-baskerville",
  "sans": "font-sans",
};

const BANNER_COLORS = [
  "#1a1a2e", "#0d1117", "#0f0c1d", "#1e0a3c", "#0a1628",
  "#1a0a0a", "#0a1a0a", "#2d1b69", "#1a2744", "#2d0a0a",
];

export default function ProfileEditor() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [displayFont, setDisplayFont] = useState(user?.displayFont || "sans");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [banner, setBanner] = useState(user?.banner || "");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerColor, setBannerColor] = useState(user?.bannerColor || "#1a1a2e");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/users/${user.username}`).then(r => r.json()).then(u => {
      setDisplayName(u.displayName || "");
      setDisplayFont(u.displayFont || "sans");
      setBio(u.bio || "");
      setAvatar(u.avatar || "");
      setBanner(u.banner || "");
      setBannerColor(u.bannerColor || "#1a1a2e");
    });
  }, [user?.username]);

  const uploadFile = async (file: File, type: "avatar" | "banner") => {
    setUploading(type);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(null);
    return data.url as string;
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "avatar");
    setAvatar(url);
  };

  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "banner");
    setBanner(url);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const res = await fetch(`/api/users/${user.username}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: displayName || null, displayFont, bio, avatar, banner, bannerColor }),
    });
    if (res.ok) {
      const updated = await res.json();
      updateUser({ displayName: updated.displayName, displayFont: updated.displayFont, avatar: updated.avatar, bio: updated.bio, banner: updated.banner, bannerColor: updated.bannerColor });
      toast({ title: "Profile saved!" });
    } else {
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const fontClass = FONT_CLASSES[displayFont] || "font-sans";

  const bannerStyle = banner
    ? { backgroundImage: `url(${banner})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: bannerColor };

  if (!user) return null;

  return (
    <ScrollArea className="h-full">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-black text-white tracking-widest uppercase mb-1">Profile Editor</h1>
          <p className="text-white/30 text-sm">Customize how others see you on Horizon</p>
        </motion.div>

        {/* Preview */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          <div className="h-32 w-full relative" style={bannerStyle}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
          </div>
          <div className="px-5 -mt-10 pb-5 relative z-10 flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl border-4 border-[#0e0e14] bg-white/10 flex items-center justify-center overflow-hidden">
              {avatar
                ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-3xl font-black text-white/40">{user.username[0]?.toUpperCase()}</span>
              }
            </div>
            <div className="mb-1">
              <p className={`text-lg font-bold text-white ${fontClass}`}>{displayName || user.username}</p>
              <p className="text-white/40 text-sm">@{user.username}</p>
              {bio && <p className="text-white/50 text-xs mt-1 max-w-xs">{bio}</p>}
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Identity</h3>
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">Username (cannot change)</label>
            <Input value={user.username} disabled className="bg-black/30 border-white/5 text-white/40 h-11" />
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Leave empty to use username"
              className="bg-black/50 border-white/10 h-11 text-white"
              data-testid="input-display-name"
            />
            <p className="text-white/20 text-xs mt-1">Shown in chat and profiles. Can use any style.</p>
          </div>
        </div>

        {/* Font */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Type className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Display Name Font</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DISPLAY_FONTS.map((f) => (
              <button
                key={f.value}
                onClick={() => setDisplayFont(f.value)}
                data-testid={`font-option-${f.value}`}
                className={`p-3 rounded-xl border text-left transition-all ${displayFont === f.value ? "border-primary/50 bg-primary/10" : "border-white/10 hover:border-white/20 bg-white/[0.02]"}`}
              >
                <span className={`text-base text-white ${FONT_CLASSES[f.value] || "font-sans"}`}>{displayName || user.username}</span>
                <p className="text-xs text-white/30 mt-0.5">{f.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Bio</h3>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write something about yourself..."
            maxLength={200}
            data-testid="input-bio"
            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm resize-none h-24 focus:outline-none focus:border-primary/50 placeholder:text-white/20"
          />
          <p className="text-white/20 text-xs">{bio.length}/200</p>
        </div>

        {/* Avatar */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Upload className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Profile Picture</h3>
          </div>
          <p className="text-white/30 text-xs">Upload an image/GIF or paste a URL</p>
          <div className="flex gap-2">
            <Input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Paste image or GIF URL..."
              className="bg-black/50 border-white/10 h-10 text-white flex-1"
            />
            <Button
              onClick={() => { if (avatarUrl) { setAvatar(avatarUrl); setAvatarUrl(""); } }}
              disabled={!avatarUrl}
              size="sm"
              className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 h-10"
            >
              Set
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => avatarRef.current?.click()}
              disabled={uploading === "avatar"}
              size="sm"
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10"
            >
              {uploading === "avatar" ? "Uploading..." : "Upload File"}
            </Button>
            {avatar && (
              <Button onClick={() => setAvatar("")} size="sm" variant="ghost" className="text-red-400 hover:text-red-300 text-xs">Remove</Button>
            )}
          </div>
          <input ref={avatarRef} type="file" accept="image/*,.gif" className="hidden" onChange={handleAvatarFile} />
        </div>

        {/* Banner */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Profile Banner</h3>
          </div>
          <p className="text-white/30 text-xs">Upload a banner image/GIF, paste a URL, or pick a color</p>
          <div className="flex gap-2">
            <Input
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="Paste banner image or GIF URL..."
              className="bg-black/50 border-white/10 h-10 text-white flex-1"
            />
            <Button
              onClick={() => { if (bannerUrl) { setBanner(bannerUrl); setBannerUrl(""); } }}
              disabled={!bannerUrl}
              size="sm"
              className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 h-10"
            >
              Set
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => bannerRef.current?.click()}
              disabled={uploading === "banner"}
              size="sm"
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10"
            >
              {uploading === "banner" ? "Uploading..." : "Upload File"}
            </Button>
            {banner && (
              <Button onClick={() => setBanner("")} size="sm" variant="ghost" className="text-red-400 hover:text-red-300 text-xs">Remove Banner</Button>
            )}
          </div>
          <input ref={bannerRef} type="file" accept="image/*,.gif" className="hidden" onChange={handleBannerFile} />
          <div>
            <p className="text-xs text-white/30 mb-2">Or pick a banner color:</p>
            <div className="flex flex-wrap gap-2">
              {BANNER_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => { setBannerColor(c); setBanner(""); }}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${bannerColor === c && !banner ? "border-primary scale-110" : "border-white/10 hover:border-white/30"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={bannerColor}
                onChange={(e) => { setBannerColor(e.target.value); setBanner(""); }}
                className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer bg-transparent"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          data-testid="button-save-profile"
          className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-display text-base rounded-xl tracking-widest uppercase"
        >
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </ScrollArea>
  );
}
