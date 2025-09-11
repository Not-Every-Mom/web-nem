import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type AuthMode = 'login' | 'signup' | 'forgot';

const AuthScreen = () => {
  console.log('AuthScreen: Component rendering');
  const [mode, setMode] = useState<AuthMode>('login');
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  // Set document title based on mode
  useDocumentTitle(
    mode === 'signup' ? 'Sign Up' : 
    mode === 'forgot' ? 'Reset Password' : 
    'Sign In'
  );
  
  console.log('AuthScreen: About to call useDemo hook');
  const { isDemoMode, toggleDemoMode } = useDemo();
  console.log('AuthScreen: useDemo hook successful, isDemoMode:', isDemoMode);

  // Redirect authenticated users to home
  useEffect(() => {
    if (!loading && user) {
      navigate("/app");
    }
  }, [user, loading, navigate]);

  // Redirect demo mode users to app
  useEffect(() => {
    if (isDemoMode) {
      navigate("/app");
    }
  }, [isDemoMode, navigate]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div 
          className="animate-spin rounded-full h-32 w-32 border-b-2 border-powder-blue"
          role="status"
          aria-label="Loading authentication status"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  const renderForm = () => {
    switch (mode) {
      case 'signup':
        return (
          <SignUpForm
            onSwitchToLogin={() => setMode('login')}
            onSwitchToForgot={() => setMode('forgot')}
          />
        );
      case 'forgot':
        return (
          <ForgotPasswordForm
            onSwitchToLogin={() => setMode('login')}
          />
        );
      default:
        return (
          <LoginForm
            onSwitchToSignUp={() => setMode('signup')}
            onSwitchToForgot={() => setMode('forgot')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-subtle" />
      <div className="absolute top-20 right-32 w-40 h-40 bg-powder-blue/10 rounded-full blur-3xl animate-pulse" aria-hidden="true" />
      <div className="absolute bottom-32 left-16 w-32 h-32 bg-muted-gold/10 rounded-full blur-2xl animate-pulse" aria-hidden="true" />
      
      <div className="container mx-auto px-6 relative z-10 max-w-md">
        {/* Back Button */}
        <div className="absolute -top-16 left-0">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/onboarding")}
            className="font-body text-muted-foreground"
            aria-label="Go back to onboarding"
          >
            <ArrowLeft className="mr-2 w-4 h-4" aria-hidden="true" />
            Back
          </Button>
        </div>

        {/* Demo Mode Toggle */}
        <div className="absolute -top-16 right-0">
          <Button 
            variant="outline" 
            onClick={toggleDemoMode}
            className="font-body text-powder-blue border-powder-blue/30 hover:bg-powder-blue/10"
            aria-label="Try demo mode without signing up"
          >
            <Eye className="mr-2 w-4 h-4" aria-hidden="true" />
            Try Demo
          </Button>
        </div>

        {/* Auth Form */}
        <main role="main" aria-label="Authentication form">
          {renderForm()}
        </main>
        
        {/* Demo Mode Note */}
        <div className="mt-6 text-center">
          <p className="font-body text-xs text-muted-foreground">
            Want to explore first? Try our{" "}
            <button 
              onClick={toggleDemoMode}
              className="text-powder-blue hover:text-deep-green underline focus:outline-none focus:ring-2 focus:ring-powder-blue focus:ring-offset-2 rounded"
              aria-label="Switch to demo mode"
            >
              demo mode
            </button>
            {" "}with no signup required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;