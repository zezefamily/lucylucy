"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, ImageIcon, Star, TrendingUp, Users, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AnalysisResult, AnalysisApiResponse } from "@/types/analysis";

// 流式文本渲染器组件
function StreamTextRenderer({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  // 简单的 markdown 解析函数
  const parseMarkdown = (text: string) => {
    // 处理标题 - 确保完全替换标题标记
    text = text.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3 mt-6 first:mt-0 flex items-center"><span class="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>$1</h3>');
    text = text.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4 mt-8 first:mt-0 flex items-center"><span class="w-3 h-3 bg-primary rounded-full mr-3 animate-pulse"></span>$1</h2>');
    text = text.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6 mt-8 first:mt-0 flex items-center"><span class="w-4 h-4 bg-gradient-to-r from-primary to-secondary rounded-full mr-3 animate-pulse shadow-lg"></span>$1</h1>');
    
    // 处理分隔线 - 将 --- 替换为美观的分隔线
    text = text.replace(/^---$/gm, '<div class="my-8 flex items-center"><div class="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div><div class="mx-4 w-2 h-2 bg-primary rounded-full animate-pulse"></div><div class="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div></div>');
    
    // 处理粗体
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">$1</strong>');
    
    // 处理评分数字 (特殊高亮)
    text = text.replace(/(\d+(?:\.\d+)?\/10分?)/g, '<span class="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg shadow-lg transform hover:scale-105 transition-transform mx-1">$1</span>');
    text = text.replace(/(\d+(?:\.\d+)?分)/g, '<span class="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg shadow-lg transform hover:scale-105 transition-transform mx-1">$1</span>');
    
    // 处理特殊关键词 - 已移除气泡效果
    // text = text.replace(/(建议|优势|改进|提升|优化|亮点|等级|评价)/g, '<span class="px-2 py-1 bg-gradient-to-r from-secondary/20 to-primary/20 text-primary font-medium rounded-md border border-primary/30 mx-1">$1</span>');
    
    // 处理数字列表项 - 更精确的匹配
    text = text.replace(/^(\d+)\.\s+(.*$)/gm, '<div class="flex items-start my-4 p-4 rounded-lg bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5 border border-primary/20 hover:border-primary/40 transition-all duration-200 shadow-sm hover:shadow-md"><div class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-primary to-secondary text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 shadow-md">$1</div><div class="text-sm leading-relaxed text-foreground flex-1">$2</div></div>');
    
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
                AI 正在深度分析中...
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
              <span className="text-sm font-medium text-green-700 dark:text-green-300">分析完成</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfileAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [streamText, setStreamText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fakeStreamText, setFakeStreamText] = useState<string>("");
  const [isFakeStreaming, setIsFakeStreaming] = useState(false);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 清理定时器和预览URL
  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileUpload = (uploadedFile: File) => {
    if (!uploadedFile.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }
    if (uploadedFile.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过10MB');
      return;
    }
    
    // 清理之前的预览URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // 创建新的预览URL
    const newPreviewUrl = URL.createObjectURL(uploadedFile);
    setPreviewUrl(newPreviewUrl);
    
    setFile(uploadedFile);
    setResult(null); // 清空之前的结果
    setStreamText(""); // 清空流式文本
    setFakeStreamText(""); // 清空假流式文本
    
    // 清理之前的定时器
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    setIsFakeStreaming(false);
    
    toast.success('图片上传成功！');
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const analyzeProfile = async () => {
    if (!file) {
      toast.error('请先上传图片');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    
    try {
      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', file);
      
      // 调用分析API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.code === 0) {
        setResult(result.data);
        toast.success('AI分析完成！');
      } else {
        toast.error(result.message || '分析失败，请重试');
      }
    } catch (error) {
      console.error('分析错误:', error);
      toast.error('网络错误，请检查连接后重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeProfileStream = async () => {
    if (!file) {
      toast.error('请先上传图片');
      return;
    }

    setIsStreaming(true);
    setStreamText("");
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/analyze?stream=true', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // 保留最后一行（可能不完整）
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('0:')) {
            // 这是文本内容
            const content = line.substring(2);
            if (content.trim()) {
              setStreamText(prev => prev + content);
            }
          } else if (line.startsWith('error:')) {
            // 这是错误信息
            const errorMsg = line.substring(6);
            toast.error(errorMsg);
            break;
          }
        }
      }

      toast.success('AI流式分析完成！');
    } catch (error) {
      console.error('流式分析错误:', error);
      toast.error('分析过程中发生错误，请重试');
    } finally {
      setIsStreaming(false);
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
        toast.success('🎉 AI分析完成！');
      }
    }, 50); // 每50ms显示一个字符，可调整速度
  };

  // 智能流式分析（假流式）
  const analyzeProfileSmart = async () => {
    if (!file) {
      toast.error('请先上传图片');
      return;
    }

    setIsFakeStreaming(true);
    setFakeStreamText("");
    setResult(null);
    
    try {
      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', file);
      
      // 调用普通的分析API
      const response = await fetch('/api/analyze', {
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
        toast.error(apiResult.message || '分析失败，请重试');
        setIsFakeStreaming(false);
      }
    } catch (error) {
      console.error('分析错误:', error);
      toast.error('网络错误，请检查连接后重试');
      setIsFakeStreaming(false);
    }
  };

  // 将分析结果转换为可读文本
  const formatAnalysisToText = (data: AnalysisResult): string => {
    const sections = [
      `# 🎯 AI智能分析报告\n\n`,
      `## 📊 综合评分：${data.score || 0}/10分\n**评价等级：${data.category || '未知'}**\n\n---\n\n`,
      `## ✨ 你的优势亮点\n\n${(data.strengths || []).map((strength, index) => `${index + 1}. ${strength}`).join('\n') || '暂无数据'}\n\n---\n\n`,
      `## 🚀 改进建议\n\n${(data.improvements || []).map((improvement, index) => `${index + 1}. ${improvement}`).join('\n') || '暂无数据'}\n\n---\n\n`,
      `## 📸 照片优化建议\n\n${(data.suggestions?.photos || []).map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n') || '暂无数据'}\n\n---\n\n`,
      `## ✍️ 个人简介优化\n\n${(data.suggestions?.bio || []).map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n') || '暂无数据'}\n\n---\n\n`,
      `## 🎨 整体建议\n\n${(data.suggestions?.overall || []).map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n') || '暂无数据'}\n\n---\n\n`,
      `**🎉 分析完成！希望这些建议能帮助你提升交友成功率！**`
    ];
    
    return sections.join('');
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
              {file ? (
                <ImageIcon className="w-8 h-8 text-primary" />
              ) : (
                <Upload className="w-8 h-8 text-primary" />
              )}
            </div>
            
            {!file && (
              <div className="text-center">
                <p className="text-lg font-medium text-foreground mb-2">
                  拖拽图片到这里或点击上传
                </p>
                <p className="text-sm text-muted-foreground">
                  支持 JPG、PNG 格式，最大 10MB
                </p>
              </div>
            )}
            
            {/* 图片预览 */}
            {previewUrl && (
              <div className="mt-4">
                <img
                  src={previewUrl}
                  alt="图片预览"
                  className="max-w-md max-h-80 rounded-lg shadow-lg border border-border/50"
                />
              </div>
            )}
            
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <Button 
              onClick={() => {
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                input?.click();
              }}
              variant="outline"
            >
              选择图片
            </Button>
            
            {file && (
              <Button
                onClick={() => {
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                  }
                  setFile(null);
                  setPreviewUrl(null);
                  setResult(null);
                  setFakeStreamText("");
                  setStreamText("");
                }}
                variant="ghost"
                size="sm"
                className="ml-2 text-red-600 hover:text-red-700"
              >
                清除
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 分析按钮 */}
      {file && (
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
                AI 正在分析中...
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-2" />
                快速分析魅力值
              </>
            )}
          </Button>
          
          {/* <Button
            onClick={analyzeProfileSmart}
            disabled={isAnalyzing || isStreaming || isFakeStreaming}
            size="lg"
            className="px-8"
            variant="outline"
          >
            {isFakeStreaming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI 正在智能分析...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 mr-2" />
                智能流式分析
              </>
            )}
          </Button>
          
          <Button
            onClick={analyzeProfileStream}
            disabled={isAnalyzing || isStreaming || isFakeStreaming}
            size="lg"
            className="px-6"
            variant="ghost"
          >
            {isStreaming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                实时流式...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 mr-2" />
                真实流式
              </>
            )}
          </Button> */}
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
                AI 实时智能分析
              </span>
              {isStreaming && (
                <div className="ml-auto flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">分析中...</span>
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
                AI 智能分析报告
              </span>
              {isFakeStreaming && (
                <div className="ml-auto flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">智能分析中...</span>
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
              
              {/* 底部科技感装饰 */}
              {/* {isFakeStreaming && (
                <div className="px-6 pb-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>智能数据流</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-16 h-1 bg-gradient-to-r from-primary/20 to-primary/60 rounded-full overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-r from-primary to-secondary animate-pulse"></div>
                      </div>
                      <span className="ml-2">AI智能处理中</span>
                    </div>
                  </div>
                </div>
              )} */}
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
              <CardTitle className="text-2xl">你的魅力评分</CardTitle>
              <CardDescription>基于AI深度学习算法分析</CardDescription>
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
                  {result.score * 10}% 匹配度
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
                  你的优势
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
                  改进建议
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
                  照片优化建议
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
                  个人简介优化建议
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
                  整体优化建议
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
              <h3 className="text-lg font-semibold mb-2">准备好提升你的交友成功率了吗？</h3>
              <p className="text-muted-foreground mb-4">
                根据以上建议优化你的资料，然后试试我们的AI开场白生成器！
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <a href="/conversation-starter">
                    试试开场白生成器 →
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/stream-analyzer">
                    体验AI实时分析 ⚡
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