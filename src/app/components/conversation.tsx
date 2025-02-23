'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useState } from 'react';

export function Conversation() {
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message) => console.log('Message:', message),
    onError: (error) => console.error('Error:', error),
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
    general: `You are a professional sales consultant with expertise in understanding customer needs. 
    - Start by introducing yourself professionally and ask about the customer's business needs
    - Focus on building rapport and trust
    - Use active listening techniques and ask open-ended questions
    - Maintain a solution-focused approach`,
    
    technical: `You are a technical sales specialist with deep product knowledge.
    - Begin with a brief introduction and assess customer's technical requirements
    - Focus on specific technical benefits and ROI
    - Use data-driven examples and case studies
    - Provide detailed technical specifications when requested
    - Address technical concerns with precise solutions`,
    
    solution: `You are a strategic solution consultant specializing in business transformation.
    - Start by understanding the customer's current business challenges
    - Use the SPIN selling methodology (Situation, Problem, Implication, Need-payoff)
    - Focus on long-term value creation and ROI
    - Present customized solutions based on customer needs
    - Discuss implementation strategy and success metrics`,
    
    closing: `You are a senior sales closing specialist focused on value-based negotiations.
    - Begin by confirming previous discussions and current status
    - Address any remaining concerns professionally
    - Present clear value propositions
    - Discuss terms and conditions confidently
    - Guide towards successful deal closure`,
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
    setPrompt(presetPrompts[type as keyof typeof presetPrompts]);
  };
//   secret-key
// hello
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
        <select
          value={agentType}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="px-4 py-2 border border-gray-600 rounded bg-gray-800 text-gray-200"
        >
          <option value="general">비즈니스 컨설팅 상담</option>
          <option value="technical">기술 솔루션 상담</option>
          <option value="solution">전략적 솔루션 컨설팅</option>
          <option value="closing">계약 클로징 전문</option>
        </select>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="상세 프롬프트 입력"
          className="px-4 py-2 border border-gray-600 rounded h-32 bg-gray-800 text-gray-200 placeholder-gray-400"
        />

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
