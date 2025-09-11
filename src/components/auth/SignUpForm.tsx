import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAccessibility } from '@/components/accessibility/AccessibilityProvider';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
  onSwitchToForgot: () => void;
}

export const SignUpForm = ({ onSwitchToLogin, onSwitchToForgot }: SignUpFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const { signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const { announce } = useAccessibility();

  // Real-time validation
  const validatePassword = (value: string) => {
    if (value && value.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return '';
  };

  const validatePasswordMatch = (password: string, confirm: string) => {
    if (confirm && password !== confirm) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: {[key: string]: string} = {};
    
    // Validate all fields
    const passwordError = validatePassword(password);
    const confirmError = validatePasswordMatch(password, confirmPassword);
    
    if (passwordError) newErrors.password = passwordError;
    if (confirmError) newErrors.confirmPassword = confirmError;
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      announce('Form has validation errors. Please check and correct them.', 'assertive');
      return;
    }

    setLoading(true);
    announce('Creating your account...', 'polite');
    
    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message
      });
      announce('Sign up failed. Please try again.', 'assertive');
    } else {
      toast({
        title: "Welcome to Not Every Mom!",
        description: "Please check your email to verify your account."
      });
      announce('Account created successfully! Please check your email to verify your account.', 'polite');
    }
    
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    announce('Connecting to Google...', 'polite');
    
    const { error } = await signInWithGoogle();
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Google sign up failed",
        description: "Please try again or use email/password."
      });
      announce('Google sign up failed. Please try again.', 'assertive');
      setGoogleLoading(false);
    }
    // Don't set loading to false here - the redirect will handle the state
  };

  return (
    <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-2 border-powder-blue/20 shadow-warm">
      <CardHeader className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center shadow-gentle">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <div>
          <CardTitle className="font-heading text-3xl text-deep-green">
            Join Not Every Mom
          </CardTitle>
          <CardDescription className="font-body text-muted-foreground mt-2">
            Create your account and find the maternal support you deserve
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="fullName" className="font-body font-medium text-deep-green">
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) {
                  setErrors(prev => ({ ...prev, fullName: '' }));
                }
              }}
              placeholder="Enter your full name"
              className="font-body border-powder-blue/30 focus:border-powder-blue focus:ring-powder-blue"
              required
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
            />
            {errors.fullName && (
              <div id="fullName-error" className="text-sm text-destructive font-body" role="alert">
                {errors.fullName}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="font-body font-medium text-deep-green">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: '' }));
                }
              }}
              placeholder="Enter your email"
              className="font-body border-powder-blue/30 focus:border-powder-blue focus:ring-powder-blue"
              required
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <div id="email-error" className="text-sm text-destructive font-body" role="alert">
                {errors.email}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="font-body font-medium text-deep-green">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                const value = e.target.value;
                setPassword(value);
                const error = validatePassword(value);
                setErrors(prev => ({ ...prev, password: error }));
              }}
              placeholder="Create a password (at least 6 characters)"
              className="font-body border-powder-blue/30 focus:border-powder-blue focus:ring-powder-blue"
              required
              minLength={6}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : "password-help"}
            />
            <div id="password-help" className="text-sm text-muted-foreground font-body">
              Must be at least 6 characters long
            </div>
            {errors.password && (
              <div id="password-error" className="text-sm text-destructive font-body" role="alert">
                {errors.password}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="font-body font-medium text-deep-green">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                const value = e.target.value;
                setConfirmPassword(value);
                const error = validatePasswordMatch(password, value);
                setErrors(prev => ({ ...prev, confirmPassword: error }));
              }}
              placeholder="Confirm your password"
              className="font-body border-powder-blue/30 focus:border-powder-blue focus:ring-powder-blue"
              required
              minLength={6}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
            />
            {errors.confirmPassword && (
              <div id="confirmPassword-error" className="text-sm text-destructive font-body" role="alert">
                {errors.confirmPassword}
              </div>
            )}
          </div>
          
          <Button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-gradient-primary hover:opacity-90 text-white font-body font-semibold py-3 transition-gentle"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
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
            onClick={handleGoogleSignUp}
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
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-powder-blue/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-body">
                Already have an account?
              </span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            onClick={onSwitchToLogin}
            className="font-body text-powder-blue hover:text-deep-green"
          >
            Sign in to your account
          </Button>
          
          <Button
            variant="ghost"
            onClick={onSwitchToForgot}
            className="font-body text-sm text-muted-foreground hover:text-deep-green"
          >
            Forgot your password?
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};