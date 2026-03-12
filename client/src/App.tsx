import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
import { AppSidebar } from "@/components/layout/app-sidebar";

function Router() {
  return (
    <Switch>
      {/* Route mapping */}
      <Route path="/">
        <Redirect to="/games" />
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
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  // Enforce consistent sidebar metrics as required by design rules
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4.5rem",
  } as React.CSSProperties;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style}>
          <div className="flex h-screen w-full bg-black text-white overflow-hidden">
            <AppSidebar />
            
            <div className="flex flex-col flex-1 overflow-hidden bg-black relative w-full border-l border-white/5 shadow-2xl">
              {/* Mobile Header */}
              <header className="md:hidden flex items-center p-4 border-b border-white/5 bg-black/90 backdrop-blur-xl z-50 shrink-0">
                <SidebarTrigger className="text-white hover:bg-white/10 transition-colors rounded-lg" />
                <div className="flex-1 flex justify-center pr-10">
                  <span className="font-display text-2xl font-black text-gradient-animated tracking-widest uppercase">
                    HORIZON
                  </span>
                </div>
              </header>
              
              {/* Main Content Area */}
              <main className="flex-1 overflow-hidden h-full relative">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
