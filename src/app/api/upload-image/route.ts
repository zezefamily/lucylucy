import { NextRequest } from "next/server";
import { newStorage } from "@/lib/storage";
import { respData, respErr } from "@/lib/resp";
import { getUuid } from "@/lib/hash";
import sharp from 'sharp';

// 支持的文件类型
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
// 最大文件大小 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// 最大上传文件数量
const MAX_FILES_COUNT = 10;

// 使用 Sharp 进行服务端图片优化
const optimizeImageWithSharp = async (buffer: Buffer, originalType: string): Promise<{ buffer: Buffer, contentType: string, stats: any }> => {
  try {
    console.log('🔧 开始服务端图片优化...');
    
    let sharpInstance = sharp(buffer);
    
    // 获取图片信息
    const metadata = await sharpInstance.metadata();
    const originalSize = buffer.length;
    
    console.log('图片信息:', {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: originalSize
    });
    
    // 如果图片太大，进行尺寸优化
    if (metadata.width && metadata.width > 1600) {
      const ratio = 1600 / metadata.width;
      const newHeight = Math.round((metadata.height || 1600) * ratio);
      sharpInstance = sharpInstance.resize(1600, newHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
      console.log(`📏 尺寸优化: ${metadata.width}x${metadata.height} -> 1600x${newHeight}`);
    }
    
    // 应用锐化滤镜，特别针对文字边缘
    sharpInstance = sharpInstance.sharpen({
      sigma: 1.2,
      m1: 1.0,
      m2: 2.0,
      x1: 2,
      y2: 10,
      y3: 20
    });
    
    // 转换为 WebP 格式，获得更好的压缩效果 - 调整质量到75%
    const optimizedBuffer = await sharpInstance
      .webp({ 
        quality: 75,  // 从85%降到75%，更好的文件大小平衡
        effort: 4,    // 压缩努力程度
        nearLossless: false
      })
      .toBuffer();
    
    const compressionRatio = ((originalSize - optimizedBuffer.length) / originalSize * 100).toFixed(1);
    const sizeReduction = ((originalSize - optimizedBuffer.length) / 1024).toFixed(1);
    
    console.log(`✅ 服务端优化完成: ${originalSize} -> ${optimizedBuffer.length} bytes (压缩率: ${compressionRatio}%, 减少: ${sizeReduction}KB)`);
    
    return {
      buffer: optimizedBuffer,
      contentType: 'image/webp',
      stats: {
        originalSize,
        optimizedSize: optimizedBuffer.length,
        compressionRatio: parseFloat(compressionRatio),
        sizeReduction: parseFloat(sizeReduction),
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
      }
    };
    
  } catch (error) {
    console.warn('服务端优化失败，使用原图:', error);
    return {
      buffer,
      contentType: originalType,
      stats: {
        originalSize: buffer.length,
        optimizedSize: buffer.length,
        compressionRatio: 0,
        sizeReduction: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
};

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
    
    // 批量并发处理函数
    const batchProcessFiles = async (files: File[], batchSize = 4) => {
      const results = [];
      
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        console.log(`🔄 处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)} (${batch.length} 个文件)`);
        
        const batchResults = await Promise.all(
          batch.map(async (file, batchIndex) => {
            const globalIndex = i + batchIndex;
            try {
              // 生成唯一文件名
              const uuid = getUuid();
              const fileExtension = 'webp';
              const filename = `${prefix}_${uuid}.${fileExtension}`;
              const key = `images/${filename}`;
              
              console.log(`文件 ${globalIndex + 1}/${files.length} 开始处理:`, { filename });
              
              // 将文件转换为 Buffer
              const arrayBuffer = await file.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              
              // 使用 Sharp 进行服务端优化
              const optimizationStartTime = performance.now();
              const { buffer: optimizedBuffer, contentType, stats } = await optimizeImageWithSharp(buffer, file.type);
              const optimizationTime = performance.now() - optimizationStartTime;
              
              // 上传优化后的文件到存储服务
              const uploadStartTime = performance.now();
              const uploadResult = await storage.uploadFile({
                body: optimizedBuffer,
                key,
                contentType,
                disposition: "inline",
              });
              const uploadTime = performance.now() - uploadStartTime;
              
              console.log(`✅ 文件 ${globalIndex + 1}/${files.length} 处理完成:`, {
                filename: uploadResult.filename,
                optimizationTime: optimizationTime.toFixed(2) + 'ms',
                uploadTime: uploadTime.toFixed(2) + 'ms',
                compressionRatio: stats.compressionRatio + '%',
                sizeReduction: stats.sizeReduction + 'KB'
              });

              return {
                success: true,
                data: {
                  url: uploadResult.url,
                  filename: uploadResult.filename,
                  key: uploadResult.key,
                  size: optimizedBuffer.length,
                  type: contentType,
                  originalName: file.name,
                  originalSize: file.size,
                  optimizationTime: optimizationTime.toFixed(2),
                  uploadTime: uploadTime.toFixed(2),
                  stats
                }
              };
            } catch (error) {
              console.error(`❌ 文件 ${globalIndex + 1}/${files.length} 处理失败:`, error);
              return {
                success: false,
                error: error instanceof Error ? error.message : '未知错误',
                originalName: file.name,
                index: globalIndex
              };
            }
          })
        );
        
        results.push(...batchResults);
        
        // 批次间短暂延迟，避免过载
        if (i + batchSize < files.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      return results;
    };
    
    // 使用批量并发处理
    console.log('开始批量处理文件...');
    const uploadResults = await batchProcessFiles(files, 4);
    
    // 分离成功和失败的结果
    const successResults = uploadResults.filter(r => r.success).map(r => r.data);
    const failedResults = uploadResults.filter(r => !r.success);
    
    // 计算总体统计
    const totalStats = successResults.reduce((acc, result) => {
      if (result && result.stats) {
        acc.totalOriginalSize += result.stats.originalSize || 0;
        acc.totalOptimizedSize += result.stats.optimizedSize || 0;
        acc.totalOptimizationTime += parseFloat(result.optimizationTime || '0') || 0;
        acc.totalUploadTime += parseFloat(result.uploadTime || '0') || 0;
      }
      return acc;
    }, {
      totalOriginalSize: 0,
      totalOptimizedSize: 0,
      totalOptimizationTime: 0,
      totalUploadTime: 0
    });
    
    const overallCompressionRatio = totalStats.totalOriginalSize > 0 
      ? ((totalStats.totalOriginalSize - totalStats.totalOptimizedSize) / totalStats.totalOriginalSize * 100).toFixed(1)
      : '0.0';
    
    console.log('📊 批量处理完成统计:', {
      total: files.length,
      success: successResults.length,
      failed: failedResults.length,
      overallCompressionRatio: overallCompressionRatio + '%',
      totalOptimizationTime: totalStats.totalOptimizationTime.toFixed(2) + 'ms',
      totalUploadTime: totalStats.totalUploadTime.toFixed(2) + 'ms'
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
      })),
      stats: {
        overallCompressionRatio: parseFloat(overallCompressionRatio),
        totalOptimizationTime: totalStats.totalOptimizationTime,
        totalUploadTime: totalStats.totalUploadTime
      }
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