import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/_core/hooks/useAuth";
import { LayoutDashboard, LogOut, Users, FileText, Settings } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/overview" },
  { icon: Users, label: "My Team", path: "/my-team" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const resizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;

      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    const handleMouseDown = () => {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const resizer = resizeRef.current;
    if (resizer) {
      resizer.addEventListener("mousedown", handleMouseDown);
    }

    return () => {
      if (resizer) {
        resizer.removeEventListener("mousedown", handleMouseDown);
      }
    };
  }, []);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = "/api/oauth/login";
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar
        style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
        className="sidebar border-r-2 border-accent"
      >
        <SidebarHeader className="border-b border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-accent-foreground font-black text-lg">TL</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-sm tracking-tight truncate">DASHBOARD</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Analytics</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0">
          <SidebarMenu className="gap-1 p-2">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={location === item.path}
                  onClick={() => navigate(item.path)}
                  className={`sidebar-item ${
                    location === item.path ? "active" : ""
                  }`}
                  aria-label={`Navigate to ${item.label}`}
                  aria-current={location === item.path ? "page" : undefined}
                >
                  <a href={item.path} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-accent text-accent-foreground font-bold">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{user.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">
                  {user.role || "Member"}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="User menu"
                >
                  <span className="sr-only">Open menu</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => navigate("/settings")}
                  className="cursor-pointer"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                  }}
                  className="cursor-pointer text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="flex flex-col h-full">
          {/* Top Navigation Bar */}
          <div className="border-b border-gray-200 dark:border-gray-800 bg-card px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden" aria-label="Toggle sidebar" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Team Performance Analytics
              </h2>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </SidebarInset>

      {/* Sidebar Resize Handle */}
      <div
        ref={resizeRef}
        className="w-1 bg-border hover:bg-accent cursor-col-resize transition-colors"
        aria-label="Resize sidebar"
        role="separator"
      />
    </SidebarProvider>
  );
}
