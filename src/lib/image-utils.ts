import imageCompression from 'browser-image-compression';

export interface ImageCompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  initialQuality?: number;
  onProgress?: (progress: number) => void;
}

export interface ImageCompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  success: boolean;
  error?: string;
}

/**
 * 智能图片压缩函数
 * 根据文件大小自动选择最佳压缩策略
 */
export async function smartImageCompression(
  file: File,
  targetSizeMB: number = 5,
  options: ImageCompressionOptions = {}
): Promise<ImageCompressionResult> {
  const originalSize = file.size;
  const originalSizeMB = originalSize / (1024 * 1024);

  try {
    // 如果文件已经很小，直接返回
    if (originalSizeMB <= targetSizeMB * 0.8) {
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 0,
        success: true
      };
    }

    // 根据原始大小选择压缩策略
    let compressionOptions: any = {
      maxSizeMB: targetSizeMB,
      maxWidthOrHeight: options.maxWidthOrHeight || 2048,
      useWebWorker: options.useWebWorker ?? true,
      initialQuality: options.initialQuality || 0.8,
      onProgress: options.onProgress
    };

    // 对于特别大的文件，使用更激进的压缩
    if (originalSizeMB > 20) {
      compressionOptions.maxWidthOrHeight = 1920;
      compressionOptions.initialQuality = 0.6;
    } else if (originalSizeMB > 10) {
      compressionOptions.maxWidthOrHeight = 2048;
      compressionOptions.initialQuality = 0.7;
    }

    const compressedFile = await imageCompression(file, compressionOptions);
    const compressedSize = compressedFile.size;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      success: true
    };

  } catch (error) {
    console.error('图片压缩失败:', error);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      success: false,
      error: error instanceof Error ? error.message : '压缩失败'
    };
  }
}

/**
 * 渐进式图片压缩
 * 如果第一次压缩不满足要求，会逐步增加压缩程度
 */
export async function progressiveImageCompression(
  file: File,
  maxSizeMB: number = 5,
  onProgress?: (progress: number, stage: string) => void
): Promise<ImageCompressionResult> {
  const originalSize = file.size;
  const targetSize = maxSizeMB * 1024 * 1024;

  // 如果文件已经满足要求
  if (originalSize <= targetSize) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      success: true
    };
  }

  const compressionStages = [
    { quality: 0.8, maxWidth: 2048, label: '标准压缩' },
    { quality: 0.6, maxWidth: 1920, label: '中等压缩' },
    { quality: 0.4, maxWidth: 1600, label: '高度压缩' },
    { quality: 0.3, maxWidth: 1280, label: '最大压缩' }
  ];

  for (let i = 0; i < compressionStages.length; i++) {
    const stage = compressionStages[i];
    
    try {
      onProgress?.(i * 25, stage.label);

      const options = {
        maxSizeMB: maxSizeMB,
        maxWidthOrHeight: stage.maxWidth,
        initialQuality: stage.quality,
        useWebWorker: true,
        onProgress: (progress: number) => {
          onProgress?.(i * 25 + progress * 0.25, stage.label);
        }
      };

      const compressedFile = await imageCompression(file, options);
      
      if (compressedFile.size <= targetSize || i === compressionStages.length - 1) {
        const compressionRatio = ((originalSize - compressedFile.size) / originalSize) * 100;
        
        return {
          file: compressedFile,
          originalSize,
          compressedSize: compressedFile.size,
          compressionRatio,
          success: true
        };
      }
    } catch (error) {
      console.warn(`压缩阶段 ${i + 1} 失败:`, error);
      continue;
    }
  }

  // 如果所有阶段都失败，返回原文件
  return {
    file,
    originalSize,
    compressedSize: originalSize,
    compressionRatio: 0,
    success: false,
    error: '所有压缩尝试都失败'
  };
}

/**
 * 验证图片文件
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 50 * 1024 * 1024; // 50MB 绝对上限

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '仅支持 JPG、PNG、WEBP 格式的图片'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `文件大小超过 ${maxSize / 1024 / 1024}MB 限制`
    };
  }

  return { valid: true };
}

/**
 * 格式化文件大小显示
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 