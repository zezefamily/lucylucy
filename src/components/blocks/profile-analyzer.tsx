"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, ImageIcon, Star, TrendingUp, Users, MessageCircle, Loader2, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { AnalysisResult, AnalysisApiResponse } from "@/types/analysis";

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
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [streamText, setStreamText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fakeStreamText, setFakeStreamText] = useState<string>("");
  const [isFakeStreaming, setIsFakeStreaming] = useState(false);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const MAX_FILES = 5;

  // 清理定时器和预览URL
  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
      // 清理所有预览URL
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

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
      setStreamText(""); // 清空流式文本
      setFakeStreamText(""); // 清空假流式文本
      
      // 清理之前的定时器
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
      setIsFakeStreaming(false);
      
      toast.success(t("toast_upload_success", { count: validFiles.length }));
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
    setFakeStreamText("");
    setStreamText("");
    
    // 清理定时器
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    setIsFakeStreaming(false);
    
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
        toast.success(t("toast_analysis_complete"));
      }
    }, 50); // 每50ms显示一个字符，可调整速度
  };

  // 智能流式分析（支持多图片）
  const analyzeProfileSmart = async () => {
    if (files.length === 0) {
      toast.error(t("toast_upload_required"));
      return;
    }

    setIsFakeStreaming(true);
    setFakeStreamText("");
    setResult(null);
    
    try {
      // 创建FormData对象，支持多文件
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      formData.append('fileCount', files.length.toString());
      formData.append('locale', locale);
      
      // 调用多图片分析API
      const response = await fetch('/api/analyze-multiple', {
        method: 'POST',
        body: formData,
      });
      
      const apiResult = await response.json();
      
      if (apiResult.code === 0) {
        // 将结构化数据转换为可读文本
        const analysisData = apiResult.data;
        const readableText = formatAnalysisToText(analysisData);
        
        // 开始模拟流式渲染
        simulateStreaming(readableText);
        
        // 计算流式渲染所需时间，然后显示结构化结果
        const estimatedTime = readableText.length * 50 + 2000;
        setTimeout(() => {
          if (!isFakeStreaming) { // 确保流式已完成
            setResult(analysisData);
          }
        }, estimatedTime);
        
      } else {
        toast.error(apiResult.message || t("toast_analysis_failed"));
        setIsFakeStreaming(false);
      }
    } catch (error) {
      console.error(t("error_analysis"), error);
      
      // 提取实际的错误信息
      let errorMessage = t("error_network");
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast.error(errorMessage);
      setIsFakeStreaming(false);
    }
  };

  // 将分析结果转换为可读文本
  const formatAnalysisToText = (data: AnalysisResult): string => {
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
      `## 🎯 ${t("ai_report_title", { count: files.length })}\n\n`,
      `## 🏆 ${t("score_title", { score: data.score || 0 })}\n**${t("score_category", { category: data.category || t("no_data") })}**\n\n---\n\n`,
      `## ✨ ${t("strengths_title")}\n\n${safeMapArray(data.strengths)}\n\n---\n\n`,
      `## 🚀 ${t("improvements_title")}\n\n${safeMapArray(data.improvements)}\n\n---\n\n`,
      `## 📸 ${t("photo_suggestions_title")}\n\n${safeMapArray(data.suggestions?.photos)}\n\n---\n\n`,
      `## ✍️ ${t("bio_suggestions_title")}\n\n${safeMapArray(data.suggestions?.bio)}\n\n---\n\n`,
      `## 🎨 ${t("overall_suggestions_title")}\n\n${safeMapArray(data.suggestions?.overall)}\n\n---\n\n`,
      `**🎉 ${t("analysis_completion", { count: files.length })}**`
    ];
    
    // 过滤掉空值并确保所有元素都是字符串
    const validSections = sections.filter(section => 
      section && typeof section === 'string' && section.trim() !== ''
    );
    
    return validSections.join('');
  };

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
    <div className="space-y-8">
      {/* 文件上传区域 */}
      <Card className="border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors">
        <CardContent className="p-8">
          <div
            className={`relative flex flex-col items-center justify-center space-y-4 ${
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
                    {t("uploaded_count", { count: files.length, max: MAX_FILES })}
                  </p>
                  <Button
                    onClick={clearAllFiles}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    {t("clear_all")}
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={t("image_preview", { index: index + 1 })}
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
        </CardContent>
      </Card>

      {/* 分析按钮 */}
      {files.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={analyzeProfileSmart}
            disabled={isAnalyzing || isStreaming || isFakeStreaming}
            size="lg"
            className="px-8"
            variant="default"
          >
            {isAnalyzing ? (
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

      {/* 流式分析结果 */}
      {(streamText || isStreaming) && (
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-background via-primary/5 to-secondary/5 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-primary/20">
            <CardTitle className="flex items-center text-xl">
              <div className="relative">
                <MessageCircle className="w-6 h-6 mr-3 text-primary" />
                {isStreaming && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t("ai_realtime_analysis")}
              </span>
              {isStreaming && (
                <div className="ml-auto flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">{t("analyzing_status_short")}</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative">
              {/* 科技感装饰线 */}
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              
              <div className="p-6">
                <div className="relative">
                  {/* 左侧装饰条 */}
                  <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-primary to-secondary rounded-full"></div>
                  
                  <div className="pl-6">
                    <StreamTextRenderer text={streamText} isStreaming={isStreaming} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 智能流式分析结果 */}
      {(fakeStreamText || isFakeStreaming) && (
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
              {/* 科技感装饰线 */}
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              
              <div className="p-6">
                <div className="relative">
                  {/* 左侧装饰条 */}
                  <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-primary to-secondary rounded-full"></div>
                  
                  <div className="pl-6">
                    <StreamTextRenderer text={fakeStreamText} isStreaming={isFakeStreaming} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
              <div className={`text-6xl font-bold ${getScoreColor(result.score)}`}>
                {result.score}
              </div>
              <div className="text-xl text-muted-foreground">/ 10</div>
              <Badge 
                variant="secondary" 
                className={`text-lg px-4 py-1 bg-gradient-to-r ${getScoreBackground(result.score)} text-white`}
              >
                {result.category}
              </Badge>
              
              {/* 自定义进度条 */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                  <div 
                    className={`h-3 rounded-full bg-gradient-to-r ${getScoreBackground(result.score)} transition-all duration-1000 ease-out`}
                    style={{ width: `${result.score * 10}%` }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1 text-center">
                  {t("match_rate", { rate: result.score * 10 })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 优势和改进建议 */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  {t("your_strengths")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-orange-600">
                  <Users className="w-5 h-5 mr-2" />
                  {t("improvement_suggestions")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-sm">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* 详细建议 */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  {t("photo_optimization")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.suggestions.photos.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-1 h-1 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-sm">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {t("bio_optimization")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.suggestions.bio.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-1 h-1 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-sm">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  {t("overall_optimization")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.suggestions.overall.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-1 h-1 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-sm">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

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
                <Button variant="outline" asChild>
                  <a href="/stream-analyzer">
                    {t("try_stream_analyzer")}
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