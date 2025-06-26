import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// 创建 OpenAI 客户端的函数
export function getOpenAI() {
  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? '',
    baseURL: process.env.OPENAI_BASE_URL, // 可选，如果不设置则使用默认值
  });
}

// 获取自定义 OpenAI 客户端的函数
export function getCustomOpenAI() {
  return createOpenAICompatible({
    name: 'custom-openai',
    apiKey: process.env.OPENAI_API_KEY ?? '',
    baseURL: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  });
}

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