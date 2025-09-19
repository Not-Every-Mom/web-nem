import { Button } from "@/components/ui/button";
import { Heart, Menu, X, User } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFocusTrap } from "@/hooks/useFocusManagement";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const mobileNavRef = useRef<HTMLDivElement>(null);
  
  // Implement focus trap for mobile menu
  useFocusTrap(isMenuOpen, mobileNavRef);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-powder-blue" />
            <span className="font-heading text-2xl text-deep-green">Not Every Mom</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8" role="navigation" aria-label="Main navigation">
            {/* <a href="#features" className="font-body text-foreground hover:text-powder-blue transition-gentle">
              Features
            </a>
            <a href="#mom-ai" className="font-body text-foreground hover:text-powder-blue transition-gentle">
              M.O.M AI
            </a> */}
            <a href="https://discord.gg/CUDd268B2w" className="font-body text-foreground hover:text-powder-blue transition-gentle">
              Discord
            </a>
            <a href="/resources" className="font-body text-foreground hover:text-powder-blue transition-gentle">
              Resources
            </a>         
            <a href="/faq" className="font-body text-foreground hover:text-powder-blue transition-gentle">
              FAQ
            </a>
            <a href="/volunteer" className="block font-body text-foreground hover:text-powder-blue transition-gentle">
              Volunteer
            </a>
               <a href="/about" className="font-body text-foreground hover:text-powder-blue transition-gentle">
              About
            </a>
            
            {/* {!loading && (
              user ? (
                // Authenticated user - show app access
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/app")}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Go to App
                  </Button>
                </div>
              ) : (
                // Unauthenticated user - show both sign in and get started
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/auth")}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="chat"
                    size="sm"
                    onClick={() => {
                      localStorage.setItem('wantsOnboarding', 'true');
                      navigate("/onboarding");
                    }}
                  >
                    Get Started
                  </Button>
                </div>
              )
            )} */}
          </div>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div 
            ref={mobileNavRef}
            id="mobile-nav"
            className="md:hidden py-4 space-y-4 border-t border-border"
            role="navigation"
            aria-label="Mobile navigation menu"
          >
            {/* <a href="#features" className="block font-body text-foreground hover:text-powder-blue transition-gentle">
              Features
            </a>
            <a href="#mom-ai" className="block font-body text-foreground hover:text-powder-blue transition-gentle">
              M.O.M AI
            </a> */}
            <a href="https://discord.gg/CUDd268B2w" className="block font-body text-foreground hover:text-powder-blue transition-gentle">
              Discord
            </a>
            <a href="/resources" className="font-body text-foreground hover:text-powder-blue transition-gentle">
              Resources
            </a>            
            <a href="/faq" className="block font-body text-foreground hover:text-powder-blue transition-gentle">
              FAQ
            </a>
            <a href="/volunteer" className="block font-body text-foreground hover:text-powder-blue transition-gentle">
              Volunteer
            </a>
            <a href="/about" className="block font-body text-foreground hover:text-powder-blue transition-gentle">
              About
            </a>
            
            {/* {!loading && (
              user ? (
                // Authenticated user - show app access
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate("/app")}
                >
                  <User className="w-4 h-4 mr-2" />
                  Go to App
                </Button>
              ) : (
                // Unauthenticated user - show both options
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("/auth")}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="chat"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      localStorage.setItem('wantsOnboarding', 'true');
                      navigate("/onboarding");
                    }}
                  >
                    Get Started
                  </Button>
                </div>
              )
            )} */}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;