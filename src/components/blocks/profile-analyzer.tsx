"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, ImageIcon, Star, TrendingUp, Users, MessageCircle, Loader2, X, Plus } from "lucide-react";
import { toast } from "sonner";
import imageCompression from 'browser-image-compression';
import AnalysisThinkingProcess from "./analysis-thinking-process";
import AnalysisThinkingProcessStream from "./analysis-thinking-process-stream";
import { useAppContext } from "@/contexts/app";
import { SubscriptionTier } from "@/types/user";
import { motion } from "framer-motion";

// 数值动画组件
const AnimatedNumber = ({ targetValue, duration = 2000 }: { targetValue: number; duration?: number }) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // 使用 easeOutCubic 缓动函数
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);
      
      setCurrentValue(Math.floor(targetValue * easedProgress));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    // 延迟开始动画
    const timer = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, 500);

    return () => {
      clearTimeout(timer);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [targetValue, duration]);

  return <span>{currentValue}</span>;
};

// 单张照片分析结果
interface PhotoAnalysis {
  photoIndex: number; // 照片序号
  score: number; // 照片评分 (1-10)
  strengths: string[]; // 优点
  improvements: string[]; // 改进建议
  comment: string; // 总体评价
}

// 分析结果接口 (移除了analysisProcess)
interface CoachAnalysisResult {
  // 总体分析
  overallScore: number; // 总体评分 (1-10)
  overallCategory: string; // 总体评价等级
  overallComment: string; // 总体评价
  
  // 每张照片的单独分析
  photoAnalyses: PhotoAnalysis[];
  
  // 最终建议
  finalSuggestions: string[]; // 最终建议列表
}

// 流式文本渲染器组件
function StreamTextRenderer({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  const t = useTranslations("profile_analyzer");
  
  // 简单的 markdown 解析函数
  const parseMarkdown = (text: string) => {
    // 处理标题 - 确保完全替换标题标记，按照从长到短的顺序处理
    text = text.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3 mt-6 first:mt-0 flex items-center"><span class="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>$1</h3>');
    text = text.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4 mt-8 first:mt-0 flex items-center"><span class="w-3 h-3 bg-primary rounded-full mr-3 animate-pulse"></span>$1</h2>');
    text = text.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6 mt-8 first:mt-0 flex items-center"><span class="w-4 h-4 bg-gradient-to-r from-primary to-secondary rounded-full mr-3 animate-pulse shadow-lg"></span>$1</h1>');
    
    // 处理分隔线 - 将 --- 替换为美观的分隔线
    text = text.replace(/^---$/gm, '<div class="my-8 flex items-center"><div class="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div><div class="mx-4 w-2 h-2 bg-primary rounded-full animate-pulse"></div><div class="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div></div>');
    
    // 处理粗体
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">$1</strong>');
    
    // 处理评分数字 (特殊高亮) - 更精确的匹配，避免匹配到单独的数字
    text = text.replace(/(\d+(?:\.\d+)?\/10)(?=分|$|\s)/g, '<span class="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg shadow-lg transform hover:scale-105 transition-transform mx-1">$1</span>');
    // 处理单独的分数（如 "8分"），但不包括 "/10分" 的情况
    text = text.replace(/(?<!\/)(\d+(?:\.\d+)?)(?=分)/g, '<span class="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg shadow-lg transform hover:scale-105 transition-transform mx-1">$1</span>');
    
    // 处理数字列表项 - 更精确的匹配，减少行间距
    text = text.replace(/^(\d+)\.\s+(.*$)/gm, '<div class="flex items-start my-2 p-3 rounded-lg bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5 border border-primary/20 hover:border-primary/40 transition-all duration-200 shadow-sm hover:shadow-md"><div class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-primary to-secondary text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 shadow-md">$1</div><div class="text-sm leading-relaxed text-foreground flex-1">$2</div></div>');
    
    // 处理破折号列表项
    text = text.replace(/^-\s+(.*$)/gm, '<div class="flex items-start my-3 p-3 rounded-md bg-gradient-to-r from-muted/30 to-muted/10 border-l-4 border-primary/40 hover:border-primary/60 transition-colors"><div class="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0 animate-pulse"></div><div class="text-sm leading-relaxed text-foreground flex-1">$1</div></div>');
    
    // 处理段落间的多个换行 - 保持适当间距
    text = text.replace(/\n\n+/g, '<div class="my-6"></div>');
    
    // 处理单个换行
    text = text.replace(/\n/g, '<br class="my-1">');
    
    return text;
  };

  const htmlContent = parseMarkdown(text);

  return (
    <div className="space-y-4 relative">
      {/* 背景科技感装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-lg"></div>
      
      <div className="relative z-10">
        <div 
          className="prose prose-sm max-w-none text-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
        
        {isStreaming && (
          <div className="flex items-center justify-center mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-4 h-4 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-4 h-4 bg-gradient-to-r from-primary to-secondary rounded-full animate-ping opacity-75"></div>
              </div>
              <div className="text-sm font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t("analyzing_status")}
              </div>
              <div className="flex space-x-1">
                <div className="w-1 h-6 bg-primary rounded-full animate-pulse"></div>
                <div className="w-1 h-6 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-6 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        {!isStreaming && text && (
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">{t("analysis_complete")}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfileAnalyzer() {
  const t = useTranslations("profile_analyzer");
  const locale = useLocale();
  const { user, userCredits, setShowSignModal, setShowPricingModal, refreshUserCredits } = useAppContext();
  
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CoachAnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // 新增状态控制思考过程和结果显示
  const [showThinkingProcess, setShowThinkingProcess] = useState(false);
  const [thinkingComplete, setThinkingComplete] = useState(false);
  const [analysisResultReady, setAnalysisResultReady] = useState(false);
  const [pendingAnalysisResult, setPendingAnalysisResult] = useState<CoachAnalysisResult | null>(null);
  
  // AI思考过程版本选择 (Plan B: steps, Plan C: stream)
  const [thinkingProcessVersion, setThinkingProcessVersion] = useState<'steps' | 'stream'>('stream');
  
  // 假流式相关状态
  const [fakeStreamText, setFakeStreamText] = useState<string>("");
  const [isFakeStreaming, setIsFakeStreaming] = useState(false);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 图片压缩相关状态
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState(0);
  const [compressionStats, setCompressionStats] = useState<{
    originalTotalSize: number;
    compressedTotalSize: number;
    filesCompressed: number;
    totalFiles: number;
  } | null>(null);
  
  const MAX_FILES = 9;
  const CACHE_KEY = 'profile_analyzer_photos';

  // 保存照片到本地缓存
  const savePhotosToCache = useCallback((photoFiles: File[]) => {
    try {
      const photoPromises = photoFiles.map(async (file) => {
        const base64 = await fileToBase64(file);
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          base64: base64
        };
      });
      
      Promise.all(photoPromises).then((photoData) => {
        const cacheData = {
          photos: photoData,
          timestamp: Date.now(),
          version: '1.0'
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        console.log(`已缓存 ${photoData.length} 张照片到本地`);
      }).catch((error) => {
        console.warn('照片缓存失败:', error);
      });
    } catch (error) {
      console.warn('保存照片缓存失败:', error);
    }
  }, []);

  // 从本地缓存恢复照片
  const loadPhotosFromCache = useCallback(async () => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (!cachedData) return;

      const parsed = JSON.parse(cachedData);
      const { photos, timestamp } = parsed;
      
      // 检查缓存是否过期（24小时）
      const maxAge = 24 * 60 * 60 * 1000; // 24小时
      if (Date.now() - timestamp > maxAge) {
        localStorage.removeItem(CACHE_KEY);
        console.log('照片缓存已过期，已清理');
        return;
      }

      if (photos && photos.length > 0) {
        const restoredFiles: File[] = [];
        const restoredUrls: string[] = [];

        for (const photoData of photos) {
          try {
            const file = base64ToFile(photoData.base64, photoData.name, photoData.type);
            const url = URL.createObjectURL(file);
            
            restoredFiles.push(file);
            restoredUrls.push(url);
          } catch (error) {
            console.warn('恢复照片失败:', photoData.name, error);
          }
        }

        if (restoredFiles.length > 0) {
          setFiles(restoredFiles);
          setPreviewUrls(restoredUrls);
          console.log(`已从缓存恢复 ${restoredFiles.length} 张照片`);
          toast.success(t("toast_photos_restored", { count: restoredFiles.length }) || `已恢复 ${restoredFiles.length} 张照片`);
        }
      }
    } catch (error) {
      console.warn('加载照片缓存失败:', error);
      // 清理损坏的缓存
      localStorage.removeItem(CACHE_KEY);
    }
  }, [setFiles, setPreviewUrls, t]);

  // 清理照片缓存
  const clearPhotosCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
      console.log('已清理照片缓存');
    } catch (error) {
      console.warn('清理照片缓存失败:', error);
    }
  }, []);

  // 工具函数：File转Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // 工具函数：Base64转File
  const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
    const arr = base64.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mimeType });
  };

  // 页面加载时恢复缓存的照片
  useEffect(() => {
    // 只在组件首次挂载且没有照片时尝试恢复缓存
    if (files.length === 0) {
      loadPhotosFromCache();
    }
  }, []); // 只运行一次

  // 清理预览URL
  useEffect(() => {
    return () => {
      // 清理所有预览URL
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      // 清理定时器
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, [previewUrls]);

  // 使用专业的图片压缩库进行压缩
  const compressImage = async (file: File): Promise<File> => {
    try {
      const fileSizeMB = file.size / (1024 * 1024);
      
      // 检测是否是Safari浏览器
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      // 高级压缩配置 - 更激进的压缩设置
      let options = {
        maxSizeMB: 1, // 目标大小1MB
        maxWidthOrHeight: 1024, // 最大宽高1024px
        useWebWorker: !isSafari, // Safari浏览器禁用Web Worker
        fileType: file.type as any, // 保持原始格式
        initialQuality: 0.8, // 初始质量
        alwaysKeepResolution: false, // 允许降低分辨率
        maxIteration: 10, // 最大压缩迭代次数
        exifOrientation: 1, // 处理图片方向
        preserveExif: false, // 移除EXIF数据减小文件
      };
      
      // 根据原始文件大小智能调整压缩参数
      if (fileSizeMB > 8) {
        options = {
          ...options,
          maxSizeMB: 0.8, // 更激进的压缩
          maxWidthOrHeight: 800,
          initialQuality: 0.4,
          maxIteration: 15,
        };
      } else if (fileSizeMB > 5) {
        options = {
          ...options,
          maxSizeMB: 0.9,
          maxWidthOrHeight: 900,
          initialQuality: 0.5,
          maxIteration: 12,
        };
      } else if (fileSizeMB > 3) {
        options = {
          ...options,
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          initialQuality: 0.6,
          maxIteration: 10,
        };
      }
      
      // Safari浏览器特殊处理 - 降低压缩参数以减少内存使用
      if (isSafari) {
        options = {
          ...options,
          maxWidthOrHeight: Math.min(options.maxWidthOrHeight, 800), // Safari限制最大尺寸
          maxIteration: Math.min(options.maxIteration, 8), // 减少迭代次数
          initialQuality: Math.max(options.initialQuality, 0.6), // 提高初始质量，减少压缩强度
        };
        
        // 对于大文件，Safari使用更保守的压缩策略
        if (fileSizeMB > 5) {
          options.maxSizeMB = Math.max(options.maxSizeMB, 1.5); // 不要压缩太小
          options.maxWidthOrHeight = 600; // 进一步限制尺寸
        }
      }
      
      // 如果是PNG格式且较大，考虑转换为JPEG以获得更好的压缩
      if (file.type === 'image/png' && fileSizeMB > 3) {
        console.log(`PNG文件较大，尝试转换为JPEG格式: ${file.name}`);
        options.fileType = 'image/jpeg';
        options.initialQuality = Math.max(0.4, options.initialQuality - 0.1);
        
        // Safari对格式转换更敏感，使用更保守的参数
        if (isSafari) {
          options.initialQuality = Math.max(0.7, options.initialQuality);
        }
      }
      
      console.log(`开始压缩: ${file.name} (${fileSizeMB.toFixed(1)}MB)`, {
        ...options,
        isSafari,
        browserUserAgent: navigator.userAgent
      });
      
      const compressedFile = await imageCompression(file, options);
      
      // 如果压缩后文件还是很大，进行二次压缩
      const compressedSizeMB = compressedFile.size / (1024 * 1024);
      if (compressedSizeMB > 1.2 && options.initialQuality > 0.3) {
        console.log(`文件仍然较大，进行二次压缩: ${compressedSizeMB.toFixed(1)}MB`);
        const secondOptions = {
          ...options,
          maxSizeMB: 1,
          initialQuality: Math.max(0.3, options.initialQuality - 0.2),
          maxWidthOrHeight: Math.max(800, options.maxWidthOrHeight - 200),
        };
        
        return await imageCompression(compressedFile, secondOptions);
      }
      
      return compressedFile;
    } catch (error) {
      console.error('图片压缩失败:', error);
      
      // Safari特定错误处理
      if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
        console.error('Safari浏览器压缩失败，错误详情:', {
          error: error,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          userAgent: navigator.userAgent
        });
        
        // 如果是内存相关错误，提供更友好的错误信息
        if (error instanceof Error && 
            (error.message.includes('memory') || 
             error.message.includes('worker') || 
             error.message.includes('load failed'))) {
          const newError = new Error(`Safari浏览器图片处理失败: ${file.name}。建议尝试使用更小的图片或切换到Chrome浏览器。`);
          throw newError;
        }
      }
      
      throw error;
    }
  };

  // 批量压缩图片 - Updated with better error handling and progress
  const compressImages = async (imageFiles: File[]): Promise<File[]> => {
    const compressedFiles: File[] = [];
    setIsCompressing(true);
    setCompressProgress(0);
    
    // 初始化统计信息
    let originalTotalSize = 0;
    let compressedTotalSize = 0;
    let filesCompressed = 0;
    
    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileSizeMB = file.size / (1024 * 1024);
        originalTotalSize += file.size;
        
        // 智能判断是否需要压缩
        if (fileSizeMB <= 2) {
          // 小于2MB，不压缩
          compressedFiles.push(file);
          compressedTotalSize += file.size;
          console.log(`跳过压缩: ${file.name} (${fileSizeMB.toFixed(1)}MB)`);
        } else {
          // 压缩图片
          const fileName = file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name;
          
          try {
            const compressedFile = await compressImage(file);
            compressedFiles.push(compressedFile);
            compressedTotalSize += compressedFile.size;
            filesCompressed++;
            
            const originalSize = (file.size / (1024 * 1024)).toFixed(1);
            const compressedSize = (compressedFile.size / (1024 * 1024)).toFixed(1);
            const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(0);
            
            console.log(`图片压缩完成: ${file.name}`);
            console.log(`原始大小: ${originalSize}MB -> 压缩后: ${compressedSize}MB (压缩率: ${compressionRatio}%)`);
          } catch (error) {
            console.error(`图片压缩失败: ${file.name}`, error);
            // 压缩失败时使用原图片
            compressedFiles.push(file);
            compressedTotalSize += file.size;
            toast.warning(t("compress_fallback", { name: fileName }));
          }
        }
        
        // 更新进度
        setCompressProgress(Math.round(((i + 1) / imageFiles.length) * 100));
      }
      
      // 更新压缩统计
      setCompressionStats({
        originalTotalSize,
        compressedTotalSize,
        filesCompressed,
        totalFiles: imageFiles.length
      });
      
      return compressedFiles;
    } catch (error) {
      console.error('批量压缩失败:', error);
      toast.error(t("compress_failed"));
      return imageFiles; // 压缩失败时返回原文件
    } finally {
      setIsCompressing(false);
      setCompressProgress(0);
    }
  };

  const handleFilesUpload = async (uploadedFiles: File[]) => {
    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];
    
    // 检查文件数量限制
    const totalFiles = files.length + uploadedFiles.length;
    if (totalFiles > MAX_FILES) {
      toast.error(t("toast_max_files", { max: MAX_FILES }));
      return;
    }
    
    // 验证文件类型和大小
    for (const file of uploadedFiles) {
      if (!file.type.startsWith('image/')) {
        toast.error(t("toast_not_image", { name: file.name }));
        continue;
      }
      
      const fileSizeMB = file.size / (1024 * 1024);
      
      if (fileSizeMB > 50) { // 50MB 绝对上限
        toast.error(t("toast_too_large_absolute", { name: file.name }));
        continue;
      }
      
      if (fileSizeMB > 10) { // 10MB 以上提示替换
        toast.error(t("toast_too_large_replace", { name: file.name, size: fileSizeMB.toFixed(1) }));
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length === 0) {
      return;
    }
    
    try {
      // 压缩图片
      const compressedFiles = await compressImages(validFiles);
      
      // 为压缩后的文件创建预览URL
      compressedFiles.forEach(file => {
        newPreviewUrls.push(URL.createObjectURL(file));
      });
      
      if (compressedFiles.length > 0) {
        const newFiles = [...files, ...compressedFiles];
        setFiles(newFiles);
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        
        // 保存照片到本地缓存
        savePhotosToCache(newFiles);
        
        // 重置所有状态
        setResult(null);
        setShowThinkingProcess(false);
        setThinkingComplete(false);
        setAnalysisResultReady(false);
        setPendingAnalysisResult(null);
        
        // 重置压缩统计
        setCompressionStats(null);
      }
    } catch (error) {
      console.error('文件处理失败:', error);
      toast.error(t("toast_upload_failed"));
    }
  };

  const handleSingleFileUpload = (uploadedFile: File) => {
    handleFilesUpload([uploadedFile]);
  };

  const removeFile = (index: number) => {
    // 清理对应的预览URL
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    
    // 更新缓存
    if (newFiles.length > 0) {
      savePhotosToCache(newFiles);
    } else {
      clearPhotosCache();
    }
    
    toast.success(t("toast_image_removed"));
  };

  const clearAllFiles = () => {
    // 清理所有预览URL
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    
    setFiles([]);
    setPreviewUrls([]);
    setResult(null);
    setShowThinkingProcess(false);
    setThinkingComplete(false);
    setAnalysisResultReady(false);
    setPendingAnalysisResult(null);
    
    // 清理照片缓存
    clearPhotosCache();
    
    // 重置压缩统计
    setCompressionStats(null);
    
    toast.success(t("toast_all_cleared"));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 压缩过程中禁用拖拽
    if (isCompressing) return;
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    // 压缩过程中禁用拖拽
    if (isCompressing) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFilesUpload(droppedFiles);
    }
  };

  // 思考过程完成的回调
  const handleThinkingComplete = () => {
    setThinkingComplete(true);
    
    // 如果分析结果已经准备好，直接显示结果，不再使用假流式
    if (analysisResultReady && pendingAnalysisResult) {
      setResult(pendingAnalysisResult);
      setPendingAnalysisResult(null);
      setIsAnalyzing(false);
      toast.success(t("toast_analysis_complete"));
    }
  };

  // 智能流式分析（协调两个API）
  const analyzeProfileSmart = async () => {
    if (files.length === 0) {
      toast.error(t("toast_upload_required"));
      return;
    }

    // 1. 检查用户登录状态
    if (!user) {
      setShowSignModal?.(true);
      return;
    }

    // 2. 获取用户订阅等级
    let userTier: SubscriptionTier = SubscriptionTier.NONE;
    try {
      const response = await fetch('/api/get-user-subscription');
      if (response.ok) {
        const { data } = await response.json();
        userTier = data.subscription?.tier || SubscriptionTier.NONE;
      }
    } catch (error) {
      console.error('获取用户订阅等级失败:', error);
    }

    // 3. 权限检查逻辑
    if (userTier === SubscriptionTier.ELITE) {
      console.log('Elite 用户，直接放行');
    } else {
      // 非 Elite 用户检查积分
      const requiredCredits = 10;
      const availableCredits = userCredits?.left_credits || 0;
      if (availableCredits < requiredCredits) {
        setShowPricingModal?.(true);
        return;
      }
    }

    setIsAnalyzing(true);
    setResult(null);
    setShowThinkingProcess(true);
    setThinkingComplete(false);
    setAnalysisResultReady(false);
    setPendingAnalysisResult(null);
    
    console.log('开始分析，当前图片信息：', {
      filesCount: files.length,
      previewUrlsCount: previewUrls.length,
      previewUrls: previewUrls
    });
    
    try {
      // 创建FormData对象，支持多文件
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
        console.log(`添加文件 ${index + 1}:`, file.name);
      });
      formData.append('fileCount', files.length.toString());
      formData.append('locale', locale);
      
      // 同时发起两个请求：思考过程由组件自己处理，这里只处理实际分析
      const response = await fetch('/api/analyze-multiple', {
        method: 'POST',
        body: formData,
      });
      
      // 先检查响应状态
      if (!response.ok) {
        // 处理HTTP错误状态
        const errorText = await response.text();
        console.error('API错误响应:', { 
          status: response.status, 
          statusText: response.statusText, 
          body: errorText 
        });
        
        let errorMessage: string;
        
        if (response.status === 413) {
          errorMessage = locale === 'zh' 
            ? "上传的图片过大，请压缩后重试" 
            : "Uploaded images are too large, please compress and try again";
        } else if (response.status === 400) {
          errorMessage = locale === 'zh' 
            ? "请求参数错误，请检查上传的图片格式" 
            : "Invalid request parameters, please check image formats";
        } else if (response.status === 500) {
          errorMessage = locale === 'zh' 
            ? "服务器内部错误，请稍后重试" 
            : "Internal server error, please try again later";
        } else if (response.status === 502 || response.status === 503 || response.status === 504) {
          errorMessage = locale === 'zh' 
            ? "服务暂时不可用，请稍后重试" 
            : "Service temporarily unavailable, please try again later";
        } else {
          errorMessage = locale === 'zh' 
            ? `请求失败 (错误码: ${response.status})，请稍后重试` 
            : `Request failed (Error: ${response.status}), please try again later`;
        }
        
        toast.error(errorMessage);
        setIsAnalyzing(false);
        setShowThinkingProcess(false);
        return;
      }
      
      // 检查内容类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('响应不是JSON格式:', { contentType });
        const errorText = await response.text();
        console.error('响应内容:', errorText);
        
        const errorMessage = locale === 'zh' 
          ? "服务器响应格式错误，请稍后重试" 
          : "Invalid server response format, please try again later";
        
        toast.error(errorMessage);
        setIsAnalyzing(false);
        setShowThinkingProcess(false);
        return;
      }
      
      // 尝试解析JSON
      let apiResult;
      try {
        apiResult = await response.json();
      } catch (jsonError) {
        console.error('JSON解析失败:', jsonError);
        const errorText = await response.text();
        console.error('原始响应内容:', errorText);
        
        const errorMessage = locale === 'zh' 
          ? "响应解析失败，请稍后重试" 
          : "Failed to parse response, please try again later";
        
        toast.error(errorMessage);
        setIsAnalyzing(false);
        setShowThinkingProcess(false);
        return;
      }
      
      if (apiResult.code === 0) {
        const analysisData = apiResult.data;
        
        console.log('AI分析结果：', {
          photoAnalyses: analysisData.photoAnalyses,
          currentPreviewUrls: previewUrls
        });
        
        setAnalysisResultReady(true);
        
        // 如果思考过程已完成，立即显示结果
        if (thinkingComplete) {
          setResult(analysisData);
          setIsAnalyzing(false);
          toast.success(t("toast_analysis_complete"));
          refreshUserCredits?.();
        } else {
          // 否则暂存结果，等待思考过程完成
          setPendingAnalysisResult(analysisData);
        }
        
      } else {
        toast.error(apiResult.message || t("toast_analysis_failed"));
        setIsAnalyzing(false);
        setShowThinkingProcess(false);
      }
    } catch (error) {
      console.error(t("error_analysis"), error);
      
      // 提取实际的错误信息
      let errorMessage = t("error_network");
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = locale === 'zh' 
          ? "网络连接失败，请检查网络后重试" 
          : "Network connection failed, please check your connection and try again";
      } else if (error instanceof SyntaxError && error.message.includes('JSON')) {
        errorMessage = locale === 'zh' 
          ? "服务器响应格式错误，请稍后重试" 
          : "Invalid server response format, please try again later";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast.error(errorMessage);
      setIsAnalyzing(false);
      setShowThinkingProcess(false);
    }
  };

  // 监听思考完成和结果准备状态
  useEffect(() => {
    if (thinkingComplete && analysisResultReady && pendingAnalysisResult && !result) {
      // 思考过程完成且分析结果准备好，直接显示结果
      setResult(pendingAnalysisResult);
      setPendingAnalysisResult(null);
      setIsAnalyzing(false);
      toast.success(t("toast_analysis_complete"));
      // 刷新用户积分余额
      refreshUserCredits?.();
    }
  }, [thinkingComplete, analysisResultReady, pendingAnalysisResult, result, t, refreshUserCredits]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBackground = (score: number) => {
    if (score >= 8) return "from-green-500 to-green-600";
    if (score >= 6) return "from-yellow-500 to-yellow-600";
    return "from-red-500 to-red-600";
  };

  return (
    <>
      {/* 文件上传区域 - 完全采用 Lucy Hero 风格，撑满屏幕 */}
      <motion.section 
        className="relative w-full min-h-screen lg:min-h-[80vh] xl:min-h-[70vh] overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* 渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF64DC] to-[#FFA8F5]" />
        
        {/* 主要内容容器 */}
        <div className="relative z-10 min-h-screen lg:min-h-[80vh] xl:min-h-[70vh] flex items-center py-8 lg:py-16 xl:py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              
              {/* 内容区域 - 根据是否有图片调整布局 */}
              {files.length === 0 ? (
                <>
                  {/* 左侧内容 - 无图片时 */}
                  <motion.div 
                    className="text-left space-y-6 relative order-2 lg:order-1"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                  >
                    <div
                      className={`relative ${
                        dragActive ? 'bg-black/10 rounded-2xl p-4' : ''
                      } ${isCompressing ? 'opacity-60 pointer-events-none' : ''} transition-all duration-300`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      {/* 压缩进度显示 */}
                      {isCompressing && (
                        <div className="w-full max-w-md bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-8">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-black">
                              {t("compressing_images")}
                            </span>
                            <span className="text-sm text-black/80">
                              {compressProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-black/20 rounded-full h-3">
                            <div 
                              className="bg-black h-3 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${compressProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-black/70 mt-2 text-center">
                            {t("compress_tip")}
                          </p>
                        </div>
                      )}
                      
                      {!isCompressing && (
                        <div className="relative">
                          {/* 主标题 */}
                          <div className="mb-8">
                            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                              <span style={{ color: '#3D08FF', fontWeight: '900' }}>Your Personal AI</span>
                              <br />
                              <span 
                                className="inline-block font-bold py-2 rounded-full"
                                style={{ 
                                  color: '#C8FB75',
                                  fontWeight: '900'
                                }}
                              >
                                Dating Coach
                              </span>
                            </h1>
                            
                            {/* 副标题 */}
                            <p className="text-xl lg:text-2xl text-black font-medium max-w-lg mt-6">
                              Upload your photos for professional analysis
                            </p>
                          </div>
                          
                          {/* 上传按钮 */}
                          <motion.div 
                            className="pt-4 mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
                          >
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                              className="group"
                            >
                              <Button 
                                onClick={() => {
                                  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                                  input?.click();
                                }}
                                disabled={isCompressing}
                                size="lg" 
                                className="bg-black text-white hover:bg-gray-800 font-semibold px-8 pl-2 pr-4 py-8 rounded-full text-lg group-hover:shadow-xl group-hover:shadow-black/20 transition-all duration-300"
                              >
                                <img 
                                  src="/imgs/lucy/hero_add_img_icon.png" 
                                  alt="upload icon" 
                                  className="mr-1 w-10 h-10 group-hover:scale-110 transition-transform duration-300"
                                />
                                <span className="group-hover:tracking-wide transition-all duration-300">
                                  Upload your dating photos
                                </span>
                              </Button>
                            </motion.div>
                          </motion.div>
                          
                          {/* 统计数据 */}
                          <motion.div 
                            className="flex gap-8"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 1, ease: "easeOut" }}
                          >
                            <div 
                              className="text-black text-lg"
                              style={{ fontWeight: '900' }}
                            >
                              Match rate <span 
                                className="text-4xl"
                                style={{ color: '#C8FB75', fontWeight: '900' }}
                              >
                                <AnimatedNumber targetValue={277} />%
                              </span>
                            </div>
                            <div 
                              className="text-black text-lg"
                              style={{ fontWeight: '900' }}
                            >
                              Reply rate <span 
                                className="text-4xl"
                                style={{ color: '#C8FB75', fontWeight: '900' }}
                              >
                                <AnimatedNumber targetValue={482} />%
                              </span>
                            </div>
                          </motion.div>
                        </div>
                      )}
                      
                      {/* 文件上传input */}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={isCompressing}
                        onChange={(e) => {
                          if (isCompressing) return;
                          if (e.target.files && e.target.files.length > 0) {
                            const selectedFiles = Array.from(e.target.files);
                            handleFilesUpload(selectedFiles);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-[5]"
                      />
                    </div>
                  </motion.div>
                </>
              ) : (
                <>
                  {/* 居中的图片预览区域 - 有图片时 */}
                  <motion.div 
                    className="col-span-full flex flex-col items-center justify-center text-center space-y-6 relative"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    <div
                      className={`relative w-full max-w-5xl ${
                        dragActive ? 'bg-black/10 rounded-2xl p-4' : ''
                      } ${isCompressing ? 'opacity-60 pointer-events-none' : ''} transition-all duration-300`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      {/* 压缩进度显示 */}
                      {isCompressing && (
                        <div className="w-full max-w-md mx-auto bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-8">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-black">
                              {t("compressing_images")}
                            </span>
                            <span className="text-sm text-black/80">
                              {compressProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-black/20 rounded-full h-3">
                            <div 
                              className="bg-black h-3 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${compressProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-black/70 mt-2 text-center">
                            {t("compress_tip")}
                          </p>
                        </div>
                      )}
                      
                      {/* 图片预览网格 */}
                      <div className="w-full relative z-20">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-black rounded-full"></div>
                            <p className="text-sm font-medium text-black">
                              {t("uploaded_count", { count: files.length, max: MAX_FILES })}
                            </p>
                          </div>
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              clearAllFiles();
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-black hover:text-black/80 hover:bg-black/10 relative z-30 pointer-events-auto"
                          >
                            {t("clear_all")}
                          </Button>
                        </div>
                        
                        {/* 压缩统计显示 */}
                        {compressionStats && compressionStats.filesCompressed > 0 && (
                          <div className="mb-6 bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/40 max-w-md mx-auto">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center text-black">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 shadow-sm"></div>
                                {t("compression_stats")}
                              </div>
                              <div className="text-black font-medium">
                                {t("saved_space", {
                                  saved: ((compressionStats.originalTotalSize - compressionStats.compressedTotalSize) / (1024 * 1024)).toFixed(1),
                                  percent: ((1 - compressionStats.compressedTotalSize / compressionStats.originalTotalSize) * 100).toFixed(0)
                                })}
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-black/70">
                              {t("files_compressed", { compressed: compressionStats.filesCompressed, total: compressionStats.totalFiles })}
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center">
                          {previewUrls.map((url, index) => (
                            <div key={index} className="relative group w-full max-w-[150px]">
                              {/* 图片容器 */}
                              <div className="aspect-[3/4] bg-white/20 backdrop-blur-sm rounded-2xl hover-lift relative w-full">
                                <img
                                  src={url}
                                  alt={t("image_preview", { index: index + 1 })}
                                  className="w-full h-full object-cover rounded-2xl"
                                />
                                
                                {/* 删除按钮 */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeFile(index);
                                  }}
                                  className="absolute top-1 right-1 w-8 h-8 rounded-full bg-black/90 hover:bg-black text-white shadow-lg hover:shadow-xl z-[60] flex items-center justify-center border-2 border-white/80 hover:scale-110 transition-all duration-200 backdrop-blur-sm"
                                  type="button"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                
                                {/* 编号标签 */}
                                <div className="absolute bottom-2 left-2 w-6 h-6 bg-black/90 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg z-[50] border-2 border-white/80 backdrop-blur-sm">
                                  {index + 1}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* 添加更多图片按钮 */}
                          {files.length < MAX_FILES && (
                            <div className="w-full max-w-[150px]">
                              <div
                                className="aspect-[3/4] border-2 border-dashed border-black/30 rounded-2xl flex items-center justify-center hover:border-black/60 hover:bg-black/5 transition-all duration-300 cursor-pointer group w-full"
                                onClick={() => {
                                  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                                  input?.click();
                                }}
                              >
                                <div className="text-center">
                                  <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-black mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
                                  <p className="text-xs text-black font-medium">{t("add_image")}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 分析按钮 - 直接放在图片列表下方 */}
                        <div className="mt-8 flex justify-center">
                          <Button
                            onClick={analyzeProfileSmart}
                            disabled={isAnalyzing || showThinkingProcess || isCompressing}
                            size="lg"
                            className="px-10 py-4 text-lg font-semibold min-w-[200px] bg-black text-white hover:bg-gray-800 rounded-full"
                            variant="default"
                          >
                            {isCompressing ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                {t("compressing_images")}
                              </>
                            ) : isAnalyzing ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                {t("analyzing")}
                              </>
                            ) : (
                              <>
                                <Star className="w-5 h-5 mr-2" />
                                {t("analyze_images", { count: files.length })}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* 文件上传input */}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={isCompressing}
                        onChange={(e) => {
                          if (isCompressing) return;
                          if (e.target.files && e.target.files.length > 0) {
                            const selectedFiles = Array.from(e.target.files);
                            handleFilesUpload(selectedFiles);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-[5]"
                        style={{ 
                          pointerEvents: 'none',
                          display: 'none'
                        }}
                      />
                    </div>
                  </motion.div>
                </>
              )}
              
              {/* 右侧图片内容 - 只在没有图片时显示 */}
              {files.length === 0 && (
                <motion.div 
                  className="relative flex items-center justify-center mt-8 lg:mt-0 order-1 lg:order-2"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                >
                  <div className="w-full max-w-sm lg:max-w-lg">
                    <img 
                      src="/imgs/lucy/banner_hero_img.png"
                      alt="Dating Profile Analysis"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* 底部文字装饰 */}
        <div className="absolute bottom-4 left-0 right-0">
          <div className="container mx-auto px-4">
            <div 
              className="text-center text-xs lg:text-sm tracking-[0.3em] font-light"
              style={{ color: '#3D08FF' }}
            >
              D &nbsp;&nbsp;&nbsp;A &nbsp;&nbsp;&nbsp;T &nbsp;&nbsp;&nbsp;I &nbsp;&nbsp;&nbsp;N &nbsp;&nbsp;&nbsp;G &nbsp;&nbsp;&nbsp; P&nbsp;&nbsp;&nbsp; H&nbsp;&nbsp;&nbsp; O&nbsp;&nbsp;&nbsp; T&nbsp;&nbsp;&nbsp; O &nbsp;&nbsp;&nbsp;A &nbsp;&nbsp;&nbsp;N &nbsp;&nbsp;&nbsp;A &nbsp;&nbsp;&nbsp;L &nbsp;&nbsp;&nbsp;Y &nbsp;&nbsp;&nbsp;Z &nbsp;&nbsp;&nbsp;E &nbsp;&nbsp;&nbsp;R
            </div>
          </div>
        </div>
      </motion.section>

      {/* 分析思考过程组件 */}
      {showThinkingProcess && (
        <motion.section 
          className="w-full py-8 lg:py-16 bg-background"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="container mx-auto px-4 lg:px-8">
            <AnalysisThinkingProcessStream 
                files={files}
                locale={locale}
                onStreamComplete={handleThinkingComplete}
                isVisible={showThinkingProcess}
            />
          </div>
        </motion.section>
      )}

      {/* 分析结果 */}
      {result && (
        <motion.section 
          className="w-full py-8 lg:py-16 bg-background"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="container mx-auto px-4 lg:px-8">
            <div className="space-y-8">
          {/* 评分卡片 */}
          <Card className="pt-0 pb-6 card-glass border-2 border-primary/20 elevation-3">
            <CardHeader className="pt-6 text-center pb-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-t-2xl">
              <CardTitle className="text-3xl font-bold text-gradient-primary">{t("comprehensive_score")}</CardTitle>
              <CardDescription className="text-lg">{t("based_on_analysis", { count: files.length })}</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6 p-8">
              <div className="relative inline-block">
                <div className={`text-8xl font-bold ${getScoreColor(result.overallScore)} mb-2`}>
                  {result.overallScore}
                </div>
                <div className="text-2xl text-muted-foreground">/ 10</div>
                <div className="absolute inset-0 bg-gradient-primary rounded-full blur-3xl opacity-20 animate-pulse"></div>
              </div>
              
              <Badge 
                variant="secondary" 
                className={`text-xl px-6 py-2 bg-gradient-primary text-white shadow-lg glow-primary`}
              >
                {result.overallCategory}
              </Badge>
              
              {/* 自定义进度条 */}
              <div className="mt-6 max-w-md mx-auto">
                <div className="w-full bg-muted/50 rounded-full h-4 elevation-1">
                  <div 
                    className={`h-4 rounded-full bg-gradient-primary transition-all duration-1000 ease-out glow-primary`}
                    style={{ width: `${result.overallScore * 10}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 每张照片分析 */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-1 h-8 bg-gradient-primary rounded-full glow-primary"></div>
              <h3 className="text-2xl font-bold text-gradient-primary">
                {t("individual_photo_analysis")}
              </h3>
            </div>
            
            <div className="grid gap-8">
              {result.photoAnalyses.map((photo, index) => {
                const imageUrl = previewUrls[photo.photoIndex - 1];
                const isImageAvailable = !!imageUrl;
                
                return (
                  <Card key={index} className="card-glass border-l-4 border-l-primary overflow-hidden hover-lift">
                    <CardContent className="p-0">
                      <div className="grid md:grid-cols-5 gap-0">
                        {/* 左侧图片展示 */}
                        <div className="md:col-span-2 relative">
                          <div className="aspect-[3/4] bg-muted/30 flex items-center justify-center">
                            {isImageAvailable ? (
                              <img
                                src={imageUrl}
                                alt={t("photo_number", { num: photo.photoIndex })}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error(`图片加载失败: 照片${photo.photoIndex}`, {
                                    src: imageUrl,
                                    error: e
                                  });
                                }}
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                                <ImageIcon className="w-12 h-12 mb-2" />
                                <span className="text-sm font-medium">{t("photo_number", { num: photo.photoIndex })}</span>
                              </div>
                            )}
                          </div>
                          {/* 评分徽章 */}
                          <div className="absolute top-4 right-4">
                            <Badge 
                              variant="secondary" 
                              className={`text-lg px-4 py-2 bg-gradient-primary text-white font-bold shadow-lg glow-primary`}
                            >
                              {photo.score}/10
                            </Badge>
                          </div>
                          {/* 照片编号 */}
                          <div className="absolute bottom-4 left-4">
                            <div className="card-glass text-foreground text-sm px-3 py-2 rounded-xl font-medium border border-white/20">
                              {t("photo_number", { num: photo.photoIndex })}
                            </div>
                          </div>
                        </div>
                        
                        {/* 右侧分析内容 */}
                        <div className="md:col-span-3 p-8">
                          <div className="space-y-6">
                            {/* 标题和评分 */}
                            <div className="flex items-center justify-between">
                              <h4 className="text-xl font-bold text-gradient-primary">
                                {t("photo_number", { num: photo.photoIndex })}
                              </h4>
                              <div className="flex items-center space-x-3">
                                <span className="text-sm text-muted-foreground">{t("score_colon")}:</span>
                                <span className={`text-2xl font-bold ${getScoreColor(photo.score)}`}>
                                  {photo.score}/10
                                </span>
                              </div>
                            </div>
                            
                            {/* 评价 */}
                            <div className="card-glass rounded-2xl p-6 border border-primary/10">
                              <h5 className="font-semibold mb-3 text-gradient-primary flex items-center">
                                <MessageCircle className="w-4 h-4 mr-2" />
                                {t("photo_comment")}:
                              </h5>
                              <p className="text-sm leading-relaxed text-foreground/80">{photo.comment}</p>
                            </div>
                            
                            {/* 优势和改进建议 */}
                            <div className="grid gap-4">
                              <div className="card-glass rounded-2xl p-6 border border-emerald-200/40 dark:border-emerald-800/40">
                                <h5 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-4 flex items-center">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 shadow-sm"></div>
                                  {t("photo_strengths")}
                                </h5>
                                <ul className="space-y-3">
                                  {photo.strengths.map((strength, i) => (
                                    <li key={i} className="flex items-start text-sm">
                                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                      <span className="text-foreground/80">{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div className="card-glass rounded-2xl p-6 border border-secondary/20">
                                <h5 className="font-semibold text-secondary mb-4 flex items-center">
                                  <div className="w-2 h-2 bg-secondary rounded-full mr-2 glow-secondary"></div>
                                  {t("photo_improvements")}
                                </h5>
                                <ul className="space-y-3">
                                  {photo.improvements.map((improvement, i) => (
                                    <li key={i} className="flex items-start text-sm">
                                      <div className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                      <span className="text-foreground/80">{improvement}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* 最终建议 */}
          <Card className="py-0 card-glass border-2 border-emerald-200/40 dark:border-emerald-800/40 elevation-2">
            <CardHeader className="py-4 bg-gradient-to-r from-emerald-100/50 to-emerald-50/30 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-t-2xl">
              <CardTitle className="flex items-center text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="w-6 h-6 mr-3" />
                {t("final_suggestions_title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <ul className="space-y-4">
                {result.finalSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4 flex-shrink-0 mt-0.5 shadow-lg">
                      {index + 1}
                    </div>
                    <span className="text-base leading-relaxed text-foreground/80">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 总体评价 */}
          <Card className="py-0 card-glass border-2 border-primary/20 elevation-2">
            <CardHeader className="py-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-2xl">
              <CardTitle className="flex items-center text-2xl font-bold text-gradient-primary">
                <Star className="w-6 h-6 mr-3" />
                {t("overall_evaluation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="text-xl font-bold text-gradient-primary">
                {t("overall_score_display", { score: result.overallScore })} - {result.overallCategory}
              </div>
              <div className="text-base leading-relaxed text-foreground/80">
                {result.overallComment}
              </div>
            </CardContent>
          </Card>

          {/* 行动建议 */}
          <Card className="card-glass bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 elevation-2">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4 text-gradient-primary">{t("action_title")}</h3>
              <p className="text-foreground/70 mb-6 text-lg">
                {t("action_description", { count: files.length })}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="px-8">
                  <a href="/conversation-starter">
                    {t("try_conversation_starter")}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
            </div>
          </div>
        </motion.section>
      )}
    </>
  );
} 