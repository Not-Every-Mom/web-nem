import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessages } from "./ChatMessages";
import LoadingView from "./LoadingView";
import useChatInterfaceController from "./useChatInterfaceController";

const ChatInterface: React.FC = () => {
  const {
    navigate,
    persona,
    messages,
    loading,
    sending,
    thinking,
    messagesEndRef,
    modelLoading,
  } = useChatInterfaceController();

  if (loading) return <LoadingView />;

  if (!persona) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-2xl text-deep-green mb-4">Persona not found</h2>
          <Button onClick={() => navigate('/app')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-subtle flex flex-col overflow-hidden">
      <ChatMessages
        messages={messages}
        thinking={thinking}
        sending={sending}
        personaName={persona.display_name || persona.name}
      />
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatInterface;
