import { NextRequest } from "next/server";
import { respErr } from "@/lib/resp";
import OpenAI from "openai";

// Next.js API路由配置 - 增加文件大小限制
export const runtime = 'nodejs';
export const maxDuration = 300; // 5分钟超时

// 文件类型验证
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 9;

// 解析FormData的安全包装函数
async function safeParseFormData(req: NextRequest) {
  try {
    // 检查Content-Length头部
    const contentLength = req.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      const maxSize = 50 * 1024 * 1024; // 50MB总限制
      if (size > maxSize) {
        throw new Error('Request too large');
      }
    }
    
    return await req.formData();
  } catch (error) {
    console.error('FormData解析错误:', error);
    throw error;
  }
}

// 多语言提示词配置 - 专门用于思考过程
const getThinkingPrompt = (locale: string = 'en'): string => {
  const prompts = {
    en: `You are a dating coach analyzing profile images. Your task is to show your detailed thinking process while analyzing these photos.

Please demonstrate your analysis thinking step by step, covering:

1. **Initial Impression** - First thoughts when seeing the photos
2. **Technical Analysis** - Photo quality, lighting, composition, angles
3. **Personal Presentation** - Clothing, grooming, body language, expressions
4. **Psychological Impact** - What emotions and impressions these photos might evoke
5. **Comparative Analysis** - How photos work together, consistency, variety
6. **Target Audience Consideration** - How different demographics might perceive these
7. **Attraction Competitiveness Analysis** - Compared to other users, what are the advantages and features

Be detailed and thorough in showing your thinking process. This helps build credibility and trust. Write in a natural, conversational tone as if you're thinking out loud.

DO NOT provide final scores, ratings, or conclusions. This is purely the thinking process phase.

Please respond in a natural, flowing narrative format, not structured lists or JSON.`,

    zh: `你是一个恋爱教练，正在分析用户的资料图片。你的任务是详细展示你在分析这些照片时的思考过程。

请一步步展示你的分析思考，涵盖：

1. **初印象** - 看到这些照片的第一感觉
2. **技术层面分析** - 照片质量、光线、构图、角度等
3. **个人形象展示** - 穿着、仪容、肢体语言、表情等
4. **心理层面影响** - 这些照片可能给人带来什么情感和印象
5. **综合搭配分析** - 照片之间的协调性、一致性、多样性
6. **目标受众考量** - 不同群体可能如何看待这些照片
7. **吸引力竞争力分析** - 相比其他用户的优势和特色

在展示思考过程时要详细透彻，这有助于建立可信度和信任感。用自然、对话式的语调，就像在自言自语思考一样。

不要提供最终评分、打分或结论。这纯粹是思考过程阶段。

请以自然流畅的叙述格式回复，不要用结构化列表或JSON格式。`
  };

  return prompts[locale as keyof typeof prompts] || prompts.en;
};

// 获取用户内容提示的多语言版本
const getUserContentText = (locale: string = 'en', fileCount: number): string => {
  const texts = {
    en: `Please show me your detailed thinking process while analyzing these ${fileCount} dating profile images. Walk me through your thoughts step by step, but don't provide final conclusions or scores yet.`,
    zh: `请详细展示你分析这${fileCount}张交友资料图片时的思考过程。一步步带我了解你的想法，但暂时不要给出最终结论或评分。`
  };

  return texts[locale as keyof typeof texts] || texts.en;
};

// 创建 OpenAI 客户端的函数
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await safeParseFormData(req);
    const fileCount = parseInt(formData.get('fileCount') as string || '0');
    
    // 获取语言参数，默认为英文
    const locale = (formData.get('locale') as string) || 'en';
    
    if (fileCount === 0) {
      const errorMessage = locale === 'zh' ? "请上传至少一张图片" : "Please upload at least one image";
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (fileCount > MAX_FILES) {
      const errorMessage = locale === 'zh' 
        ? `最多只能上传${MAX_FILES}张图片` 
        : `Maximum ${MAX_FILES} images allowed`;
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const files: File[] = [];
    const dataUrls: string[] = [];

    // 处理所有上传的文件
    for (let i = 0; i < fileCount; i++) {
      const file = formData.get(`file${i}`) as File;
      
      if (!file) {
        continue;
      }

      // 验证文件类型
      if (!ALLOWED_TYPES.includes(file.type)) {
        const errorMessage = locale === 'zh' 
          ? `图片 ${i + 1} 格式不支持，仅支持 JPG、PNG、WEBP 格式`
          : `Image ${i + 1} format not supported, only JPG, PNG, WEBP formats are allowed`;
        return new Response(
          JSON.stringify({ error: errorMessage }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // 验证文件大小
      if (file.size > MAX_FILE_SIZE) {
        const errorMessage = locale === 'zh' 
          ? `图片 ${i + 1} 大小超过10MB限制`
          : `Image ${i + 1} size exceeds 10MB limit`;
        return new Response(
          JSON.stringify({ error: errorMessage }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      files.push(file);

      // 读取文件内容并转换为base64
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      dataUrls.push(dataUrl);
    }

    if (files.length === 0) {
      const errorMessage = locale === 'zh' ? "未找到有效的图片文件" : "No valid image files found";
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const modelName = "gpt-4o";

    // 构建消息内容
    const userContent: any[] = [
      {
        type: 'text',
        text: getUserContentText(locale, files.length)
      }
    ];

    // 添加所有图片
    dataUrls.forEach((dataUrl, index) => {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: dataUrl
        }
      });
    });

    // 流式响应
    try {
      const stream = await getOpenAIClient().chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: getThinkingPrompt(locale)
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        temperature: 0.7, // 思考过程可以更有创意一些
        max_tokens: 1500,
        stream: true,
      });

      // 创建流式响应
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                const data = `data: ${JSON.stringify({ content })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            }
            
            // 发送完成信号
            const endData = `data: ${JSON.stringify({ done: true })}\n\n`;
            controller.enqueue(encoder.encode(endData));
            controller.close();
          } catch (error) {
            console.error('Stream error:', error);
            const errorData = `data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        }
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
      
    } catch (openaiError) {
      console.error("OpenAI API调用错误:", openaiError);
      
      // 处理特定的OpenAI错误
      if (openaiError instanceof Error) {
        const errorMessage = openaiError.message.toLowerCase();
        
        if (errorMessage.includes('api key')) {
          const message = locale === 'zh' 
            ? "API密钥配置错误，请检查OPENAI_API_KEY设置" 
            : "API key configuration error, please check OPENAI_API_KEY setting";
          return respErr(message);
        } else if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
          const message = locale === 'zh' 
            ? "API配额不足，请检查OpenAI账户余额" 
            : "API quota insufficient, please check OpenAI account balance";
          return respErr(message);
        } else if (errorMessage.includes('rate limit')) {
          const message = locale === 'zh' 
            ? "API调用频率过高，请稍后重试" 
            : "API rate limit exceeded, please try again later";
          return respErr(message);
        }
      }
      
      const errorMessage = locale === 'zh' 
        ? "AI思考过程服务暂时不可用，请稍后重试" 
        : "AI thinking process service temporarily unavailable, please try again later";
      return respErr(errorMessage);
    }
    
  } catch (error) {
    console.error("思考过程API错误:", error);
    const errorMessage = req.headers.get('accept-language')?.includes('zh') 
      ? "思考过程分析中发生错误，请稍后重试" 
      : "Error occurred during thinking process analysis, please try again later";
    return respErr(errorMessage);
  }
}

// 健康检查端点
export async function GET() {
  return new Response(
    JSON.stringify({ 
      status: "healthy", 
      service: "lucylucy-analyze-thinking-api",
      version: "1.0.0",
      features: ["real-time-thinking-process", "streaming-response", "multilingual-support"],
      supportedLocales: ["en", "zh"],
      maxFiles: MAX_FILES
    }),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );
} 