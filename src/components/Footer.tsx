import { Heart, Mail, MessageCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  
  return (
    <footer className="bg-deep-green/5 border-t border-deep-green/10 py-16 px-8 lg:px-16">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-8 h-8 text-powder-blue" />
              <span className="font-display text-2xl font-bold text-deep-green">M.O.M AI</span>
            </div>
            <p className="font-sans text-muted-foreground text-sm leading-relaxed">
              Your Maternal AI companion and supportive community for comfort, guidance, and healing.
            </p>
            <div className="inline-flex items-center px-3 py-1 bg-powder-blue/10 rounded-full">
              <span className="font-sans text-deep-green text-xs font-medium">
                My Other Mom
              </span>
            </div>
          </div>
          
          {/* Features */}
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-deep-green">Features</h3>
            <ul className="space-y-2 font-sans text-sm text-muted-foreground">
              <li>
                <button 
                  onClick={() => navigate("#personas")}
                  className="hover:text-powder-blue transition-colors story-link"
                >
                  AI Personas
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate("/app/community")}
                  className="hover:text-powder-blue transition-colors story-link"
                >
                  Community Support
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate("/app/chat")}
                  className="hover:text-powder-blue transition-colors story-link"
                >
                  24/7 AI Chat
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate("/app/resources")}
                  className="hover:text-powder-blue transition-colors story-link"
                >
                  Resources
                </button>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-deep-green">Support</h3>
            <ul className="space-y-2 font-sans text-sm text-muted-foreground">
              <li>
                <button 
                  onClick={() => navigate("/faq")}
                  className="hover:text-powder-blue transition-colors story-link"
                >
                  FAQ
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate("/app/settings")}
                  className="hover:text-powder-blue transition-colors story-link"
                >
                  Account Settings
                </button>
              </li>
              <li>
                <a 
                  href="mailto:support@momdi.com"
                  className="hover:text-powder-blue transition-colors story-link flex items-center"
                >
                  <Mail className="w-4 h-4 mr-1" />
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
          
          {/* Get Started */}
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-deep-green">Get Started</h3>
            <ul className="space-y-2 font-sans text-sm text-muted-foreground">
              <li>
                <button 
                  onClick={() => {
                    localStorage.setItem('wantsOnboarding', 'true');
                    navigate("/onboarding");
                  }}
                  className="hover:text-powder-blue transition-colors story-link flex items-center"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Start Chatting
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate("/auth")}
                  className="hover:text-powder-blue transition-colors story-link"
                >
                  Sign In / Sign Up
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate("/app/community")}
                  className="hover:text-powder-blue transition-colors story-link flex items-center"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Join Community
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-deep-green/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="font-sans text-sm text-muted-foreground">
              © {new Date().getFullYear()} M.O.M AI. All rights reserved.
            </div>
            
            {/* Legal Links */}
            <div className="flex space-x-6 font-sans text-sm text-muted-foreground">
              <button 
                onClick={() => navigate("/privacy-policy")}
                className="hover:text-powder-blue transition-colors story-link"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => navigate("/terms-of-service")}
                className="hover:text-powder-blue transition-colors story-link"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;