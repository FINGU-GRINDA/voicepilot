"use client";

import { useConversation } from "@11labs/react";
import { useState, useEffect, useRef, Suspense } from "react";
import { Send, Mic, Pause, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useConfigStore } from '@/store/configStore';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function TestPageContent() {
  const { aiSuggestedConfig } = useConfigStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: ({ message, source }: { message: string, source: string }) => {
      const messageObj: Message = { 
        role: source === 'user' ? 'user' : 'assistant', 
        content: message 
      };
      setMessages(prev => [...prev, messageObj]);
    },
    onError: (error: Error) => console.error("Error:", error),
    preferHeadphonesForIosDevices: true,
  });

  useEffect(() => {
    const startSession = async () => {
      try {
        console.log("Requesting audio permission...");
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("Audio permission granted");

        if (!aiSuggestedConfig) {
          console.warn("AI configuration is not available");
          return;
        }
        
        console.log("Starting conversation session with config:", {
          agentId: process.env.NEXT_PUBLIC_AGENT_ID,
          language: aiSuggestedConfig.language,
        });
        
        await conversation.startSession({
          agentId: process.env.NEXT_PUBLIC_AGENT_ID,
          overrides: {
            agent: {
              prompt: {
                prompt: aiSuggestedConfig.systemPrompt,
              },
              firstMessage: aiSuggestedConfig.welcomeMessage,
              language: aiSuggestedConfig.language,
            },
          },
        });
        console.log("Conversation session started successfully");
      } catch (error) {
        console.error("Failed to start conversation:", error);
        if (error instanceof Error) {
          console.error("Error details:", error.message);
        }
      }
    };

    startSession();
    
    return () => {
      console.log("Ending conversation session");
      conversation.endSession();
    };
  }, [conversation, aiSuggestedConfig]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    try {
      console.log("Sending message:", inputMessage);
      // 메시지 처리 로직 추가
      setInputMessage('');
      console.log("Message sent successfully");
    } catch (error) {
      console.error("Failed to send message:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
    }
  };

  const toggleListening = () => {
    try {
      setIsListening(prev => {
        const newState = !prev;
        console.log(`${newState ? 'Starting' : 'Stopping'} voice recording`);
        return newState;
      });
    } catch (error) {
      console.error("Error toggling voice recording:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-sky-900 to-black text-white p-6">
      <div className="max-w-3xl mx-auto h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Test Configuration</h1>
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <Card
                className={`p-4 max-w-[80%] ${
                  message.role === "assistant"
                    ? "bg-sky-900/50 border-sky-500/20 text-white"
                    : "bg-sky-500 text-white"
                }`}
              >
                {message.content}
              </Card>
            </div>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-h-[80px] max-h-[160px] bg-white/5 border-white/10"
          />
          <div className="flex flex-col gap-2">
            <Button
              size="icon"
              className={`rounded-full ${
                isListening
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-sky-500 hover:bg-sky-600"
              }`}
              onClick={toggleListening}
            >
              {isListening ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              className="rounded-full bg-sky-500 hover:bg-sky-600"
              disabled={!inputMessage.trim()}
              onClick={handleSendMessage}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-gradient-to-b from-sky-900 to-black text-white p-6">
        <div className="max-w-3xl mx-auto h-full flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    }>
      <TestPageContent />
    </Suspense>
  );
} 