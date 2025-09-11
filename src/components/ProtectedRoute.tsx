import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { isDemoMode } = useDemo();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to auth if not authenticated and not in demo mode
    if (!loading && !user && !isDemoMode) {
      navigate("/auth");
    }
  }, [user, loading, isDemoMode, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-powder-blue" />
      </div>
    );
  }

  // Allow access if user is authenticated OR in demo mode
  if (!user && !isDemoMode) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
};