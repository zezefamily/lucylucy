"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Sparkles, RotateCcw, Trash2, Upload, ImageIcon, X, Plus, Heart } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { ConversationStarter, ConversationStarterResponse } from "@/types/conversation-starter";

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
  
  const MAX_FILES = 5;
  
  // 使用 ref 来追踪当前处理的结果，避免重复执行
  const processedResultRef = useRef<ConversationStarter | null>(null);
  const streamingTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

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

    // 清除之前的定时器
    clearStreamingTimeouts();
    
    // 逐行显示开场白
    result.starters.forEach((starter, index) => {
      const timeout = setTimeout(() => {
        setVisibleStarters(prev => [...prev, index]);
        
        // 如果是最后一行，等待打字完成后结束流式效果
        if (index === result.starters.length - 1) {
          // 计算最后一行打字完成的时间
          const textLength = starter.length;
          const typingDuration = textLength * 30; // 30ms per character
          
          const endTimeout = setTimeout(() => {
            setIsStreaming(false);
          }, typingDuration + 500); // 额外等待500ms
          streamingTimeoutsRef.current.push(endTimeout);
        }
      }, index * 1200); // 每行延迟1200ms，给打字机效果留出时间
      
      streamingTimeoutsRef.current.push(timeout);
    });

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

  const handleFilesUpload = (uploadedFiles: File[]) => {
    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];
    
    // 检查文件数量限制
    const totalFiles = files.length + uploadedFiles.length;
    if (totalFiles > MAX_FILES) {
      toast.error(t("toast_max_files", { max: MAX_FILES }));
      return;
    }
    
    uploadedFiles.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(t("toast_not_image", { name: file.name }));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t("toast_too_large", { name: file.name }));
        return;
      }
      
      validFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    });
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
      setResult(null); // 清空之前的结果
      
      // 清理之前的定时器
      clearStreamingTimeouts();
      setIsStreaming(false);
      processedResultRef.current = null;
      
      toast.success(t("toast_upload_success", { count: validFiles.length }));
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
    
    // 清理定时器
    clearStreamingTimeouts();
    setIsStreaming(false);
    processedResultRef.current = null;
    
    toast.success(t("toast_all_cleared"));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    setIsStreaming(false);
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
        setResult({
          starters: data.data.starters,
          topic: data.data.topic
        });
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
      await navigator.clipboard.writeText(text);
      toast.success(t("copied"));
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error(t("toast_copy_failed"));
    }
  };

  const handleClear = () => {
    clearStreamingTimeouts();
    setResult(null);
    setVisibleStarters([]);
    setIsStreaming(false);
    processedResultRef.current = null;
  };

  const handleTryAgain = () => {
    if (files.length > 0) {
      handleGenerate();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
          <Heart className="w-8 h-8 text-primary" />
          {t("title")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("description")}
        </p>
      </div>

      {/* 图片上传区域 */}
      <Card className="mb-8 border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            {t("upload_title")}
          </CardTitle>
          <CardDescription>
            {t("upload_description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`relative flex flex-col items-center justify-center space-y-4 p-8 rounded-lg ${
              dragActive ? 'bg-primary/5' : ''
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              {files.length > 0 ? (
                <ImageIcon className="w-8 h-8 text-primary" />
              ) : (
                <Upload className="w-8 h-8 text-primary" />
              )}
            </div>
            
            {files.length === 0 && (
              <div className="text-center">
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
                    {t("image_count", { count: files.length })} / {MAX_FILES}
                  </p>
                  <Button
                    onClick={clearAllFiles}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    {t("clear_images")}
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`图片预览 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg shadow-md border border-border/50"
                      />
                      <Button
                        onClick={() => removeFile(index)}
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                  
                  {/* 添加更多图片按钮 */}
                  {files.length < MAX_FILES && (
                    <div
                      className="w-full h-32 border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => {
                        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                        input?.click();
                      }}
                    >
                      <div className="text-center">
                        <Plus className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">{t("add_more")}</p>
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
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const selectedFiles = Array.from(e.target.files);
                  handleFilesUpload(selectedFiles);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <Button 
              onClick={() => {
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                input?.click();
              }}
              variant="outline"
            >
              {t("select_image")}
            </Button>
          </div>

          {/* 生成按钮 */}
          {files.length > 0 && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleGenerate}
                disabled={isLoading || isStreaming}
                size="lg"
                className="px-8"
              >
                {isLoading ? (
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
        </CardContent>
      </Card>

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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                {t("result_title")}
              </CardTitle>
              <CardDescription>
                {t("result_description")} • {t("based_on_photos", { count: files.length })} • {t("success_tip")}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTryAgain}
                disabled={isLoading || isStreaming}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t("try_again")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={isStreaming}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t("clear")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 显示已流式输出的开场白 */}
            {result.starters.map((starter, index) => (
              <div
                key={`starter-${index}`}
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
                        text={starter} 
                        speed={30}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(starter)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
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