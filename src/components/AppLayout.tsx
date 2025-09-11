import BottomTabNavigation from "@/components/BottomTabNavigation";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatComposer from "@/components/chat/ChatComposer";
import MemoryDevPanel from "@/components/dev/MemoryDevPanel";
import { SkipLink } from "@/components/ui/skip-link";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="mx-auto max-w-[414px] min-h-screen bg-background">
      <SkipLink />
      <ChatHeader />
      <DemoModeBanner />
      <main 
        id="main-content" 
        className="pb-36" 
        role="main"
        tabIndex={-1}
        aria-label="Main content"
      >
        {children}
      </main>
      <ChatComposer />
      <BottomTabNavigation />
      <MemoryDevPanel />
    </div>
  );
};