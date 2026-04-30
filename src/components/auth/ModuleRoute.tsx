import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "./ProtectedRoute";
import { useModuleSettings, type ModuleKey } from "@/hooks/useModuleSettings";

interface ModuleRouteProps {
  module: ModuleKey;
  children: React.ReactNode;
}

/**
 * Wraps ProtectedRoute and additionally redirects to "/" when the
 * given module has been disabled in workspace Settings.
 */
export function ModuleRoute({ module, children }: ModuleRouteProps) {
  const { isLoading, isEnabled } = useModuleSettings();

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!isEnabled(module)) {
    return <Navigate to="/" replace />;
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
}
