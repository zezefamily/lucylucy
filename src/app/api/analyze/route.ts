import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import OpenAI from "openai";

// 分析结果接口
interface AnalysisResult {
  score: number;
  category: string;
  suggestions: {
    photos: string[];
    bio: string[];
    overall: string[];
  };
  strengths: string[];
  improvements: string[];
}

// 文件类型验证
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 多语言提示词配置 - 流式分析
const getStreamSystemPrompt = (locale: string = 'en'): string => {
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

// 多语言提示词配置 - 非流式分析
const getSystemPrompt = (locale: string = 'en'): string => {
  const prompts = {
    en: `You are a professional dating profile analyst. Please analyze the user's uploaded dating profile screenshot and provide detailed scoring and suggestions.

Please return the analysis results strictly in the following JSON format, without adding any other text:
{
  "score": 7.5,
  "category": "Very Attractive",
  "suggestions": {
    "photos": ["suggestion1", "suggestion2", "suggestion3"],
    "bio": ["suggestion1", "suggestion2", "suggestion3"],
    "overall": ["suggestion1", "suggestion2", "suggestion3"]
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"]
}

Scoring Criteria:
- 9-10 points: Extremely attractive, profile is nearly perfect
- 8-8.9 points: Very attractive, profile is excellent
- 7-7.9 points: Very attractive, profile is good
- 6-6.9 points: Attractive, room for improvement
- 5-5.9 points: Average, needs considerable improvement
- Below 4 points: Needs significant improvement

Please carefully analyze photo quality, bio, overall presentation, and provide specific actionable suggestions. Return only JSON, no other content.`,

    zh: `你是一个专业的交友资料分析师。请分析用户上传的交友资料截图，并提供详细的评分和建议。

请严格按照以下JSON格式返回分析结果，不要添加任何其他文字：
{
  "score": 7.5,
  "category": "很有吸引力",
  "suggestions": {
    "photos": ["建议1", "建议2", "建议3"],
    "bio": ["建议1", "建议2", "建议3"],
    "overall": ["建议1", "建议2", "建议3"]
  },
  "strengths": ["优势1", "优势2", "优势3"],
  "improvements": ["改进点1", "改进点2", "改进点3"]
}

评分标准：
- 9-10分：极具吸引力，资料非常完美
- 8-8.9分：非常有吸引力，资料很优秀
- 7-7.9分：很有吸引力，资料不错
- 6-6.9分：有吸引力，有改进空间
- 5-5.9分：一般，需要较多改进
- 4分以下：需要大幅改进

请仔细分析照片质量、个人简介、整体呈现等方面，提供具体可行的建议。只返回JSON，不要其他内容。`
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
    const file = formData.get('file') as File;
    const stream = req.nextUrl.searchParams.get('stream') === 'true';
    
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
    
    // const modelName = "gemini-2.5-pro-preview-06-05"
    const modelName = "gpt-4o"

    // 流式响应
    if (stream) {
      const encoder = new TextEncoder();
      
      const readable = new ReadableStream({
        async start(controller) {
          try {
            // 使用OpenAI进行流式图像分析
            const stream = await getOpenAIClient().chat.completions.create({
              model: modelName,
              messages: [
                {
                  role: 'system',
                  content: getStreamSystemPrompt(locale)
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: getUserContentText(locale)
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: dataUrl
                      }
                    }
                  ]
                }
              ],
              temperature: 0.7,
              max_tokens: 1500, // 降低max_tokens避免社区讨论中提到的问题
              stream: true,
            });

            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                // 发送内容块
                const data = `0:${content}\n`;
                controller.enqueue(encoder.encode(data));
              }
            }
            
            controller.close();
          } catch (error) {
            console.error("流式分析错误:", error);
            const errorMessage = locale === 'zh' ? "分析过程中发生错误" : "Error occurred during analysis";
            const errorData = `error:${errorMessage}\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        }
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    }
    
    // 非流式响应 - 改进错误处理
    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: modelName,
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
                type: 'image_url',
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 1500, // 降低max_tokens避免社区讨论中提到的问题
      });

      const result = response.choices[0].message.content;
      
      if (!result) {
        const errorMessage = locale === 'zh' ? "AI 分析失败，请重试" : "AI analysis failed, please try again";
        return respErr(errorMessage);
      }

      // 检查返回内容是否包含错误信息
      if (result.includes('error') || result.includes('Error') || result.includes('failed')) {
        console.error('OpenAI返回错误信息:', result);
        const errorMessage = locale === 'zh' 
          ? "AI分析过程中遇到问题，请稍后重试"
          : "AI analysis encountered issues, please try again later";
        return respErr(errorMessage);
      }

      // 清理AI返回的内容，移除可能的markdown代码块标记
      let cleanedResult = result.trim();
      
      // 移除开头的 ```json 或 ``` 标记
      if (cleanedResult.startsWith('```json')) {
        cleanedResult = cleanedResult.replace(/^```json\s*/, '');
      } else if (cleanedResult.startsWith('```')) {
        cleanedResult = cleanedResult.replace(/^```\s*/, '');
      }
      
      // 移除结尾的 ``` 标记
      if (cleanedResult.endsWith('```')) {
        cleanedResult = cleanedResult.replace(/\s*```$/, '');
      }
      
      // 再次trim，确保没有多余的空白字符
      cleanedResult = cleanedResult.trim();

      // 验证是否是有效的JSON格式
      if (!cleanedResult.startsWith('{') || !cleanedResult.endsWith('}')) {
        console.error('OpenAI返回的不是有效JSON格式:', cleanedResult);
        const errorMessage = locale === 'zh' 
          ? "AI返回格式异常，请重试" 
          : "AI response format error, please try again";
        return respErr(errorMessage);
      }

      // 解析AI返回的JSON结果
      try {
        const analysisResult = JSON.parse(cleanedResult);
        
        // 验证必要字段是否存在
        if (!analysisResult.score || !analysisResult.category || !analysisResult.suggestions) {
          console.error('OpenAI返回的JSON缺少必要字段:', analysisResult);
          const errorMessage = locale === 'zh' 
            ? "AI分析结果格式不完整，请重试" 
            : "AI analysis result format incomplete, please try again";
          return respErr(errorMessage);
        }
        
        return respData(analysisResult);
      } catch (parseError) {
        console.error('JSON解析失败:', parseError);
        console.log('AI原始返回:', result);
        console.log('清理后的内容:', cleanedResult);
        
        // 根据社区讨论，这种错误通常是由于响应被截断导致的
        if (parseError instanceof SyntaxError && parseError.message.includes('JSON')) {
          const errorMessage = locale === 'zh' 
            ? "AI响应被截断，请稍后重试或尝试上传更小的图片" 
            : "AI response was truncated, please try again later or upload smaller images";
          return respErr(errorMessage);
        }
        
        const errorMessage = locale === 'zh' 
          ? "AI分析结果解析失败，请重试" 
          : "Failed to parse AI analysis result, please try again";
        return respErr(errorMessage);
      }
      
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
        } else if (errorMessage.includes('model') || errorMessage.includes('not found')) {
          const message = locale === 'zh' 
            ? "模型配置错误，请联系管理员" 
            : "Model configuration error, please contact administrator";
          return respErr(message);
        } else if (errorMessage.includes('string did not match') || errorMessage.includes('expected pattern')) {
          const message = locale === 'zh' 
            ? "API配置格式错误，请检查环境变量设置" 
            : "API configuration format error, please check environment variables";
          return respErr(message);
        } else if (errorMessage.includes('context_length_exceeded')) {
          const message = locale === 'zh' 
            ? "图片过大，请上传更小的图片" 
            : "Image too large, please upload smaller images";
          return respErr(message);
        }
      }
      
      const errorMessage = locale === 'zh' 
        ? "AI服务暂时不可用，请稍后重试" 
        : "AI service temporarily unavailable, please try again later";
      return respErr(errorMessage);
    }
    
  } catch (error) {
    console.error("分析API错误:", error);
    const errorMessage = req.headers.get('accept-language')?.includes('zh') 
      ? "分析过程中发生错误，请稍后重试" 
      : "Error occurred during analysis, please try again later";
    return respErr(errorMessage);
  }
}

// 健康检查端点
export async function GET() {
  return respData({ 
    status: "healthy", 
    service: "lucylucy-analyze-api",
    version: "3.0.0",
    features: ["openai-vision", "real-ai-analysis", "streaming-support", "multilingual-support"],
    supportedLocales: ["en", "zh"]
  });
} 