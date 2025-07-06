import { NextRequest } from "next/server";
import { respErr } from "@/lib/resp";
import { getOpenAI } from "@/lib/openai-config";
import { streamText } from "ai";

// Next.js API路由配置 - 增加文件大小限制
export const runtime = 'nodejs';
export const maxDuration = 300; // 5分钟超时

// 文件类型验证
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 解析FormData的安全包装函数
async function safeParseFormData(req: NextRequest) {
  try {
    // 检查Content-Length头部
    const contentLength = req.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      const maxSize = 20 * 1024 * 1024; // 20MB总限制
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

// 多语言提示词配置
const getSystemPrompt = (locale: string = 'en'): string => {
  const prompts = {
    en: `You are a professional dating profile analyst. Please analyze the user's uploaded dating profile screenshot and provide detailed scoring and suggestions.

Please follow these steps for analysis:
1. First, briefly describe what you see
2. Then provide detailed scoring analysis
3. Finally, provide specific improvement suggestions

Please analyze in natural language, as if having a conversation with the user. The analysis should be professional, friendly, and specific.

Scoring Criteria:
- 9-10 points: Extremely attractive, profile is nearly perfect
- 8-8.9 points: Very attractive, profile is excellent
- 7-7.9 points: Very attractive, profile is good
- 6-6.9 points: Attractive, room for improvement
- 5-5.9 points: Average, needs considerable improvement
- Below 4 points: Needs significant improvement

Please carefully analyze photo quality, bio, overall presentation, and other aspects.`,

    zh: `你是一个专业的交友资料分析师。请分析用户上传的交友资料截图，并提供详细的评分和建议。

请按照以下步骤进行分析：
1. 首先简单描述看到的内容
2. 然后给出详细的评分分析
3. 最后提供具体的改进建议

请以自然的语言进行分析，就像在和用户对话一样。分析要专业、友善、具体。

评分标准：
- 9-10分：极具吸引力，资料非常完美
- 8-8.9分：非常有吸引力，资料很优秀
- 7-7.9分：很有吸引力，资料不错
- 6-6.9分：有吸引力，有改进空间
- 5-5.9分：一般，需要较多改进
- 4分以下：需要大幅改进

请仔细分析照片质量、个人简介、整体呈现等方面。`
  };

  return prompts[locale as keyof typeof prompts] || prompts.en;
};

// 获取用户内容提示的多语言版本
const getUserContentText = (locale: string = 'en'): string => {
  const texts = {
    en: 'Please analyze this dating profile screenshot and provide detailed scoring and improvement suggestions:',
    zh: '请分析这个交友资料截图，给出详细的评分和改进建议：'
  };

  return texts[locale as keyof typeof texts] || texts.en;
};

export async function POST(req: NextRequest) {
  try {
    const formData = await safeParseFormData(req);
    const file = formData.get('file') as File;
    
    // 获取语言参数，默认为英文
    const locale = (formData.get('locale') as string) || 'en';
    
    if (!file) {
      const errorMessage = locale === 'zh' ? "请上传图片文件" : "Please upload an image file";
      return respErr(errorMessage);
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      const errorMessage = locale === 'zh' 
        ? "仅支持 JPG、PNG、WEBP 格式的图片"
        : "Only JPG, PNG, WEBP image formats are supported";
      return respErr(errorMessage);
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      const errorMessage = locale === 'zh' 
        ? "文件大小不能超过10MB"
        : "File size cannot exceed 10MB";
      return respErr(errorMessage);
    }

    // 读取文件内容并转换为base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;
    
    // 使用OpenAI进行流式图像分析
    const result = await streamText({
      model: getOpenAI()('gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(locale)
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: getUserContentText(locale)
            },
            {
              type: 'image',
              image: dataUrl
            }
          ]
        }
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    // 返回流式响应
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error("流式分析API错误:", error);
    const errorMessage = req.headers.get('accept-language')?.includes('zh') 
      ? "分析过程中发生错误，请稍后重试" 
      : "Error occurred during analysis, please try again later";
    return respErr(errorMessage);
  }
} 