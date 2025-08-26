import { NextRequest } from "next/server";
import { newStorage } from "@/lib/storage";
import { respData, respErr } from "@/lib/resp";
import { getUuid } from "@/lib/hash";

// 支持的文件类型
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
// 最大文件大小 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// 最大上传文件数量
const MAX_FILES_COUNT = 10;

export async function POST(req: NextRequest) {
  try {
    console.log('=== 图片上传 API 开始 ===');
    
    const formData = await req.formData();
    const prefix = formData.get('prefix') as string || 'call-lucy';
    
    // 获取文件 - 支持单文件和多文件
    const files: File[] = [];
    
    // 尝试获取单个文件 (向后兼容)
    const singleFile = formData.get('file') as File;
    if (singleFile) {
      files.push(singleFile);
    }
    
    // 尝试获取多个文件
    const multipleFiles = formData.getAll('files') as File[];
    if (multipleFiles.length > 0) {
      files.push(...multipleFiles.filter(f => f instanceof File));
    }
    
    console.log('接收到文件:', {
      count: files.length,
      files: files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      })),
      prefix
    });
    
    if (files.length === 0) {
      console.error('没有接收到文件');
      return respErr("请选择要上传的图片文件");
    }

    // 验证文件数量
    if (files.length > MAX_FILES_COUNT) {
      console.error('文件数量过多:', files.length);
      return respErr(`最多只能上传 ${MAX_FILES_COUNT} 个文件`);
    }

    // 批量验证文件
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 验证文件类型
      if (!ALLOWED_TYPES.includes(file.type)) {
        console.error(`文件 ${i + 1} 类型不支持:`, file.type);
        return respErr(`文件 "${file.name}" 格式不支持，仅支持 JPG、PNG、WEBP 格式的图片`);
      }

      // 验证文件大小
      if (file.size > MAX_FILE_SIZE) {
        console.error(`文件 ${i + 1} 太大:`, file.size);
        return respErr(`文件 "${file.name}" 大小不能超过10MB`);
      }
    }

    // 检查存储环境变量
    const requiredEnvs = ['STORAGE_ENDPOINT', 'STORAGE_ACCESS_KEY', 'STORAGE_SECRET_KEY', 'STORAGE_BUCKET'];
    const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
    
    if (missingEnvs.length > 0) {
      console.error('缺少存储环境变量:', missingEnvs);
      return respErr(`存储配置错误，缺少环境变量: ${missingEnvs.join(', ')}`);
    }

    console.log('存储配置检查通过');

    // 创建存储实例
    const storage = newStorage();
    
    // 并发上传所有文件
    console.log('开始批量上传文件...');
    const uploadPromises = files.map(async (file, index) => {
      try {
        // 生成唯一文件名
        const uuid = getUuid();
        const fileExtension = file.type.split('/')[1];
        const filename = `${prefix}_${uuid}.${fileExtension}`;
        const key = `images/${filename}`;
        
        console.log(`文件 ${index + 1} 生成信息:`, { uuid, filename, key, fileExtension });
        
        // 将文件转换为 Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log(`文件 ${index + 1} 转换完成，Buffer 大小:`, buffer.length);
        
        // 上传到存储服务
        console.log(`开始上传文件 ${index + 1} 到存储服务...`);
        const uploadResult = await storage.uploadFile({
          body: buffer,
          key,
          contentType: file.type,
          disposition: "inline",
        });

        console.log(`文件 ${index + 1} 上传成功:`, uploadResult);

        return {
          success: true,
          data: {
            url: uploadResult.url,
            filename: uploadResult.filename,
            key: uploadResult.key,
            size: file.size,
            type: file.type,
            originalName: file.name
          }
        };
      } catch (error) {
        console.error(`文件 ${index + 1} 上传失败:`, error);
        return {
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
          originalName: file.name
        };
      }
    });

    // 等待所有上传完成
    const uploadResults = await Promise.all(uploadPromises);
    
    // 分离成功和失败的结果
    const successResults = uploadResults.filter(r => r.success).map(r => r.data);
    const failedResults = uploadResults.filter(r => !r.success);
    
    console.log('批量上传完成:', {
      total: files.length,
      success: successResults.length,
      failed: failedResults.length
    });

    // 如果是单文件上传且成功，保持原有格式 (向后兼容)
    if (files.length === 1 && successResults.length === 1) {
      return respData(successResults[0]);
    }

    // 多文件上传结果格式
    const result = {
      total: files.length,
      success: successResults.length,
      failed: failedResults.length,
      results: successResults,
      errors: failedResults.map(r => ({
        originalName: r.originalName,
        error: r.error
      }))
    };

    console.log('返回批量上传结果:', result);
    
    // 如果有文件上传失败，但也有成功的，返回部分成功结果
    if (failedResults.length > 0 && successResults.length > 0) {
      return respData({
        ...result,
        message: `部分文件上传成功：${successResults.length}/${files.length}`
      });
    }
    
    // 如果全部失败
    if (successResults.length === 0) {
      return respErr(`所有文件上传失败：${failedResults.map(f => f.originalName).join(', ')}`);
    }
    
    // 全部成功
    return respData({
      ...result,
      message: `所有文件上传成功：${successResults.length}/${files.length}`
    });

  } catch (error) {
    console.error('图片上传 API 错误:', error);
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
    
    // 返回更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return respErr(`图片上传失败: ${errorMessage}`);
  }
} 