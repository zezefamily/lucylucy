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
import { motion } from "framer-motion";

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
  const CACHE_KEY = 'conversation_starter_photos';
  
  // 使用 ref 来追踪当前处理的结果，避免重复执行
  const processedResultRef = useRef<ConversationStarter | null>(null);
  const streamingTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const prevLocaleRef = useRef<string>(locale);
  const completedAnalysisRef = useRef<string>('');

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
        const newFiles = [...files, ...compressedFiles];
        setFiles(newFiles);
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        
        // 保存照片到本地缓存
        savePhotosToCache(newFiles);
        
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
    setVisibleStarters([]);
    setIsShowingAnalysis(false);
    setAnalysisComplete(false);
    setAnalysisTypingComplete(false);
    setShowScrollButton(false);
    setIsAnalyzing(false);
    
    // 清理照片缓存
    clearPhotosCache();
    
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
      {/* 文件上传区域 - 采用 Lucy Hero 风格，撑满屏幕 */}
      <section className="relative w-full min-h-screen lg:min-h-[80vh] xl:min-h-[70vh] overflow-hidden">
        {/* 渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF64DC] to-[#FFA8F5]" />
        
        {/* 左上角贝塞尔曲线装饰 */}
        <motion.div 
          className="absolute top-0 left-0 pointer-events-none"
          initial={{ opacity: 0, scale: 0.8, x: -50, y: -50 }}
          animate={{ opacity: 0.3, scale: 1, x: 0, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
        >
          <svg 
            width="400" 
            height="300" 
            viewBox="0 0 400 300" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path 
              d="M0 0 C120 0, 180 60, 200 120 C220 180, 160 240, 80 260 C40 270, 0 250, 0 200 Z" 
              fill="#FF64DC"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.8 }}
            />
          </svg>
        </motion.div>
        
        {/* 主要内容容器 */}
        <div className="relative z-10 min-h-screen lg:min-h-[80vh] xl:min-h-[70vh] flex items-center py-8 lg:py-16 xl:py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              
              {/* 内容区域 - 根据是否有图片调整布局 */}
              {files.length === 0 ? (
                <>
                  {/* 左侧内容 - 无图片时 */}
                  <motion.div 
                    className="text-left space-y-6 relative order-2 lg:order-1"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
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
                              <span style={{ color: '#C8FB75', fontWeight: '900' }}>Upload their profile.</span>
                              <br />
                              <span 
                                className="inline-block font-bold py-2 rounded-full text-white"
                                style={{ 
                                  fontWeight: '900',
                                  color: '#3D08FF'
                                }}
                              >
                                Let Lucy write the perfect opener.
                              </span>
                            </h1>
                            
                            {/* 副标题 */}
                            <p className="text-white mt-6" style={{ fontSize: '20px' }}>
                              Say something that hits their vibe — not just their inbox.
                            </p>
                          </div>
                          
                          {/* 上传按钮 */}
                          <div className="pt-4 mb-8">
                            <div className="group">
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
                                  Upload their bio screenshot
                                </span>
                              </Button>
                            </div>
                          </div>
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
                              {t("image_count", { count: files.length })} / {MAX_FILES}
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
                            {t("clear_images")}
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
                                  alt={t("image_preview_alt", { index: index + 1 })}
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
                                  <p className="text-xs text-black font-medium">{t("add_more")}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 分析按钮 - 直接放在图片列表下方 */}
                        <div className="mt-8 flex justify-center">
                          <Button
                            onClick={handleGenerate}
                            disabled={isLoading || isStreaming || isCompressing}
                            size="lg"
                            className="px-10 py-4 text-lg font-semibold min-w-[200px] bg-black text-white hover:bg-gray-800 rounded-full"
                            variant="default"
                          >
                            {isCompressing ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                {t("compressing_images")}
                              </>
                            ) : isLoading ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                {t("generating")}
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                {t("generate")}
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
                  transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                >
                  <div className="w-full max-w-sm lg:max-w-lg">
                    <img 
                      src="/imgs/lucy/banner_conversation.png"
                      alt="Conversation Starter"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        {/* 底部文字装饰 */}
        {/* <div className="absolute bottom-4 left-0 right-0">
          <div className="container mx-auto px-4">
            <div 
              className="text-center text-xs lg:text-sm tracking-[0.3em] font-light"
              style={{ color: '#3D08FF' }}
            >
              C &nbsp;&nbsp;&nbsp;O &nbsp;&nbsp;&nbsp;N &nbsp;&nbsp;&nbsp;V &nbsp;&nbsp;&nbsp;E &nbsp;&nbsp;&nbsp;R &nbsp;&nbsp;&nbsp;S &nbsp;&nbsp;&nbsp;A &nbsp;&nbsp;&nbsp;T &nbsp;&nbsp;&nbsp;I &nbsp;&nbsp;&nbsp;O &nbsp;&nbsp;&nbsp;N &nbsp;&nbsp;&nbsp; S&nbsp;&nbsp;&nbsp; T&nbsp;&nbsp;&nbsp; A&nbsp;&nbsp;&nbsp; R&nbsp;&nbsp;&nbsp; T&nbsp;&nbsp;&nbsp; E &nbsp;&nbsp;&nbsp;R
            </div>
          </div>
        </div> */}
      </section>
      
            <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
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