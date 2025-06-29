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
          ? `请分析这${files.length}张照片中的人物，基于他们的外貌、穿着、风格、兴趣爱好和个性特征，生成5组不同风格的个性化聊天开场白。这些开场白应该能够提升交友成功率、增加好感度和兴趣度。`
          : `Please analyze the person(s) in these ${files.length} photo(s), and based on their appearance, clothing, style, interests, and personality traits, generate 5 different styles of personalized conversation starters that would increase dating success rate, likability, and interest.`
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
      ? `你是一个恋爱教练，名叫 Lucy。
你能根据用户提交所匹配对象的资料页和照片信息，针对性生成不同风格的开场白，帮助他们提升回复率。

你需要一步步详细展示你的分析思考过程，这样可以提升专业性和可信度，包括：
• 对对方兴趣爱好和性格的判断
• 对三观和感情观的判断
• 可能喜欢什么类型的人
• 你的对话策略和写作思路

然后给出5组不同风格的高回复率开场白。

开场白要求：
• 语气自然随意，接近真实对话
• 内容简短，避免过长
• 不要使用引号

请按照以下JSON格式返回结果，注意只返回JSON内容，不要使用markdown代码块：
{
  "analysis": "这里是完整的分析思考过程",
  "starters": ["开场白1", "开场白2", "开场白3", "开场白4", "开场白5"]
}`
      : `You are a dating coach named Lucy.
You can generate targeted conversation starters in different styles based on the profile and photos of the person the user wants to match with, helping them improve response rates.

You need to show your detailed analysis and thinking process step by step to enhance professionalism and credibility, including:
• Judgment on the person's interests and personality
• Assessment of their values and relationship views
• What type of person they might like
• Your conversation strategy and writing approach

Then provide 5 different styles of high-response-rate conversation starters.

Conversation starter requirements:
• Natural and casual tone, close to real conversation
• Keep content brief, avoid being too lengthy
• Do not use quotation marks

Please return the result in the following JSON format, only return JSON content without markdown code blocks:
{
  "analysis": "Complete analysis and thinking process here",
  "starters": ["starter1", "starter2", "starter3", "starter4", "starter5"]
}`;

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
        response_format: { type: "json_object" },
      });

      const result = response.choices[0].message.content;
      
      if (!result) {
        return respErr("AI 分析失败，请重试");
      }

      // 解析JSON响应
      let parsedResult;
      try {
        // 尝试直接解析JSON
        parsedResult = JSON.parse(result);
      } catch (parseError) {
        console.error("直接JSON解析失败，尝试提取JSON内容:", parseError);
        console.log("原始响应内容:", result);
        
        // 尝试从markdown代码块中提取JSON
        let jsonContent = result;
        
        // 移除可能的markdown代码块标记
        jsonContent = jsonContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '');
        jsonContent = jsonContent.replace(/```\s*/gi, '');
        
        // 尝试找到JSON对象的开始和结束
        const jsonStart = jsonContent.indexOf('{');
        const jsonEnd = jsonContent.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
          
          try {
            parsedResult = JSON.parse(jsonContent);
            console.log("成功从文本中提取JSON");
          } catch (secondError) {
            console.error("提取JSON失败:", secondError);
            console.log("提取的内容:", jsonContent);
            return respErr("AI响应格式错误，请重试");
          }
        } else {
          console.error("未找到有效的JSON结构");
          return respErr("AI响应格式错误，请重试");
        }
      }

      // 验证响应结构
      if (!parsedResult.analysis || !Array.isArray(parsedResult.starters)) {
        return respErr("AI响应结构不完整，请重试");
      }

      const { analysis, starters } = parsedResult;

      if (starters.length === 0) {
        return respErr("未能生成有效的开场白，请重试");
      }

      return respData({
        success: true,
        analysis,
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