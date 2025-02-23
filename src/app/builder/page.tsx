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

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Tool {
  name: string;
  description: string;
  parameters: string;
}

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
  const searchParams = useSearchParams();

  const prompt = searchParams.get("prompt");

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
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
  const [isTestMode, setIsTestMode] = useState(false);
  const [newKnowledge, setNewKnowledge] = useState("");
  const [newTool, setNewTool] = useState<Tool>({
    name: "",
    description: "",
    parameters: "",
  });
  const [testMessages, setTestMessages] = useState<Message[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isClient, setIsClient] = useState(false);

  const conversation = useConversation({
    onConnect: () => console.log("Connected"),
    onDisconnect: () => console.log("Disconnected"),
    onMessage: ({ message, source }: { message: string; source: string }) => {
      console.log("Message:", message, "Source:", source);
      const messageObj = {
        role: source === "user" ? "user" : "assistant",
        content: message,
      };

      if (isTestMode) {
        setTestMessages((prev) => [...prev, messageObj as Message]);
      } else {
        setMessages((prev) => [...prev, messageObj as Message]);
      }
    },
    onError: (error: Error) => console.error("Error:", error),
    preferHeadphonesForIosDevices: true,
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const testChatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (testChatContainerRef.current) {
      testChatContainerRef.current.scrollTop =
        testChatContainerRef.current.scrollHeight;
    }
  }, []);

  const speakMessage = (message: string) => {
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.volume = volume / 100;
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };
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

  const startTestMode = () => {
    setIsTestMode(true);
    setTestMessages([
      { role: "assistant", content: agentConfig.welcomeMessage },
    ]);
  };

  const startConversationSession = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_AGENT_ID,
        overrides: {
          agent: {
            prompt: {
              prompt:
                "You are a sophisticated Voice AI assistant focused on helping users configure their ideal voice AI agent. Guide the conversation by asking these questions one at a time, waiting for the user's response before moving to the next question:\n\n1. Purpose\n- Ask: '이 음성 AI 어시스턴트를 어떤 목적으로 사용하실 계획인가요? (예: 고객 서비스, 교육, 개인 비서 등)'\n- Listen to their use case and confirm understanding\n\n2. Knowledge Base\n- Ask: '음성 AI가 어떤 정보나 지식을 가지고 있어야 하나요? 특정 분야나 주제가 있다면 알려주세요.'\n- Help them specify required knowledge domains\n\n3. Language Preferences\n- Ask: '어떤 언어로 소통하기를 원하시나요? 다국어 지원이 필요하신가요?'\n- Confirm language requirements and formality level\n\nAfter gathering these basic requirements, we can discuss more specific details about:\n- Voice characteristics (성별, 나이, 말투)\n- Communication style (격식체/비격식체, 전문성 수준)\n- Technical specifications (음성 품질, 응답 속도)\n\nRemember to:\n- Ask only one question at a time\n- Wait for user response before proceeding\n- Provide examples when needed\n- Confirm understanding before moving to next topic.",
            },
            firstMessage:
              "Hello! I'm here to help create your perfect voice AI experience. For what purpose do you plan to use this voice AI assistant? (e.g. customer service, training, personal secretary, etc.)",
            language: agentConfig.language,
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

  // UI에 세션 컨트롤 버튼 추가
  const SessionControls = () => (
    <div className="flex gap-2 mb-4">
      <Button
        onClick={startConversationSession}
        className="bg-green-500 hover:bg-green-600"
      >
        Start Session
      </Button>
      <Button
        onClick={stopConversationSession}
        className="bg-red-500 hover:bg-red-600"
      >
        End Session
      </Button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-sky-900 to-black text-white">
      <div className="h-full flex">
        {!isTestMode ? (
          <>
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
                      value={agentConfig.language}
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
                      value={agentConfig.name}
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
                      value={agentConfig.description}
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
                    {agentConfig.knowledgeBase.map((knowledge, index) => (
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
                    {agentConfig.tools.map((tool, index) => (
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
                        value={agentConfig.voiceConfig.type}
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
                        value={agentConfig.voiceConfig.style}
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

                {/* Test Button */}
                <Button
                  className="w-full bg-sky-500 hover:bg-sky-600"
                  onClick={startTestMode}
                >
                  Test Your Agent
                  <Play className="ml-2 h-4 w-4" />
                </Button>
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
                      message.role === "assistant"
                        ? "justify-start"
                        : "justify-end"
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
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Test Mode UI
          <div className="w-full p-6 flex flex-col">
            <SessionControls />
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-sky-400" />
                <h2 className="text-xl font-bold">Test Your Voice AI Agent</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsTestMode(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Test Chat Messages */}
            <div
              ref={testChatContainerRef}
              className="flex-1 overflow-y-auto space-y-4 mb-4"
            >
              {testMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "assistant"
                      ? "justify-start"
                      : "justify-end"
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

            {/* Test Input Area */}
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
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Volume Control */}
            <div className="mt-4 flex items-center gap-2">
              {volume === 0 ? (
                <VolumeX className="h-5 w-5 text-sky-400" />
              ) : (
                <Volume2 className="h-5 w-5 text-sky-400" />
              )}
              <Slider
                value={[volume]}
                onValueChange={(values) => setVolume(values[0])}
                max={100}
                step={1}
                className="w-[200px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
