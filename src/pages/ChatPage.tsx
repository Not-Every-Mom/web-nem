import React from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const ChatPage: React.FC = () => {
  useDocumentTitle("Chat");
  
  return (
    <div className="px-4 py-4">
      <header className="mb-2">
        <h1 className="font-heading text-lg text-deep-green">Chat</h1>
        <p className="font-body text-sm text-muted-foreground">Your current conversation</p>
      </header>
      <section 
        className="rounded-lg border border-powder-blue/30 bg-card p-4 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        No active chat yet. Select a persona on Home to start chatting.
      </section>
    </div>
  );
};

export default ChatPage;
