import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import OpenAI from "openai";

// 文件类型验证
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

// 创建 OpenAI 客户端的函数
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileCount = parseInt(formData.get('fileCount') as string || '0');
    const locale = formData.get('locale') as string || 'zh';
    
    if (fileCount === 0) {
      return respErr("请上传至少一张图片");
    }

    if (fileCount > MAX_FILES) {
      return respErr(`最多只能上传${MAX_FILES}张图片`);
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
        return respErr(`图片 ${i + 1} 格式不支持，仅支持 JPG、PNG、WEBP 格式`);
      }

      // 验证文件大小
      if (file.size > MAX_FILE_SIZE) {
        return respErr(`图片 ${i + 1} 大小超过10MB限制`);
      }

      files.push(file);

      // 读取文件内容并转换为base64
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      dataUrls.push(dataUrl);
    }

    if (files.length === 0) {
      return respErr("未找到有效的图片文件");
    }

    const modelName = "gpt-4o";
    const isChineseLocale = locale.startsWith('zh');

    // 构建消息内容
    const userContent: any[] = [
      {
        type: 'text',
        text: isChineseLocale 
          ? `请分析这${files.length}张照片中的人物，基于他们的外貌、穿着、风格、兴趣爱好和个性特征，生成10个个性化的聊天开场白。这些开场白应该能够提升交友成功率、增加好感度和兴趣度。`
          : `Please analyze the person(s) in these ${files.length} photo(s), and based on their appearance, clothing, style, interests, and personality traits, generate 10 personalized conversation starters that would increase dating success rate, likability, and interest.`
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

    const systemPrompt = isChineseLocale 
      ? `你是一位专业的交友顾问和心理学专家。请根据用户上传的照片分析对方的特征，生成高质量的个性化开场白。

分析维度：
1. 外貌特征和风格品味
2. 穿着打扮和时尚感
3. 兴趣爱好和生活方式
4. 性格特质和气质
5. 社交场景和环境背景

开场白要求：
- 个性化：针对对方的具体特征
- 自然友好：不显突兀或刻意
- 引起兴趣：能够激发对话欲望  
- 增加好感：展现你的观察力和真诚
- 实用性强：适合在真实社交场景使用
- 避免过于直接或唐突的表达
- 每个开场白应该简洁明了，易于使用

请直接列出10个开场白，每行一个，不需要编号或额外说明。`
      : `You are a professional dating coach and psychology expert. Please analyze the characteristics of the person(s) in the uploaded photos and generate high-quality personalized conversation starters.

Analysis dimensions:
1. Physical features and style taste
2. Clothing and fashion sense  
3. Hobbies and lifestyle
4. Personality traits and temperament
5. Social scenes and environmental background

Conversation starter requirements:
- Personalized: Target specific characteristics of the person
- Natural and friendly: Not awkward or forced
- Interest-generating: Able to spark desire for conversation
- Likability-enhancing: Show your observation skills and sincerity
- Practical: Suitable for real social scenarios
- Avoid overly direct or abrupt expressions
- Each starter should be concise and easy to use

Please list 10 conversation starters directly, one per line, without numbering or additional explanations.`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        temperature: 0.8,
        max_tokens: 1000,
      });

      const result = response.choices[0].message.content;
      
      if (!result) {
        return respErr("AI 分析失败，请重试");
      }

      // 解析生成的开场白
      const starters = result
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 5);

      if (starters.length === 0) {
        return respErr("未能生成有效的开场白，请重试");
      }

      return respData({
        success: true,
        starters,
        topic: `基于${files.length}张图片的分析`, // 用于显示的主题描述
        imageCount: files.length
      });
      
    } catch (openaiError) {
      console.error("OpenAI API调用错误:", openaiError);
      
      // 处理特定的OpenAI错误
      if (openaiError instanceof Error) {
        const errorMessage = openaiError.message.toLowerCase();
        
        if (errorMessage.includes('api key')) {
          return respErr("API密钥配置错误，请检查OPENAI_API_KEY设置");
        } else if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
          return respErr("API配额不足，请检查OpenAI账户余额");
        } else if (errorMessage.includes('rate limit')) {
          return respErr("API调用频率过高，请稍后重试");
        } else if (errorMessage.includes('model') || errorMessage.includes('not found')) {
          return respErr("模型配置错误，请联系管理员");
        } else if (errorMessage.includes('context_length_exceeded')) {
          return respErr("图片过多或过大，请减少图片数量或尺寸");
        }
      }
      
      return respErr("AI服务暂时不可用，请稍后重试");
    }
    
  } catch (error) {
    console.error("图片开场白生成API错误:", error);
    return respErr("分析过程中发生错误，请稍后重试");
  }
}

// 健康检查端点
export async function GET() {
  return respData({ 
    status: "healthy", 
    service: "conversation-starter-image-api",
    version: "1.0.0",
    features: ["image-analysis", "personalized-starters", "multi-image-support"],
    maxFiles: MAX_FILES
  });
} 