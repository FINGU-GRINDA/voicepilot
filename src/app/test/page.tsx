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
  const [isConnected, setIsConnected] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected');
      setIsConnected(true);
    },
    onDisconnect: () => {
      console.log('Disconnected');
      setIsConnected(false);
    },
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
    let mounted = true;

    const startSession = async () => {
      if (!mounted) return;

      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (!mounted) return;

        // 이전 세션이 있다면 종료
        if (isConnected) {
          await conversation.endSession().catch(err => {
            console.log('Error ending previous session:', err);
          });
        }

        // 새 세션 시작
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
      } catch (error) {
        console.error("Failed to start conversation:", error);
      }
    };

    startSession();

    return () => {
      mounted = false;
      // 컴포넌트 언마운트 시 세션 종료
      if (isConnected) {
        conversation.endSession().catch(err => {
          console.log('Error ending session on unmount:', err);
        });
      }
    };
  }, [aiSuggestedConfig]); // aiSuggestedConfig가 변경될 때마다 세션 재시작

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !isConnected) return;
    
    try {
      await conversation.sendMessage(inputMessage);
      setInputMessage('');
    } catch (error) {
      console.error("Failed to send message:", error);
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
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="text-4xl">👋</div>
              <h2 className="text-2xl font-semibold">Shall we begin?</h2>
              <p className="text-gray-400">
                Say who are you to start the conversation
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
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
            ))
          )}
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
              onClick={() => setIsListening(!isListening)}
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