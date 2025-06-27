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
const MAX_FILES = 5;

// 多语言提示词配置
const getSystemPrompt = (locale: string = 'en'): string => {
  const prompts = {
    en: `You are a professional dating profile analyst. You need to analyze the user's multiple dating profile images and provide comprehensive scoring and suggestions.

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

Analysis Focus:
1. Overall coordination and consistency of multiple images
2. Display effects from different angles and scenes
3. Technical aspects like photo quality, composition, lighting
4. Diversity of personal image presentation
5. Overall impression and attractiveness

Scoring Criteria:
- 9-10 points: Extremely attractive, multiple images perfectly showcase personal charm
- 8-8.9 points: Very attractive, excellent image combination
- 7-7.9 points: Very attractive, good image pairing
- 6-6.9 points: Attractive, room for improvement in image combination
- 5-5.9 points: Average, needs considerable improvement
- Below 4 points: Needs significant improvement

Please carefully analyze the combination effects of multiple photos, overall presentation, and provide specific actionable suggestions. Return only JSON, no other content.`,

    zh: `你是一个专业的交友资料分析师。现在需要分析用户上传的多张交友资料图片，并提供综合的评分和建议。

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

分析重点：
1. 多图片的整体协调性和一致性
2. 不同角度和场景的展示效果
3. 照片质量、构图、光线等技术层面
4. 个人形象的多样性展示
5. 整体给人的印象和吸引力

评分标准：
- 9-10分：极具吸引力，多张图片完美展示个人魅力
- 8-8.9分：非常有吸引力，图片组合很优秀
- 7-7.9分：很有吸引力，图片搭配不错
- 6-6.9分：有吸引力，图片组合有改进空间
- 5-5.9分：一般，需要较多改进
- 4分以下：需要大幅改进

请仔细分析多张照片的组合效果、整体呈现等方面，提供具体可行的建议。只返回JSON，不要其他内容。`
  };

  return prompts[locale as keyof typeof prompts] || prompts.en;
};

// 获取用户内容提示的多语言版本
const getUserContentText = (locale: string = 'en', fileCount: number): string => {
  const texts = {
    en: `Please analyze these ${fileCount} dating profile images and provide comprehensive scoring and improvement suggestions. Note that this is a comprehensive analysis of multiple images, considering overall coordination and completeness:`,
    zh: `请分析这${fileCount}张交友资料图片，给出综合的评分和改进建议。请注意这是多张图片的综合分析，需要考虑整体的协调性和完整性：`
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
    const fileCount = parseInt(formData.get('fileCount') as string || '0');
    
    // 获取语言参数，默认为英文
    const locale = (formData.get('locale') as string) || 'en';
    
    if (fileCount === 0) {
      const errorMessage = locale === 'zh' ? "请上传至少一张图片" : "Please upload at least one image";
      return respErr(errorMessage);
    }

    if (fileCount > MAX_FILES) {
      const errorMessage = locale === 'zh' 
        ? `最多只能上传${MAX_FILES}张图片` 
        : `Maximum ${MAX_FILES} images allowed`;
      return respErr(errorMessage);
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
        return respErr(errorMessage);
      }

      // 验证文件大小
      if (file.size > MAX_FILE_SIZE) {
        const errorMessage = locale === 'zh' 
          ? `图片 ${i + 1} 大小超过10MB限制`
          : `Image ${i + 1} size exceeds 10MB limit`;
        return respErr(errorMessage);
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
      return respErr(errorMessage);
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
            content: userContent
          }
        ],
        temperature: 0.3,
        max_tokens: 2000, // 多图片分析需要更多tokens
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
            ? "图片过多或过大，请减少图片数量或尺寸" 
            : "Too many or too large images, please reduce image count or size";
          return respErr(message);
        }
      }
      
      const errorMessage = locale === 'zh' 
        ? "AI服务暂时不可用，请稍后重试" 
        : "AI service temporarily unavailable, please try again later";
      return respErr(errorMessage);
    }
    
  } catch (error) {
    console.error("多图片分析API错误:", error);
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
    service: "lucylucy-analyze-multiple-api",
    version: "1.0.0",
    features: ["multi-image-analysis", "openai-vision", "up-to-5-images", "multilingual-support"],
    supportedLocales: ["en", "zh"],
    maxFiles: MAX_FILES
  });
} 