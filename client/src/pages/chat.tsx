import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Hash, Settings, User, LogOut, Shield, Trash2, Plus, MessageSquare, Palette, Type, Sparkles, Paintbrush, Eye, MoreVertical, Reply, Edit2, Smile, X, Image as ImageIcon, Monitor, ExternalLink, Ban, Clock, Bot } from "lucide-react";
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

const FONTS = [
  "Adios Script Pro", "Affair", "Aphrodite Pro", "Belluccia Pro", "Burges Script",
  "Cantoni Pro", "Carolyna Pro Black", "Feel Script", "Melany Lane", "Parfumerie Script",
  "Vunder Script™", "Halo Handletter", "Parisienne", "Nickainley", "Samantha Brandon Handwritten Font",
  "Canva", "Canva +3", "Sophisticated Serif & Display Fonts", "Instrument Serif", "Playfair Display",
  "Bodoni Moda", "Didot", "Cormorant", "EB Garamond", "Libre Baskerville", "Royalis",
  "Royal Affair", "Bauer Bodoni", "Alberobello Serif", "Ginetta Marriage Serif Font",
  "Stardust Celestina Modern Serif Font", "Le Murmure", "Mazius Display"
];

const COLORS = [
  { name: "Cool Blue", hex: "#D7EFFF", desc: "A frosty, icy blue." },
  { name: "Jade", hex: "#AEB8A0", desc: "A serene, moody mint-moss green." },
  { name: "Plum Noir", hex: "#351E28", desc: "A deep, decadent dark purple." },
  { name: "Wasabi", hex: "#E9F056", desc: "An electric chartreuse neon." },
  { name: "Persimmon", hex: "#E2725B", desc: "A vibrant, warm orange-red." },
  { name: "Transformative Teal", hex: "#008080", desc: "A deep, eco-conscious teal." },
  { name: "Electric Fuchsia", hex: "#FD4FFF", desc: "A fluorescent, high-energy pink." },
  { name: "Blue Aura", hex: "#A0B0C0", desc: "A soft, hazy, pastel-gray blue." },
  { name: "Amber Haze", hex: "#FFBF00", desc: "A glowing, warm yellow-amber." },
  { name: "Jelly Mint", hex: "#A0E6DA", desc: "A bright, fresh, minty green." },
  { name: "Mocha Mousse", hex: "#A47864", desc: "A rich, warm, earthy brown." },
  { name: "Cloud Dancer", hex: "#F0EFE9", desc: "A warm, airy, off-white." },
  { name: "Universal Khaki", hex: "#C2B280", desc: "A versatile, mid-tone tan." },
  { name: "Cocoa Powder", hex: "#4B3621", desc: "A deep, dark brown alternative to black." },
  { name: "Sage Green", hex: "#9CACA0", desc: "A soft, natural, calming green." },
  { name: "Terracotta Red", hex: "#E2725B", desc: "A sun-baked, clay-like, rust color." },
  { name: "Warm Taupe", hex: "#A09080", desc: "A gentle, grounded gray-brown." },
  { name: "Almond", hex: "#EFDECD", desc: "A warm, soft, neutral cream." },
  { name: "Dusty Rose", hex: "#D58D8D", desc: "A muted, mature, pink-beige." },
  { name: "Burnt Sienna", hex: "#E97451", desc: "A rusty, earthy red-brown." },
  { name: "Digital Lavender", hex: "#A78BFA", desc: "A serene, tech-inspired purple." },
  { name: "Verdant Green", hex: "#4CAF50", desc: "A vibrant, emerald-like green." },
  { name: "Sunny Yellow", hex: "#FFDD44", desc: "A bold, high-contrast, nostalgic yellow." },
  { name: "Neon Magenta", hex: "#FF00FF", desc: "A high-voltage, digital pop color." },
  { name: "Cyber Blue", hex: "#0000FF", desc: "A standard, high-contrast blue screen color." },
  { name: "Midnight Blue", hex: "#101585", desc: "A deep, luxurious navy." },
  { name: "Charcoal", hex: "#333333", desc: "A dark, soft alternative to absolute black." },
  { name: "Pearlescent Purple", hex: "#C3B1E1", desc: "An iridescent, dreamy shade." },
  { name: "Mineral Blue", hex: "#48AAAD", desc: "A clear, saturated, ocean blue." },
  { name: "Burnished Lilac", hex: "#A295C1", desc: "A smoky, vintage-modern lavender." }
];

const ANIMATIONS = [
  "Kinetic Type", "Handwriting Signature", "Glitch Reveal", "Morphing Shape", "3D Pop-up",
  "Gradient Stroke", "Neon Glow", "Slide & Fade", "Liquid Morph", "Typewriter Effect",
  "Paper Plane Reveal", "Rotating Cube", "Particles/Dust Formation", "Draw-on (SVG)",
  "Layered 3D Extrusion", "Stop-Motion Effect", "Zoom-In/Zoom-Out", "Scan Line Reveal",
  "Elastic/Bounce", "Wave/Wavy Movement"
];

const GRADIENTS = [
  "Electric Magenta to Deep Blue", "Incandescent Red to Electric Orange", "Neon Cyan to Deep Purple",
  "Acid Yellow (Wasabi) to Charcoal", "Neon Green on Black", "Pearlescent Purple to Soft Teal",
  "Iridescent Aqua to Silver", "Mint Green to Dusty Rose", "Lavender Blue to Icy White",
  "Cyan to Soft Magenta", "Tangerine Orange to Warm Rust", "Butter Yellow to Deep Mocha",
  "Dusty Pink to Warm Gray", "Cream to Dark Cocoa", "Terracotta to Sand",
  "Emerald Green to Deep Teal", "Deep Sapphire to Royal Purple", "Ocean Blue to Deep Aqua",
  "Magenta to Hot Pink", "White to Light Gray (with neon glow)"
];

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
  const MOD_COMMANDS = [
    { cmd: "/ban",      syntax: "/ban <username> <time> [reason]",     icon: "🔨", desc: "Temporarily or permanently ban a user from chat.", needsTime: "ban"     as const, needsReason: true  },
    { cmd: "/timeout",  syntax: "/timeout <username> <time>",          icon: "⏱️", desc: "Silence a user for a set period — they can still read chat.",  needsTime: "timeout" as const, needsReason: false },
    { cmd: "/unban",    syntax: "/unban <username>",                   icon: "✅", desc: "Lift an active ban and let the user chat again.",              needsTime: null,      needsReason: false },
    { cmd: "/untimeout",syntax: "/untimeout <username>",               icon: "🔊", desc: "Remove an active timeout and restore posting privileges.",     needsTime: null,      needsReason: false },
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
    if (activeChannel) fetchMessages(activeChannel.id);
  }, [activeChannel]);

  useEffect(() => {
    if (justSentRef.current) {
      justSentRef.current = false;
      scrollToBottom(true);
    } else {
      scrollToBottom(false);
    }
  }, [messages]);

  // Real-time polling for new messages
  useEffect(() => {
    if (!activeChannel) return;
    const interval = setInterval(() => {
      fetchMessages(activeChannel.id);
    }, 2000); // Poll every 2 seconds
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
    }, 5000); // Poll every 5 seconds
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

  const handleUpdateUser = async (updates: any) => {
    if (!user) return;
    const res = await authFetch(`/api/chat/users/${user.username}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updatedUser = await res.json();
      const merged = { ...user, ...updatedUser };
      setUser(merged);
      updateAuthUser(updatedUser);
      localStorage.setItem("horizon_chat_user", JSON.stringify(merged));
      toast({ title: "Customization updated" });
    }
  };

  // Real-time polling for roles
  useEffect(() => {
    fetchRoles();
    const interval = setInterval(() => {
      fetchRoles();
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
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
      toast({ title: "Channel created" });
      setNewChannelName("");
      setIsPrivate(false);
      setAllowedUsers("");
      setReadOnlyPublic(false);
      fetchChannels();
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

  const fetchMessages = async (channelId: number) => {
    const res = await fetch(`/api/chat/channels/${channelId}/messages`);
    const data = await res.json();
    setMessages(data);
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
        toast({ title: data.message, className: "bg-green-900/80 border-green-500/30 text-green-200" });
        fetchBanStatus();
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

  const getFontClass = (fontName: string) => {
    switch (fontName) {
      case "Adios Script Pro": case "Affair": case "Aphrodite Pro": case "Parisienne": return "font-adios";
      case "Architects Daughter": case "Samantha Brandon Handwritten Font": return "font-architects";
      case "Playfair Display": return "font-playfair";
      case "EB Garamond": return "font-garamond";
      case "Libre Baskerville": return "font-baskerville";
      case "Bodoni Moda": case "Didot": return "font-bodoni";
      case "Cormorant": return "font-cormorant";
      case "Instrument Serif": return "font-instrument";
      default: return "font-sans";
    }
  };

  const getAnimationClass = (animName: string) => {
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
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/95 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full mx-6 rounded-3xl border border-red-500/20 bg-red-950/20 p-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <Ban className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-1">Banned from Chat</h2>
              <p className="text-white/40 text-sm">You have been banned from Horizon Chat.</p>
            </div>
            <div className="space-y-3 text-left rounded-2xl bg-white/[0.03] border border-white/5 p-4">
              <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Reason</p>
                <p className="text-sm text-white/80 mt-0.5">{banStatus.ban?.reason || "No reason provided"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Banned by</p>
                <p className="text-sm text-white/80 mt-0.5">{banStatus.ban?.bannedBy}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Expires</p>
                <p className="text-sm text-white/80 mt-0.5">{banStatus.ban?.expiresAt ? new Date(banStatus.ban.expiresAt).toLocaleString() : "Never (Permanent)"}</p>
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
                        "Admin": 1,
                        "Server Settings": 2,
                        "Manage Channels": 3,
                        "Manage Roles": 4,
                      };
                      return (orderMap[a.name] ?? 99) - (orderMap[b.name] ?? 99);
                    })
                    .map(role => (
                      <div key={role.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm uppercase tracking-widest" style={{ color: role.color }}>
                            {role.name}
                          </h3>
                          <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded">
                            {rolesByName[role.name]?.length || 0}
                          </span>
                        </div>
                        <div className="space-y-1 bg-white/[0.02] rounded p-2">
                          {(rolesByName[role.name] || []).map(u => (
                            <div key={u.username} className="text-xs hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5" style={{ color: role.color }}>
                              {u.username}
                            </div>
                          ))}
                          {(!rolesByName[role.name] || rolesByName[role.name].length === 0) && (
                            <div className="text-xs text-muted-foreground/50 px-2 py-1 italic">No users</div>
                          )}
                        </div>
                      </div>
                    ))}
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
                    <span 
                      className={`font-black tracking-wide ${msg.username === "RandomIX" ? 'text-gradient-animated text-lg' : ''} ${getFontClass(msg.font || "")} ${getAnimationClass(msg.animation || "")}`} 
                      style={{ color: msg.roleColor !== "gradient" ? msg.roleColor : undefined }}
                      data-text={msg.username}
                    >
                      {msg.username}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(msg.roles && msg.roles.length > 0) ? (
                        msg.roles.map((roleName: string) => {
                          const roleData = roles.find(r => r.name === roleName);
                          return (
                            <span 
                              key={roleName}
                              className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/5 uppercase tracking-widest whitespace-nowrap"
                              style={{ borderColor: roleData?.color + '40', color: roleData?.color || '#9ca3af' }}
                            >
                              {roleName}
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
                            <Input type="color" value={newRoleColor} onChange={(e) => setNewRoleColor(e.target.value)} className="h-10 w-full bg-transparent p-0 border-none" />
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
                              {roles.map(role => (
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
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Customization</label>
                    <div className="grid grid-cols-1 gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full justify-start gap-3 border-white/10 hover:bg-white/5"><Type className="w-4 h-4" /> 30 Fanciest Fonts</Button>
                        </DialogTrigger>
                        <DialogContent className="bg-black border-white/10 max-w-2xl max-h-[80vh]">
                          <DialogHeader><DialogTitle className="text-gradient-animated font-display">THE FANCIEST FONTS</DialogTitle></DialogHeader>
                          <ScrollArea className="h-full pr-4">
                            <div className="grid grid-cols-2 gap-2 p-1">
                              {FONTS.map((font, i) => (
                                <Button key={i} variant="ghost" className="justify-start h-auto py-3 text-white/70 hover:text-white hover:bg-white/5 font-sans" onClick={() => handleUpdateUser({ font })}>
                                  {i + 1}. {font}
                                </Button>
                              ))}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full justify-start gap-3 border-white/10 hover:bg-white/5"><Palette className="w-4 h-4" /> 30 Master Colors</Button>
                        </DialogTrigger>
                        <DialogContent className="bg-black border-white/10 max-w-2xl max-h-[80vh]">
                          <DialogHeader><DialogTitle className="text-gradient-animated font-display">MASTER COLORS</DialogTitle></DialogHeader>
                          <ScrollArea className="h-full pr-4">
                            <div className="grid grid-cols-1 gap-2 p-1">
                              {COLORS.map((color, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-primary/50 transition-all cursor-pointer" onClick={() => handleUpdateUser({ roleColor: color.hex })}>
                                  <div className="w-10 h-10 rounded-lg shadow-lg" style={{ backgroundColor: color.hex }} />
                                  <div>
                                    <p className="font-bold text-white">{color.name} <span className="text-xs font-mono text-muted-foreground ml-2">{color.hex}</span></p>
                                    <p className="text-xs text-muted-foreground italic">{color.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full justify-start gap-3 border-white/10 hover:bg-white/5"><Sparkles className="w-4 h-4" /> 20 Elite Animations</Button>
                        </DialogTrigger>
                        <DialogContent className="bg-black border-white/10 max-w-2xl max-h-[80vh]">
                          <DialogHeader><DialogTitle className="text-gradient-animated font-display">ELITE ANIMATIONS</DialogTitle></DialogHeader>
                          <ScrollArea className="h-full pr-4">
                            <div className="grid grid-cols-1 gap-2 p-1">
                              {ANIMATIONS.map((anim, i) => (
                                <Button key={i} variant="ghost" className="justify-start h-12 text-white/70 hover:text-white hover:bg-white/5 px-4 rounded-xl border border-white/5" onClick={() => handleUpdateUser({ animation: anim })}>
                                  <span className="w-6 text-primary font-mono text-xs">{i + 1}</span> {anim}
                                </Button>
                              ))}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full justify-start gap-3 border-white/10 hover:bg-white/5"><Paintbrush className="w-4 h-4" /> 20 Color through Color</Button>
                        </DialogTrigger>
                        <DialogContent className="bg-black border-white/10 max-w-2xl max-h-[80vh]">
                          <DialogHeader><DialogTitle className="text-gradient-animated font-display">COLOR THROUGH COLOR</DialogTitle></DialogHeader>
                          <ScrollArea className="h-full pr-4">
                            <div className="grid grid-cols-1 gap-2 p-1">
                              {GRADIENTS.map((grad, i) => (
                                <Button key={i} variant="ghost" className="justify-start h-14 text-white/70 hover:text-white hover:bg-white/5 px-4 rounded-xl border border-white/5 group" onClick={() => handleUpdateUser({ animation: "gradient-" + i, roleColor: "gradient" })}>
                                  <span className="w-6 text-primary font-mono text-xs">{i + 1}</span> 
                                  <span className="text-gradient-animated font-bold tracking-tight">{grad}</span>
                                </Button>
                              ))}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

      </div>
    </div>
  );
}
