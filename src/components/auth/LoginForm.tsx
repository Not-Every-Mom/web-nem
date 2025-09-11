import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Heart, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LiveRegion } from '@/components/ui/live-region';

interface LoginFormProps {
  onSwitchToSignUp: () => void;
  onSwitchToForgot: () => void;
}

export const LoginForm = ({ onSwitchToSignUp, onSwitchToForgot }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const { signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    
    const { error } = await signIn(email, password);
    
    if (error) {
      let errorMessage = "Please check your credentials and try again.";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Please check your email and confirm your account before signing in.";
      }
      
      setFormError(errorMessage);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: errorMessage
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in to Not Every Mom."
      });
    }
    
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    const { error } = await signInWithGoogle();
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Google sign in failed",
        description: "Please try again or use email/password."
      });
      setGoogleLoading(false);
    }
    // Don't set loading to false here - the redirect will handle the state
  };

  return (
    <Card 
      className="w-full max-w-md bg-card/80 backdrop-blur-sm border-2 border-powder-blue/20 shadow-warm"
      role="region"
      aria-label="Sign in form"
    >
      <CardHeader className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center shadow-gentle">
          <Heart className="w-8 h-8 text-white" aria-hidden="true" />
        </div>
        <div>
          <CardTitle className="font-heading text-3xl text-deep-green">
            Welcome Back
          </CardTitle>
          <CardDescription className="font-body text-muted-foreground mt-2">
            Sign in to continue your journey with M.O.M
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent>
        {formError && (
          <div 
            className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start space-x-2"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-destructive">Sign in failed</p>
              <p className="text-sm text-destructive/80">{formError}</p>
            </div>
          </div>
        )}
        
        <form 
          onSubmit={handleSubmit} 
          className="space-y-4"
          noValidate
          aria-describedby={formError ? 'form-error' : undefined}
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="font-body font-medium text-deep-green">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="font-body border-powder-blue/30 focus:border-powder-blue focus:ring-powder-blue"
              required
              autoComplete="email"
              aria-invalid={formError ? 'true' : 'false'}
              aria-describedby={formError ? 'email-error' : 'email-help'}
            />
            <div id="email-help" className="sr-only">
              Enter the email address associated with your account
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="font-body font-medium text-deep-green">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="font-body border-powder-blue/30 focus:border-powder-blue focus:ring-powder-blue"
              required
              autoComplete="current-password"
              aria-invalid={formError ? 'true' : 'false'}
              aria-describedby={formError ? 'password-error' : 'password-help'}
            />
            <div id="password-help" className="sr-only">
              Enter your account password
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-gradient-primary hover:opacity-90 text-white font-body font-semibold py-3 transition-gentle"
            aria-describedby="signin-status"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
          <LiveRegion id="signin-status">
            {loading ? 'Processing sign in request, please wait...' : ''}
          </LiveRegion>
        </form>
        
        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-powder-blue/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-body">
                Or continue with
              </span>
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full mt-4 border-powder-blue/30 hover:bg-powder-blue/5 font-body"
          >
            {googleLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting to Google...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>
        </div>
        
        <div className="mt-6 space-y-3 text-center">
          <Button
            variant="ghost"
            onClick={onSwitchToForgot}
            className="font-body text-sm text-muted-foreground hover:text-deep-green"
          >
            Forgot your password?
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-powder-blue/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-body">
                Don't have an account?
              </span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            onClick={onSwitchToSignUp}
            className="font-body text-powder-blue hover:text-deep-green"
          >
            Create a new account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};