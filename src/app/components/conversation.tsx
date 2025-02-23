'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useState } from 'react';
import { IncomingSocketEvent } from '@11labs/client';

export function Conversation() {
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message: IncomingSocketEvent) => console.log('Message:', message),
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
      title: '비즈니스 컨설팅 상담',
      description: '일반적인 비즈니스 니즈 파악 및 솔루션 제안',
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
      title: '기술 솔루션 상담',
      description: '기술 제품 및 서비스에 대한 전문적인 상담',
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
      title: '전략적 솔루션 컨설팅',
      description: '장기적 비즈니스 전환 및 혁신 전략 수립',
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
      title: '계약 클로징 전문',
      description: '최종 계약 체결 및 협상을 위한 상담',
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
    professional: '전문성과 신뢰성을 바탕으로 격식있게 소통하며, 데이터와 사례를 활용하여 설명합니다',
    friendly: '친근하고 편안한 태도로 소통하되, 전문성을 유지하며 고객의 입장에서 생각합니다',
    energetic: '적극적이고 열정적인 태도로 소통하며, 긍정적인 에너지로 고객의 참여를 유도합니다',
    empathetic: '고객의 상황과 감정에 깊이 공감하며, 진정성 있는 태도로 해결책을 제시합니다',
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
        agentId: 'LdmtJp2ispR6yn5KEimY',
        overrides: {
          agent: {
            prompt: {
              prompt: `${prompt}\n\nCommunication style: ${toneOptions[tone as keyof typeof toneOptions]}`,
            },
            firstMessage: "안녕하세요, 저는 귀사의 비즈니스 성장을 도와드릴 전문 컨설턴트입니다. 먼저 귀사의 현재 상황과 해결하고자 하는 과제에 대해 말씀해 주시겠습니까?",
            language: 'ko',
          },
        },
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [conversation, prompt, language, volume, tone]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col gap-4 mb-4 w-full max-w-md">
        <div className="space-y-2">
          <label className="text-gray-200 text-sm">상담 유형 선택</label>
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
          <label className="text-gray-200 text-sm">상세 프롬프트 설정</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="프롬프트를 수정하여 상담 스타일을 커스터마이즈하세요"
            className="px-4 py-2 border border-gray-600 rounded h-48 bg-gray-800 text-gray-200 placeholder-gray-400 w-full"
          />
        </div>

        <select
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="px-4 py-2 border border-gray-600 rounded bg-gray-800 text-gray-200"
        >
          <option value="professional">전문적인 톤</option>
          <option value="friendly">친근한 톤</option>
          <option value="energetic">활기찬 톤</option>
          <option value="empathetic">공감하는 톤</option>
        </select>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-4 py-2 border border-gray-600 rounded bg-gray-800 text-gray-200"
        >
          <option value="en">English</option>
          <option value="ko">Korean</option>
          <option value="ja">Japanese</option>
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
  );
}
