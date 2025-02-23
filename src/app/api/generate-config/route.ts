import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not defined');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const { messages, currentConfig } = await req.json();
    
    if (!messages || !currentConfig) {
      return NextResponse.json(
        { error: 'Missing required fields: messages or currentConfig' },
        { status: 400 }
      );
    }

    const gptMessages = [
      {
        role: 'system',
        content: `You are an AI configuration assistant. Based on the conversation history, help configure an AI agent. Analyze the conversation and current AI suggested configuration to extract relevant information. Return a complete JSON object that includes all configuration fields.

Current AI suggested configuration:
${JSON.stringify(currentConfig, null, 2)}

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
}`
      },
      ...messages
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
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      return NextResponse.json(
        { 
          error: `OpenAI API request failed: ${response.statusText}`,
          details: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in generate-config:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate configuration',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 