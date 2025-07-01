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
          // toast.info(t("compressing_image", { name: fileName }));
          
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
            
            // 如果压缩效果显著，显示提示
            // if (compressedFile.size < file.size * 0.7) {
            //   toast.success(t("compress_success", { 
            //     name: fileName,
            //     original: originalSize,
            //     compressed: compressedSize,
            //     ratio: compressionRatio
            //   }));
            // }
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
      
      // 显示总体压缩效果
      // if (filesCompressed > 0) {
      //   const totalSavedMB = ((originalTotalSize - compressedTotalSize) / (1024 * 1024)).toFixed(1);
      //   const totalSavedPercent = ((1 - compressedTotalSize / originalTotalSize) * 100).toFixed(0);
      //   
      //   toast.success(t("compression_complete", {
      //     count: filesCompressed,
      //     savedMB: totalSavedMB,
      //     savedPercent: totalSavedPercent
      //   }));
      // }
      
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
        setFiles(prev => [...prev, ...compressedFiles]);
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        
        // 重置所有状态
        setResult(null);
        setShowThinkingProcess(false);
        setThinkingComplete(false);
        setAnalysisResultReady(false);
        setPendingAnalysisResult(null);
        
        // 重置压缩统计
        setCompressionStats(null);
        
        // 显示上传成功信息
        const hasCompressed = compressedFiles.some((file, index) => file.size < validFiles[index].size);
        // if (hasCompressed) {
        //   toast.success(t("toast_upload_compressed_success", { count: compressedFiles.length }));
        // } else {
        //   toast.success(t("toast_upload_success", { count: compressedFiles.length }));
        // }
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
    
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    
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

    setIsAnalyzing(true);
    setResult(null);
    setShowThinkingProcess(true);
    setThinkingComplete(false);
    setAnalysisResultReady(false);
    setPendingAnalysisResult(null);
    
    // 调试信息：确保图片URLs仍然有效
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
        
        // 调试信息：查看AI返回的照片分析数据
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
    }
  }, [thinkingComplete, analysisResultReady, pendingAnalysisResult, result, t]);

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

  // 模拟流式渲染效果
  const simulateStreaming = (fullText: string) => {
    // 清理之前的定时器
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
    }
    
    setIsFakeStreaming(true);
    setFakeStreamText("");
    
    let currentIndex = 0;
    const characters = fullText.split('');
    
    streamIntervalRef.current = setInterval(() => {
      if (currentIndex < characters.length) {
        setFakeStreamText(prev => prev + characters[currentIndex]);
        currentIndex++;
      } else {
        if (streamIntervalRef.current) {
          clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }
        setIsFakeStreaming(false);
        
        // 假流式完成后显示最终结果
        if (pendingAnalysisResult) {
          setResult(pendingAnalysisResult);
          setPendingAnalysisResult(null);
          setIsAnalyzing(false);
        }
        
        toast.success(t("toast_analysis_complete"));
      }
    }, 20); // 每20ms显示一个字符，可调整速度
  };

  // 将分析结果转换为可读文本
  const formatAnalysisToText = (data: CoachAnalysisResult): string => {
    // 安全的数组映射函数
    const safeMapArray = (arr: string[] | undefined) => {
      if (!arr || !Array.isArray(arr) || arr.length === 0) {
        return t("no_data");
      }
      return arr
        .filter(item => item && typeof item === 'string') // 过滤掉空值和非字符串
        .map((item, index) => `${index + 1}. ${item}`)
        .join('\n') || t("no_data");
    };

    const sections = [
      `## 🎯 ${t("dating_coach_analysis_title", { count: files.length })}\n\n`,
      
      // 总体评分
      `## 🏆 ${t("overall_evaluation")}\n**${t("overall_score_display", { score: data.overallScore || 0 })}** - ${data.overallCategory || t("no_data")}\n\n${data.overallComment || t("no_data")}\n\n---\n\n`,
      
      // 每张照片分析
      `## 📸 ${t("individual_photo_analysis")}\n\n`,
    ];

    // 添加每张照片的分析
    if (data.photoAnalyses && Array.isArray(data.photoAnalyses)) {
      data.photoAnalyses.forEach((photo, index) => {
        sections.push(
          `### ${t("photo_number", { num: photo.photoIndex || index + 1 })} - ${t("score_colon")} ${photo.score || 0}/10\n\n`,
          `**${t("photo_comment")}:** ${photo.comment || t("no_data")}\n\n`,
          `**${t("photo_strengths")}:**\n${safeMapArray(photo.strengths)}\n\n`,
          `**${t("photo_improvements")}:**\n${safeMapArray(photo.improvements)}\n\n---\n\n`
        );
      });
    }

    // 最终建议
    sections.push(
      `## 💡 ${t("final_suggestions_title")}\n\n${safeMapArray(data.finalSuggestions)}\n\n---\n\n`,
      `**🎉 ${t("coach_analysis_complete", { count: files.length })}**`
    );
    
    // 过滤掉空值并确保所有元素都是字符串
    const validSections = sections.filter(section => 
      section && typeof section === 'string' && section.trim() !== ''
    );
    
    return validSections.join('');
  };

  return (
    <div className="space-y-8">
      {/* 文件上传区域 */}
      <Card className="border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors">
        <CardContent className="p-8">
          <div
            className={`relative flex flex-col items-center justify-center space-y-4 ${
              dragActive ? 'bg-primary/5' : ''
            } ${isCompressing ? 'opacity-60 pointer-events-none' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {/* <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              {isCompressing ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : files.length > 0 ? (
                <ImageIcon className="w-8 h-8 text-primary" />
              ) : (
                <Upload className="w-8 h-8 text-primary" />
              )}
            </div> */}
            
            {/* 压缩进度显示 */}
            {isCompressing && (
              <div className="w-full max-w-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary">
                    {t("compressing_images")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {compressProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${compressProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {t("compress_tip")}
                </p>
              </div>
            )}
            
            {files.length === 0 && !isCompressing && (
              <div className="text-center">
                {/* 引导图片 */}
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <img
                      src="/imgs/lucy/profile_analyzer_upload_icon.png"
                      alt={t("upload_guide_image")}
                      className="w-48 h-48 md:w-56 md:h-56 object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
                    />
                    {/* 装饰性光环效果 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                <p className="text-lg font-medium text-foreground mb-2">
                  {t("upload_placeholder")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("upload_tip")}
                </p>
              </div>
            )}
            
            {/* 图片预览网格 */}
            {files.length > 0 && (
              <div className="mt-4 w-full">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {t("uploaded_count", { count: files.length, max: MAX_FILES })}
                  </p>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation(); // 阻止事件冒泡，防止触发文件选择
                      clearAllFiles();
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 relative z-10"
                  >
                    {t("clear_all")}
                  </Button>
                </div>
                
                {/* 压缩统计显示 */}
                {compressionStats && compressionStats.filesCompressed > 0 && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-green-700 dark:text-green-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        {t("compression_stats")}
                      </div>
                      <div className="text-green-600 dark:text-green-400 font-medium">
                        {t("saved_space", {
                          saved: ((compressionStats.originalTotalSize - compressionStats.compressedTotalSize) / (1024 * 1024)).toFixed(1),
                          percent: ((1 - compressionStats.compressedTotalSize / compressionStats.originalTotalSize) * 100).toFixed(0)
                        })}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                      {t("files_compressed", { compressed: compressionStats.filesCompressed, total: compressionStats.totalFiles })}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-[3/4] bg-muted rounded-lg shadow-md border border-border/50 overflow-hidden">
                        <img
                          src={url}
                          alt={t("image_preview", { index: index + 1 })}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <Button
                        onClick={() => removeFile(index)}
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full p-0 bg-primary hover:bg-primary/80 text-white shadow-lg border-2 border-white transition-all duration-200 hover:scale-110 z-10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded-md font-medium shadow-sm">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                  
                  {/* 添加更多图片按钮 */}
                  {files.length < MAX_FILES && (
                    <div
                      className="aspect-[3/4] border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => {
                        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                        input?.click();
                      }}
                    >
                      <div className="text-center">
                        <Plus className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">{t("add_image")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
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
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            
            {/* 只在没有图片时显示select_image按钮 */}
            {files.length === 0 && !isCompressing && (
              <Button 
                onClick={() => {
                  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                  input?.click();
                }}
                disabled={isCompressing}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-3 rounded-lg font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isCompressing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("compressing_images")}
                  </>
                ) : (
                  t("select_image")
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 分析按钮 */}
      {files.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* AI思考过程版本选择器 */}
          {/* <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg border">
            <span className="text-sm font-medium text-muted-foreground">思考过程显示:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setThinkingProcessVersion('steps')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  thinkingProcessVersion === 'steps'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Plan B (步骤式)
              </button>
              <button
                onClick={() => setThinkingProcessVersion('stream')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  thinkingProcessVersion === 'stream'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Plan C (流式)
              </button>
            </div>
          </div> */}
          
          <Button
            onClick={analyzeProfileSmart}
            disabled={isAnalyzing || showThinkingProcess || isCompressing}
            size="lg"
            className="px-8"
            variant="default"
          >
            {isCompressing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("compressing_images")}
              </>
            ) : isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("analyzing")}
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-2" />
                {t("analyze_images", { count: files.length })}
              </>
            )}
          </Button>
        </div>
      )}

      {/* 分析思考过程组件 - 根据版本选择渲染不同组件 */}
      {showThinkingProcess && (
        <div className="space-y-6">
          {/* {thinkingProcessVersion === 'steps' ? (
            <AnalysisThinkingProcess 
              files={files}
              locale={locale}
              onStreamComplete={handleThinkingComplete}
              isVisible={showThinkingProcess}
            />
          ) : (
            <AnalysisThinkingProcessStream 
              files={files}
              locale={locale}
              onStreamComplete={handleThinkingComplete}
              isVisible={showThinkingProcess}
            />
          )} */}

          <AnalysisThinkingProcessStream 
              files={files}
              locale={locale}
              onStreamComplete={handleThinkingComplete}
              isVisible={showThinkingProcess}
          />
          
          {/* 假流式分析结果 - 暂时隐藏 */}
          {/* {(fakeStreamText || isFakeStreaming) && (
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-background via-primary/5 to-secondary/5 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-primary/20">
                <CardTitle className="flex items-center text-xl">
                  <div className="relative">
                    <MessageCircle className="w-6 h-6 mr-3 text-primary" />
                    {isFakeStreaming && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {t("ai_multi_analysis_report")}
                  </span>
                  {isFakeStreaming && (
                    <div className="ml-auto flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-muted-foreground">{t("comprehensive_analyzing", { count: files.length })}</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative">
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                  
                  <div className="p-6">
                    <div className="relative">
                      <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-primary to-secondary rounded-full"></div>
                      
                      <div className="pl-6">
                        <StreamTextRenderer text={fakeStreamText} isStreaming={isFakeStreaming} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )} */}
        </div>
      )}

      {/* 分析结果 */}
      {result && (
        <div className="space-y-6">
          {/* 评分卡片 */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">{t("comprehensive_score")}</CardTitle>
              <CardDescription>{t("based_on_analysis", { count: files.length })}</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className={`text-6xl font-bold ${getScoreColor(result.overallScore)}`}>
                {result.overallScore}
              </div>
              <div className="text-xl text-muted-foreground">/ 10</div>
              <Badge 
                variant="secondary" 
                className={`text-lg px-4 py-1 bg-gradient-to-r ${getScoreBackground(result.overallScore)} text-white`}
              >
                {result.overallCategory}
              </Badge>
              
              {/* 自定义进度条 */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                  <div 
                    className={`h-3 rounded-full bg-gradient-to-r ${getScoreBackground(result.overallScore)} transition-all duration-1000 ease-out`}
                    style={{ width: `${result.overallScore * 10}%` }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1 text-center">
                  {t("match_rate", { rate: result.overallScore * 10 })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 每张照片分析 */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center">
              <ImageIcon className="w-5 h-5 mr-2" />
              {t("individual_photo_analysis")}
            </h3>
            
            {/* 调试信息面板 - 开发环境 */}
            {process.env.NODE_ENV === 'development' && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">调试信息:</h4>
                  <div className="text-xs text-yellow-700 space-y-1">
                    <div>总上传图片数: {files.length}</div>
                    <div>预览URL数量: {previewUrls.length}</div>
                    <div>分析结果数量: {result?.photoAnalyses?.length || 0}</div>
                    <div>预览URLs: {previewUrls.map((url, i) => `${i + 1}: ${url.substring(0, 50)}...`).join(' | ')}</div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid gap-6">
              {result.photoAnalyses.map((photo, index) => {
                const imageUrl = previewUrls[photo.photoIndex - 1];
                const isImageAvailable = !!imageUrl;
                
                // 开发环境调试日志
                if (process.env.NODE_ENV === 'development') {
                  console.log(`照片 ${photo.photoIndex} 分析:`, {
                    photoIndex: photo.photoIndex,
                    arrayIndex: photo.photoIndex - 1,
                    imageUrl: imageUrl,
                    isAvailable: isImageAvailable,
                    totalUrls: previewUrls.length
                  });
                }
                
                return (
                  <Card key={index} className="border-l-4 border-l-primary overflow-hidden">
                    <CardContent className="p-0">
                      <div className="grid md:grid-cols-5 gap-0">
                        {/* 左侧图片展示 */}
                        <div className="md:col-span-2 relative">
                          <div className="aspect-[3/4] bg-muted flex items-center justify-center border-r border-border/50">
                            {isImageAvailable ? (
                              <img
                                src={imageUrl}
                                alt={t("photo_number", { num: photo.photoIndex })}
                                className="w-full h-full object-contain"
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
                                <span className="text-xs mt-1 text-red-500">图片URL不可用</span>
                                {process.env.NODE_ENV === 'development' && (
                                  <div className="text-xs mt-2 text-gray-500">
                                    <div>期望索引: {photo.photoIndex - 1}</div>
                                    <div>URL数量: {previewUrls.length}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {/* 评分徽章 */}
                          <div className="absolute top-3 right-3">
                            <Badge 
                              variant="secondary" 
                              className={`text-sm px-3 py-1 bg-gradient-to-r ${getScoreBackground(photo.score)} text-white font-bold shadow-lg`}
                            >
                              {photo.score}/10
                            </Badge>
                          </div>
                          {/* 照片编号 */}
                          <div className="absolute bottom-3 left-3">
                            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
                              {t("photo_number", { num: photo.photoIndex })}
                            </div>
                          </div>
                          {/* 调试信息 - 开发时可以显示，上线时删除 */}
                          {process.env.NODE_ENV === 'development' && (
                            <div className="absolute top-3 left-3 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              索引: {photo.photoIndex - 1} / 总数: {previewUrls.length}
                            </div>
                          )}
                        </div>
                        
                        {/* 右侧分析内容 */}
                        <div className="md:col-span-3 p-6">
                          <div className="space-y-4">
                            {/* 标题和评分 */}
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-semibold">
                                {t("photo_number", { num: photo.photoIndex })}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">{t("score_colon")}:</span>
                                <span className={`text-lg font-bold ${getScoreColor(photo.score)}`}>
                                  {photo.score}/10
                                </span>
                              </div>
                            </div>
                            
                            {/* 评价 */}
                            <div className="bg-muted/50 rounded-lg p-4">
                              <h5 className="font-medium mb-2 text-primary">{t("photo_comment")}:</h5>
                              <p className="text-sm leading-relaxed">{photo.comment}</p>
                            </div>
                            
                            {/* 优势和改进建议 */}
                            <div className="grid gap-4">
                              <div className="bg-green-50/50 rounded-lg p-4 border border-green-200/50">
                                <h5 className="font-medium text-green-700 mb-3 flex items-center">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                  {t("photo_strengths")}
                                </h5>
                                <ul className="space-y-2">
                                  {photo.strengths.map((strength, i) => (
                                    <li key={i} className="flex items-start text-sm">
                                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                      <span className="text-green-800">{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div className="bg-orange-50/50 rounded-lg p-4 border border-orange-200/50">
                                <h5 className="font-medium text-orange-700 mb-3 flex items-center">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                                  {t("photo_improvements")}
                                </h5>
                                <ul className="space-y-2">
                                  {photo.improvements.map((improvement, i) => (
                                    <li key={i} className="flex items-start text-sm">
                                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                      <span className="text-orange-800">{improvement}</span>
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
          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <TrendingUp className="w-5 h-5 mr-2" />
                {t("final_suggestions_title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.finalSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-sm">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 总体评价 */}
          <Card className="border-2 border-purple-200 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-700">
                <Star className="w-5 h-5 mr-2" />
                {t("overall_evaluation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-lg">
                <strong>{t("overall_score_display", { score: result.overallScore })}</strong> - {result.overallCategory}
              </div>
              <div className="text-sm leading-relaxed">
                {result.overallComment}
              </div>
            </CardContent>
          </Card>

          {/* 行动建议 */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">{t("action_title")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("action_description", { count: files.length })}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <a href="/conversation-starter">
                    {t("try_conversation_starter")}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 