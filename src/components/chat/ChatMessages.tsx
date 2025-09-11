// Chat Messages Component
// Displays chat messages with typing indicators

import { Message } from "./types";
import SupportSafetyBanner from "@/components/chat/SupportSafetyBanner";
import { Heart } from "lucide-react";

interface ChatMessagesProps {
  messages: Message[];
  thinking: boolean;
  sending: boolean;
  personaName: string;
}

export const ChatMessages = ({ messages, thinking, sending, personaName }: ChatMessagesProps) => {
  return (
    <div 
      className="flex-1 overflow-y-auto p-2 space-y-2 scroll-smooth"
      role="log"
      aria-label={`Conversation with ${personaName}`}
      aria-live="polite"
      aria-atomic="false"
    >
      {messages.length === 0 ? (
        <div className="text-center py-8" role="status">
          <SupportSafetyBanner />
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-heading text-xl text-deep-green mb-2">
            Start your conversation with {personaName}
          </h3>
          <p className="font-body text-muted-foreground">
            Share what's on your mind and receive caring support
          </p>
        </div>
      ) : (
        messages.map((message) => {
          const isUser = message.sender_type === 'user';
          return (
            <div
              key={message.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-enter`}
              role="article"
              aria-label={`${isUser ? 'Your message' : `Message from ${personaName}`}`}
            >
              <div
                className={[
                  'max-w-[80%] px-3 py-2 text-sm shadow-md',
                  'rounded-2xl',
                  isUser ? 'rounded-br-md bg-gradient-primary text-white' : 'rounded-bl-md bg-muted/80 text-foreground border border-input/40'
                ].join(' ')}
              >
                <p className="font-body whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          );
        })
      )}
      
      {thinking && <TypingIndicator type="thinking" />}
      {sending && <TypingIndicator type="typing" />}
    </div>
  );
};

const TypingIndicator = ({ type }: { type: 'thinking' | 'typing' }) => (
  <div className="flex justify-start animate-enter" role="status" aria-live="polite">
    <div className="max-w-[60%] px-3 py-2 rounded-2xl rounded-bl-md bg-muted/80 border border-input/40 shadow-sm">
      <div className="flex items-center gap-2">
        <span 
          className="w-2 h-2 bg-powder-blue rounded-full animate-bounce" 
          aria-hidden="true"
        />
        <span 
          className="w-2 h-2 bg-powder-blue rounded-full animate-bounce" 
          style={{ animationDelay: '0.12s' }}
          aria-hidden="true"
        />
        <span 
          className="w-2 h-2 bg-powder-blue rounded-full animate-bounce" 
          style={{ animationDelay: '0.24s' }}
          aria-hidden="true"
        />
        <span className="text-xs text-muted-foreground ml-2">
          {type === 'thinking' ? 'Thinking…' : 'Typing…'}
        </span>
      </div>
    </div>
  </div>
);