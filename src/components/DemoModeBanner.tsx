import { useDemo } from "@/hooks/useDemo";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, X, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DemoModeBanner = () => {
  const { isDemoMode, exitDemoMode } = useDemo();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Don't show banner if not in demo mode or if user is actually authenticated
  if (!isDemoMode || user) {
    return null;
  }

  const handleSignUp = () => {
    exitDemoMode();
    navigate("/auth");
  };

  return (
    <div className="mx-4 mb-2 mt-16 px-3 py-2 bg-muted-gold/20 border border-muted-gold/30 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-dark-brown/70" />
          <span className="font-body text-xs text-dark-brown/80">
            Demo Mode • <button onClick={handleSignUp} className="underline font-medium hover:text-dark-brown">Sign up to save progress</button>
          </span>
        </div>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={exitDemoMode}
          className="h-6 w-6 p-0 text-dark-brown/70 hover:bg-dark-brown/10"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};