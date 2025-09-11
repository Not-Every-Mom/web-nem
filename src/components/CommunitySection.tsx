import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, MessageSquare, Heart, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CommunitySection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-24 px-8 lg:px-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-deep-green/5" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Community Benefits */}
          <div className="space-y-8" data-animate>
            <div className="space-y-6">
              <h2 className="font-display text-3xl lg:text-4xl text-deep-green font-bold tracking-tight">
                🌍 Community Connection
              </h2>
              <p className="font-sans text-xl text-muted-foreground leading-relaxed font-light">
                Beyond one-on-one chats with M.O.M, join a supportive community of others who understand — 
                a place to share, heal, and grow together.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <Users className="w-6 h-6 text-powder-blue flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-display text-lg text-deep-green font-semibold mb-1">Safe Spaces</h4>
                  <p className="font-sans text-muted-foreground text-sm">
                    Connect with others in moderated, supportive environments designed for healing and growth.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <MessageSquare className="w-6 h-6 text-muted-gold flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-display text-lg text-deep-green font-semibold mb-1">Shared Experiences</h4>
                  <p className="font-sans text-muted-foreground text-sm">
                    Share your journey, learn from others, and find comfort in knowing you're not alone.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Heart className="w-6 h-6 text-deep-green flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-display text-lg text-deep-green font-semibold mb-1">Mutual Support</h4>
                  <p className="font-sans text-muted-foreground text-sm">
                    Give and receive encouragement in a community that celebrates every step of your healing journey.
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              variant="primary-hero" 
              size="lg" 
              onClick={() => navigate("/app/community")}
              className="group"
            >
              Join Our Community
              <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
          
          {/* Right: Visual Element */}
          <div className="relative" data-animate>
            <Card className="p-8 bg-gradient-to-br from-powder-blue/10 to-deep-green/10 backdrop-blur-sm border-powder-blue/20">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-powder-blue to-muted-gold rounded-full flex items-center justify-center">
                  <Users className="w-10 h-10 text-white" />
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-display text-xl text-deep-green font-semibold">
                    You're Not Alone
                  </h3>
                  <p className="font-sans text-muted-foreground leading-relaxed">
                    "Finding this community changed everything for me. Having both M.O.M AI and real people who understand my journey has been incredibly healing."
                  </p>
                  <div className="text-sm text-muted-foreground font-medium">
                    — Sarah, Community Member
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="font-display text-2xl font-bold text-powder-blue">24/7</div>
                    <div className="text-xs text-muted-foreground">Support</div>
                  </div>
                  <div className="text-center">
                    <div className="font-display text-2xl font-bold text-muted-gold">Safe</div>
                    <div className="text-xs text-muted-foreground">Environment</div>
                  </div>
                  <div className="text-center">
                    <div className="font-display text-2xl font-bold text-deep-green">Real</div>
                    <div className="text-xs text-muted-foreground">Connection</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;