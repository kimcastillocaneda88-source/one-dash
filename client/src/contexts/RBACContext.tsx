import React, { createContext, useContext, ReactNode } from "react";

export type UserRole = "Admin" | "TeamLeader" | "Member";

interface RBACContextType {
  userRole: UserRole | null;
  canAccess: (requiredRoles: UserRole[]) => boolean;
  isAdmin: boolean;
  isTeamLeader: boolean;
  isMember: boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

interface RBACProviderProps {
  children: ReactNode;
  userRole: UserRole | null;
}

export function RBACProvider({ children, userRole }: RBACProviderProps) {
  const value: RBACContextType = {
    userRole,
    canAccess: (requiredRoles: UserRole[]) => {
      if (!userRole) return false;
      return requiredRoles.includes(userRole);
    },
    isAdmin: userRole === "Admin",
    isTeamLeader: userRole === "TeamLeader",
    isMember: userRole === "Member",
  };

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
}

export function useRBAC(): RBACContextType {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error("useRBAC must be used within a RBACProvider");
  }
  return context;
}

/**
 * Higher-order component to protect routes based on role
 */
export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles: UserRole[]
): React.ComponentType<P> {
  return function ProtectedComponent(props: P) {
    const { canAccess } = useRBAC();

    if (!canAccess(requiredRoles)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              You do not have permission to access this page.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
