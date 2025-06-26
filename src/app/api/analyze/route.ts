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
    
    if (!file) {
      return respErr("请上传图片文件");
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return respErr("仅支持 JPG、PNG、WEBP 格式的图片");
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return respErr("文件大小不能超过10MB");
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
                  content: `你是一个专业的交友资料分析师。请分析用户上传的交友资料截图，并提供详细的评分和建议。

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
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: '请分析这个交友资料截图，给出详细的评分和改进建议：'
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
              max_tokens: 2000,
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
            const errorData = `error:分析过程中发生错误\n`;
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
    
    // 非流式响应（保持原有功能）
    const response = await getOpenAIClient().chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: `你是一个专业的交友资料分析师。请分析用户上传的交友资料截图，并提供详细的评分和建议。

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
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请分析这个交友资料截图，给出详细的评分和改进建议：'
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
      max_tokens: 2000,
    });

    const result = response.choices[0].message.content;
    
    if (!result) {
      return respErr("AI 分析失败，请重试");
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

    // 解析AI返回的JSON结果
    try {
      const analysisResult = JSON.parse(cleanedResult);
      return respData(analysisResult);
    } catch (parseError) {
      console.error('解析AI结果失败:', parseError);
      console.log('AI原始返回:', result);
      console.log('清理后的内容:', cleanedResult);
      return respErr("AI分析结果解析失败，请重试");
    }
    
  } catch (error) {
    console.error("分析API错误:", error);
    return respErr("分析过程中发生错误，请稍后重试");
  }
}

// 健康检查端点
export async function GET() {
  return respData({ 
    status: "healthy", 
    service: "lucylucy-analyze-api",
    version: "3.0.0",
    features: ["openai-vision", "real-ai-analysis", "streaming-support"]
  });
} 