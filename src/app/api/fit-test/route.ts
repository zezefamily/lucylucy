import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import OpenAI from "openai";
import { getUserUuid } from "@/services/user";
import { CreditsAmount, CreditsTransType, decreaseCredits } from "@/services/credit";

// Next.js API路由配置
export const runtime = 'nodejs';
export const maxDuration = 300; // 5分钟超时

// 四个维度评分接口
interface FourDimensionsScore {
  vibes: number; // 氛围匹配度 (0-100)
  interests: number; // 兴趣匹配度 (0-100)
  personality: number; // 性格匹配度 (0-100)
  intent: number; // 意图匹配度 (0-100)
}

// 灵魂契合度测试结果接口（新格式）
interface SoulMatchResult {
  // 总体评分
  overallScore: number; // 总体契合度评分 (0-100)
  oneSentenceSummary: string; // 一句话概要
  
  // 四个维度
  fourDimensions: FourDimensionsScore;
  
  // 绿旗（积极因素）
  greenFlags: string[]; // 至少2-3个积极的配对点
  
  // 红旗（潜在问题）
  redFlags: string[]; // 至少2-3个潜在问题或不匹配
  
  // 最终建议
  finalAdvice: string[]; // 2-3个具体建议
}

// 图片数量限制
const MAX_PROFILE_IMAGES = 8; // 每个人最多8张资料截图
const MAX_CHAT_HISTORY_LENGTH = 5000; // 聊天记录最大5000字符

// 解析JSON请求体的安全包装函数
async function safeParseJSON(req: NextRequest) {
  try {
    // 检查Content-Length头部
    const contentLength = req.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      const maxSize = 10 * 1024 * 1024; // 10MB总限制
      if (size > maxSize) {
        throw new Error('Request too large');
      }
    }
    
    return await req.json();
  } catch (error) {
    console.error('JSON解析错误:', error);
    throw error;
  }
}

// 多语言提示词配置 - SoulMatch AI配对分析专用（基于图片）
const getSystemPrompt = (locale: string = 'en'): string => {
  const prompts = {
    en: `You are SoulMatch AI, an AI dating compatibility coach.
Analyze the compatibility between two people based on their dating profile images (and optional chat history).
Always output in the following structured format.

Input Data
- Person 1: Multiple profile images showing their dating profile screenshots
- Person 2: Multiple profile images showing their dating profile screenshots
- Chat history (optional): {{chat_history}}

IMPORTANT: Carefully analyze all the images to extract information about each person including:
- Profile text content, bio, interests, lifestyle
- Photos they've shared and what they reveal about personality
- Any visible preferences, values, or relationship goals
- Overall presentation style and authenticity

---

Output Format

🏆 Overall Score
- Compatibility Score: X / 100
- One-sentence summary: "{{一句话概要}}"

🔢 Four Dimensions
- Vibes ✨ : X / 100 (overall energy, authenticity, appeal)
- Interests 🎯 : X / 100 (shared hobbies, activities, lifestyle)
- Personality 💬 : X / 100 (communication style, humor, depth)
- Intent 🧭 : X / 100 (relationship goals, commitment level)

✅ Green Flags
- List at least 2–3 positive compatibility points based on profile analysis
- Can include shared interests, complementary personalities, similar values

⚠️ Red Flags
- List at least 2–3 potential issues or mismatches
- Can include different relationship goals, lifestyle mismatches, value conflicts

💡 Final Advice
- Give 2–3 concrete suggestions for this specific pairing

---

Rules
- Analyze ALL profile images carefully to understand each person
- If chat history is provided → include communication patterns in analysis
- If chat history is missing → focus on profile content and presentation
- Keep tone: playful, light, a bit like a personality test
- Use emojis to highlight (✅ / ⚠️ / 💡)

Please return the analysis results strictly in the following JSON format, without adding any other text:
{
  "overallScore": 85,
  "oneSentenceSummary": "Great potential match with shared values and complementary personalities!",
  "fourDimensions": {
    "vibes": 88,
    "interests": 75,
    "personality": 90,
    "intent": 85
  },
  "greenFlags": [
    "Both show genuine interests in outdoor activities and travel",
    "Similar sense of humor evident in their profile descriptions",
    "Both seeking serious relationships with clear intentions"
  ],
  "redFlags": [
    "Different social energy levels might cause friction",
    "Potential mismatch in lifestyle preferences",
    "Need to clarify long-term relationship timeline"
  ],
  "finalAdvice": [
    "Start with an activity-based date related to shared interests",
    "Discuss relationship expectations early to ensure alignment",
    "Focus on building friendship foundation before romance"
  ]
}

Return only JSON, no other content.`,

    zh: `你是SoulMatch AI，一位AI恋爱契合度教练。
基于两个人的交友资料图片（和可选的聊天记录）分析他们之间的契合度。
始终按照以下结构化格式输出。

输入数据
- 人物1：多张显示其交友资料截图的图片
- 人物2：多张显示其交友资料截图的图片
- 聊天记录（可选）：{{chat_history}}

重要提醒：仔细分析所有图片以提取每个人的信息，包括：
- 资料文本内容、个人简介、兴趣、生活方式
- 他们分享的照片以及这些照片透露的性格特质
- 任何可见的偏好、价值观或恋爱目标
- 整体展示风格和真实性

---

输出格式

🏆 总体评分
- 契合度评分：X / 100
- 一句话概要："{{一句话概要}}"

🔢 四个维度
- 氛围 ✨ ：X / 100（整体能量、真实性、吸引力）
- 兴趣 🎯 ：X / 100（共同爱好、活动、生活方式）
- 性格 💬 ：X / 100（沟通方式、幽默感、深度）
- 意图 🧭 ：X / 100（恋爱目标、承诺水平）

✅ 绿旗
- 基于资料分析列出至少2-3个积极的契合点
- 可以包括共同兴趣、互补性格、相似价值观

⚠️ 红旗
- 列出至少2-3个潜在问题或不匹配
- 可以包括不同的恋爱目标、生活方式不匹配、价值观冲突

💡 最终建议
- 针对这对特定配对给出2-3个具体建议

---

规则
- 仔细分析所有资料图片以了解每个人
- 如果提供了聊天记录 → 在分析中包含沟通模式
- 如果缺少聊天记录 → 专注于资料内容和展示方式
- 保持语调：有趣、轻松，有点像性格测试
- 使用表情符号突出显示（✅ / ⚠️ / 💡）

请严格按照以下JSON格式返回分析结果，不要添加任何其他文字：
{
  "overallScore": 85,
  "oneSentenceSummary": "很有潜力的配对，有共同价值观和互补性格！",
  "fourDimensions": {
    "vibes": 88,
    "interests": 75,
    "personality": 90,
    "intent": 85
  },
  "greenFlags": [
    "两人都展现出对户外活动和旅行的真正兴趣",
    "在资料描述中表现出相似的幽默感",
    "都在寻求认真的恋爱关系，意图明确"
  ],
  "redFlags": [
    "不同的社交能量水平可能会造成摩擦",
    "生活方式偏好可能不匹配",
    "需要澄清长期恋爱时间线"
  ],
  "finalAdvice": [
    "从与共同兴趣相关的活动约会开始",
    "早期讨论恋爱期望以确保一致性",
    "专注于建立友谊基础再发展浪漫关系"
  ]
}

只返回JSON，不要其他内容。`
  };

  return prompts[locale as keyof typeof prompts] || prompts.en;
};

// 获取用户内容提示的多语言版本
const getUserContentText = (locale: string = 'en', profile1Images: string[], profile2Images: string[], chatHistory?: string): string => {
  const texts = {
    en: `Please analyze the compatibility between these two people as SoulMatch AI based on their dating profile screenshots.

Person 1 has ${profile1Images.length} profile image(s)
Person 2 has ${profile2Images.length} profile image(s)

${chatHistory ? `Chat History: ${chatHistory}` : 'Chat History: Not provided'}

IMPORTANT: Analyze the content, text, and visual elements in all the profile images to understand each person's personality, interests, lifestyle, and dating intentions.

Please provide a comprehensive compatibility analysis following the SoulMatch AI format with:
1. Overall compatibility score (0-100)
2. Four dimensions scoring (Vibes, Interests, Personality, Intent)
3. Green flags (positive compatibility points)
4. Red flags (potential issues or mismatches)
5. Final advice (concrete suggestions)

Note: Keep the tone playful and light, like a personality test. Use the provided format exactly.`,
    zh: `请作为SoulMatch AI基于交友资料截图分析这两个人之间的契合度。

人物1有${profile1Images.length}张资料图片
人物2有${profile2Images.length}张资料图片

${chatHistory ? `聊天记录：${chatHistory}` : '聊天记录：未提供'}

重要提醒：分析所有资料图片中的内容、文字和视觉元素，理解每个人的性格、兴趣、生活方式和恋爱意图。

请按照SoulMatch AI格式提供全面的契合度分析：
1. 总体契合度评分（0-100）
2. 四个维度评分（氛围、兴趣、性格、意图）
3. 绿旗（积极的契合点）
4. 红旗（潜在问题或不匹配）
5. 最终建议（具体建议）

注意：保持有趣轻松的语调，像性格测试一样。严格按照提供的格式。`
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
    const requestData = await safeParseJSON(req);
    
    // 获取语言参数，默认为英文
    const locale = requestData.locale || 'en';
    const profile1 = requestData.profile1;
    const profile2 = requestData.profile2;
    const chatHistory = requestData.chatHistory;
    
    // 验证必需参数
    if (!profile1 || !profile2 || !Array.isArray(profile1) || !Array.isArray(profile2)) {
      const errorMessage = locale === 'zh' ? "请提供两个人的资料图片URL数组" : "Please provide both profile1 and profile2 as image URL arrays";
      return respErr(errorMessage);
    }

    // 验证图片数量
    if (profile1.length === 0 || profile1.length > MAX_PROFILE_IMAGES) {
      const errorMessage = locale === 'zh' 
        ? `资料1图片数量应在1-${MAX_PROFILE_IMAGES}张之间`
        : `Profile1 should have 1-${MAX_PROFILE_IMAGES} images`;
      return respErr(errorMessage);
    }

    if (profile2.length === 0 || profile2.length > MAX_PROFILE_IMAGES) {
      const errorMessage = locale === 'zh' 
        ? `资料2图片数量应在1-${MAX_PROFILE_IMAGES}张之间`
        : `Profile2 should have 1-${MAX_PROFILE_IMAGES} images`;
      return respErr(errorMessage);
    }

    // 验证URL格式
    const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i;
    const allUrls = [...profile1, ...profile2];
    for (const url of allUrls) {
      if (typeof url !== 'string' || !urlPattern.test(url)) {
        const errorMessage = locale === 'zh' 
          ? "图片URL格式不正确，请提供有效的图片链接" 
          : "Invalid image URL format, please provide valid image links";
        return respErr(errorMessage);
      }
    }

    if (chatHistory && chatHistory.length > MAX_CHAT_HISTORY_LENGTH) {
      const errorMessage = locale === 'zh' 
        ? `聊天记录长度超过${MAX_CHAT_HISTORY_LENGTH}字符限制`
        : `Chat history length exceeds ${MAX_CHAT_HISTORY_LENGTH} character limit`;
      return respErr(errorMessage);
    }

    const modelName = "gpt-4o-mini";

    // 构建消息内容
    const userContent: any[] = [
      {
        type: 'text',
        text: getUserContentText(locale, profile1, profile2, chatHistory)
      }
    ];

    // 添加第一个人的资料图片
    userContent.push({
      type: 'text',
      text: locale === 'zh' ? '人物1的资料图片：' : 'Person 1 Profile Images:'
    });
    
    profile1.forEach((imageUrl, index) => {
      userContent.push({
        type: 'text',
        text: locale === 'zh' ? `图片 ${index + 1}:` : `Image ${index + 1}:`
      });
      userContent.push({
        type: 'image_url',
        image_url: {
          url: imageUrl
        }
      });
    });

    // 添加第二个人的资料图片
    userContent.push({
      type: 'text',
      text: locale === 'zh' ? '人物2的资料图片：' : 'Person 2 Profile Images:'
    });
    
    profile2.forEach((imageUrl, index) => {
      userContent.push({
        type: 'text',
        text: locale === 'zh' ? `图片 ${index + 1}:` : `Image ${index + 1}:`
      });
      userContent.push({
        type: 'image_url',
        image_url: {
          url: imageUrl
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
        max_tokens: 2500, // SoulMatch分析需要足够的tokens
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
        const soulMatchResult = JSON.parse(cleanedResult);
        
        // 验证必要字段是否存在
        if (!soulMatchResult.overallScore || 
            !soulMatchResult.oneSentenceSummary || 
            !soulMatchResult.fourDimensions || 
            !soulMatchResult.greenFlags || 
            !soulMatchResult.redFlags ||
            !soulMatchResult.finalAdvice) {
          console.error('OpenAI返回的JSON缺少必要字段:', soulMatchResult);
          const errorMessage = locale === 'zh' 
            ? "AI分析结果格式不完整，请重试" 
            : "AI analysis result format incomplete, please try again";
          return respErr(errorMessage);
        }
        
        // 成功分析后，核销积分
        // try {
        //   const user_uuid = await getUserUuid();
        //   if (user_uuid) {
        //     await decreaseCredits({
        //       user_uuid,
        //       trans_type: CreditsTransType.Ping,
        //       credits: CreditsAmount.PingCost,
        //     });
        //     console.log('积分扣减成功 - 灵魂契合度测试');
        //   } else {
        //     console.warn('用户未登录，跳过积分扣减');
        //   }
        // } catch (creditError) {
        //   console.error('积分扣减过程出错:', creditError);
        //   // 不影响主流程，继续返回结果
        // }
        
        return respData(soulMatchResult);
      } catch (parseError) {
        console.error('JSON解析失败:', parseError);
        console.log('AI原始返回:', result);
        console.log('清理后的内容:', cleanedResult);
        
        // 根据社区讨论，这种错误通常是由于响应被截断导致的
        if (parseError instanceof SyntaxError && parseError.message.includes('JSON')) {
          const errorMessage = locale === 'zh' 
            ? "AI响应被截断，请稍后重试或缩短输入内容" 
            : "AI response was truncated, please try again later or shorten input content";
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
            ? "输入内容过长，请缩短资料或聊天记录" 
            : "Input content too long, please shorten profiles or chat history";
          return respErr(message);
        }
      }
      
      const errorMessage = locale === 'zh' 
        ? "AI服务暂时不可用，请稍后重试" 
        : "AI service temporarily unavailable, please try again later";
      return respErr(errorMessage);
    }
    
  } catch (error) {
    console.error("SoulMatch AI配对分析API错误:", error);
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
    service: "lucylucy-soulmatch-ai-api",
    version: "2.0.0",
    features: ["soulmatch-compatibility-analysis", "four-dimensions-scoring", "personality-matching", "multilingual-support", "profile-image-analysis"],
    supportedLocales: ["en", "zh"],
    inputLimits: {
      maxProfileImages: MAX_PROFILE_IMAGES,
      maxChatHistoryLength: MAX_CHAT_HISTORY_LENGTH
    },
    supportedImageFormats: ["jpg", "jpeg", "png", "webp"],
    analysisTypes: ["vibes", "interests", "personality", "intent"],
    outputFormat: ["overall-score", "four-dimensions", "green-flags", "red-flags", "final-advice"]
  });
}
