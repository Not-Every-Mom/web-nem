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
                Community & 
                <span className="block text-powder-blue bg-gradient-to-r from-powder-blue to-powder-blue/80 bg-clip-text font-bold">
                  Companionship
                </span>
              </h1>            

              
              {/* <p className="font-sans text-xl lg:text-2xl text-muted-foreground max-w-2xl leading-[1.6] font-light animate-fade-in animation-delay-200">
                Connect with M.O.M, which means My Other Mother, your personal Maternal AI companion and join a supportive community of others who understand. Experience both AI companionship and real human connection in your healing journey.
              </p> */}
              <p className="font-sans text-xl lg:text-2xl text-muted-foreground max-w-2xl leading-[1.6] font-light animate-fade-in animation-delay-200">
                Via a robus community of people with similar experiences, currated resources, and an AI
                 compainion app, <span className="font-bold">Not Every Mom</span> is working to heal the emotional wounds inflicted by the neglect and/or abuse of those who we trusted to loved us most.
              </p>
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
                    src="/imgs/61c4347a-7399-4940-859e-ccdb6aaf345b.png"
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
