/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useConversation } from "@11labs/react";
import type React from "react";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import {
  Mic,
  Pause,
  Send,
  X,
  Play,
  Plus,
  Trash2,
  Sparkles,
  FileText,
  PenToolIcon as Tool,
  Bot,
  MessageSquare,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useSearchParams, useRouter } from "next/navigation";
import { useConfigStore } from '@/store/configStore';

// 주요 인터페이스 정의
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Tool {
  name: string;
  description: string;
  parameters: string;
}

// AI 에이전트 설정을 위한 메인 설정 인터페이스
interface AgentConfig {
  name: string;
  description: string;
  knowledgeBase: string[];
  systemPrompt: string;
  tools: Tool[];
  voiceConfig: {
    type: string;
    speed: number;
    style: string;
  };
  welcomeMessage: string;
  fallbackMessage: string;
  language: string;
}

export default function Page() {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-sky-900 to-black text-white">
      <Suspense fallback={<div>Loading...</div>}>
        <BuilderContent />
      </Suspense>
    </div>
  );
}

function BuilderContent() {
  const { config, aiSuggestedConfig, updateConfig, updateAiSuggestedConfig } = useConfigStore();
  
  // Ensure initial values are always defined
  const safeAiConfig = {
    name: aiSuggestedConfig.name || '',
    description: aiSuggestedConfig.description || '',
    knowledgeBase: aiSuggestedConfig.knowledgeBase || [],
    tools: aiSuggestedConfig.tools || [],
    voiceConfig: {
      type: aiSuggestedConfig.voiceConfig?.type || '',
      speed: aiSuggestedConfig.voiceConfig?.speed || 1,
      style: aiSuggestedConfig.voiceConfig?.style || '',
    },
    language: aiSuggestedConfig.language || 'en',
  };

  // agentConfig와 aiSuggestedConfig state 제거
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [newKnowledge, setNewKnowledge] = useState("");
  const [newTool, setNewTool] = useState<Tool>({
    name: "",
    description: "",
    parameters: "",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // setConfigWithGPTOnCustomerMessage 수정
  const setConfigWithGPTOnCustomerMessage = useCallback(async (messageText?: string) => {
    const message = messageText || inputMessage;
    if (!message.trim()) return;

    if (!messageText) {
      setInputMessage('');
    }

    try {
      const gptMessages: Message[] = [
        {
          role: 'system',
          content: `You are an AI configuration assistant. Based on the conversation history, help configure an AI agent. Analyze the conversation and current AI suggested configuration to extract relevant information. Return a complete JSON object that includes all configuration fields.

Current AI suggested configuration:
${JSON.stringify(aiSuggestedConfig, null, 2)}

Return a JSON object that follows this structure, including all fields:
{
  "name": "string",
  "description": "string",
  "knowledgeBase": ["string"],
  "systemPrompt": "string",
  "tools": [{
    "name": "string",
    "description": "string",
    "parameters": "string"
  }],
  "voiceConfig": {
    "type": "string",
    "speed": number,
    "style": "string"
  },
  "welcomeMessage": "string",
  "fallbackMessage": "string",
  "language": "string"
}

Important:
1. Include ALL fields in the response, even if they haven't changed
2. Prioritize information from user messages over existing configuration
3. For fields not explicitly discussed in the conversation:
   - Use values from the current AI suggested configuration if available
   - Use reasonable defaults based on the context if no existing value
4. Ensure the configuration is complete and coherent

Previous conversation history:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`
        },
        ...messages,
        { role: 'user', content: message }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: gptMessages,
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        console.error('Empty response from GPT API');
        return;
      }

      // extractJsonFromString 함수를 사용하여 JSON 파싱
      const parsedConfig = extractJsonFromString(content);
      if (!parsedConfig) {
        console.error('Failed to extract JSON from response');
        return;
      }

      // 타입 검증 및 정리
      const validatedConfig: Partial<AgentConfig> = {};

      // 각 필드 타입 검증 및 처리
      if (typeof parsedConfig.name === 'string') validatedConfig.name = parsedConfig.name;
      if (typeof parsedConfig.description === 'string') validatedConfig.description = parsedConfig.description;
      if (Array.isArray(parsedConfig.knowledgeBase)) validatedConfig.knowledgeBase = parsedConfig.knowledgeBase.filter(k => typeof k === 'string');
      if (typeof parsedConfig.systemPrompt === 'string') validatedConfig.systemPrompt = parsedConfig.systemPrompt;
      if (typeof parsedConfig.language === 'string') validatedConfig.language = parsedConfig.language;

      // voiceConfig 검증
      if (parsedConfig.voiceConfig && typeof parsedConfig.voiceConfig === 'object') {
        validatedConfig.voiceConfig = {
          type: typeof parsedConfig.voiceConfig.type === 'string' ? parsedConfig.voiceConfig.type : config.voiceConfig.type,
          speed: typeof parsedConfig.voiceConfig.speed === 'number' ? parsedConfig.voiceConfig.speed : config.voiceConfig.speed,
          style: typeof parsedConfig.voiceConfig.style === 'string' ? parsedConfig.voiceConfig.style : config.voiceConfig.style
        };
      }

      // tools 검증
      if (Array.isArray(parsedConfig.tools)) {
        validatedConfig.tools = parsedConfig.tools.filter(tool => 
          tool && 
          typeof tool.name === 'string' && 
          typeof tool.description === 'string' && 
          typeof tool.parameters === 'string'
        );
      }

      // 상태 업데이트 부분만 수정
      updateAiSuggestedConfig(validatedConfig);

    } catch (error) {
      console.error('Error calling GPT API:', error);
    }
  }, [inputMessage, updateAiSuggestedConfig]);

  // Eleven Labs 음성 대화 훅 설정
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: ({ message, source }: { message: string, source: string }) => {
      const messageObj: Message = { 
        role: source === 'user' ? 'user' : 'assistant', 
        content: message 
      };
      setMessages(prev => [...prev, messageObj]);
      if (source === 'user') {
        console.log('user message');
        setConfigWithGPTOnCustomerMessage(message);
      }
    },
    onError: (error: Error) => console.error("Error:", error),
    preferHeadphonesForIosDevices: true,
  });

  // 세션 시작 함수를 useCallback으로 래핑
  const startSession = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_AGENT_ID,
        overrides: {
          agent: {
            prompt: {
              prompt: "You are a sophisticated Voice AI assistant designed to help users configure their ideal voice AI agent. Guide the conversation by asking one short question at a time, ensuring clarity and confirmation before proceeding to the next step.",
            },
            firstMessage: "Hello! For what purpose do you plan to use this voice AI assistant?",
            language: "en",
          },
        },
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }, []);

  // 세션 종료 함수를 useCallback으로 래핑
  const stopSession = useCallback(async () => {
    await conversation.endSession();
  }, []);

  useEffect(() => {
    let mounted = true;

    if (mounted) {
      startSession();
    }

    return () => {
      mounted = false;
      stopSession();
    };
  }, []); // 빈 의존성 배열

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, []);

  // 컴포넌트 마운트 시 초기 메시지 처리
  useEffect(() => {
    const initialPrompt = searchParams.get('prompt');
    const isInitialMessage = searchParams.get('initialMessage');
    
    if (initialPrompt && isInitialMessage) {
      // 초기 메시지를 messages 배열에 추가
      setMessages([{
        role: 'user',
        content: initialPrompt
      }]);
      
      // GPT 설정 업데이트 트리거
      setConfigWithGPTOnCustomerMessage(initialPrompt);
    }
  }, [searchParams, setConfigWithGPTOnCustomerMessage]);

  // Knowledge Base 관련 함수들 수정
  const addKnowledgeBase = () => {
    if (newKnowledge.trim()) {
      updateConfig({
        knowledgeBase: [...config.knowledgeBase, newKnowledge]
      });
      setNewKnowledge("");
    }
  };

  const removeKnowledgeBase = (index: number) => {
    updateConfig({
      knowledgeBase: config.knowledgeBase.filter((_, i) => i !== index)
    });
  };

  // Tools 관련 함수들 수정
  const addTool = () => {
    if (newTool.name && newTool.description) {
      updateConfig({
        tools: [...config.tools, newTool]
      });
      setNewTool({ name: "", description: "", parameters: "" });
    }
  };

  const removeTool = (index: number) => {
    updateConfig({
      tools: config.tools.filter((_, i) => i !== index)
    });
  };

  const extractJsonFromString = (text: string): Partial<AgentConfig> | null => {
    try {
      const jsonRegex = /{[\s\S]*}/;
      const match = text.match(jsonRegex);
      
      if (!match) return null;
      
      const jsonStr = match[0];
      const parsed = JSON.parse(jsonStr) as Partial<AgentConfig>;
      
      // AgentConfig 타입에 맞는 필드들만 필터링
      const validKeys = [
        'name', 'description', 'knowledgeBase', 'systemPrompt',
        'tools', 'voiceConfig', 'welcomeMessage', 'fallbackMessage', 'language'
      ];
      
      return Object.fromEntries(
        Object.entries(parsed).filter(([key]) => validKeys.includes(key))
      ) as Partial<AgentConfig>;
    } catch (error) {
      console.error('JSON parsing error:', error);
      return null;
    }
  };

  // 메시지 전송 핸들러 추가
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    await setConfigWithGPTOnCustomerMessage();
  };

  // Enter 키 핸들러 추가
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // AI 제안 설정을 표시할 새로운 컴포넌트
  const AISuggestions = () => {
    if (Object.keys(aiSuggestedConfig).length === 0) return null;

    const handleTestConfig = () => {
      // URL 파라미터 대신 상태 관리를 통해 설정 전달
      router.push('/test');
    };

    return (
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold text-sky-400 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Suggestions
        </h3>
        <Card className="bg-white/5 border-white/10 p-4">
          {aiSuggestedConfig.name && (
            <div className="mb-2">
              <Label>Suggested Name</Label>
              <div className="text-sm text-sky-400">{aiSuggestedConfig.name}</div>
            </div>
          )}
          {aiSuggestedConfig.description && (
            <div className="mb-2">
              <Label>Suggested Description</Label>
              <div className="text-sm text-sky-400">{aiSuggestedConfig.description}</div>
            </div>
          )}
          {/* 다른 설정값들도 필요에 따라 표시 */}
          <div className="flex gap-2 mt-4">
            <Button 
              className="bg-green-500 hover:bg-green-600"
              onClick={handleTestConfig}
            >
              Test Configuration
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="h-full flex">
      <div className="w-1/2 p-6 overflow-y-auto border-r border-white/10">
        <div className="max-w-md mx-auto space-y-8">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-sky-400" />
            <h2 className="text-2xl font-bold">Agent Configuration</h2>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sky-400">
              Basic Information
            </h3>
            <div>
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={safeAiConfig.language}
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    language: e.target.value,
                  }))
                }
                className="w-full mt-1 bg-white/5 border-white/10 rounded-md p-2 text-white"
              >
                <option value="en">English</option>
                <option value="ko">한국어</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
            <div>
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                value={safeAiConfig.name}
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="mt-1 bg-white/5 border-white/10"
                placeholder="Enter agent name..."
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={safeAiConfig.description}
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="mt-1 bg-white/5 border-white/10"
                placeholder="Describe your agent's purpose..."
              />
            </div>
          </div>

          {/* Knowledge Base */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sky-400 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Knowledge Base
            </h3>
            <div className="space-y-2">
              {(safeAiConfig.knowledgeBase || []).map((knowledge, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 bg-white/5 p-2 rounded-lg"
                >
                  <div className="flex-1 text-sm">{knowledge}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeKnowledgeBase(index)}
                    className="h-8 w-8 text-red-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newKnowledge}
                  onChange={(e) => setNewKnowledge(e.target.value)}
                  placeholder="Add documentation URL or paste text..."
                  className="bg-white/5 border-white/10"
                />
                <Button
                  onClick={addKnowledgeBase}
                  disabled={!newKnowledge.trim()}
                  size="icon"
                  className="bg-sky-500 hover:bg-sky-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tools */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sky-400 flex items-center gap-2">
              <Tool className="w-5 h-5" />
              Available Tools
            </h3>
            <div className="space-y-4">
              {(safeAiConfig.tools || []).map((tool, index) => (
                <div
                  key={index}
                  className="bg-white/5 p-3 rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="font-medium">{tool.name}</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTool(index)}
                      className="h-8 w-8 text-red-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-400">
                    {tool.description}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {tool.parameters}
                  </div>
                </div>
              ))}
              <Card className="bg-white/5 border-white/10">
                <div className="p-3 space-y-3">
                  <Input
                    value={newTool.name}
                    onChange={(e) =>
                      setNewTool(prev => ({
                        ...prev,
                        name: e.target.value
                      }))
                    }
                    placeholder="Tool name..."
                    className="bg-white/5 border-white/10"
                  />
                  <Textarea
                    value={newTool.description}
                    onChange={(e) =>
                      setNewTool(prev => ({
                        ...prev,
                        description: e.target.value
                      }))
                    }
                    placeholder="Tool description..."
                    className="bg-white/5 border-white/10"
                  />
                  <Textarea
                    value={newTool.parameters}
                    onChange={(e) =>
                      setNewTool(prev => ({
                        ...prev,
                        parameters: e.target.value
                      }))
                    }
                    placeholder="Parameters (JSON)..."
                    className="bg-white/5 border-white/10 font-mono text-sm"
                  />
                  <Button
                    onClick={addTool}
                    disabled={!newTool.name || !newTool.description}
                    className="w-full bg-sky-500 hover:bg-sky-600"
                  >
                    Add Tool
                    <Plus className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Voice Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sky-400 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Voice Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="voiceType">Voice Type</Label>
                <Input
                  id="voiceType"
                  value={safeAiConfig.voiceConfig.type}
                  onChange={(e) =>
                    updateConfig((prev) => ({
                      ...prev,
                      voiceConfig: {
                        ...prev.voiceConfig,
                        type: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 bg-white/5 border-white/10"
                  placeholder="e.g., Professional Female, Friendly Male..."
                />
              </div>
              <div>
                <Label htmlFor="voiceStyle">Speaking Style</Label>
                <Input
                  id="voiceStyle"
                  value={safeAiConfig.voiceConfig.style}
                  onChange={(e) =>
                    updateConfig((prev) => ({
                      ...prev,
                      voiceConfig: {
                        ...prev.voiceConfig,
                        style: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 bg-white/5 border-white/10"
                  placeholder="e.g., Conversational, Professional..."
                />
              </div>
            </div>
          </div>

          {/* AI 제안 설정 표시 */}
          <AISuggestions />
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div className="w-1/2 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-bold">AI Assistant</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => {}}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Chat Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto space-y-4 mb-4"
        >
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

        {/* Input Area */}
        <div className="flex items-end gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
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
