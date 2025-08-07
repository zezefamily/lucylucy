import { NextRequest } from "next/server";
import { newStorage } from "@/lib/storage";
import { respData, respErr } from "@/lib/resp";

export async function GET(req: NextRequest) {
  try {
    console.log('=== 存储配置测试 ===');
    
    // 检查环境变量
    const envVars = {
      STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT || 'MISSING',
      STORAGE_REGION: process.env.STORAGE_REGION || 'MISSING',
      STORAGE_ACCESS_KEY: process.env.STORAGE_ACCESS_KEY ? 'CONFIGURED' : 'MISSING',
      STORAGE_SECRET_KEY: process.env.STORAGE_SECRET_KEY ? 'CONFIGURED' : 'MISSING',
      STORAGE_BUCKET: process.env.STORAGE_BUCKET || 'MISSING',
      STORAGE_DOMAIN: process.env.STORAGE_DOMAIN || 'MISSING'
    };

    console.log('环境变量状态:', envVars);

    // 检查是否有缺失的必需环境变量
    const requiredEnvs = ['STORAGE_ENDPOINT', 'STORAGE_ACCESS_KEY', 'STORAGE_SECRET_KEY', 'STORAGE_BUCKET'];
    const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
    
    if (missingEnvs.length > 0) {
      return respErr(`缺少必需的环境变量: ${missingEnvs.join(', ')}`);
    }

    // 尝试创建存储实例
    try {
      const storage = newStorage();
      console.log('存储实例创建成功');
      
      return respData({
        message: '存储配置正常',
        envVars,
        status: 'OK'
      });
    } catch (storageError) {
      console.error('存储实例创建失败:', storageError);
      return respErr(`存储实例创建失败: ${storageError instanceof Error ? storageError.message : '未知错误'}`);
    }

  } catch (error) {
    console.error('存储测试错误:', error);
    return respErr(`测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
} 