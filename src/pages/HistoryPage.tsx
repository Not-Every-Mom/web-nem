import React from "react";
import { Link } from "react-router-dom";

const HistoryPage: React.FC = () => {
  return (
    <div className="px-4 py-4">
      <header className="mb-2">
        <h1 className="font-heading text-2xl text-deep-green">Conversation History</h1>
        <p className="font-body text-sm text-muted-foreground">Review your past conversations and interactions</p>
      </header>
      <main role="main">
        <section className="rounded-lg border border-powder-blue/30 bg-card p-6" aria-labelledby="empty-state-heading">
          <div className="text-center">
            <h2 id="empty-state-heading" className="font-heading text-lg text-deep-green mb-3">
              No conversations yet
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Start chatting with M.O.M AI to see your conversation history here
            </p>
            <Link 
              to="/app" 
              className="inline-flex items-center justify-center h-11 px-6 rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-gentle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-describedby="start-chat-desc"
            >
              Start your first conversation
            </Link>
            <p id="start-chat-desc" className="sr-only">
              Begin a new chat session with M.O.M AI companion
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HistoryPage;
