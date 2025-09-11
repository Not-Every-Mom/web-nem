import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFocusTrap } from "@/hooks/useFocusManagement";
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  Bot,
  FileText,
  CreditCard,
  LogOut,
  Shield,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const adminMenuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Community Management", url: "/admin/community", icon: Users },
  { title: "Persona Management", url: "/admin/personas", icon: Bot },
  { title: "Content Management", url: "/admin/content", icon: FileText },
  { title: "Billing", url: "/admin/billing", icon: CreditCard },
];

export const AdminLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { announce } = useAccessibility();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/admin/login");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Keyboard shortcuts for admin navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + number for quick navigation
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= adminMenuItems.length) {
          e.preventDefault();
          const item = adminMenuItems[num - 1];
          navigate(item.url);
          announce(`Navigated to ${item.title}`, "polite");
        }
      }
      // Alt + H for home dashboard
      if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        navigate('/admin/dashboard');
        announce("Navigated to Dashboard", "polite");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, announce]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r" role="navigation" aria-label="Admin navigation">
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="font-semibold text-lg">Admin Console</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu role="menu" aria-label="Admin menu items">
                  {adminMenuItems.map((item, index) => (
                    <SidebarMenuItem key={item.title} role="none">
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          role="menuitem"
                          aria-describedby={`menu-shortcut-${index + 1}`}
                          className={({ isActive }) =>
                            isActive
                              ? "bg-primary text-primary-foreground font-medium"
                              : "hover:bg-muted/50"
                          }
                        >
                          <item.icon className="h-4 w-4" aria-hidden="true" />
                          <span>{item.title}</span>
                          <div id={`menu-shortcut-${index + 1}`} className="sr-only">
                            Keyboard shortcut: Alt + {index + 1}
                          </div>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarFallback className="text-xs">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate("/")}>
                  Go to Main App
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="border-b bg-background p-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger aria-label="Toggle sidebar navigation" />
              <h1 className="text-lg font-semibold">
                {adminMenuItems.find(item => isActive(item.url))?.title || "Admin Console"}
              </h1>
            </div>
            <div className="sr-only" role="status" aria-live="polite">
              Admin navigation shortcuts: Alt+1 through Alt+5 for menu items, Alt+H for Dashboard
            </div>
          </header>

          <main 
            className="flex-1 p-6" 
            role="main" 
            aria-labelledby="page-title"
            id="main-content"
            tabIndex={-1}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};