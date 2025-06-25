import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// 标准 OpenAI 配置
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? '',
  baseURL: process.env.OPENAI_BASE_URL, // 可选，如果不设置则使用默认值
});

// 如果你需要使用兼容的 OpenAI API 服务
export const customOpenAI = createOpenAICompatible({
  name: 'custom-openai',
  apiKey: process.env.OPENAI_API_KEY ?? '',
  baseURL: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
});

// 配置验证函数
export function validateOpenAIConfig() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY 环境变量未设置');
  }
  
  console.log('OpenAI 配置已加载:', {
    hasApiKey: !!process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL || '默认 (https://api.openai.com/v1)',
  });
} 