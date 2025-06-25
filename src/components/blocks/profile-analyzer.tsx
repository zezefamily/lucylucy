"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, ImageIcon, Star, TrendingUp, Users, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AnalysisResult, AnalysisApiResponse } from "@/types/analysis";

export default function ProfileAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [streamText, setStreamText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = (uploadedFile: File) => {
    if (!uploadedFile.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }
    if (uploadedFile.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过10MB');
      return;
    }
    setFile(uploadedFile);
    setResult(null); // 清空之前的结果
    setStreamText(""); // 清空流式文本
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
            
            {file ? (
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  文件大小: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg font-medium text-foreground mb-2">
                  拖拽图片到这里或点击上传
                </p>
                <p className="text-sm text-muted-foreground">
                  支持 JPG、PNG 格式，最大 10MB
                </p>
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
          </div>
        </CardContent>
      </Card>

      {/* 分析按钮 */}
      {file && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={analyzeProfile}
            disabled={isAnalyzing || isStreaming}
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
          
          <Button
            onClick={analyzeProfileStream}
            disabled={isAnalyzing || isStreaming}
            size="lg"
            className="px-8"
            variant="outline"
          >
            {isStreaming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI 正在实时分析...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 mr-2" />
                实时流式分析
              </>
            )}
          </Button>
        </div>
      )}

      {/* 流式分析结果 */}
      {(streamText || isStreaming) && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              AI 实时分析结果
              {isStreaming && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                {streamText}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1"></span>
                )}
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