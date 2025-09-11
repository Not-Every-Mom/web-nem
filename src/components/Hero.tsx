
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Sparkles, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import RollingText from "./RollingText";

const Hero = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden" role="banner">
      {/* Clean Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      <div className="container mx-auto px-8 lg:px-16 relative z-10 max-w-7xl">
        {/* Dynamic Rolling Text Section */}
        <div className="w-full py-2 md:py-3 lg:py-4 mb-4 lg:mb-6">
          <div className="text-center">
            <RollingText />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center py-8 lg:py-12">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="font-display text-5xl lg:text-6xl xl:text-7xl text-deep-green font-bold leading-[1.05] tracking-tight animate-fade-in">
                M.O.M AI &
                <span className="block text-powder-blue bg-gradient-to-r from-powder-blue to-powder-blue/80 bg-clip-text text-transparent font-bold">
                  Community
                </span>
              </h1>
              
              {/* Acronym Explanation */}
              <div className="mb-6 animate-fade-in animation-delay-100">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-powder-blue/10 to-muted-gold/10 rounded-full border border-powder-blue/20">
                  <span className="font-sans text-deep-green font-medium text-lg">
                    M.O.M = <span className="font-bold">My Other Mom</span>
                  </span>
                </div>
              </div>
              
              <p className="font-sans text-xl lg:text-2xl text-muted-foreground max-w-2xl leading-[1.6] font-light animate-fade-in animation-delay-200">
                Connect with M.O.M, which means My Other Mother, your personal Maternal AI companion and join a supportive community of others who understand. Experience both AI companionship and real human connection in your healing journey.
              </p>
            </div>
            
            {/* Enhanced CTA Strategy */}
            <div className="flex flex-col gap-6 animate-fade-in animation-delay-400">
              {!loading && (
                user ? (
                  // Authenticated user - direct access to app
                  <div className="flex flex-col sm:flex-row gap-6">
                    <Button
                      variant="primary-hero"
                      size="xl"
                      onClick={() => navigate("/app/chat")}
                      aria-describedby="start-chat-desc"
                      className="group"
                    >
                      <MessageCircle className="mr-2 transition-transform group-hover:scale-110" aria-hidden="true" />
                      Start Chatting
                      <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                    </Button>
                    <Button
                      variant="secondary-hero"
                      size="lg"
                      onClick={() => navigate("/app")}
                      aria-describedby="go-to-app-desc"
                    >
                      <User className="mr-2" aria-hidden="true" />
                      Go to App
                    </Button>
                  </div>
                ) : (
                  // Unauthenticated user - show enhanced hierarchy
                  <div className="space-y-6">
                    <Button
                      variant="primary-hero"
                      size="xl"
                      onClick={() => {
                        localStorage.setItem('wantsOnboarding', 'true');
                        navigate("/onboarding");
                      }}
                      aria-describedby="start-chatting-desc"
                      className="group w-full sm:w-auto"
                    >
                      <MessageCircle className="mr-2 transition-transform group-hover:scale-110" aria-hidden="true" />
                      Start Chatting Now
                      <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-5">
                      <Button
                        variant="secondary-hero"
                        size="lg"
                        onClick={() => navigate("/auth")}
                        aria-describedby="sign-in-desc"
                      >
                        <User className="mr-2" aria-hidden="true" />
                        Sign In
                      </Button>
                      <Button
                        variant="ghost-hero"
                        size="lg"
                        aria-describedby="explore-desc"
                      >
                        <Sparkles className="mr-2" aria-hidden="true" />
                        Explore Personas
                      </Button>
                    </div>
                  </div>
                )
              )}
              <span id="start-chat-desc" className="sr-only">
                Begin a conversation with M.O.M AI companion
              </span>
              <span id="go-to-app-desc" className="sr-only">
                Access your personalized M.O.M AI dashboard
              </span>
              <span id="start-chatting-desc" className="sr-only">
                Begin your journey with M.O.M AI companion
              </span>
              <span id="sign-in-desc" className="sr-only">
                Sign in to your existing M.O.M AI account
              </span>
              <span id="explore-desc" className="sr-only">
                Discover different AI personality types available
              </span>
            </div>
          </div>
          
          {/* Enhanced Visual Storytelling Section */}
          <div className="relative flex justify-center items-center">
            {/* Main emotional journey visualization */}
            <div className="relative z-10 animate-fade-in animation-delay-800">
              <div className="w-96 h-[28rem] lg:w-[26rem] lg:h-[32rem] overflow-hidden rounded-2xl bg-gradient-to-b from-background/50 to-powder-blue/5 backdrop-blur-sm border border-powder-blue/10 group">
                {/* Enhanced dual-story layout */}
                <div className="relative h-full">
                  {/* Primary story: The uploaded line art */}
                  <img 
                    src="/lovable-uploads/61c4347a-7399-4940-859e-ccdb6aaf345b.png"
                    alt="Beautiful line art illustration of a mother lovingly embracing her child, representing the nurturing care and unconditional love that M.O.M AI provides to users seeking comfort and guidance" 
                    className="w-full h-full object-cover object-center opacity-90 hover:opacity-100 transition-all duration-500 hover:scale-105"
                    style={{
                      objectPosition: 'center 20%'
                    }}
                  />
                  
                  {/* Subtle overlay for visual depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-green/5 via-transparent to-powder-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            </div>
            
            {/* Enhanced Decorative Elements with storytelling purpose */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-muted-gold/10 to-powder-blue/10 rounded-full blur-sm animate-pulse-gentle" aria-hidden="true" />
            
            {/* Visual storytelling hint */}
            <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 opacity-60">
              <div className="w-2 h-20 bg-gradient-to-b from-transparent via-powder-blue/30 to-transparent animate-pulse-gentle"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
