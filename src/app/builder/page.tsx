/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useConversation } from "@11labs/react";
import type React from "react";
import { useState, useEffect, useRef } from "react";
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
import { useSearchParams } from "next/navigation";

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
  // 주요 상태 관리
  const [messages, setMessages] = useState<Message[]>([]); // 채팅 메시지 저장
  const [inputMessage, setInputMessage] = useState(""); // 사용자 입력 메시지
  const [isListening, setIsListening] = useState(false); // 음성 입력 상태
  const [newKnowledge, setNewKnowledge] = useState("");
  const [newTool, setNewTool] = useState<Tool>({
    name: "",
    description: "",
    parameters: "",
  });
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    name: "Voice AI Assistant",
    description:
      "An intelligent voice-enabled AI assistant that provides natural and engaging conversations",
    knowledgeBase: ["https://docs.elevenlabs.io/quickstart"],
    systemPrompt:
      "You are a sophisticated Voice AI assistant focused on helping users configure their ideal voice AI agent. Guide the conversation by asking these questions one at a time, waiting for the user's response before moving to the next question:\n\n1. Purpose\n- Ask: '이 음성 AI 어시스턴트를 어떤 목적으로 사용하실 계획인가요? (예: 고객 서비스, 교육, 개인 비서 등)'\n- Listen to their use case and confirm understanding\n\n2. Knowledge Base\n- Ask: '음성 AI가 어떤 정보나 지식을 가지고 있어야 하나요? 특정 분야나 주제가 있다면 알려주세요.'\n- Help them specify required knowledge domains\n\n3. Language Preferences\n- Ask: '어떤 언어로 소통하기를 원하시나요? 다국어 지원이 필요하신가요?'\n- Confirm language requirements and formality level\n\nAfter gathering these basic requirements, we can discuss more specific details about:\n- Voice characteristics (성별, 나이, 말투)\n- Communication style (격식체/비격식체, 전문성 수준)\n- Technical specifications (음성 품질, 응답 속도)\n\nRemember to:\n- Ask only one question at a time\n- Wait for user response before proceeding\n- Provide examples when needed\n- Confirm understanding before moving to next topic.",
    tools: [
      {
        name: "Check Order Status",
        description: "Retrieves the current status of a customer order",
        parameters: '{"orderId": "string"}',
      },
    ],
    voiceConfig: {
      type: "Professional Female",
      speed: 1,
      style: "Friendly and Helpful",
    },
    welcomeMessage:
      "Hi there! I'm your Voice AI assistant. I'm here to help and chat with you naturally. Feel free to speak or type your message - I'm listening!",
    fallbackMessage:
      "I didn't catch that clearly. Could you please repeat that or try typing your message instead?",
    language: "en",
  });
  const [isClient, setIsClient] = useState(false);
  
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

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // AI 응답으로 받은 설정을 저장할 새로운 상태
  const [aiSuggestedConfig, setAiSuggestedConfig] = useState<Partial<AgentConfig>>({
    name: '',
    description: '',
    knowledgeBase: [],
    systemPrompt: '',
    tools: [],
    voiceConfig: {
      type: '',
      speed: 1,
      style: ''
    },
    welcomeMessage: '',
    fallbackMessage: '',
    language: ''
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, []);

  const addKnowledgeBase = () => {
    if (newKnowledge.trim()) {
      setAgentConfig((prev) => ({
        ...prev,
        knowledgeBase: [...prev.knowledgeBase, newKnowledge],
      }));
      setNewKnowledge("");
    }
  };

  const removeKnowledgeBase = (index: number) => {
    setAgentConfig((prev) => ({
      ...prev,
      knowledgeBase: prev.knowledgeBase.filter((_, i) => i !== index),
    }));
  };

  const addTool = () => {
    if (newTool.name && newTool.description) {
      setAgentConfig((prev) => ({
        ...prev,
        tools: [...prev.tools, newTool],
      }));
      setNewTool({ name: "", description: "", parameters: "" });
    }
  };

  const removeTool = (index: number) => {
    setAgentConfig((prev) => ({
      ...prev,
      tools: prev.tools.filter((_, i) => i !== index),
    }));
  };

  // 음성 대화 세션 시작 함수
  const startConversationSession = async () => {
    try {
      // 마이크 권한 요청
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 에이전트 세션 시작 및 설정
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_AGENT_ID,
        overrides: {
          agent: {
            prompt: {
              prompt: "You are a sophisticated Voice AI assistant designed to help users configure their ideal voice AI agent. Guide the conversation by asking one short question at a time, ensuring clarity and confirmation before proceeding to the next step. You are a sophisticated Voice AI assistant designed to help users configure their ideal voice AI agent. Guide the conversation by asking one short question at a time, ensuring clarity and confirmation before proceeding to the next step. You are a sophisticated Voice AI assistant designed to help users configure their ideal voice AI agent. Guide the conversation by asking one short question at a time, ensuring clarity and confirmation before proceeding to the next step.",
              // prompt: "당신은 사용자가 이상적인 음성 AI 에이전트를 구성할 수 있도록 돕는 데 중점을 둔 정교한 음성 AI 비서입니다. 다음 질문으로 넘어가기 전에 사용자의 응답을 기다리며 한 번에 하나씩 쩗은 질문하여 대화를 안내하세요:\n\n1. 목적\n- Ask: '이 음성 AI 어시스턴트를 어떤 목적으로 사용하실 계획인가요? (예: 고객 서비스, 교육, 개인 비서 등)'\n- 그들의 사용 사례를 듣고 이해를 확인하세요\n\n2. 지식 베이스\n- Ask: '음성 AI가 어떤 정보나 지식을 가지고 있어야 하나요? 특정 분야나 주제가 있다면 알려주세요.'\n- 필요한 지식 도메인을 지정하는 데 도움\n\n3. 언어 선호도\n- Ask: '어떤 언어로 소통하기를 원하시나요? 다국어 지원이 필요하신가요?'\n- 언어 요구 사항 및 형식 수준 확인\n\n이러한 기본 요구 사항을 수집한 후, 다음에 대해 더 구체적인 세부 사항을 논의할 수 있습니다:\n- 음성 특성(성별, 나이, 말투)\n- 커뮤니케이션 스타일 (격식체/비격식체, 전문성 수준)\n- 기술 사양(음성 품질, 응답 속도)\n\n기억하세요:\n- 한 번에 한 가지 질문만 하세요\n- 진행하기 전에 사용자 응답을 기다립니다\n- 필요할 때 예시 제공\n- 다음 주제로 넘어가기 전에 이해를 확인하세요.",
            },
            firstMessage: "Hello! For what purpose do you plan to use this voice AI assistant?",
            // firstMessage: "안녕하세요! 이 음성 AI 비서를 어떤 용도로 활용하고 싶으신가요?",
            language: "en",
            // language: agentConfig.language,
          },
        },
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const stopConversationSession = async () => {
    await conversation.endSession();
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

  // OpenAI API를 통한 메시지 처리
  const setConfigWithGPTOnCustomerMessage = async (messageText?: string) => {
    const message = messageText || inputMessage;
    if (!message.trim()) return;

    if (!messageText) {
      setInputMessage('');
    }

    try {
      const gptMessages: Message[] = [
        {
          role: 'system',
          content: `You are an AI configuration assistant. Analyze the conversation history and current AI suggested configuration to extract relevant information. Prioritize information from the most recent user messages over existing configurations. Return a JSON object that reflects these preferences.

Current AI suggested configuration:
${JSON.stringify(aiSuggestedConfig, null, 2)}

Return a JSON object with only the fields that can be confidently determined from the conversation. The response should follow this structure:
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
1. Prioritize information from user messages over existing configuration
2. Only include fields that are explicitly discussed or can be confidently inferred
3. Maintain any existing configuration values that aren't contradicted by the conversation
4. If a field is not mentioned in the conversation, exclude it from the response`
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
          type: typeof parsedConfig.voiceConfig.type === 'string' ? parsedConfig.voiceConfig.type : agentConfig.voiceConfig.type,
          speed: typeof parsedConfig.voiceConfig.speed === 'number' ? parsedConfig.voiceConfig.speed : agentConfig.voiceConfig.speed,
          style: typeof parsedConfig.voiceConfig.style === 'string' ? parsedConfig.voiceConfig.style : agentConfig.voiceConfig.style
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

      // 기존 설정과 새로운 설정을 병합
      setAiSuggestedConfig(prev => ({
        ...prev,
        ...validatedConfig
      }));

    } catch (error) {
      console.error('Error calling GPT API:', error);
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

  // UI에 세션 컨트롤 버튼 추가
  const SessionControls = () => (
    <div className="flex gap-2 mb-4">
      <Button
        onClick={startConversationSession}
        className="opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity bg-transparent hover:bg-green-600 border border-green-500"
      >
        Start Session
      </Button>
      <Button
        onClick={stopConversationSession}
        className="opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity bg-transparent hover:bg-red-600 border border-red-500"
      >
        End Session
      </Button>
    </div>
  );

  // AI 제안 설정을 표시할 새로운 컴포넌트
  const AISuggestions = () => {
    if (Object.keys(aiSuggestedConfig).length === 0) return null;

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
          <Button 
            className="mt-4 bg-sky-500 hover:bg-sky-600"
            onClick={() => setAgentConfig(prev => ({...prev, ...aiSuggestedConfig}))}
          >
            Apply Suggestions
          </Button>
        </Card>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-sky-900 to-black text-white">
      <div className="h-full flex">
        <div className="w-1/2 p-6 overflow-y-auto border-r border-white/10">
          <SessionControls />
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
                  value={aiSuggestedConfig.language || agentConfig.language}
                  onChange={(e) =>
                    setAgentConfig((prev) => ({
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
                  value={aiSuggestedConfig.name}
                  onChange={(e) =>
                    setAgentConfig((prev) => ({
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
                  value={aiSuggestedConfig.description}
                  onChange={(e) =>
                    setAgentConfig((prev) => ({
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
                {(aiSuggestedConfig.knowledgeBase || []).map((knowledge, index) => (
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
                {(aiSuggestedConfig.tools || []).map((tool, index) => (
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
                        setNewTool((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Tool name..."
                      className="bg-white/5 border-white/10"
                    />
                    <Textarea
                      value={newTool.description}
                      onChange={(e) =>
                        setNewTool((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Tool description..."
                      className="bg-white/5 border-white/10"
                    />
                    <Textarea
                      value={newTool.parameters}
                      onChange={(e) =>
                        setNewTool((prev) => ({
                          ...prev,
                          parameters: e.target.value,
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
                    value={aiSuggestedConfig.voiceConfig?.type}
                    onChange={(e) =>
                      setAgentConfig((prev) => ({
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
                    value={aiSuggestedConfig.voiceConfig?.style}
                    onChange={(e) =>
                      setAgentConfig((prev) => ({
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
    </div>
  );
}
