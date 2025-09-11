"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import { SubscriptionTier } from "@/types/user";

export default function ImageGenerationResult() {
  const t = useTranslations("image_generation_result");
  const router = useRouter();
  const { user, userCredits, setShowSignModal, setShowPricingModal, refreshUserCredits } = useAppContext();

  
  // 从URL参数获取生成的图片数据
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<any>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  // 生成图片的函数
  const generateImages = async () => {
    try {
      setIsLoading(true);
      setFailedImages(new Set()); // 清除之前的失败状态
      console.log('=== 开始生成图片 ===');
      
      // 1. 检查是否有待生成的图片
      const imageToGenerate = localStorage.getItem('imageToGenerate');
      if (!imageToGenerate) {
        console.log('没有找到待生成的图片，返回上一页');
        router.push('/');
        return;
      }

      // 2. 解析压缩图片数据
      const imageData = JSON.parse(imageToGenerate);
      console.log('从 localStorage 读取压缩图片数据:', imageData);
      
      // 保存原始图片信息
      setOriginalImage(imageData.originalFile);
      
      // 3. 将base64转换为File对象并发起API请求
      const base64Data = imageData.compressedFile.base64;
      const response = await fetch(base64Data);
      const blob = await response.blob();
      const file = new File([blob], imageData.compressedFile.name, { 
        type: imageData.compressedFile.type 
      });

      console.log('开始调用 banana-img API...');
      const formData = new FormData();
      formData.append('image', file);

      const apiResponse = await fetch('/api/banana-img', {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('API调用失败:', errorText);
        throw new Error(`生成失败: ${apiResponse.status} ${apiResponse.statusText}`);
      }

      const result = await apiResponse.json();
      console.log('API响应:', result);

      // 4. 检查响应格式
      if (result.code !== 0) {
        throw new Error(result.message || '生成失败');
      }

      if (!result.data || !result.data.generatedImages) {
        throw new Error('AI未能生成有效的图片，请重试');
      }

      // 验证生成的图片数量和质量
      if (!Array.isArray(result.data.generatedImages) || result.data.generatedImages.length === 0) {
        throw new Error('AI未能生成任何图片，请重试');
      }

      // 检查每个图片的URL有效性
      const invalidImages = result.data.generatedImages.filter((imageData: any, index: number) => {
        const imageUrl = typeof imageData === 'string' ? imageData : imageData.url;
        return !imageUrl || (!imageUrl.startsWith('http') && !imageUrl.startsWith('/'));
      });

      if (invalidImages.length > 0) {
        console.warn(`发现 ${invalidImages.length} 个无效图片URL:`, invalidImages);
        toast.warning(`生成的图片中有 ${invalidImages.length} 个可能无法正常显示`);
      }

      // 5. 更新状态显示结果
      setGeneratedImages(result.data.generatedImages);
      setTaskId(result.data.taskId);
      
      // 验证生成的图片URL
      console.log('图片生成成功，验证图片URL:');
      result.data.generatedImages.forEach((imageData: any, index: number) => {
        const imageUrl = typeof imageData === 'string' ? imageData : imageData.url;
        console.log(`图片 ${index + 1}: ${imageUrl}`);
        
        // 检查URL有效性
        if (!imageUrl || (!imageUrl.startsWith('http') && !imageUrl.startsWith('/'))) {
          console.warn(`图片 ${index + 1} URL可能无效: ${imageUrl}`);
        }
      });

      // 6. 刷新用户积分余额
      try {
        await refreshUserCredits?.();
        console.log('用户积分已刷新');
      } catch (refreshError) {
        console.warn('刷新用户积分失败:', refreshError);
      }

    } catch (error) {
      console.error('图片生成失败:', error);
      const errorMessage = error instanceof Error ? error.message : '图片生成失败，请重试';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 页面加载时自动开始生成
  useEffect(() => {
    console.log('=== 结果页面加载，开始生成图片 ===');
    generateImages();
  }, []);



  const handleGoBack = () => {
    router.back();
  };

  const handleSaveStyle = async (index: number) => {
    setSelectedStyle(index);
    
    try {
      const selectedImageData = generatedImages[index];
      const selectedImageUrl = typeof selectedImageData === 'string' ? selectedImageData : selectedImageData.url;
      console.log(`Saving style ${index} with image: ${selectedImageUrl}`);
      
      // 下载图片到本地
      await downloadImage(selectedImageUrl, `generated-style-${index + 1}.jpg`);
      
    } catch (error) {
      console.error('Failed to save style:', error);
    }
  };

  // 下载图片到本地的函数
  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`Image downloaded: ${filename}`);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const handleRegenerate = async () => {
    console.log('=== 用户点击重新生成 ===');
    
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
      console.log('Elite 用户，直接放行重新生成');
    } else {
      // 非 Elite 用户检查积分
      const requiredCredits = 5; // 重新生成需要5积分
      const availableCredits = userCredits?.left_credits || 0;
      if (availableCredits < requiredCredits) {
        setShowPricingModal?.(true);
        return;
      }
    }

    console.log('权限检查通过，开始重新生成', {
      userTier: userTier,
      availableCredits: userCredits?.left_credits || 0,
      requiredCredits: userTier === SubscriptionTier.ELITE ? 0 : 5
    });

    // 基于同一张原始图片重新生成
    generateImages();
  };

  const handleGenerateBest = () => {
    // 基于用户选择或所有生成的图片，生成一张最佳照片
    router.push('/?mode=best');
  };

  const handleImageClick = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFA8F5] to-[#FF64DC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">{t("generating")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFA8F5] to-[#FF64DC] relative overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* 返回按钮 */}
        <button 
          onClick={handleGoBack}
          className="mb-8 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>

        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            {t("title")}
          </h1>
          <p className="text-white/90 text-lg sm:text-xl">
            {t("subtitle")}
          </p>
        </div>

        {/* 图片网格 */}
        <div className="flex flex-wrap justify-center gap-y-[30px] gap-x-4 sm:gap-x-[30px] mb-8 max-w-4xl mx-auto">
          {generatedImages.map((imageData, index) => {
            const imageUrl = typeof imageData === 'string' ? imageData : imageData.url;
            return (
              <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300"
              style={{ width: '320px', flexShrink: 0 }}
            >
              {/* 图片容器 */}
              <div 
                className={`w-full h-[360px] mb-3 overflow-hidden bg-gray-100 relative group rounded-t-2xl ${!failedImages.has(index) ? 'cursor-pointer' : ''}`}
                onClick={() => !failedImages.has(index) && handleImageClick(imageUrl)}
              >
                {!failedImages.has(index) ? (
                  <img
                    src={imageUrl}
                    alt={`${t("alt_texts.generated_style")} ${index + 1}`}
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                    onError={() => {
                      console.warn(`图片加载失败: ${imageUrl}, 索引: ${index}`);
                      console.warn('图片数据:', imageData);
                      
                      // 标记该图片为加载失败
                      setFailedImages(prev => new Set([...prev, index]));
                    }}
                  />
                ) : (
                  // 图片加载失败时显示重试界面
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-600">
                    <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 6.5c-.77.833-.192 2.5 1.732 2.5z"/>
                    </svg>
                    <p className="text-sm mb-3 text-center">图片加载失败</p>
                    <button
                      onClick={() => {
                        console.log(`重试加载图片 ${index + 1}, URL: ${imageUrl}`);
                        
                        // 先从失败状态中移除
                        setFailedImages(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(index);
                          return newSet;
                        });
                        
                        // 强制刷新图片缓存：在URL后添加时间戳
                        setTimeout(() => {
                          const imgElement = document.querySelector(`img[alt*="${index + 1}"]`) as HTMLImageElement;
                          if (imgElement) {
                            const originalSrc = imageUrl;
                            const separator = originalSrc.includes('?') ? '&' : '?';
                            const newSrc = `${originalSrc}${separator}retry=${Date.now()}`;
                            console.log(`强制刷新图片缓存: ${newSrc}`);
                            imgElement.src = newSrc;
                          }
                        }, 100);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      重试加载
                    </button>
                  </div>
                )}
                
                {/* 悬停遮罩和放大图标 - 只在图片正常显示时显示 */}
                {!failedImages.has(index) && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center pointer-events-none">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"/>
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* 保存按钮 */}
              <div className="p-3 flex justify-center">
                <Button
                  onClick={() => handleSaveStyle(index)}
                  disabled={selectedStyle === index || failedImages.has(index)}
                  className={`text-base font-semibold rounded-full transition-all duration-300 ${
                    selectedStyle === index
                      ? "bg-green-500 hover:bg-green-500 text-white"
                      : failedImages.has(index)
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-[#3D08FF] hover:bg-[#3D08FF]/90 text-white"
                  }`}
                  style={{ width: '280px', height: '80px' }}
                >
                {selectedStyle === index ? (
                  <>
                    <span className="mr-2">✓</span>
                    {t("style_saved")}
                  </>
                ) : failedImages.has(index) ? (
                  "图片加载失败"
                ) : (
                  t("save_style")
                )}
                </Button>
              </div>
            </motion.div>
            );
          })}
        </div>

        {/* 底部操作按钮 */}
        <div className="flex flex-col gap-4 justify-center items-center w-full px-4">
          {/* 重新生成按钮 */}
          <Button
            onClick={handleRegenerate}
            disabled={isLoading}
            className="bg-black hover:bg-gray-800 text-white text-base sm:text-lg font-semibold rounded-full flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-[505px]"
            style={{ 
              height: '68px',
              maxWidth: '505px'
            }}
          >
            {/* <RotateCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} /> */}
            {isLoading ? t("generating") : t("regenerate")}
          </Button>

          {/* 生成最佳照片文字 */}
          <div className="text-center">
            <p className="text-black text-base font-medium cursor-pointer hover:text-white transition-colors" onClick={handleGenerateBest}>
              {t("generate_best_subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* 大图预览模态框 */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closePreview}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <button
                onClick={closePreview}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6L18 18"/>
                </svg>
              </button>

              {/* 大图 */}
              <img
                src={previewImage}
                alt={t("alt_texts.preview_image")}
                className="w-full h-full object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 