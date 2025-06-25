import { NextRequest } from "next/server";
import { respErr } from "@/lib/resp";
import { openai } from "@/lib/openai-config";
import { streamText } from "ai";

// 文件类型验证
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
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
    
    // 使用OpenAI进行流式图像分析
    const result = await streamText({
      model: openai('gpt-4o'),
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
    return respErr("分析过程中发生错误，请稍后重试");
  }
} 