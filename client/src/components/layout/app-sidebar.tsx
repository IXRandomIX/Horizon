import { useLocation, Link } from "wouter";
import { Gamepad2, Globe, Megaphone, ShieldCheck, Wrench, Lock, MessageCircle, Users, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader
} from "@/components/ui/sidebar";

const navItems = [
  { name: "Announcements", path: "/announcements", icon: Megaphone },
  { name: "HORIZON CHAT", path: "/chat", icon: MessageCircle },
  { name: "Horizon AI", path: "/ai", icon: Sparkles, highlight: true },
  { name: "Partners", path: "/partners", icon: Users },
  { name: "Games Portal", path: "/games", icon: Gamepad2 },
  { name: "Proxy Browser", path: "/browser", icon: Globe },
  { name: "Proxies", path: "/proxies", icon: ShieldCheck },
  { name: "Media / Tools", path: "/tools", icon: Wrench },
  { name: "Gatekeep OS", path: "/gatekeep-os", icon: Lock },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r border-white/5 bg-black">
      <SidebarHeader className="pt-10 pb-8 px-6 flex flex-col items-center select-none">
        <h1 className="font-display text-4xl sm:text-5xl font-black text-gradient-animated tracking-widest uppercase text-center">
          HORIZON
        </h1>
        <div className="w-16 h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 mt-6 rounded-full opacity-60 shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
      </SidebarHeader>
      
      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
              {navItems.map((item) => {
                const isActive = location === item.path;
                const isHighlight = (item as any).highlight;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild tooltip={item.name} isActive={isActive}>
                      <Link 
                        href={item.path} 
                        className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 ${
                          isActive 
                            ? 'bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(124,58,237,0.15)] border border-primary/20' 
                            : isHighlight
                            ? 'text-primary/80 hover:text-primary hover:bg-primary/5 border border-primary/10'
                            : 'text-muted-foreground hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <item.icon className={`w-5 h-5 transition-colors ${isActive || isHighlight ? 'text-primary' : ''}`} />
                        <span className="font-medium text-base tracking-wide">{item.name}</span>
                        {isHighlight && !isActive && (
                          <span className="ml-auto text-[9px] font-bold uppercase tracking-widest bg-primary/20 text-primary border border-primary/30 rounded-md px-1.5 py-0.5">AI</span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
