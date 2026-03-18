import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/context/auth";
import { NotificationsProvider } from "@/context/notifications";
import NotFound from "@/pages/not-found";
import Games from "@/pages/games";
import Browser from "@/pages/browser";
import Proxies from "@/pages/proxies";
import Tools from "@/pages/tools";
import GatekeepOS from "@/pages/gatekeep-os";
import Announcements from "@/pages/announcements";
import Chat from "@/pages/chat";
import Partners from "@/pages/partners";
import AIPage from "@/pages/ai";
import TheWall from "@/pages/the-wall";
import LoginPage from "@/pages/login";
import ProfileEditor from "@/pages/profile-editor";
import FriendsPage from "@/pages/friends";
import InboxPage from "@/pages/inbox";
import DMsPage from "@/pages/dms";
import UsersPage from "@/pages/users";
import GlobalInboxPage from "@/pages/global-inbox";
import MoviesPage from "@/pages/movies";
import HorizonTubePage from "@/pages/horizontube";
import EaglerCraft from "@/pages/eaglercraft";
import EaglerCraftLauncher from "@/pages/eaglercraft-launcher";
import ChangeLogsPage from "@/pages/change-logs";
import ChatRulesPage from "@/pages/chat-rules";
import { AppSidebar } from "@/components/layout/app-sidebar";
import MusicPlayer from "@/components/music-player";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/announcements" />
      </Route>
      <Route path="/games" component={Games} />
      <Route path="/browser" component={Browser} />
      <Route path="/proxies" component={Proxies} />
      <Route path="/tools" component={Tools} />
      <Route path="/gatekeep-os" component={GatekeepOS} />
      <Route path="/announcements" component={Announcements} />
      <Route path="/chat" component={Chat} />
      <Route path="/partners" component={Partners} />
      <Route path="/ai" component={AIPage} />
      <Route path="/the-wall" component={TheWall} />
      <Route path="/profile" component={ProfileEditor} />
      <Route path="/friends" component={FriendsPage} />
      <Route path="/inbox" component={InboxPage} />
      <Route path="/dms/:username" component={DMsPage} />
      <Route path="/dms" component={DMsPage} />
      <Route path="/users" component={UsersPage} />
      <Route path="/global-inbox" component={GlobalInboxPage} />
      <Route path="/movies" component={MoviesPage} />
      <Route path="/horizontube" component={HorizonTubePage} />
      <Route path="/eaglercraft" component={EaglerCraft} />
      <Route path="/eaglercraft-launcher" component={EaglerCraftLauncher} />
      <Route path="/change-logs" component={ChangeLogsPage} />
      <Route path="/chat-rules" component={ChatRulesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthGate() {
  const { user, isVerifying } = useAuth();

  if (isVerifying) {
    return (
      <div className="flex h-screen w-full bg-black items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500/40 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4.5rem",
  } as React.CSSProperties;

  return (
    <NotificationsProvider>
      <SidebarProvider style={style}>
        <div className="flex h-screen w-full bg-black text-white overflow-hidden">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden bg-black relative w-full border-l border-white/5 shadow-2xl">
            <header className="md:hidden flex items-center p-4 border-b border-white/5 bg-black/90 backdrop-blur-xl z-50 shrink-0">
              <SidebarTrigger className="text-white hover:bg-white/10 transition-colors rounded-lg" />
              <div className="flex-1 flex justify-center pr-10">
                <span className="font-display text-2xl font-black text-gradient-animated tracking-widest uppercase">
                  HORIZON
                </span>
              </div>
            </header>
            <main className="flex-1 overflow-hidden h-full relative">
              <Router />
            </main>
          </div>
        </div>
        <MusicPlayer />
      </SidebarProvider>
    </NotificationsProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AuthGate />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
