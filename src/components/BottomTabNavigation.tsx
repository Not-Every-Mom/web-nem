import { Home, MessageSquare, Users, Settings, BookOpen } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { usePersonaTheme } from "@/hooks/usePersonaTheme";

const BottomTabNavigation = () => {
  const location = useLocation();
  
  // Extract persona ID from chat routes
  const chatMatch = location.pathname.match(/\/chat\/([^\/]+)/);
  const personaId = chatMatch ? chatMatch[1] : null;
  const theme = usePersonaTheme(personaId);

  const tabs = [
    { name: "Home", href: "/app", icon: Home, label: "Home" },
    { name: "Chat", href: "/app/chat", icon: MessageSquare, label: "Chat" },
    { name: "Community", href: "/app/community", icon: Users, label: "Community" },
    { name: "Resources", href: "/resources", icon: BookOpen, label: "Resources" },
    { name: "Settings", href: "/app/settings", icon: Settings, label: "Settings" }
  ];

  // Don't show navigation on auth/onboarding pages
  if (location.pathname === '/auth' || location.pathname === '/onboarding' || location.pathname === '/') {
    return null;
  }

  const navStyle = theme && location.pathname.includes('/chat/') ? {
    backgroundColor: `${theme.muted}80`,
    borderColor: `${theme.primary}30`,
  } : {};

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 backdrop-blur-md border-t z-50 transition-all duration-300"
      style={navStyle}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around py-2 px-4 max-w-[414px] mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.href || location.pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          
          const activeColor = theme && location.pathname.includes('/chat/') ? theme.primary : 'hsl(var(--powder-blue))';
          
          return (
            <NavLink
              key={tab.name}
              to={tab.href}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center h-12 min-w-[72px] px-3 rounded-lg transition-all duration-200`}
              style={isActive ? {
                color: activeColor,
                backgroundColor: `${activeColor}20`,
              } : {}}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-body font-medium">
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabNavigation;