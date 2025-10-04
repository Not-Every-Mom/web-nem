import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { DemoProvider } from "@/hooks/useDemo";
import { ChatHeaderProvider } from "@/hooks/useChatHeader";
import { ChatComposerProvider } from "@/hooks/useChatComposer";
import { AccessibilityProvider } from "@/components/accessibility/AccessibilityProvider";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import ResourcesPage from "./pages/ResourcesPage";
import FAQPage from "./pages/FAQPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => {

  const shouldShowOnboarding = () => { return false};

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminAuthProvider>
          <DemoProvider>
            <ChatHeaderProvider>
              <ChatComposerProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter basename="/">
                <AccessibilityProvider>
                  <Routes>
                  {/* Public routes without app layout */}
                  <Route path="/" element={<Index />} />               
                  
                  {/* Public resources (uses app shell but not protected) */}
                  <Route path="/resources" element={<AppLayout><ResourcesPage /></AppLayout>} />
                  <Route path="/faq" element={<FAQPage />} />                  
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="/" element={<NotFound />} />
                  </Routes>
                </AccessibilityProvider>
              </BrowserRouter>
            </TooltipProvider>
              </ChatComposerProvider>
            </ChatHeaderProvider>
          </DemoProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
