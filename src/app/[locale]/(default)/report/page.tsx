"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, Users, MessageCircle, Loader2, ImageIcon, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import AnalysisThinkingProcessStream from "@/components/blocks/analysis-thinking-process-stream";
import { useAppContext } from "@/contexts/app";
import { SubscriptionTier } from "@/types/user";
import { motion } from "framer-motion";

// 单张照片分析结果
interface PhotoAnalysis {
  photoIndex: number; // 照片序号
  score: number; // 照片评分 (1-10)
  strengths: string[]; // 优点
  improvements: string[]; // 改进建议
  comment: string; // 总体评价
}

// 分析结果接口
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

export default function ReportPage() {
  const t = useTranslations("profile_analyzer");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, userCredits, setShowSignModal, setShowPricingModal, refreshUserCredits } = useAppContext();
  
  // 从URL参数获取文件信息
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [filesCount, setFilesCount] = useState(0);
  
  // 分析相关状态
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CoachAnalysisResult | null>(null);
  
  // 思考过程相关状态
  const [showThinkingProcess, setShowThinkingProcess] = useState(false);
  const [thinkingComplete, setThinkingComplete] = useState(false);
  const [analysisResultReady, setAnalysisResultReady] = useState(false);
  const [pendingAnalysisResult, setPendingAnalysisResult] = useState<CoachAnalysisResult | null>(null);

  // 分数颜色辅助函数
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  // 从缓存恢复文件信息
  const loadFilesFromCache = useCallback(() => {
    try {
      const cachedData = localStorage.getItem('profile_analyzer_photos');
      if (!cachedData) {
        toast.error("未找到上传的照片，请重新上传");
        router.push('/profile-analyzer');
        return;
      }

      const parsed = JSON.parse(cachedData);
      const { photos, timestamp } = parsed;
      
      // 检查缓存是否过期（24小时）
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp > maxAge) {
        localStorage.removeItem('profile_analyzer_photos');
        toast.error("照片缓存已过期，请重新上传");
        router.push('/profile-analyzer');
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
          setFilesCount(restoredFiles.length);
          console.log(`已从缓存恢复 ${restoredFiles.length} 张照片`);
          
          // 自动开始分析
          setTimeout(() => {
            analyzeProfile(restoredFiles);
          }, 1000);
        }
      }
    } catch (error) {
      console.warn('加载照片缓存失败:', error);
      toast.error("加载照片失败，请重新上传");
      router.push('/profile-analyzer');
    }
  }, [router]);

  // Base64转File工具函数
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

  // 页面加载时恢复缓存
  useEffect(() => {
    loadFilesFromCache();
  }, [loadFilesFromCache]);

  // 清理预览URL
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // 思考过程完成的回调
  const handleThinkingComplete = () => {
    setThinkingComplete(true);
    
    // 如果分析结果已经准备好，直接显示结果
    if (analysisResultReady && pendingAnalysisResult) {
      setResult(pendingAnalysisResult);
      setPendingAnalysisResult(null);
      setIsAnalyzing(false);
      toast.success(t("toast_analysis_complete"));
    }
  };

  // 分析逻辑 - 迁移自 analyzeProfileSmart 第719行以下
  const analyzeProfile = async (analysisFiles: File[] = files) => {
    if (analysisFiles.length === 0) {
      toast.error(t("toast_upload_required"));
      router.push('/profile-analyzer');
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
      filesCount: analysisFiles.length,
      previewUrlsCount: previewUrls.length,
      previewUrls: previewUrls
    });
    
    try {
      // 创建FormData对象，支持多文件
      const formData = new FormData();
      analysisFiles.forEach((file, index) => {
        formData.append(`file${index}`, file);
        console.log(`添加文件 ${index + 1}:`, file.name);
      });
      formData.append('fileCount', analysisFiles.length.toString());
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

  return (
    <div className="min-h-screen bg-background">
      {/* 页面头部 */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-2xl font-bold text-gradient-primary">
                分析报告
              </h1>
            </div>
            
            {/* {filesCount > 0 && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>分析照片:</span>
                <Badge variant="outline">{filesCount} 张</Badge>
              </div>
            )} */}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-8">
        {/* 加载状态 */}
        {!files.length && !result && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-muted-foreground">正在加载照片信息...</p>
          </div>
        )}

        {/* 分析思考过程组件 */}
        {showThinkingProcess && files.length > 0 && (
          <motion.section 
            className="w-full py-8 lg:py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <AnalysisThinkingProcessStream 
              files={files}
              locale={locale}
              onStreamComplete={handleThinkingComplete}
              isVisible={showThinkingProcess}
            />
          </motion.section>
        )}

        {/* 分析结果 */}
        {result && (
          <motion.section 
            className="w-full py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
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
          </motion.section>
        )}
      </div>
    </div>
  );
}