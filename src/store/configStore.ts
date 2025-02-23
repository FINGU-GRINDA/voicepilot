import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createJSONStorage } from 'zustand/middleware';

interface Tool {
  name: string;
  description: string;
  parameters: string;
}

interface VoiceConfig {
  type: string;
  speed: number;
  style: string;
}

interface AgentConfig {
  name: string;
  description: string;
  knowledgeBase: string[];
  systemPrompt: string;
  tools: Tool[];
  voiceConfig: VoiceConfig;
  welcomeMessage: string;
  fallbackMessage: string;
  language: string;
}

interface ConfigStore {
  config: AgentConfig;
  aiSuggestedConfig: Partial<AgentConfig>;
  updateConfig: (newConfig: Partial<AgentConfig> | ((prev: AgentConfig) => Partial<AgentConfig>)) => void;
  updateAiSuggestedConfig: (newConfig: Partial<AgentConfig> | ((prev: Partial<AgentConfig>) => Partial<AgentConfig>)) => void;
}

const defaultConfig: AgentConfig = {
  name: "Voice AI Assistant",
  description: "An intelligent voice-enabled AI assistant that provides natural and engaging conversations",
  knowledgeBase: ["https://docs.elevenlabs.io/quickstart"],
  systemPrompt: "You are a sophisticated Voice AI assistant...", // 기존 긴 프롬프트
  tools: [{
    name: "Check Order Status",
    description: "Retrieves the current status of a customer order",
    parameters: '{"orderId": "string"}',
  }],
  voiceConfig: {
    type: "Professional Female",
    speed: 1,
    style: "Friendly and Helpful",
  },
  welcomeMessage: "Hi there! I'm your Voice AI assistant...",
  fallbackMessage: "I didn't catch that clearly...",
  language: "en",
};

export const useConfigStore = create(
  persist<ConfigStore>(
    (set) => ({
      config: defaultConfig,
      aiSuggestedConfig: {},
      updateConfig: (newConfig) => 
        set((state) => ({ 
          config: { 
            ...state.config, 
            ...(typeof newConfig === 'function' 
              ? newConfig(state.config) 
              : newConfig)
          }
        })),
      updateAiSuggestedConfig: (newConfig) =>
        set((state) => ({
          aiSuggestedConfig: { 
            ...state.aiSuggestedConfig, 
            ...(typeof newConfig === 'function' 
              ? newConfig(state.aiSuggestedConfig) 
              : newConfig)
          }
        })),
    }),
    {
      name: 'agent-config-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
); 