"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

export default function ImageGenerationResult() {
  const t = useTranslations("image_generation_result");
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 从URL参数获取生成的图片数据
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchGeneratedImages = async () => {
      try {
        const taskId = searchParams.get('taskId');
        const imageUrls = searchParams.get('images');
        
        if (imageUrls) {
          // 如果URL参数中有图片，直接使用
          const images = JSON.parse(decodeURIComponent(imageUrls));
          setGeneratedImages(images);
        } else {
          // 否则使用模拟数据 - 使用更好的示例照片
          const mockImages = [
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face",
            "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop&crop=face",
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face"
          ];
          setGeneratedImages(mockImages);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load generated images:', error);
        // 使用模拟数据作为后备
        setGeneratedImages([
          "/imgs/users/1.png",
          "/imgs/users/2.png", 
          "/imgs/users/3.png",
          "/imgs/users/4.png"
        ]);
        setIsLoading(false);
      }
    };
    
    fetchGeneratedImages();
  }, [searchParams]);

  const handleGoBack = () => {
    router.back();
  };

  const handleSaveStyle = async (index: number) => {
    setSelectedStyle(index);
    
    try {
      const selectedImageUrl = generatedImages[index];
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

  const handleRegenerate = () => {
    setIsLoading(true);
    
    // 重新生成图片
    setTimeout(() => {
      // 在实际应用中，这里会调用图片生成API
      const newMockImages = [
        "/imgs/users/5.png",
        "/imgs/users/6.png", 
        "/imgs/users/7.png",
        "/imgs/users/8.png"
      ];
      setGeneratedImages(newMockImages);
      setSelectedStyle(null);
      setIsLoading(false);
    }, 2000);
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
          {generatedImages.map((imageUrl, index) => (
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
          ))}
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