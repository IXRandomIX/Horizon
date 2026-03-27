import { Component, type ReactNode, lazy, Suspense } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/context/auth";
import { NotificationsProvider } from "@/context/notifications";
import { AppSidebar } from "@/components/layout/app-sidebar";
import MusicPlayer from "@/components/music-player";
import LoginPage from "@/pages/login";

const Games = lazy(() => import("@/pages/games"));
const Browser = lazy(() => import("@/pages/browser"));
const Proxies = lazy(() => import("@/pages/proxies"));
const Tools = lazy(() => import("@/pages/tools"));
const GatekeepOS = lazy(() => import("@/pages/gatekeep-os"));
const Announcements = lazy(() => import("@/pages/announcements"));
const Chat = lazy(() => import("@/pages/chat"));
const Partners = lazy(() => import("@/pages/partners"));
const Credits = lazy(() => import("@/pages/credits"));
const AIPage = lazy(() => import("@/pages/ai"));
const TheWall = lazy(() => import("@/pages/the-wall"));
const ProfileEditor = lazy(() => import("@/pages/profile-editor"));
const FriendsPage = lazy(() => import("@/pages/friends"));
const InboxPage = lazy(() => import("@/pages/inbox"));
const DMsPage = lazy(() => import("@/pages/dms"));
const UsersPage = lazy(() => import("@/pages/users"));
const GlobalInboxPage = lazy(() => import("@/pages/global-inbox"));
const MoviesPage = lazy(() => import("@/pages/movies"));
const HorizonTubePage = lazy(() => import("@/pages/horizontube"));
const RanksPage = lazy(() => import("@/pages/ranks"));
const LeaderboardPage = lazy(() => import("@/pages/leaderboard"));
const EaglerCraft = lazy(() => import("@/pages/eaglercraft"));
const EaglerCraftLauncher = lazy(() => import("@/pages/eaglercraft-launcher"));
const ChangeLogsPage = lazy(() => import("@/pages/change-logs"));
const ChatRulesPage = lazy(() => import("@/pages/chat-rules"));

function PageLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-6 h-6 border-2 border-purple-500/40 border-t-purple-500 rounded-full animate-spin" />
    </div>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, error: err instanceof Error ? err.message : String(err) };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 text-white p-8">
          <p className="text-white/40 text-sm">Something went wrong. Please refresh to try again.</p>
          <button
            onClick={() => {
              localStorage.removeItem("horizon_music_history");
              localStorage.removeItem("horizon_music_current");
              this.setState({ hasError: false, error: "" });
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
          >
            Clear cached data &amp; retry
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition-colors"
          >
            Refresh page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
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
        <Route path="/credits" component={Credits} />
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
        <Route path="/ranks" component={RanksPage} />
        <Route path="/leaderboard" component={LeaderboardPage} />
        <Route path="/eaglercraft" component={EaglerCraft} />
        <Route path="/eaglercraft-launcher" component={EaglerCraftLauncher} />
        <Route path="/change-logs" component={ChangeLogsPage} />
        <Route path="/chat-rules" component={ChatRulesPage} />
        <Route>
          <Redirect to="/announcements" />
        </Route>
      </Switch>
    </Suspense>
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
          <ErrorBoundary>
            <AuthGate />
            <Toaster />
          </ErrorBoundary>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
