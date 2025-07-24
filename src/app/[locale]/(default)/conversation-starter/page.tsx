"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Sparkles, RotateCcw, Trash2, X, Plus, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import imageCompression from 'browser-image-compression';
import { ConversationStarter } from "@/types/conversation-starter";
import { useAppContext } from "@/contexts/app";
import { SubscriptionTier } from "@/types/user";

// 打字机效果组件
const TypewriterText = ({ 
  text, 
  speed = 30, 
  onComplete,
  onTextChange
}: { 
  text: string; 
  speed?: number; 
  onComplete?: () => void;
  onTextChange?: (currentText: string) => void;
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
        const newText = text.slice(0, index + 1);
        setDisplayedText(newText);
        onTextChange?.(newText); // 通知父组件文本更新
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
  }, [text, speed, onComplete, onTextChange]);

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
  const { user, userCredits, setShowSignModal, setShowPricingModal, refreshUserCredits } = useAppContext();
  
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [result, setResult] = useState<ConversationStarter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleStarters, setVisibleStarters] = useState<number[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // 新增：跟踪每个开场白的完成状态
  const [completedStarters, setCompletedStarters] = useState<Set<number>>(new Set());
  
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
  const [isAnalyzing, setIsAnalyzing] = useState(false); // 新增：正在分析状态
  
  // 新增：自动滚动相关
  const analysisContentRef = useRef<HTMLDivElement>(null);
  const isAutoScrollRef = useRef<boolean>(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const MAX_FILES = 9;
  
  // 使用 ref 来追踪当前处理的结果，避免重复执行
  const processedResultRef = useRef<ConversationStarter | null>(null);
  const streamingTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const prevLocaleRef = useRef<string>(locale);
  const completedAnalysisRef = useRef<string>('');

  // 自动滚动到底部 - 使用 useCallback 确保函数稳定
  const scrollToBottom = useCallback(() => {
    if (analysisContentRef.current && isAutoScrollRef.current) {
      analysisContentRef.current.scrollTop = analysisContentRef.current.scrollHeight;
    }
  }, []);

  // 检查用户是否在底部附近
  const handleAnalysisScroll = useCallback(() => {
    if (analysisContentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = analysisContentRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      const needsScroll = scrollHeight > clientHeight;
      
      isAutoScrollRef.current = isNearBottom;
      setShowScrollButton(needsScroll && !isNearBottom && isShowingAnalysis && !analysisTypingComplete);
    }
  }, [isShowingAnalysis, analysisTypingComplete]);

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
          setIsAnalyzing(false); // Lucy 分析完成，重置分析状态
          if (result.analysis) {
            completedAnalysisRef.current = result.analysis;
          }
        }}
        onTextChange={scrollToBottom}
      />
    );
  }, [result?.analysis, result?.topic, locale, analysisTypingComplete, scrollToBottom]);

  // 当分析内容更新时自动滚动
  useEffect(() => {
    if (isShowingAnalysis && !analysisTypingComplete) {
      scrollToBottom();
      
      // 延迟检查滚动状态，确保DOM已更新
      const timer = setTimeout(() => {
        handleAnalysisScroll();
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      // 分析完成时隐藏滚动按钮
      setShowScrollButton(false);
    }
  }, [analysisContent, isShowingAnalysis, analysisTypingComplete, scrollToBottom, handleAnalysisScroll]);

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
    setCompletedStarters(new Set()); // 清空完成状态
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
        
        // 逐行显示开场白 - 改为递归方式确保按顺序显示
        const showNextStarter = (index: number) => {
          if (index >= result.starters.length) {
            // 所有开场白都显示完成
            const finalTimeout = setTimeout(() => {
              setIsStreaming(false);
            }, 500);
            streamingTimeoutsRef.current.push(finalTimeout);
            return;
          }
          
          // 显示当前开场白
          const timeout = setTimeout(() => {
            setVisibleStarters(prev => [...prev, index]);
            
            // 等待当前开场白打字完成后再显示下一条
            const starter = result.starters[index];
            const typingDuration = starter.length * 30; // 30ms per character
            
            const nextTimeout = setTimeout(() => {
              showNextStarter(index + 1);
            }, typingDuration + 300); // 每条完成后等待300ms再显示下一条
            
            streamingTimeoutsRef.current.push(nextTimeout);
          }, index === 0 ? 500 : 0); // 第一条延迟500ms，后续条目立即开始
          
          streamingTimeoutsRef.current.push(timeout);
        };
        
        showNextStarter(0);
      }, analysisTypingDuration + 1000); // analysis完成后延迟1秒
      
      streamingTimeoutsRef.current.push(startersStartTimeout);
    } else {
      // 没有analysis，立即重置分析状态并直接显示starters
      setIsAnalyzing(false);
      
      // 使用相同的递归方式显示开场白
      const showNextStarter = (index: number) => {
        if (index >= result.starters.length) {
          // 所有开场白都显示完成
          const finalTimeout = setTimeout(() => {
            setIsStreaming(false);
          }, 500);
          streamingTimeoutsRef.current.push(finalTimeout);
          return;
        }
        
        // 显示当前开场白
        const timeout = setTimeout(() => {
          setVisibleStarters(prev => [...prev, index]);
          
          // 等待当前开场白打字完成后再显示下一条
          const starter = result.starters[index];
          const typingDuration = starter.length * 30; // 30ms per character
          
          const nextTimeout = setTimeout(() => {
            showNextStarter(index + 1);
          }, typingDuration + 300); // 每条完成后等待300ms再显示下一条
          
          streamingTimeoutsRef.current.push(nextTimeout);
        }, index === 0 ? 500 : 0); // 第一条延迟500ms，后续条目立即开始
        
        streamingTimeoutsRef.current.push(timeout);
      };
      
      showNextStarter(0);
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
      setCompletedStarters(new Set()); // 重置完成状态
      setIsStreaming(false);
      setShowScrollButton(false);
      setIsAnalyzing(false);
      clearStreamingTimeouts();
      // 清理已完成的analysis记录
      completedAnalysisRef.current = '';
      // 重置滚动状态
      isAutoScrollRef.current = true;
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
        setIsAnalyzing(false);
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
    setShowScrollButton(false);
    setIsAnalyzing(false);
    
    // 清理定时器
    clearStreamingTimeouts();
    setIsStreaming(false);
    completedAnalysisRef.current = '';
    processedResultRef.current = null;
    // 重置滚动状态
    isAutoScrollRef.current = true;
    
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

    // 1. 检查用户登录状态
    if (!user) {
      // toast.warning(locale === 'zh' ? "请先登录以使用开场白生成功能" : "Please login to use conversation starter feature");
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
      // Elite 用户直接放行
      console.log('Elite 用户，直接放行');
    } else {
      // 非 Elite 用户检查积分
      const requiredCredits = 10;
      const availableCredits = userCredits?.left_credits || 0;
      
      if (availableCredits < requiredCredits) {
        // 积分不足，弹出 Pricing 弹窗
        // toast.warning(
        //   locale === 'zh' 
        //     ? `生成开场白需要 ${requiredCredits} 积分，当前剩余 ${availableCredits} 积分，请充值后继续`
        //     : `Generating conversation starters requires ${requiredCredits} credits, you have ${availableCredits} credits remaining, please top up to continue`
        // );
        setShowPricingModal?.(true);
        return;
      } else {
        // 积分充足，放行并提示扣费
        // toast.info(
        //   locale === 'zh' 
        //     ? `本次生成将消耗 ${requiredCredits} 积分，剩余 ${availableCredits - requiredCredits} 积分`
        //     : `This generation will consume ${requiredCredits} credits, ${availableCredits - requiredCredits} credits remaining`
        // );
      }
    }

    // 立即设置分析状态，阻止其他卡片显示
    setIsAnalyzing(true);
    
    // 清理之前的状态和定时器
    clearStreamingTimeouts();
    setIsLoading(true);
    setResult(null);
    setVisibleStarters([]);
    setIsShowingAnalysis(false);
    setAnalysisComplete(false);
    setAnalysisTypingComplete(false);
    setIsStreaming(false);
    setShowScrollButton(false);
    completedAnalysisRef.current = '';
    processedResultRef.current = null;
    // 重置滚动状态
    isAutoScrollRef.current = true;
    
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
        
        // 刷新用户积分余额
        refreshUserCredits?.();
        
        // 如果没有分析内容，立即重置分析状态
        if (!data.data.analysis) {
          setIsAnalyzing(false);
        }
      } else {
        toast.error(data.message || t("no_results"));
        // 请求失败时重置分析状态
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(t("error"));
      // 请求出错时重置分析状态
      setIsAnalyzing(false);
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
    setCompletedStarters(new Set()); // 重置完成状态
    setIsShowingAnalysis(false);
    setAnalysisComplete(false);
    setAnalysisTypingComplete(false);
    setIsStreaming(false);
    setShowScrollButton(false);
    setIsAnalyzing(false);
    completedAnalysisRef.current = '';
    processedResultRef.current = null;
    // 重置滚动状态
    isAutoScrollRef.current = true;
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
      
      // 检测是否是Safari浏览器
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      // 高级压缩配置 - 更激进的压缩设置
      let options = {
        maxSizeMB: 0.6, // 目标大小0.8MB，更适合网络传输
        maxWidthOrHeight: 800, // 最大宽高1024px
        useWebWorker: !isSafari, // Safari浏览器禁用Web Worker
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
      if (file.type === 'image/png' && fileSizeMB > 2) {
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
    <div className="min-h-screen bg-gradient-fluid relative overflow-hidden">
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-primary rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-secondary rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-gradient-accent rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-16">
            <div className="relative inline-block">
              <h1 className="text-4xl md:text-6xl font-bold text-gradient-primary mb-6 float-animation flex items-center justify-center gap-3">
                <Heart className="w-12 h-12 md:w-16 md:h-16 text-primary" />
                {t("title")}
              </h1>
              <div className="absolute -inset-4 bg-gradient-primary rounded-full blur-2xl opacity-20 animate-pulse"></div>
            </div>
            <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed">
              {t("description")}
            </p>
          </div>

          {/* 图片上传区域 */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-10"></div>
            <div className="relative">
              <Card className="card-glass border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-primary/5 via-card to-secondary/5">
                <CardContent className="space-y-4">
                  <div
                    className={`relative flex flex-col items-center justify-center space-y-6 min-h-[320px] ${
                      dragActive ? 'bg-primary/10' : ''
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
                          <span className="text-sm font-medium text-primary">
                            {t("compressing_images")}
                          </span>
                          <span className="text-sm text-foreground/60">
                            {compressProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-gradient-primary h-2 rounded-full transition-all duration-300 ease-out glow-primary"
                            style={{ width: `${compressProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-foreground/60 mt-1 text-center">
                          {t("compress_tip")}
                        </p>
                      </div>
                    )}
                    
                    {files.length === 0 && !isCompressing && (
                      <div className="text-center space-y-6">
                        {/* 上传图标 */}
                        <div className="w-50 h-50 md:w-50 md:h-50 mx-auto flex items-center justify-center">
                          <img 
                            src="/imgs/lucy/conversation_starter_upload_icon.png" 
                            alt={t("upload_icon_alt")}
                            className="w-full h-full object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300 animate-breathe"
                          />
                        </div>
                        
                        {/* 文案 */}
                        <div className="space-y-3">
                          <h3 className="text-2xl font-bold text-gradient-primary">
                            {t("drag_upload_text")}
                          </h3>
                          <p className="text-sm md:text-base text-foreground/70">
                            {t("upload_format_tip")}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* 图片预览网格 */}
                    {files.length > 0 && (
                      <div className="mt-4 w-full">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm text-foreground/70">
                            {t("image_count", { count: files.length })} / {MAX_FILES}
                          </p>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearAllFiles();
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive/80 relative z-10"
                          >
                            {t("clear_images")}
                          </Button>
                        </div>
                        
                        {/* 压缩统计显示 */}
                        {compressionStats && compressionStats.filesCompressed > 0 && (
                          <div className="mb-4 p-3 bg-accent-green/10 border border-accent-green/20 rounded-lg">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center text-accent-green">
                                <div className="w-2 h-2 bg-accent-green rounded-full mr-2"></div>
                                {t("compression_stats")}
                              </div>
                              <div className="text-accent-green font-medium">
                                {t("saved_space", {
                                  saved: ((compressionStats.originalTotalSize - compressionStats.compressedTotalSize) / (1024 * 1024)).toFixed(1),
                                  percent: ((1 - compressionStats.compressedTotalSize / compressionStats.originalTotalSize) * 100).toFixed(0)
                                })}
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-accent-green/80">
                              {t("files_compressed", { compressed: compressionStats.filesCompressed, total: compressionStats.totalFiles })}
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {previewUrls.map((url, index) => (
                            <div key={index} className="relative group">
                              {/* 图片容器 - 移除overflow-hidden避免裁剪按钮 */}
                              <div className="aspect-[3/4] bg-muted rounded-lg shadow-md border border-border/50 elevation-1 hover:elevation-2 transition-all duration-300">
                                <img
                                  src={url}
                                  alt={t("image_preview_alt", { index: index + 1 })}
                                  className="w-full h-full object-contain rounded-lg"
                                />
                                
                                {/* 删除按钮 - 优化颜色显示，浮在照片右上角 */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeFile(index);
                                  }}
                                  className="absolute top-1 right-1 w-8 h-8 rounded-full bg-primary/90 hover:bg-primary text-white shadow-lg hover:shadow-xl z-[60] flex items-center justify-center border-2 border-white/80 hover:scale-110 transition-all duration-200 backdrop-blur-sm"
                                  type="button"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                
                                {/* 编号标签 - 左下角，优化颜色显示 */}
                                <div className="absolute bottom-2 left-2 w-6 h-6 bg-primary/90 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg z-[50] border-2 border-white/80 backdrop-blur-sm">
                                  {index + 1}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* 添加更多图片按钮 */}
                          {files.length < MAX_FILES && (
                            <div
                              className="aspect-[3/4] border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/20"
                              onClick={() => {
                                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                                input?.click();
                              }}
                            >
                              <div className="text-center">
                                <Plus className="w-6 h-6 text-foreground/60 mx-auto mb-1" />
                                <p className="text-xs text-foreground/60">{t("add_more")}</p>
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
                        className={`btn-modern bg-gradient-primary hover:bg-gradient-primary/90 text-white px-8 py-3 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-300 glow-primary ${
                          !isCompressing ? 'animate-wiggle-interval' : ''
                        }`}
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
            </div>
          </div>

          {/* 生成按钮 */}
          {files.length > 0 && (
            <div className="flex justify-center mb-8">
              <Button
                onClick={handleGenerate}
                disabled={isLoading || isStreaming || isCompressing}
                size="lg"
                className={`btn-modern px-8 bg-gradient-primary hover:bg-gradient-primary/90 text-white font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-300 glow-primary hover-lift`}
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

          {/* Results with Streaming Effect */}
          {(result || isLoading) && (
            <div className="space-y-6">
              {/* Lucy的分析思考过程 - 独立卡片模块 */}
              {(isLoading || isAnalyzing || (result && result.analysis)) && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-secondary rounded-3xl blur-3xl opacity-10"></div>
                  <div className="relative">
                    <Card className="pt-0 border-1 border-primary/20 bg-gradient-to-br from-primary/5 via-white to-secondary/5 shadow-lg card-glass">
                      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-primary/20 flex items-center h-16 rounded-t-2xl">
                        <CardTitle className="pt-6 flex items-center justify-between text-xl w-full min-h-[2.5rem]">
                          <div className="flex items-center">
                            {/* 爱心图标 */}
                            <span className={`mr-2 text-primary transition-all duration-1000 ${
                              (isLoading || isAnalyzing || (isShowingAnalysis && !analysisTypingComplete)) ? 'animate-pulse' : ''
                            }`}>
                              <Heart className="w-5 h-5" />
                            </span>
                            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                              {t("lucy_analysis_title")}
                            </span>
                          </div>
                          
                          {/* 状态指示器 */}
                          {(isLoading || isAnalyzing || (isShowingAnalysis && !analysisTypingComplete)) && (
                            <div className="flex items-center space-x-2 text-sm text-primary">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>
                                {(isLoading || isAnalyzing) ? t("generating") : t("thinking_in_progress")}
                              </span>
                            </div>
                          )}
                          
                          {!isLoading && !isAnalyzing && analysisTypingComplete && (
                            <div className="flex items-center space-x-2 text-sm text-green-600">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span>{t("thinking_complete")}</span>
                            </div>
                          )}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="p-0">
                        {(isLoading || isAnalyzing) && !result ? (
                          // 加载或分析状态显示
                          <div className="p-6">
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <span className="text-sm text-primary ml-2">{t("analyzing_tip")}</span>
                              </div>
                            </div>
                          </div>
                        ) : result?.analysis ? (
                          // 有分析内容时显示
                          <div className={`transition-opacity duration-700 ease-out ${
                            isShowingAnalysis ? 'opacity-100' : 'opacity-0'
                          }`}>
                            {isShowingAnalysis && (
                              <div className="relative">
                                {/* 动态高度的内容容器 */}
                                <div 
                                  ref={analysisContentRef}
                                  onScroll={handleAnalysisScroll}
                                  className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/60 scrollbar-track-gray-100 p-6"
                                  style={{
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: 'hsl(var(--primary)) #f3f4f6'
                                  }}
                                >
                                  {/* 渐变背景装饰 */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none"></div>
                                  
                                  <div className="relative z-10">
                                    <div className="text-sm leading-relaxed text-primary dark:text-primary whitespace-pre-wrap">
                                      {analysisContent}
                                      
                                      {/* 打字机指示器 */}
                                      {isShowingAnalysis && !analysisTypingComplete && (
                                        <div className="flex items-center space-x-2 mt-4">
                                          <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* 上下边缘模糊过渡遮罩 */}
                                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white via-white/60 to-transparent pointer-events-none z-20"></div>
                                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none z-20"></div>
                                
                                {/* 滚动提示 - 当用户不在底部且正在流式输出时显示 */}
                                {showScrollButton && (
                                  <div className="absolute bottom-2 right-2">
                                    <button
                                      onClick={scrollToBottom}
                                      className="px-3 py-1 bg-primary text-white text-xs rounded-full shadow-lg hover:bg-primary/80 transition-colors"
                                    >
                                      {locale === 'zh' ? '↓ 查看最新' : '↓ View Latest'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : result && !result.analysis ? (
                          // 没有分析内容时显示占位符
                          <div className="p-6">
                            <div className="text-center text-muted-foreground py-4">
                              <span className="text-sm">{t("no_analysis_available") || "暂无分析内容"}</span>
                            </div>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* 开场白结果卡片 */}
              {!isLoading && !isAnalyzing && result && (!result.analysis || analysisTypingComplete) && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-accent rounded-3xl blur-3xl opacity-10"></div>
                  <div className="relative">
                    <Card className="card-glass">
                      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Heart className="w-5 h-5 text-primary" />
                            {t("result_title")}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {result.topic && (
                              <span className="inline-block bg-gradient-primary text-white px-3 py-1 rounded-full text-sm font-medium mr-2 mb-2">
                                {result.topic}
                              </span>
                            )}
                            {t("result_description")} • {t("based_on_photos", { count: files.length })} • {t("success_tip")}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleTryAgain}
                            disabled={isLoading || isStreaming}
                            className="flex-1 sm:flex-none hover-lift"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            {t("try_again")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClear}
                            disabled={isStreaming}
                            className="flex-1 sm:flex-none hover-lift"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t("clear")}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* 分隔线 */}
                        {result.analysis && analysisTypingComplete && (
                          <div className="mb-4 flex items-center">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                            <div className="px-4 text-sm font-medium text-primary">
                              {t("recommended_starters")}
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                          </div>
                        )}
                        
                        {/* 显示已流式输出的开场白 */}
                        {result.starters.map((starter, index) => {
                          // 为每个starter创建稳定的key，避免重复刷新
                          const isVisible = visibleStarters.includes(index);
                          const isCompleted = completedStarters.has(index);
                          
                          return (
                            <div
                              key={`starter-${index}-${result.topic || 'unknown'}`}
                              className={`transition-opacity duration-700 ease-out ${
                                isVisible ? 'opacity-100' : 'opacity-0'
                              }`}
                            >
                              {isVisible && (
                                <div className="flex items-start gap-3 p-4 rounded-xl border bg-card/50 hover:bg-accent/20 transition-all duration-300 group elevation-1 hover:elevation-2 hover-lift">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-medium text-white glow-primary">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 text-sm leading-relaxed text-foreground">
                                    {isCompleted ? (
                                      // 已完成的开场白直接显示完整文本
                                      <span>{starter}</span>
                                    ) : (
                                      // 未完成的开场白使用打字机效果
                                      <TypewriterText 
                                        key={`starter-typing-${index}-${result.topic || 'unknown'}`}
                                        text={starter || '开场白内容加载中...'} 
                                        speed={30}
                                        onComplete={() => {
                                          console.log('TypewriterText completed for index:', index);
                                          // 标记该开场白为已完成
                                          setCompletedStarters(prev => new Set(prev).add(index));
                                        }}
                                        onTextChange={(currentText) => {
                                          // 可选：跟踪打字进度
                                        }}
                                      />
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopy(starter)}
                                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 hover-lift"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* 正在流式输出时显示的加载指示器 */}
                        {isStreaming && visibleStarters.length < result.starters.length && (
                          <div 
                            key="loading-indicator" 
                            className="flex items-start gap-3 p-4 rounded-xl border bg-card/30 opacity-60 animate-pulse"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-medium text-white">
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
                          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 elevation-1">
                            <div className="flex items-center space-x-2">
                              <Heart className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-primary">
                                {t("completion_message")} 
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
    </div>
  );
}