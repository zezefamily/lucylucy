"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Sparkles, RotateCcw, Trash2, X, Plus, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import imageCompression from 'browser-image-compression';
import { ConversationStarter } from "@/types/conversation-starter";

// 打字机效果组件
const TypewriterText = ({ 
  text, 
  speed = 30, 
  onComplete 
}: { 
  text: string; 
  speed?: number; 
  onComplete?: () => void;
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setDisplayedText("");
    setIsTyping(true);
    let index = 0;

    const type = () => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
        timeoutRef.current = setTimeout(type, speed);
      } else {
        setIsTyping(false);
        onComplete?.();
      }
    };

    type();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, onComplete]);

  return (
    <span className="inline-block">
      {displayedText}
      {isTyping && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
};

export default function ConversationStarterPage() {
  const t = useTranslations("conversation_starter");
  const params = useParams();
  const locale = params.locale as string;
  
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [result, setResult] = useState<ConversationStarter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleStarters, setVisibleStarters] = useState<number[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // 图片压缩相关状态
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState(0);
  const [compressionStats, setCompressionStats] = useState<{
    originalTotalSize: number;
    compressedTotalSize: number;
    filesCompressed: number;
    totalFiles: number;
  } | null>(null);
  
  // 新增：analysis相关状态
  const [isShowingAnalysis, setIsShowingAnalysis] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisTypingComplete, setAnalysisTypingComplete] = useState(false);
  
  const MAX_FILES = 9;
  
  // 使用 ref 来追踪当前处理的结果，避免重复执行
  const processedResultRef = useRef<ConversationStarter | null>(null);
  const streamingTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const prevLocaleRef = useRef<string>(locale);
  const completedAnalysisRef = useRef<string>('');

  // 使用 useMemo 来稳定 analysis 内容的渲染
  const analysisContent = useMemo(() => {
    if (!result?.analysis) return null;
    
    // 如果已经完成打字或者是同一个analysis内容
    if (analysisTypingComplete || completedAnalysisRef.current === result.analysis) {
      return <span>{result.analysis}</span>;
    }
    
    // 否则显示TypewriterText
    return (
      <TypewriterText 
        key={`analysis-${result.topic}-${locale}-${result.analysis.substring(0, 50)}`}
        text={result.analysis} 
        speed={20}
        onComplete={() => {
          setAnalysisComplete(true); 
          setAnalysisTypingComplete(true);
          if (result.analysis) {
            completedAnalysisRef.current = result.analysis;
          }
        }}
      />
    );
  }, [result?.analysis, result?.topic, locale, analysisTypingComplete]);

  // 清理定时器和预览URL
  useEffect(() => {
    return () => {
      if (streamingTimeoutsRef.current) {
        streamingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      }
      // 清理所有预览URL
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // 清除所有定时器
  const clearStreamingTimeouts = () => {
    streamingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    streamingTimeoutsRef.current = [];
  };

  // 模拟流式输出效果
  useEffect(() => {
    // 如果没有结果，或者已经处理过这个结果，或者正在流式输出，则跳过
    if (!result || processedResultRef.current === result || isStreaming) {
      return;
    }

    // 标记当前结果已处理
    processedResultRef.current = result;
    setIsStreaming(true);
    setVisibleStarters([]);
    setIsShowingAnalysis(false);
    setAnalysisComplete(false);
    setAnalysisTypingComplete(false);

    // 清除之前的定时器
    clearStreamingTimeouts();
    
    // 如果有analysis内容，先显示analysis
    if (result.analysis) {
      // 开始显示analysis
      const analysisTimeout = setTimeout(() => {
        setIsShowingAnalysis(true);
      }, 500);
      streamingTimeoutsRef.current.push(analysisTimeout);
      
      // analysis显示完成后，开始显示starters
      const analysisLength = result.analysis.length;
      const analysisTypingDuration = analysisLength * 20; // 20ms per character
      
      const startersStartTimeout = setTimeout(() => {
        setAnalysisComplete(true);
        
        // 逐行显示开场白
        result.starters.forEach((starter, index) => {
          const timeout = setTimeout(() => {
            setVisibleStarters(prev => [...prev, index]);
            
            // 如果是最后一行，等待打字完成后结束流式效果
            if (index === result.starters.length - 1) {
              const textLength = starter.length;
              const typingDuration = textLength * 30; // 30ms per character
              
              const endTimeout = setTimeout(() => {
                setIsStreaming(false);
              }, typingDuration + 500);
              streamingTimeoutsRef.current.push(endTimeout);
            }
          }, index * 1200); // 每行延迟1200ms
          
          streamingTimeoutsRef.current.push(timeout);
        });
      }, analysisTypingDuration + 1000); // analysis完成后延迟1秒
      
      streamingTimeoutsRef.current.push(startersStartTimeout);
    } else {
      // 没有analysis，直接显示starters
      result.starters.forEach((starter, index) => {
        const timeout = setTimeout(() => {
          setVisibleStarters(prev => [...prev, index]);
          
          if (index === result.starters.length - 1) {
            const textLength = starter.length;
            const typingDuration = textLength * 30;
            
            const endTimeout = setTimeout(() => {
              setIsStreaming(false);
            }, typingDuration + 500);
            streamingTimeoutsRef.current.push(endTimeout);
          }
        }, index * 1200);
        
        streamingTimeoutsRef.current.push(timeout);
      });
    }

    // 清理函数
    return () => {
      clearStreamingTimeouts();
    };
  }, [result]); // 只依赖 result

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      clearStreamingTimeouts();
    };
  }, []);

  // 监听locale变化，重置相关状态
  useEffect(() => {
    // 只有当locale真正发生变化时才重置状态
    if (prevLocaleRef.current !== locale && result) {
      // 语言切换时，如果有结果，重置状态以重新播放动画
      setIsShowingAnalysis(false);
      setAnalysisComplete(false);
      setAnalysisTypingComplete(false);
      setVisibleStarters([]);
      setIsStreaming(false);
      clearStreamingTimeouts();
      // 清理已完成的analysis记录
      completedAnalysisRef.current = '';
      // 不重置processedResultRef，让流式输出效果重新触发
      processedResultRef.current = null;
    }
    // 更新上一次的locale
    prevLocaleRef.current = locale;
  }, [locale]); // 只依赖locale

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
        setResult(null); // 清空之前的结果
        
        // 清理之前的定时器
        clearStreamingTimeouts();
        setIsStreaming(false);
        setIsShowingAnalysis(false);
        setAnalysisComplete(false);
        setAnalysisTypingComplete(false);
        completedAnalysisRef.current = '';
        processedResultRef.current = null;
        
        // 重置压缩统计
        setCompressionStats(null);
        
        // 显示上传成功信息
        const hasCompressed = compressedFiles.some((file, index) => file.size < validFiles[index].size);
        if (hasCompressed) {
          toast.success(t("toast_upload_compressed_success", { count: compressedFiles.length }));
        } else {
          toast.success(t("toast_upload_success", { count: compressedFiles.length }));
        }
      }
    } catch (error) {
      console.error('文件处理失败:', error);
      toast.error(t("toast_upload_failed"));
    }
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
    setVisibleStarters([]);
    setIsShowingAnalysis(false);
    setAnalysisComplete(false);
    setAnalysisTypingComplete(false);
    
    // 清理定时器
    clearStreamingTimeouts();
    setIsStreaming(false);
    completedAnalysisRef.current = '';
    processedResultRef.current = null;
    
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

  const handleGenerate = async () => {
    if (files.length === 0) {
      toast.error(t("upload_error"));
      return;
    }

    // 清理之前的状态和定时器
    clearStreamingTimeouts();
    setIsLoading(true);
    setResult(null);
    setVisibleStarters([]);
    setIsShowingAnalysis(false);
    setAnalysisComplete(false);
    setAnalysisTypingComplete(false);
    setIsStreaming(false);
    completedAnalysisRef.current = '';
    processedResultRef.current = null;
    
    try {
      // 创建FormData对象，支持多文件
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      formData.append('fileCount', files.length.toString());
      formData.append('locale', locale);
      
      const response = await fetch("/api/conversation-starter-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.code === 0 && data.data?.starters?.length > 0) {
        const resultData = {
          starters: data.data.starters,
          topic: data.data.topic,
          analysis: data.data.analysis
        };
        setResult(resultData);
        toast.success(t("toast_analysis_complete"));
      } else {
        toast.error(data.message || t("no_results"));
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      // 检查是否支持现代 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success(t("copied"));
        return;
      }
      
      // Fallback: 使用传统的 execCommand 方法
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast.success(t("copied"));
      } else {
        throw new Error('execCommand failed');
      }
    } catch (error) {
      console.error("Failed to copy:", error);
      
      // 最终 fallback: 提示用户手动复制
      if (typeof window !== 'undefined') {
        // 尝试选中文本让用户手动复制
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          const range = document.createRange();
          const textNode = document.createTextNode(text);
          document.body.appendChild(textNode);
          range.selectNode(textNode);
          selection.addRange(range);
          
          toast.info(t("copy_manual_hint") || "Please manually copy the selected text (Ctrl+C / Cmd+C)");
          
          // 3秒后清理
          setTimeout(() => {
            document.body.removeChild(textNode);
            selection.removeAllRanges();
          }, 3000);
        } else {
          toast.error(t("toast_copy_failed"));
        }
      } else {
        toast.error(t("toast_copy_failed"));
      }
    }
  };

  const handleClear = () => {
    clearStreamingTimeouts();
    setResult(null);
    setVisibleStarters([]);
    setIsShowingAnalysis(false);
    setAnalysisComplete(false);
    setAnalysisTypingComplete(false);
    setIsStreaming(false);
    completedAnalysisRef.current = '';
    processedResultRef.current = null;
  };

  const handleTryAgain = () => {
    if (files.length > 0) {
      handleGenerate();
    }
  };

  // 使用专业的图片压缩库进行压缩
  const compressImage = async (file: File): Promise<File> => {
    try {
      const fileSizeMB = file.size / (1024 * 1024);
      
      // 高级压缩配置 - 更激进的压缩设置
      let options = {
        maxSizeMB: 0.6, // 目标大小0.8MB，更适合网络传输
        maxWidthOrHeight: 800, // 最大宽高1024px
        useWebWorker: true, // 使用Web Worker提升性能
        fileType: file.type as any, // 保持原始格式
        initialQuality: 0.75, // 初始质量略微降低
        alwaysKeepResolution: false, // 允许降低分辨率
        maxIteration: 10, // 最大压缩迭代次数
        exifOrientation: 1, // 处理图片方向
        preserveExif: false, // 移除EXIF数据减小文件
      };
      
      // 根据原始文件大小智能调整压缩参数
      if (fileSizeMB > 8) {
        options = {
          ...options,
          maxSizeMB: 0.6, // 大文件压缩得更小
          maxWidthOrHeight: 800,
          initialQuality: 0.4,
          maxIteration: 15,
        };
      } else if (fileSizeMB > 5) {
        options = {
          ...options,
          maxSizeMB: 0.7,
          maxWidthOrHeight: 900,
          initialQuality: 0.5,
          maxIteration: 12,
        };
      } else if (fileSizeMB > 2) {
        // 2-5MB的文件，适度压缩
        options = {
          ...options,
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1024,
          initialQuality: 0.6,
          maxIteration: 10,
        };
      } else {
        // 1-2MB的文件，轻度压缩保持质量
        options = {
          ...options,
          maxSizeMB: 0.9,
          maxWidthOrHeight: 1200,
          initialQuality: 0.75,
          maxIteration: 8,
        };
      }
      
      // 如果是PNG格式且较大，考虑转换为JPEG以获得更好的压缩
      if (file.type === 'image/png' && fileSizeMB > 2) {
        console.log(`PNG文件较大，尝试转换为JPEG格式: ${file.name}`);
        options.fileType = 'image/jpeg';
        options.initialQuality = Math.max(0.4, options.initialQuality - 0.1);
      }
      
      console.log(`开始压缩: ${file.name} (${fileSizeMB.toFixed(1)}MB)`, options);
      
      const compressedFile = await imageCompression(file, options);
      
      // 如果压缩后文件还是很大，进行二次压缩
      const compressedSizeMB = compressedFile.size / (1024 * 1024);
      if (compressedSizeMB > 1.0 && options.initialQuality > 0.3) {
        console.log(`文件仍然较大，进行二次压缩: ${compressedSizeMB.toFixed(1)}MB`);
        const secondOptions = {
          ...options,
          maxSizeMB: 0.8,
          initialQuality: Math.max(0.3, options.initialQuality - 0.2),
          maxWidthOrHeight: Math.max(800, options.maxWidthOrHeight - 200),
        };
        
        return await imageCompression(compressedFile, secondOptions);
      }
      
      return compressedFile;
    } catch (error) {
      console.error('图片压缩失败:', error);
      throw error;
    }
  };

  // 批量压缩图片
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
        if (fileSizeMB <= 1) {
          // 小于1MB，不压缩 - 已经足够小且质量适中
          compressedFiles.push(file);
          compressedTotalSize += file.size;
          console.log(`跳过压缩: ${file.name} (${fileSizeMB.toFixed(1)}MB - 文件已足够小)`);
        } else {
          // 大于1MB需要压缩 - 优化网络传输和服务器性能
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
            // toast.warning(t("compress_fallback", { name: fileName }));
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
          <Heart className="w-8 h-8 text-primary" />
          {t("title")}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t("description")}
        </p>
      </div>

      {/* 图片上传区域 */}
      {/* <div className="text-center mb-8"> */}
        {/* 喇叭图标和标题
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.5 3A2.5 2.5 0 0 1 21 5.5c0 .44-.06.86-.17 1.25l1.49 2.61A1 1 0 0 1 21.45 11H18a7 7 0 0 1-6.85 5.61l-.15.01V17a2 2 0 0 1-2 2H8a1 1 0 0 1-1-1v-4.66A6.8 6.8 0 0 1 6 13H2.55a1 1 0 0 1-.87-1.36l1.48-2.61A2.52 2.52 0 0 1 3 8.5A2.5 2.5 0 0 1 5.5 6c.06 0 .12 0 .18.01A2.5 2.5 0 0 1 8 4.5c.44 0 .86.06 1.25.17L11.86 3.18A1 1 0 0 1 13.23 4.55L11.74 7.17c.17.39.26.81.26 1.25a2.5 2.5 0 0 1-2.18 2.48c-.06 0-.12.01-.18.01A2.5 2.5 0 0 1 7.5 9c0-.44.06-.86.17-1.25L6.18 5.14A1 1 0 0 1 7.55 3.77L9.83 6.26c.39-.17.81-.26 1.25-.26A2.5 2.5 0 0 1 18.5 3z"/>
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t("profile_screenshot_title")}
          </h2>
        </div> */}
        
        {/* 副标题
        <p className="text-lg text-gray-600 mb-8">
          {t("profile_screenshot_subtitle")}
        </p> */}
      {/* </div> */}

      <Card className="mb-8 border-2 border-dashed border-purple-300 hover:border-purple-500 transition-colors bg-gradient-to-br from-purple-50/30 via-white to-blue-50/30">
        {/* <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            {t("upload_title")}
          </CardTitle>
          <CardDescription>
            {t("upload_description")}
          </CardDescription>
        </CardHeader> */}
        <CardContent className="space-y-4">
          <div
            className={`relative flex flex-col items-center justify-center space-y-6 min-h-[320px] ${
              dragActive ? 'bg-purple-500/5' : ''
            } ${isCompressing ? 'opacity-60 pointer-events-none' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {/* 压缩进度显示 */}
            {isCompressing && (
              <div className="w-full max-w-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-600">
                    {t("compressing_images")}
                  </span>
                  <span className="text-sm text-gray-600">
                    {compressProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${compressProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1 text-center">
                  {t("compress_tip")}
                </p>
              </div>
            )}
            
            {files.length === 0 && !isCompressing && (
              <div className="text-center space-y-6">
                {/* 上传图标 - 使用用户提供的图片 */}
                <div className="w-50 h-50 md:w-50 md:h-50 mx-auto flex items-center justify-center">
                  <img 
                    src="/imgs/lucy/conversation_starter_upload_icon.png" 
                    alt={t("upload_icon_alt")}
                    className="w-full h-full object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                {/* 文案 */}
                <div className="space-y-3">
                  <p className="text-xl md:text-2xl font-medium text-gray-800">
                    {t("drag_upload_text")}
                  </p>
                  <p className="text-sm md:text-base text-gray-500">
                    {t("upload_format_tip")}
                  </p>
                </div>
              </div>
            )}
            
            {/* 已上传图片预览 */}
            {/* {files.length > 0 && !isCompressing && (
              <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center">
                <img 
                  src="/imgs/lucy/conversation_starter_upload_icon.png" 
                  alt={t("upload_icon_alt")}
                  className="w-12 h-12 object-contain opacity-70"
                />
              </div>
            )} */}
            
            {/* 图片预览网格 */}
            {files.length > 0 && (
              <div className="mt-4 w-full">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    {t("image_count", { count: files.length })} / {MAX_FILES}
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
                    {t("clear_images")}
                  </Button>
                </div>
                
                {/* 压缩统计显示 */}
                {compressionStats && compressionStats.filesCompressed > 0 && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        {t("compression_stats")}
                      </div>
                      <div className="text-green-600 font-medium">
                        {t("saved_space", {
                          saved: ((compressionStats.originalTotalSize - compressionStats.compressedTotalSize) / (1024 * 1024)).toFixed(1),
                          percent: ((1 - compressionStats.compressedTotalSize / compressionStats.originalTotalSize) * 100).toFixed(0)
                        })}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-green-600">
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
                          alt={t("image_preview_alt", { index: index + 1 })}
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
                        <Plus className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                        <p className="text-xs text-gray-600">{t("add_more")}</p>
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
            
            {/* 只在没有图片时显示Choose image按钮 */}
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
                  t("choose_image")
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 生成按钮 - 移出Card外部 */}
      {files.length > 0 && (
        <div className="flex justify-center mb-8">
          <Button
            onClick={handleGenerate}
            disabled={isLoading || isStreaming || isCompressing}
            size="lg"
            className="px-8 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isCompressing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("compressing_images")}
              </>
            ) : isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {t("generating")}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {t("generate")}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
              {t("generating")}
            </CardTitle>
            <CardDescription>
              {t("analyzing_tip")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Results with Streaming Effect */}
      {result && !isLoading && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                {t("result_title")}
              </CardTitle>
              <CardDescription className="mt-1">
                {t("result_description")} • {t("based_on_photos", { count: files.length })} • {t("success_tip")}
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTryAgain}
                disabled={isLoading || isStreaming}
                className="flex-1 sm:flex-none"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t("try_again")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={isStreaming}
                className="flex-1 sm:flex-none"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t("clear")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Lucy的分析思考过程 */}
            {result.analysis && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">L</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("lucy_analysis_title")}
                  </h3>
                </div>
                
                <div className={`transition-opacity duration-700 ease-out ${
                  isShowingAnalysis ? 'opacity-100' : 'opacity-0'
                }`}>
                  {isShowingAnalysis && (
                    <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-lg p-4 border border-purple-200/50">
                      <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                        {analysisContent}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 分隔线 */}
                {analysisComplete && (
                  <div className="mt-6 mb-4 flex items-center">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
                    <div className="px-4 text-sm font-medium text-purple-600">
                      {t("recommended_starters")}
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
                  </div>
                )}
              </div>
            )}
            
            {/* 显示已流式输出的开场白 */}
            {result.starters.map((starter, index) => (
              <div
                key={`starter-wrapper-${index}`}
                className={`transition-opacity duration-700 ease-out ${
                  visibleStarters.includes(index)
                    ? 'opacity-100'
                    : 'opacity-0'
                }`}
              >
                {visibleStarters.includes(index) && (
                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors duration-300 group shadow-sm hover:shadow-md">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-sm font-medium text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1 text-sm leading-relaxed">
                      <TypewriterText 
                        key={`starter-${index}-${result.topic}-${locale}-${starter.substring(0, 30)}`}
                        text={starter} 
                        speed={30}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(starter)}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            {/* 正在流式输出时显示的加载指示器 */}
            {isStreaming && visibleStarters.length < result.starters.length && (
              <div 
                key="loading-indicator" 
                className="flex items-start gap-3 p-4 rounded-lg border bg-card/50 opacity-60 animate-pulse"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-sm font-medium text-white">
                  {visibleStarters.length + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-muted rounded flex-1 animate-pulse"></div>
                    <div className="h-2 bg-muted rounded w-20 animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-muted rounded w-3/4 animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}

            {/* 成功提示 */}
            {!isStreaming && result && visibleStarters.length === result.starters.length && (
              <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {t("completion_message")}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}