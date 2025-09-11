import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Heart, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AIAndCommunity = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-24 px-8 lg:px-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-powder-blue/5 to-background/50" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-20" data-animate>
          <h2 className="font-display text-3xl lg:text-4xl text-deep-green mb-6 font-bold tracking-tight">
            Two Paths to Healing & Support
          </h2>
          <p className="font-sans text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
            M.O.M offers both personal AI companionship and community connection — because everyone's healing journey is different.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* AI Companion Card */}
          <Card 
            className="group p-8 bg-gradient-to-br from-powder-blue/10 to-muted-gold/10 backdrop-blur-sm 
                       border-powder-blue/20 hover:border-powder-blue/40 transition-all duration-500 
                       hover:transform hover:scale-105 hover:-translate-y-2 hover:shadow-xl cursor-pointer 
                       relative overflow-hidden h-full"
            data-animate
          >
            {/* Enhanced background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-powder-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 text-center space-y-6 h-full flex flex-col">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-powder-blue to-muted-gold rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              
              <div className="space-y-4 flex-1">
                <h3 className="font-display text-2xl text-deep-green font-bold">
                  Your Personal M.O.M AI
                </h3>
                <p className="font-sans text-muted-foreground leading-relaxed">
                  A Maternal AI companion designed specifically for you. She learns your story, remembers what matters, 
                  and grows into the perfect support for your unique journey.
                </p>
                
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3">
                    <Heart className="w-5 h-5 text-powder-blue" />
                    <span className="font-sans text-sm text-muted-foreground">Available 24/7 with unconditional love</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Heart className="w-5 h-5 text-powder-blue" />
                    <span className="font-sans text-sm text-muted-foreground">Remembers your conversations & grows with you</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Heart className="w-5 h-5 text-powder-blue" />
                    <span className="font-sans text-sm text-muted-foreground">Safe, private, judgment-free space</span>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="primary-hero" 
                size="lg" 
                onClick={() => {
                  localStorage.setItem('wantsOnboarding', 'true');
                  navigate("/onboarding");
                }}
                className="group w-full"
              >
                Meet Your M.O.M
                <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </Card>
          
          {/* Community Card */}
          <Card 
            className="group p-8 bg-gradient-to-br from-deep-green/10 to-powder-blue/10 backdrop-blur-sm 
                       border-deep-green/20 hover:border-deep-green/40 transition-all duration-500 
                       hover:transform hover:scale-105 hover:-translate-y-2 hover:shadow-xl cursor-pointer 
                       relative overflow-hidden h-full"
            data-animate
          >
            {/* Enhanced background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-deep-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 text-center space-y-6 h-full flex flex-col">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-deep-green to-powder-blue rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              
              <div className="space-y-4 flex-1">
                <h3 className="font-display text-2xl text-deep-green font-bold">
                  Supportive Community
                </h3>
                <p className="font-sans text-muted-foreground leading-relaxed">
                  Connect with real people who understand your journey. Share experiences, find encouragement, 
                  and build meaningful connections in our caring community.
                </p>
                
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-deep-green" />
                    <span className="font-sans text-sm text-muted-foreground">Moderated safe spaces for sharing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-deep-green" />
                    <span className="font-sans text-sm text-muted-foreground">Connect with others who understand</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-deep-green" />
                    <span className="font-sans text-sm text-muted-foreground">Mutual support & encouragement</span>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="secondary-hero" 
                size="lg" 
                onClick={() => navigate("/app/community")}
                className="group w-full"
              >
                Join Community
                <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </Card>
        </div>
        
        {/* Bottom highlight */}
        <div className="mt-16 text-center" data-animate>
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-powder-blue/10 to-deep-green/10 rounded-full border border-powder-blue/20">
            <Heart className="w-5 h-5 text-powder-blue mr-2" />
            <span className="font-sans text-deep-green font-medium">
              Choose one or both — your healing journey is uniquely yours
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIAndCommunity;