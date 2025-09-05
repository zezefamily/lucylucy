"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ImageGenerationResult() {
  const t = useTranslations("image_generation_result");
  const router = useRouter();
  const isMobile = useIsMobile();

  
  // 从URL参数获取生成的图片数据
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<any>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  // 检测设备和浏览器类型
  const detectDevice = () => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isChrome = /chrome/i.test(userAgent) && !/edge/i.test(userAgent);
    const isMobileDevice = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    
    return { isIOS, isAndroid, isSafari, isChrome, isMobileDevice };
  };

  // 生成图片的函数
  const generateImages = async () => {
    try {
      setIsLoading(true);
      console.log('=== 开始生成图片 ===');
      
      // 1. 检查是否有待生成的图片
      const imageToGenerate = localStorage.getItem('imageToGenerate');
      if (!imageToGenerate) {
        console.log('没有找到待生成的图片，返回上一页');
        router.push('/image-generation');
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

      // 验证生成的图片数量
      if (!Array.isArray(result.data.generatedImages) || result.data.generatedImages.length === 0) {
        throw new Error('AI未能生成任何图片，请重试');
      }

      // 5. 更新状态显示结果
      setGeneratedImages(result.data.generatedImages);
      setTaskId(result.data.taskId);
      
      console.log('图片生成成功');

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

  // 移动端Web Share API保存图片
  const saveImageViaMobileShare = async (imageUrl: string, filename: string): Promise<boolean> => {
    try {
      const { isIOS, isAndroid, isMobileDevice } = detectDevice();
      
      if (!isMobileDevice || !navigator.share) {
        return false;
      }

      // 获取图片blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // 创建File对象
      const file = new File([blob], filename, { type: blob.type });
      
      // 检查是否支持文件分享
      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        console.log('设备不支持文件分享');
        return false;
      }

      // 使用Web Share API分享图片
      await navigator.share({
        title: '保存生成的图片',
        text: '来自 Lucy 的 AI 生成图片',
        files: [file]
      });
      
      console.log('图片通过Web Share API分享成功');
      return true;
      
    } catch (error) {
      console.error('Web Share API分享失败:', error);
      return false;
    }
  };

  // 移动端长按保存提示
  const showMobileSaveTip = (imageUrl: string) => {
    const { isIOS, isAndroid } = detectDevice();
    
    if (isIOS) {
      toast.success(t("mobile_ios_save_tip"), {
        duration: 4000,
      });
    } else if (isAndroid) {
      toast.success(t("mobile_android_save_tip"), {
        duration: 4000,
      });
    } else {
      toast.success(t("mobile_general_save_tip"), {
        duration: 3000,
      });
    }
  };

  // 下载图片到本地的函数（桌面端）
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
      
      console.log(`图片下载成功: ${filename}`);
    } catch (error) {
      console.error('图片下载失败:', error);
    }
  };

  const handleSaveStyle = async (index: number) => {
    setSelectedStyle(index);
    
    try {
      const selectedImageData = generatedImages[index];
      const selectedImageUrl = typeof selectedImageData === 'string' ? selectedImageData : selectedImageData.url;
      const filename = `generated-style-${index + 1}.jpg`;
      
      console.log(`保存样式 ${index} 图片: ${selectedImageUrl}`);
      
      const { isMobileDevice } = detectDevice();
      
             if (isMobileDevice) {
         // 移动端：尝试使用Web Share API
         const shareSuccess = await saveImageViaMobileShare(selectedImageUrl, filename);
         
         if (shareSuccess) {
           toast.success(t("mobile_share_success"));
         } else {
           // 如果Web Share API不可用，显示长按保存提示
           showMobileSaveTip(selectedImageUrl);
         }
       } else {
         // 桌面端：直接下载
         await downloadImage(selectedImageUrl, filename);
         toast.success(t("desktop_save_success"));
       }
      
         } catch (error) {
       console.error('保存样式失败:', error);
       toast.error(t("save_error"));
     }
  };

  const handleRegenerate = () => {
    // 基于同一张原始图片重新生成
    console.log('=== 用户点击重新生成 ===');
    generateImages();
  };

  const handleGenerateBest = () => {
    // 基于用户选择或所有生成的图片，生成一张最佳照片
    router.push('/image-generation?mode=best');
  };

  const handleImageClick = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  // 移动端长按事件处理
  const handleImageLongPress = (imageUrl: string, index: number) => {
    if (isMobile) {
      // 在移动端，长按时给出保存提示
      showMobileSaveTip(imageUrl);
    }
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
          
          {/* 移动端保存提示 */}
          {isMobile && (
            <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
              <p className="text-white/80 text-sm">
                {t("mobile_save_tip")}
              </p>
            </div>
          )}
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
                className="w-full h-[360px] mb-3 overflow-hidden bg-gray-100 relative group cursor-pointer rounded-t-2xl"
                onClick={() => handleImageClick(imageUrl)}
                onTouchStart={(e) => {
                  // 移动端长按检测
                  const touchStartTime = Date.now();
                  const timer = setTimeout(() => {
                    handleImageLongPress(imageUrl, index);
                  }, 800); // 800ms长按
                  
                  const handleTouchEnd = () => {
                    clearTimeout(timer);
                    if (Date.now() - touchStartTime < 800) {
                      // 短按，打开预览
                      handleImageClick(imageUrl);
                    }
                    document.removeEventListener('touchend', handleTouchEnd);
                  };
                  
                  document.addEventListener('touchend', handleTouchEnd);
                }}
              >
                <img
                  src={imageUrl}
                  alt={`${t("alt_texts.generated_style")} ${index + 1}`}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                  onError={(e) => {
                    // 如果网络图片加载失败，使用本地图片作为后备
                    (e.target as HTMLImageElement).src = `/imgs/users/${index + 1}.png`;
                  }}
                />
                
                {/* 悬停遮罩和放大图标 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center pointer-events-none">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700">
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"/>
                    </svg>
                  </div>
                </div>

                {/* 移动端长按提示 */}
                {isMobile && (
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {t("mobile_long_press_hint")}
                  </div>
                )}
              </div>

              {/* 保存按钮 */}
              <div className="p-3 flex justify-center">
                <Button
                  onClick={() => handleSaveStyle(index)}
                  disabled={selectedStyle === index}
                  className={`text-base font-semibold rounded-full transition-all duration-300 ${
                    selectedStyle === index
                      ? "bg-green-500 hover:bg-green-500 text-white"
                      : "bg-[#3D08FF] hover:bg-[#3D08FF]/90 text-white"
                  }`}
                  style={{ width: '280px', height: '80px' }}
                >
                {selectedStyle === index ? (
                  <>
                    <span className="mr-2">✓</span>
                    {t("style_saved")}
                  </>
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