/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Mic, Plane, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

// SpeechRecognition 및 webkitSpeechRecognition 타입 선언
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Page() {
  const [isMicActive, setIsMicActive] = useState(false);
  const [prompt, setPrompt] = useState("");
  const router = useRouter();

  const handleStartSpeech = () => {
    const recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.lang = "en-US"; // 영어
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    setIsMicActive(true);

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      console.log("Speech received: ", speechResult);
      setPrompt(speechResult);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error detected: ", event.error);
      setIsMicActive(false);
    };

    recognition.onspeechend = () => {
      recognition.stop();
      setIsMicActive(false);
    };
  };

  const handleButtonClick = () => {
    const queryString = new URLSearchParams({ prompt }).toString();
    router.push(`/builder?${queryString}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-900 to-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Plane className="w-8 h-8 text-sky-400" />
          <span className="font-bold text-xl">VoicePilot</span>
        </div>
      </header>

      {/* New Banner */}
      <div className="bg-sky-500/10 border-b border-sky-500/20 p-2 text-center text-sm">
        <span className="inline-flex items-center gap-2">
          <span className="bg-sky-500 text-[10px] px-1.5 py-0.5 rounded font-medium">
            NEW
          </span>
          Your AI call center takes flight in 2 minutes
        </span>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-10 md:py-20 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          Build your voice agent on the fly—just speak and go live.
        </h1>
        <p className="text-gray-300 mb-8">
          Transform your customer service instantly with AI-powered voice agents
        </p>

        {/* Main Input Area */}
        <div className="relative mb-8">
          <Textarea
            placeholder="Example: I need a friendly AI assistant that sounds like a seasoned concierge. They should handle bookings, explain our loyalty program, and address common travel queries with a touch of humor..."
            className="w-full h-40 md:h-32 bg-white/5 border-white/10 rounded-lg resize-none focus:ring-2 focus:ring-sky-500/50 transition-all pr-24"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="absolute top-2 right-2 flex flex-col gap-2">
            <Button
              onClick={handleStartSpeech}
              size="icon"
              className={`rounded-full ${
                isMicActive ? "bg-red-500" : "bg-sky-500 hover:bg-sky-600"
              }`}
              title="Speak your description"
            >
              <Mic className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <Button
          className="w-full md:w-auto mb-8 bg-sky-500 hover:bg-sky-600 text-lg py-6 px-8"
          onClick={handleButtonClick}
        >
          Speak Your Agent to Life
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>

        {/* Quick Templates */}
        <div className="mb-4">
          <p className="text-lg font-semibold text-gray-300 mb-2">
            Or choose a pre-configured agent to take off immediately:
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Button
              variant="outline"
              size="lg"
              className="border-white/10 bg-white/5"
            >
              <span className="text-sky-400 mr-2">POPULAR</span>
              24/7 Sky Concierge
              <span className="text-xs text-gray-400 ml-2">
                Reduce wait times by 80%
              </span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/10 bg-white/5"
            >
              Booking Wizard
              <span className="text-xs text-gray-400 ml-2">
                Increase conversions by 35%
              </span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/10 bg-white/5"
            >
              VIP Loyalty Guide
              <span className="text-xs text-gray-400 ml-2">
                Boost customer retention by 50%
              </span>
            </Button>
          </div>
        </div>

        {/* Integration Icons */}
        <div className="text-center">
          <p className="text-gray-300 mb-4">
            Powered by industry-leading AI technology
          </p>
          <div className=" justify-items-center max-w-xs mx-auto">
            <div
              className="px-4 h-16 bg-white/5 rounded-2xl flex items-center justify-center group hover:bg-white/10 transition-colors cursor-pointer"
              title="ElevenLabs - Human-quality voices"
            >
              elevenlabs
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 flex items-center justify-between p-4 text-xs md:text-sm text-gray-300 border-t border-white/10 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button className="hover:text-white">See It In Action</button>
          <button className="hover:text-white">Success Stories</button>
          <button className="hover:text-white">Pricing</button>
          <button className="hover:text-white">Support</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline">
            Your AI assistant is ready for takeoff
          </span>
          <span className="animate-pulse">...</span>
        </div>
      </footer>
    </div>
  );
}
