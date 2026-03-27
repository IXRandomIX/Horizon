import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import {
  Gamepad2, Globe, Megaphone, ShieldCheck, Wrench, Lock, MessageCircle,
  Users, Sparkles, BrickWall, UserCircle, Heart, Inbox, MessageSquare,
  LogOut, UsersRound, MailOpen, Clapperboard, Sword, ScrollText, Monitor, BookOpen, Youtube, Trophy, BarChart2, Star
} from "lucide-react";
import { getRankForXP } from "@shared/quests";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth";
import { useNotifications } from "@/context/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const socialItemsBase = [
  { name: "Friends", path: "/friends", icon: Heart },
  { name: "Inbox", path: "/inbox", icon: Inbox, badgeKey: "inbox" },
  { name: "DMs", path: "/dms", icon: MessageSquare },
  { name: "Users", path: "/users", icon: UsersRound },
];

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-auto min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-primary/30">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { globalInboxUnread, chatUnread, changeLogsUnread, inboxUnread, markGlobalInboxRead, markChatRead, markChangeLogsRead, markInboxRead } = useNotifications();
  const [rankInfo, setRankInfo] = useState<{ xp: number | null; rank: { name: string; color: string }; isStaff: boolean } | null>(null);

  const fetchRankInfo = () => {
    const token = localStorage.getItem("horizon_session_token");
    if (!token) return;
    fetch("/api/ranks/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setRankInfo(data); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchRankInfo();
    window.addEventListener("xp-updated", fetchRankInfo);
    const poll = setInterval(fetchRankInfo, 60000);
    return () => {
      window.removeEventListener("xp-updated", fetchRankInfo);
      clearInterval(poll);
    };
  }, [user?.username]);

  const FONT_CLASSES: Record<string, string> = {
    "Playfair Display": "font-playfair",
    "EB Garamond": "font-garamond",
    "Bodoni Moda": "font-bodoni",
    "Cormorant": "font-cormorant",
    "Instrument Serif": "font-instrument",
    "Parisienne": "font-adios",
    "sans": "font-sans",
  };

  const displayName = user?.displayName || user?.username || "";
  const fontClass = FONT_CLASSES[user?.displayFont || "sans"] || "font-sans";

  const navItems = [
    { name: "Announcements", path: "/announcements", icon: Megaphone },
    { name: "Change Logs", path: "/change-logs", icon: ScrollText, badge: changeLogsUnread, onNavigate: markChangeLogsRead },
    { name: "HORIZON CHAT", path: "/chat", icon: MessageCircle, badge: chatUnread, onNavigate: markChatRead },
    { name: "Chat Rules", path: "/chat-rules", icon: BookOpen },
    { name: "Horizon AI", path: "/ai", icon: Sparkles, highlight: true },
    { name: "Global Inbox", path: "/global-inbox", icon: MailOpen, badge: globalInboxUnread, onNavigate: markGlobalInboxRead },
    { name: "Partners", path: "/partners", icon: Users },
    { name: "Credits", path: "/credits", icon: Star },
    { name: "Movies", path: "/movies", icon: Clapperboard },
    { name: "HorizonTube", path: "/horizontube", icon: Youtube },
    { name: "Ranks & Quests", path: "/ranks", icon: Trophy },
    { name: "Leaderboard", path: "/leaderboard", icon: BarChart2 },
    { name: "Games Portal", path: "/games", icon: Gamepad2 },
    { name: "Dragon X V2", path: "/eaglercraft", icon: Sword },
    { name: "Eaglercraft Launcher", path: "/eaglercraft-launcher", icon: Monitor },
    { name: "Proxy Browser", path: "/browser", icon: Globe },
    { name: "Proxies", path: "/proxies", icon: ShieldCheck },
    { name: "Media / Tools", path: "/tools", icon: Wrench },
    { name: "Gatekeep OS", path: "/gatekeep-os", icon: Lock },
    { name: "THE WALL", path: "/the-wall", icon: BrickWall, wall: true },
  ];

  return (
    <Sidebar className="border-r border-white/5 bg-black">
      <SidebarHeader className="pt-10 pb-8 px-6 flex flex-col items-center select-none">
        <h1 className="font-display text-4xl sm:text-5xl font-black text-gradient-animated tracking-widest uppercase text-center">
          HORIZON
        </h1>
        <div className="w-16 h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 mt-6 rounded-full opacity-60 shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
      </SidebarHeader>

      <SidebarContent className="px-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
              {navItems.map((item) => {
                const isActive = location === item.path;
                const isHighlight = (item as any).highlight;
                const isWall = (item as any).wall;
                const badge = (item as any).badge as number | undefined;
                const onNavigate = (item as any).onNavigate as (() => void) | undefined;

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild tooltip={item.name} isActive={isActive}>
                      <Link
                        href={item.path}
                        onClick={onNavigate}
                        className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 ${
                          isActive && isWall
                            ? "bg-red-950/30 text-red-400 shadow-[inset_0_0_20px_rgba(220,38,38,0.15)] border border-red-800/40"
                            : isWall
                            ? "text-red-500/70 hover:text-red-400 hover:bg-red-950/20 border border-red-900/20"
                            : isActive
                            ? "bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(124,58,237,0.15)] border border-primary/20"
                            : isHighlight
                            ? "text-primary/80 hover:text-primary hover:bg-primary/5 border border-primary/10"
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isWall ? "text-red-500/70" : isActive || isHighlight ? "text-primary" : ""}`} />
                        <span className={`font-medium text-base tracking-wide flex-1 min-w-0 truncate ${isWall ? "font-black tracking-widest" : ""}`}>{item.name}</span>

                        {/* Notification badge (takes priority over other right-side tags) */}
                        {badge && badge > 0 && !isActive ? (
                          <Badge count={badge} />
                        ) : isHighlight && !isActive ? (
                          <span className="ml-auto text-[9px] font-bold uppercase tracking-widest bg-primary/20 text-primary border border-primary/30 rounded-md px-1.5 py-0.5 flex-shrink-0">AI</span>
                        ) : isWall && !isActive ? (
                          <span className="ml-auto text-[9px] font-bold uppercase tracking-widest bg-red-950/40 text-red-500/70 border border-red-900/30 rounded-md px-1.5 py-0.5 flex-shrink-0">???</span>
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Social Section */}
        <SidebarGroup className="mt-2">
          <div className="px-4 mb-2">
            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Social</p>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {socialItemsBase.map((item) => {
                const isActive = location === item.path || location.startsWith(item.path + "/");
                const badge = (item as any).badgeKey === "inbox" ? inboxUnread : 0;
                const onNavigate = (item as any).badgeKey === "inbox" ? markInboxRead : undefined;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild tooltip={item.name} isActive={isActive}>
                      <Link
                        href={item.path}
                        onClick={onNavigate}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                        <span className="font-medium text-sm tracking-wide">{item.name}</span>
                        <Badge count={badge} />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile Footer */}
      <SidebarFooter className="border-t border-white/5 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-testid="button-user-menu"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-sm font-black text-white/50 overflow-hidden flex-shrink-0">
                {user?.avatar
                  ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  : <span>{user?.username?.[0]?.toUpperCase()}</span>
                }
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className={`text-sm font-bold text-white truncate ${fontClass}`}>{displayName}</p>
                {rankInfo ? (
                  <p className="text-[10px] font-bold truncate" style={{ color: rankInfo.rank.color }}>
                    {rankInfo.isStaff ? `STAFF · ${(rankInfo.xp ?? 0).toLocaleString()} XP` : `${rankInfo.rank.name} · ${(rankInfo.xp ?? 0).toLocaleString()} XP`}
                  </p>
                ) : (
                  <p className="text-xs text-white/30 truncate">@{user?.username}</p>
                )}
              </div>
              {user?.role && user.role !== "User" && (
                <span className="text-[9px] font-bold text-primary/70 bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 flex-shrink-0 uppercase tracking-wider">
                  {user.role}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-52 bg-[#0e0e14] border border-white/10 rounded-xl"
          >
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white">
                <UserCircle className="w-4 h-4" />
                Edit Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              onClick={logout}
              className="text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
