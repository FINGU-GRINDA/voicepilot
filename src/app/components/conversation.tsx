'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useState, useEffect } from 'react';

export function Conversation() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: ({ message, source }: { message: string, source: string }) => console.log('Message:', message, 'Source:', source),
    onError: (error: Error) => console.error('Error:', error),
    preferHeadphonesForIosDevices: true,
    connectionDelay: {
      android: 3000,
      ios: 0,
      default: 0,
    }
  });

  const [prompt, setPrompt] = useState('You are a helpful sales agent. Please assist customers professionally.');
  const [agentType, setAgentType] = useState('general');
  const [language, setLanguage] = useState('ko');
  const [volume, setVolume] = useState(0.5);
  const [tone, setTone] = useState('professional');

  // 프리셋 프롬프트 정의
  const presetPrompts = {
    general: {
      title: 'Business Consulting',
      description: 'General business needs assessment and solution proposal',
      prompt: `You are a professional business consultant specializing in growth strategy.
      Key Responsibilities:
      - Conduct a thorough needs assessment through strategic questioning
      - Analyze business challenges and opportunities
      - Provide actionable recommendations
      - Focus on measurable outcomes and ROI
      
      Communication Guidelines:
      - Start with a professional introduction
      - Use active listening and strategic questioning
      - Maintain a consultative approach
      - Provide clear, actionable insights
      - End with concrete next steps`,
    },
    
    technical: {
      title: 'Technical Solution Consulting',
      description: 'Professional consultation for technical products and services',
      prompt: `You are a technical solutions architect with deep industry expertise.
      Key Responsibilities:
      - Assess technical requirements and infrastructure needs
      - Explain complex technical concepts in clear terms
      - Provide detailed solution architectures
      - Address security and scalability concerns
      
      Communication Guidelines:
      - Begin with technical capability assessment
      - Use relevant technical terminology appropriately
      - Provide specific examples and use cases
      - Focus on technical benefits and implementation
      - Include risk mitigation strategies`,
    },
    
    solution: {
      title: 'Strategic Solution Consulting',
      description: 'Long-term business transformation and innovation strategy',
      prompt: `You are a strategic transformation consultant.
      Key Responsibilities:
      - Develop comprehensive digital transformation strategies
      - Identify core business challenges and opportunities
      - Create roadmaps for implementation
      - Define success metrics and KPIs
      
      Communication Guidelines:
      - Focus on long-term strategic value
      - Use industry best practices and benchmarks
      - Provide phased implementation approaches
      - Address change management considerations
      - Emphasize sustainable growth strategies`,
    },
    
    closing: {
      title: 'Contract Closing Specialist',
      description: 'Final contract negotiation and closing consultation',
      prompt: `You are a senior sales closing specialist.
      Key Responsibilities:
      - Navigate final negotiations effectively
      - Address remaining concerns and objections
      - Clarify terms and conditions
      - Secure mutual agreement
      
      Communication Guidelines:
      - Summarize previous agreements
      - Focus on value realization
      - Handle objections professionally
      - Guide through decision-making process
      - Maintain win-win perspective`,
    },
  };

  // 톤 설정 옵션
  const toneOptions = {
    professional: 'Communicate formally with professionalism and reliability, using data and case studies',
    friendly: 'Maintain a friendly and comfortable attitude while maintaining expertise',
    energetic: 'Communicate with an active and passionate attitude, encouraging customer participation',
    empathetic: 'Deeply empathize with customer situations and emotions, providing solutions with sincerity',
  };

  // 언어 설정 옵션
  const languageOptions = {
    en: 'English',
    ko: 'Korean',
    ja: 'Japanese'
  };

  // 프리셋 변경 핸들러
  const handlePresetChange = (type: string) => {
    setAgentType(type);
    setPrompt(presetPrompts[type as keyof typeof presetPrompts].prompt);
  };

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_AGENT_ID,
        overrides: {
          agent: {
            prompt: {
              prompt: `${prompt}\n\nCommunication style: ${toneOptions[tone as keyof typeof toneOptions]}`,
            },
            firstMessage: "Hello, I am a professional business consultant. Please tell me about your current situation and the challenges you are facing.",
            language: language,
          },
        },
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [conversation, prompt, language, volume, tone, toneOptions]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    isClient ? (
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col gap-4 mb-4 w-full max-w-md">
          <div className="space-y-2">
            <label className="text-gray-200 text-sm">Select Consultation Type</label>
            <select
              value={agentType}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="px-4 py-2 border border-gray-600 rounded bg-gray-800 text-gray-200 w-full"
            >
              {Object.entries(presetPrompts).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.title} - {value.description}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-gray-200 text-sm">Detailed Prompt Settings</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Customize your consultation style by modifying the prompt"
              className="px-4 py-2 border border-gray-600 rounded h-48 bg-gray-800 text-gray-200 placeholder-gray-400 w-full"
            />
          </div>

          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="px-4 py-2 border border-gray-600 rounded bg-gray-800 text-gray-200"
          >
            <option value="professional">Professional Tone</option>
            <option value="friendly">Friendly Tone</option>
            <option value="energetic">Energetic Tone</option>
            <option value="empathetic">Empathetic Tone</option>
          </select>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-4 py-2 border border-gray-600 rounded bg-gray-800 text-gray-200"
          >
            {Object.entries(languageOptions).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>

          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={startConversation}
            disabled={conversation.status === 'connected'}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-700 disabled:text-gray-400 hover:bg-blue-700"
          >
            Start Conversation
          </button>
          <button
            onClick={stopConversation}
            disabled={conversation.status !== 'connected'}
            className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-700 disabled:text-gray-400 hover:bg-red-700"
          >
            Stop Conversation
          </button>
        </div>

        <div className="flex flex-col items-center text-gray-200">
          <p>Status: {conversation.status}</p>
          <p>Agent is {conversation.isSpeaking ? 'speaking' : 'listening'}</p>
          {conversation.canSendFeedback && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => conversation.sendFeedback(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                👍 Positive Feedback
              </button>
              <button
                onClick={() => conversation.sendFeedback(false)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                👎 Negative Feedback
              </button>
            </div>
          )}
        </div>
      </div>
    ) : null
  );
}
