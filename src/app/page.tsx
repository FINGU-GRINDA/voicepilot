import type { Metadata } from 'next'
import { Conversation } from "./components/conversation";

export const metadata: Metadata = {
  title: 'Voice AI Agent Builder & Tester',
  description: 'Build, fine-tune, and test your Voice AI Agent with ElevenLabs. Customize agent behavior through real-time conversation and form configuration.',
  keywords: [
    'Voice AI',
    'Conversational AI',
    'ElevenLabs',
    'AI Agent Builder',
    'Voice Assistant',
    'AI Testing Platform'
  ],
  openGraph: {
    title: 'Voice AI Agent Builder & Tester',
    description: 'Interactive platform for building and testing Voice AI Agents with ElevenLabs technology',
    type: 'website',
  }
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          ElevenLabs Voice AI Builder
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Build your Voice AI Agent through conversation, fine-tune its behavior, and test its capabilities
        </p>
        <Conversation />
      </div>
    </main>
  );
}
