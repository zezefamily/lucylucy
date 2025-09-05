import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { respData, respErr } from "@/lib/resp";
import { getUuid } from "@/lib/hash";

// 创建 OpenAI 客户端的函数
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL
  });
}

export async function POST(req: NextRequest) {
  try {
    // 解析 FormData
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return respErr("No image file provided");
    }

    // 验证文件类型
    if (!imageFile.type.startsWith('image/')) {
      return respErr("Invalid file type. Please upload an image file.");
    }

    // 验证文件大小 (例如限制为10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      return respErr("File too large. Maximum size is 10MB.");
    }

    console.log("Received image file:", {
      name: imageFile.name,
      type: imageFile.type,
      size: imageFile.size
    });

    // 将文件转换为base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:${imageFile.type};base64,${buffer.toString('base64')}`;
    
    // 生成唯一ID
    const uniqueId = getUuid();

    console.log("Image converted to base64, size:", buffer.length, "bytes");

    // AI图片生成提示词
    const basePrompt = {
      en: `Generate exactly 4 separate and distinct photos of the person in the image, optimized for use on dating apps to increase match rates. 

IMPORTANT: Please provide 4 individual photos, each as a separate image. Targeted at North American dating app users, with aesthetics aligned to local preferences. Ensure the photos closely resemble the original person, as if they were naturally taken. Use a variety of different life settings, camera perspectives, and lighting to enhance the diversity and credibility of the photos. Some photos don't need to be in ultra-high resolution—slightly lower pixel quality is fine to mimic the feel of casual smartphone photography.

Please return the results in exactly this format, with 4 different styles that you think work best for dating apps:

**Style 1: [Your chosen style name]**
![image](URL_1)

**Style 2: [Your chosen style name]**
![image](URL_2)

**Style 3: [Your chosen style name]**
![image](URL_3)

**Style 4: [Your chosen style name]**
![image](URL_4)

Choose 4 diverse and appealing styles that would maximize dating app success. Be creative with style names and variety.`,
      zh: `帮图片中的人物生成恰好4张独立且不同的照片，适合放在 dating app 上，提升匹配量。

重要：请提供4张独立的照片，每张都是单独的图片。面向北美 dating 产品的使用人群，审美要跟当地一致些。注意要跟图片本人很像，就像拍出来的一样。注意用不同的生活场景和景别和光线，提升照片的丰富度和可信度。有些图不用那么高清，可以像素稍微低一点，更接近手机拍摄的感觉。

请严格按照以下格式返回结果，使用4种你认为最适合交友软件的不同风格：

**风格1：[你选择的风格名称]**
![image](URL_1)

**风格2：[你选择的风格名称]**
![image](URL_2)

**风格3：[你选择的风格名称]**
![image](URL_3)

**风格4：[你选择的风格名称]**
![image](URL_4)

请选择4种多样化且有吸引力的风格，以最大化交友软件的成功率。在风格名称和多样性方面要有创意。`
    };

    // 使用您提供的原始提示词
    const prompt = {
      en: basePrompt.en,
      zh: basePrompt.zh
    };

    console.log("Using prompt for image generation:", prompt);

    // 使用 gemini-2.5-flash-image 模型生成图片
    const openai = getOpenAIClient();
    let generatedImages: any[] = [];
    
    try {
      console.log("Generating 4 images with gemini-2.5-flash-image");
      
      const response = await openai.chat.completions.create({
        model: "gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt.en
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        temperature: 0.8,
        max_tokens: 1000,
      });

      const result = response.choices[0].message.content;
      
      console.log("Gemini API 原始响应:", result);
      
      // 提取图片URL和对应的风格名称
      const urlMatches = result?.match(/https:\/\/[^\s\)]+\.(?:png|jpg|jpeg|webp)/gi) || [];
      
      if (urlMatches.length >= 4) {
        console.log("成功提取到4个或更多独立的图片URL:", urlMatches);
        
        // 尝试提取AI自定义的风格名称
        const styleMatches = result?.match(/\*\*(?:Style \d+|风格\d+):\s*([^\*\n]+)\*\*/gi) || [];
        console.log("提取到的风格标签:", styleMatches);
        
        // 解析风格名称
        const extractedStyles = styleMatches.map(match => {
          const styleNameMatch = match.match(/:\s*([^\*\n]+)/);
          return styleNameMatch ? styleNameMatch[1].trim().replace(/\[|\]/g, '') : '';
        });
        
        console.log("解析后的风格名称:", extractedStyles);
        
        // 创建风格条目，使用AI自定义的风格名称
        generatedImages = urlMatches.slice(0, 4).map((url, index) => ({
          style: extractedStyles[index] || `style_${index + 1}`, // 如果没有提取到风格名称，使用默认值
          styleLabel: extractedStyles[index] || `Style ${index + 1}`,
          url: url,
          index: index + 1,
          generated_content: result
        }));
        
      } else if (urlMatches.length === 1) {
        console.log("提取到1个图片URL（可能是四合一图片）:", urlMatches[0]);
        
        // 如果只有一个URL，创建4个条目都使用同一个URL（四合一图片）
        // 尝试提取AI自定义的风格名称
        const styleMatches = result?.match(/\*\*(?:Style \d+|风格\d+):\s*([^\*\n]+)\*\*/gi) || [];
        const extractedStyles = styleMatches.map(match => {
          const styleNameMatch = match.match(/:\s*([^\*\n]+)/);
          return styleNameMatch ? styleNameMatch[1].trim().replace(/\[|\]/g, '') : '';
        });
        
        generatedImages = Array.from({length: 4}, (_, index) => ({
          style: extractedStyles[index] || `style_${index + 1}`,
          styleLabel: extractedStyles[index] || `Style ${index + 1}`,
          url: urlMatches[0],
          index: index + 1,
          generated_content: result
        }));
        
      } else if (urlMatches.length > 0) {
        console.log(`提取到${urlMatches.length}个图片URL，补齐到4个:`, urlMatches);
        
        // 如果有部分URL，重复使用来补齐4个
        // 尝试提取AI自定义的风格名称
        const styleMatches = result?.match(/\*\*(?:Style \d+|风格\d+):\s*([^\*\n]+)\*\*/gi) || [];
        const extractedStyles = styleMatches.map(match => {
          const styleNameMatch = match.match(/:\s*([^\*\n]+)/);
          return styleNameMatch ? styleNameMatch[1].trim().replace(/\[|\]/g, '') : '';
        });
        
        generatedImages = Array.from({length: 4}, (_, index) => ({
          style: extractedStyles[index] || `style_${index + 1}`,
          styleLabel: extractedStyles[index] || `Style ${index + 1}`,
          url: urlMatches[index % urlMatches.length], // 循环使用已有的URL
          index: index + 1,
          generated_content: result
        }));
        
      } else {
        console.error("未在AI响应中找到任何有效的图片URL");
        console.log("完整响应内容:", result);
        throw new Error("AI未能生成有效的图片链接，请重试");
      }

      console.log("最终生成的图片数组:", generatedImages);
      
    } catch (genError) {
      console.error("Failed to generate images with gemini:", genError);
      
      // 如果AI生成失败，返回错误
      return respErr(genError instanceof Error ? genError.message : "Failed to generate images with AI model");
    }

    return respData({
      success: true,
      originalImage: {
        name: imageFile.name,
        type: imageFile.type,
        size: imageFile.size,
        base64: base64Image
      },
      generatedImages,
      taskId: uniqueId,
      message: "Images generated successfully"
    });

  } catch (error) {
    console.error("Image generation API error:", error);
    return respErr("Internal server error");
  }
}


