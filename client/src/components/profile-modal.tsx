import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { UserPlus, MessageSquare, MoreVertical, Shield, Check, Clock, UserMinus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ProfileModalProps {
  username: string | null;
  onClose: () => void;
}

const FONTS: Record<string, string> = {
  "Playfair Display": "font-playfair",
  "EB Garamond": "font-garamond",
  "Bodoni Moda": "font-bodoni",
  "Cormorant": "font-cormorant",
  "Instrument Serif": "font-instrument",
  "Parisienne": "font-adios",
  "sans": "font-sans",
};

export function ProfileModal({ username, onClose }: ProfileModalProps) {
  const { user: me } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [friendStatus, setFriendStatus] = useState<string>("none");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedMe, setBlockedMe] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [showRoleAssign, setShowRoleAssign] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [allRoles, setAllRoles] = useState<any[]>([]);
  const isAdmin = me?.username === "RandomIX";

  useEffect(() => {
    if (!username) return;
    setProfile(null);
    setFriendStatus("none");
    setIsBlocked(false);
    setBlockedMe(false);

    fetch(`/api/users/${username}`).then(r => r.json()).then(u => {
      setProfile(u);
      setSelectedRoles(u.roles || []);
    });

    if (me && me.username !== username) {
      fetch(`/api/friendship/${username}?me=${me.username}`).then(r => r.json()).then(d => setFriendStatus(d.status));
      fetch(`/api/isblocked?blocker=${me.username}&blocked=${username}`).then(r => r.json()).then(d => setIsBlocked(d.blocked));
      fetch(`/api/isblocked?blocker=${username}&blocked=${me.username}`).then(r => r.json()).then(d => setBlockedMe(d.blocked));
    }

    fetch("/api/chat/roles").then(r => r.json()).then(setAllRoles);
  }, [username, me]);

  if (!username) return null;

  const handleFriendRequest = async () => {
    if (!me) return;
    await fetch("/api/friends/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: me.username, to: username }) });
    setFriendStatus("sent");
    toast({ title: "Friend request sent!" });
  };

  const handleBlock = async () => {
    if (!me) return;
    await fetch("/api/block", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blocker: me.username, blocked: username }) });
    setIsBlocked(true);
    toast({ title: `Blocked @${username}` });
    onClose();
  };

  const handleUnblock = async () => {
    if (!me) return;
    await fetch("/api/unblock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blocker: me.username, blocked: username }) });
    setIsBlocked(false);
    toast({ title: `Unblocked @${username}` });
  };

  const handleDM = () => {
    onClose();
    navigate(`/dms/${username}`);
  };

  const handleAssignRoles = async () => {
    if (!me) return;
    await fetch(`/api/users/${username}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-username": me.username },
      body: JSON.stringify({ roles: selectedRoles }),
    });
    toast({ title: "Roles updated!" });
    setShowRoleAssign(false);
    setProfile((p: any) => ({ ...p, roles: selectedRoles }));
  };

  const bannerStyle = profile?.banner
    ? { backgroundImage: `url(${profile.banner})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: profile?.bannerColor || "#1a1a2e" };

  const fontClass = FONTS[profile?.displayFont] || "font-sans";
  const displayName = profile?.displayName || username;
  const isSelf = me?.username === username;

  return (
    <Dialog open={!!username} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 bg-[#0e0e14] border border-white/10 rounded-2xl overflow-hidden max-w-sm w-full">
        {/* Banner */}
        <div className="h-28 w-full relative" style={bannerStyle}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0e0e14]/90" />
        </div>

        {/* Avatar */}
        <div className="px-5 -mt-10 relative z-10 flex items-end justify-between">
          <div className="w-20 h-20 rounded-2xl border-4 border-[#0e0e14] overflow-hidden bg-white/10 flex items-center justify-center">
            {profile?.avatar
              ? <img src={profile.avatar} alt={username} className="w-full h-full object-cover" />
              : <span className="text-3xl font-black text-white/40">{username[0]?.toUpperCase()}</span>
            }
          </div>
          {!isSelf && me && (
            <div className="flex items-center gap-1 mb-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#0e0e14] border border-white/10">
                  {isBlocked
                    ? <DropdownMenuItem onClick={handleUnblock} className="text-green-400">Unblock @{username}</DropdownMenuItem>
                    : <DropdownMenuItem onClick={handleBlock} className="text-red-400">Block @{username}</DropdownMenuItem>
                  }
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-5 pb-5 pt-2 space-y-4">
          <div>
            <h2 className={`text-xl font-bold text-white ${fontClass}`}>{displayName}</h2>
            <p className="text-white/40 text-sm">@{username}</p>
            {profile?.role && profile.role !== "User" && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-bold" style={{ color: profile.roleColor || "#9ca3af", backgroundColor: `${profile.roleColor || "#9ca3af"}20`, border: `1px solid ${profile.roleColor || "#9ca3af"}40` }}>
                {profile.role}
              </span>
            )}
          </div>

          {/* Roles badges */}
          {profile?.roles?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(profile.roles as string[]).map((r: string) => {
                const roleObj = allRoles.find((ar: any) => ar.name === r);
                const color = roleObj?.color || "#9ca3af";
                return (
                  <span key={r} className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ color, backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
                    {r}
                  </span>
                );
              })}
            </div>
          )}

          {/* Bio */}
          {profile?.bio && (
            <p className="text-white/60 text-sm leading-relaxed border-l-2 border-white/10 pl-3">{profile.bio}</p>
          )}

          {/* Actions */}
          {!isSelf && me && !blockedMe && (
            <div className="flex gap-2">
              {!isBlocked && (
                <>
                  {friendStatus === "none" && (
                    <Button size="sm" onClick={handleFriendRequest} className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30">
                      <UserPlus className="w-4 h-4 mr-1.5" /> Add Friend
                    </Button>
                  )}
                  {friendStatus === "sent" && (
                    <Button size="sm" disabled className="flex-1 bg-white/5 text-white/40 border border-white/10">
                      <Clock className="w-4 h-4 mr-1.5" /> Pending
                    </Button>
                  )}
                  {friendStatus === "accepted" && (
                    <Button size="sm" disabled className="flex-1 bg-green-900/20 text-green-400 border border-green-800/30">
                      <Check className="w-4 h-4 mr-1.5" /> Friends
                    </Button>
                  )}
                  {friendStatus === "received" && (
                    <Button size="sm" onClick={() => { if (me) fetch("/api/friends/respond", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: username, to: me.username, status: "accepted" }) }).then(() => setFriendStatus("accepted")); }} className="flex-1 bg-green-900/20 hover:bg-green-900/30 text-green-400 border border-green-800/30">
                      <Check className="w-4 h-4 mr-1.5" /> Accept
                    </Button>
                  )}
                  <Button size="sm" onClick={handleDM} className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10">
                    <MessageSquare className="w-4 h-4 mr-1.5" /> DM
                  </Button>
                </>
              )}
              {isBlocked && (
                <Button size="sm" onClick={handleUnblock} className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10">
                  <UserMinus className="w-4 h-4 mr-1.5" /> Unblock
                </Button>
              )}
            </div>
          )}

          {/* Admin role assignment */}
          {isAdmin && !isSelf && (
            <div className="border-t border-white/10 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40 uppercase tracking-widest flex items-center gap-1"><Shield className="w-3 h-3" /> Roles</span>
                <Button size="sm" variant="ghost" onClick={() => setShowRoleAssign(!showRoleAssign)} className="text-xs text-primary hover:text-primary/80 h-6 px-2">
                  {showRoleAssign ? "Cancel" : "+ Edit"}
                </Button>
              </div>
              {showRoleAssign && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {allRoles.map((r: any) => (
                      <button
                        key={r.name}
                        onClick={() => setSelectedRoles(prev => prev.includes(r.name) ? prev.filter(x => x !== r.name) : [...prev, r.name])}
                        className={`text-xs px-2 py-0.5 rounded-full font-bold border transition-all ${selectedRoles.includes(r.name) ? "opacity-100" : "opacity-30"}`}
                        style={{ color: r.color, backgroundColor: `${r.color}20`, borderColor: `${r.color}40` }}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                  <Button size="sm" onClick={handleAssignRoles} className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs">
                    Save Roles
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
