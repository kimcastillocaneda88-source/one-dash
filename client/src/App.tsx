import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { RBACProvider } from "./contexts/RBACContext";
import { useAuth } from "./_core/hooks/useAuth";
import DashboardLayout from "./components/DashboardLayout";
import Overview from "./pages/Overview";
import MyTeam from "./pages/MyTeam";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Team Leader Dashboard</h1>
          <p className="text-muted-foreground mb-6">Please log in to continue</p>
          <a
            href="/api/oauth/login"
            className="inline-block px-6 py-2 bg-accent text-accent-foreground rounded font-semibold hover:bg-gray-700 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Overview} />
        <Route path="/overview" component={Overview} />
        <Route path="/my-team" component={MyTeam} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route path="/404" component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  const { user } = useAuth();

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <RBACProvider userRole={user?.role as any}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </RBACProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
