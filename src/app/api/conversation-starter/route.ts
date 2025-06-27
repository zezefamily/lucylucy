import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";
import { ConversationStarterRequest, ConversationStarterResponse } from '@/types/conversation-starter';

// 创建 OpenAI 客户端的函数
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL
  });
}

export async function POST(request: NextRequest) {
  try {
    const { topic, locale = 'en' }: ConversationStarterRequest = await request.json();

    if (!topic) {
      return NextResponse.json<ConversationStarterResponse>(
        { 
          success: false,
          starters: [],
          topic: '',
          error: 'Topic is required' 
        },
        { status: 400 }
      );
    }

    const isChineseLocale = locale.startsWith('zh');
    
    const prompt = isChineseLocale 
      ? `请为以下话题或情境生成10个引人入胜、自然的开场白对话：

话题/情境：${topic}

要求：
- 每个开场白应该简洁明了，易于使用
- 适合不同性格的人使用
- 能够自然地引起对话
- 避免过于正式或生硬的表达
- 每个开场白换行显示

请直接列出开场白，不需要编号或额外说明。`
      : `Generate 10 engaging, natural conversation starters for the following topic or context:

Topic/Context: ${topic}

Requirements:
- Each starter should be concise and easy to use
- Suitable for different personality types
- Can naturally spark conversation  
- Avoid overly formal or stiff expressions
- Display each starter on a new line

Please list the conversation starters directly without numbering or additional explanations.`;

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const result = response.choices[0].message.content;
    
    if (!result) {
      return NextResponse.json<ConversationStarterResponse>(
        { 
          success: false,
          starters: [],
          topic: '',
          error: 'Failed to generate conversation starters' 
        },
        { status: 500 }
      );
    }

    const starters = result
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 5);

    return NextResponse.json<ConversationStarterResponse>({
      success: true,
      starters,
      topic,
    });

  } catch (error) {
    console.error('Error generating conversation starters:', error);
    return NextResponse.json<ConversationStarterResponse>(
      { 
        success: false,
        starters: [],
        topic: '',
        error: 'Failed to generate conversation starters' 
      },
      { status: 500 }
    );
  }
}

// 健康检查端点
export async function GET() {
  return NextResponse.json({ 
    status: "healthy", 
    service: "conversation-starter-api",
    version: "1.0.0",
    features: ["openai-chat-completions", "multilingual-support"]
  });
}
