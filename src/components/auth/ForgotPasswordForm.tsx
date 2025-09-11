import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Heart, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

export const ForgotPasswordForm = ({ onSwitchToLogin }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await resetPassword(email);
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: error.message
      });
    } else {
      setSent(true);
      toast({
        title: "Reset email sent",
        description: "Please check your email for password reset instructions."
      });
    }
    
    setLoading(false);
  };

  if (sent) {
    return (
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-2 border-powder-blue/20 shadow-warm">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center shadow-gentle">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="font-heading text-3xl text-deep-green">
              Check Your Email
            </CardTitle>
            <CardDescription className="font-body text-muted-foreground mt-2">
              We've sent password reset instructions to {email}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4 text-center">
            <p className="font-body text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            
            <Button
              onClick={() => setSent(false)}
              variant="outline"
              className="w-full font-body border-powder-blue/30 text-deep-green hover:bg-powder-blue/10"
            >
              Try Again
            </Button>
            
            <Button
              onClick={onSwitchToLogin}
              variant="ghost"
              className="w-full font-body text-powder-blue hover:text-deep-green"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-2 border-powder-blue/20 shadow-warm">
      <CardHeader className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center shadow-gentle">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <div>
          <CardTitle className="font-heading text-3xl text-deep-green">
            Reset Password
          </CardTitle>
          <CardDescription className="font-body text-muted-foreground mt-2">
            Enter your email and we'll send you reset instructions
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
              aria-describedby="email-desc"
              autoComplete="email"
            />
            <p id="email-desc" className="text-xs text-muted-foreground">
              We'll send password reset instructions to this email
            </p>
          </div>
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-primary hover:opacity-90 text-white font-body font-semibold py-3 transition-gentle"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Email'
            )}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <Button
            onClick={onSwitchToLogin}
            variant="ghost"
            className="font-body text-powder-blue hover:text-deep-green"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};