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
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import AuthScreen from "./pages/AuthScreen";
import HomePage from "./pages/HomePage";
import CommunityPage from "./pages/CommunityPage";
import ResourcesPage from "./pages/ResourcesPage";
import BillingPage from "./pages/BillingPage";
import SettingsPage from "./pages/SettingsPage";
import ChatPage from "./pages/ChatPage";
import HistoryPage from "./pages/HistoryPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import FAQPage from "./pages/FAQPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import ChatInterface from "./components/ChatInterface";
import ThreadDetailPage from "./components/forum/ThreadDetailPage";
import NotFound from "./pages/NotFound";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminCommunityPage } from "./pages/admin/AdminCommunityPage";
import { AdminPersonasPage } from "./pages/admin/AdminPersonasPage";
import { AdminContentPage } from "./pages/admin/AdminContentPage";
import AdminBillingPage from "./pages/admin/AdminBillingPage";
import { BASE_PATH } from "@/config";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => {
  
  
  // Check if user should see onboarding - only for first-time visitors who choose "Get Started"
  // const shouldShowOnboarding = () => {
  //   const hasCompleted = localStorage.getItem('hasCompletedOnboarding');
  //   const wantsOnboarding = localStorage.getItem('wantsOnboarding');
  //   return hasCompleted !== 'true' && wantsOnboarding === 'true';
  // };

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
              <BrowserRouter>
                <AccessibilityProvider>
                  <Routes>
                  {/* Public routes without app layout */}
                  <Route path={BASE_PATH} element={<Index />} />
                  {/* <Route path="/onboarding" element={<Onboarding />} /> */}
                  {/* <Route path="/auth" element={<AuthScreen />} /> */}
                  
                  {/* Public resources (uses app shell but not protected) */}
                  <Route path="/resources" element={<AppLayout><ResourcesPage /></AppLayout>} />
                  <Route path="/faq" element={<FAQPage />} />
                  
                  {/* App routes with layout */}
                  {/* <Route path="/app" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Outlet />
                      </AppLayout>
                    </ProtectedRoute>
                  }>
                    <Route index element={<HomePage />} />
                    <Route path="chat" element={<ChatPage />} />
                    <Route path="chat/:personaId" element={<ChatInterface />} />
                    <Route path="chat/:personaId/:conversationId" element={<ChatInterface />} />
                    <Route path="history" element={<HistoryPage />} />
                    <Route path="community" element={<CommunityPage />} />
                    <Route path="community/thread/:threadId" element={<ThreadDetailPage />} />
                    <Route path="billing" element={<BillingPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="settings/account" element={<AccountSettingsPage />} />
                    <Route path="settings/faq" element={<FAQPage />} />
                    <Route path="settings/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="settings/terms" element={<TermsOfServicePage />} />
                  </Route> */}

                  {/* Legacy redirects */}
                  {/* <Route path="/chat" element={<Navigate to="/app/chat" replace />} />
                  <Route path="/history" element={<Navigate to="/app/history" replace />} />
                  <Route path="/community" element={<Navigate to="/app/community" replace />} />
                  <Route path="/billing" element={<Navigate to="/app/billing" replace />} />
                  <Route path="/settings" element={<Navigate to="/app/settings" replace />} /> */}

                  {/* Forum routes legacy thread path */}
                  {/* <Route path="/community/thread/:threadId" element={<ThreadDetailPage />} /> */}
                  
                  {/* Admin routes */}
                  {/* <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="/admin" element={
                    <AdminProtectedRoute>
                      <AdminLayout />
                    </AdminProtectedRoute>
                  }>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="community" element={<AdminCommunityPage />} />
                    <Route path="personas" element={<AdminPersonasPage />} />
                    <Route path="content" element={<AdminContentPage />} />
                    <Route path="billing" element={<AdminBillingPage />} />
                  </Route>
                   */}
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path={BASE_PATH} element={<NotFound />} />
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
