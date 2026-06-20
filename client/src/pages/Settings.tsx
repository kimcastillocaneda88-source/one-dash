import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRBAC } from "@/contexts/RBACContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const { userRole } = useRBAC();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="headline-massive">Settings</h1>
        <p className="subtext-delicate mt-2">Manage your account and preferences</p>
      </div>

      {/* User Profile Section */}
      <div className="bg-card rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-foreground mt-1">{user?.name || "Not set"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-foreground mt-1">{user?.email || "Not set"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <p className="text-foreground mt-1 capitalize">{userRole || "Unknown"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Member Since</label>
              <p className="text-foreground mt-1">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-card rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Auto-refresh metrics</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically refresh dashboard data every 30 seconds
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4"
                aria-label="Enable auto-refresh"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Desktop notifications</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive notifications for important metric changes
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked={false}
                className="w-4 h-4"
                aria-label="Enable desktop notifications"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-card rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Security</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Login Method</label>
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {user?.loginMethod || "Unknown"}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2"
                aria-label="Log out from dashboard"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-card rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4">About</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Team Leader Dashboard v1.0.0</p>
            <p>Real-time performance analytics for team leaders</p>
            <p className="mt-4">
              For support or feedback, please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
