import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { PersonaSelector } from "@/components/PersonaSelector";
import { useEmbeddings } from "@/hooks/useEmbeddings";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const HomePage = () => {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const { ensureReady } = useEmbeddings();
  
  useDocumentTitle("Home");
  useEffect(() => { ensureReady(); }, []);
  
  // Get display name - prioritize real user data, fallback to demo
  const displayName = user?.user_metadata?.full_name || 
                     (isDemoMode ? 'Demo User' : 'Dear');
  const avatarInitial = user?.user_metadata?.full_name?.charAt(0) || 
                       user?.email?.charAt(0) || 
                       (isDemoMode ? 'D' : 'M');

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <header className="mb-6">
          <h1 className="font-heading text-2xl text-deep-green mb-2">
            Welcome back, {displayName}
          </h1>
          <p className="font-body text-muted-foreground">
            Choose a persona to start a meaningful conversation
          </p>
        </header>
        <PersonaSelector />
      </div>
    </div>
  );
};

export default HomePage;