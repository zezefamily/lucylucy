"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, ImageIcon, Star, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function StreamAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisText, setAnalysisText] = useState<string>("");
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
    setAnalysisText(""); // 清空之前的分析结果
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
    setAnalysisText("");
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/analyze-stream', {
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
              setAnalysisText(prev => prev + content);
            }
          }
        }
      }

      toast.success('AI分析完成！');
    } catch (error) {
      console.error('分析错误:', error);
      toast.error('分析过程中发生错误，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 文件上传区域 */}
      <Card className="border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors">
        <CardHeader>
          <CardTitle className="text-center">上传交友资料截图</CardTitle>
          <CardDescription className="text-center">
            AI将实时分析你的资料并给出专业建议
          </CardDescription>
        </CardHeader>
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
        <div className="text-center">
          <Button
            onClick={analyzeProfile}
            disabled={isAnalyzing}
            size="lg"
            className="px-8"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI 正在实时分析...
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-2" />
                开始AI实时分析
              </>
            )}
          </Button>
        </div>
      )}

      {/* 实时分析结果 */}
      {(analysisText || isAnalyzing) && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              AI 实时分析结果
              {isAnalyzing && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {analysisText}
                {isAnalyzing && (
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1"></span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 功能说明 */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">实时分析</h3>
            <p className="text-sm text-muted-foreground">
              AI实时生成分析结果，无需等待
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">专业建议</h3>
            <p className="text-sm text-muted-foreground">
              基于交友心理学的专业优化建议
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">图像识别</h3>
            <p className="text-sm text-muted-foreground">
              先进的AI视觉技术分析你的资料
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 