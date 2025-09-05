"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Compressor from 'compressorjs';

export default function ImageGeneration() {
  const t = useTranslations("image_generation");
  const router = useRouter();
  
  // 图片数据
  const imageGroups = [
    {
      original_img: "https://pub-4c1bda179b984d73a1dd14ae74983504.r2.dev/static/banner_0_orig.png",
      rendering_img: [
        "https://pub-4c1bda179b984d73a1dd14ae74983504.r2.dev/static/banner_0_result_1.png",
        "https://pub-4c1bda179b984d73a1dd14ae74983504.r2.dev/static/banner_0_result_2.png", 
        "https://pub-4c1bda179b984d73a1dd14ae74983504.r2.dev/static/banner_0_result_3.png"
      ]
    },
    {
      original_img: "https://pub-4c1bda179b984d73a1dd14ae74983504.r2.dev/static/banner_1_orig.png",
      rendering_img: [
        "https://pub-4c1bda179b984d73a1dd14ae74983504.r2.dev/static/banner_1_result_1.png",
        "https://pub-4c1bda179b984d73a1dd14ae74983504.r2.dev/static/banner_1_result_2.png", 
        "https://pub-4c1bda179b984d73a1dd14ae74983504.r2.dev/static/banner_1_result_3.png"
      ]
    },
    {
      original_img: "https://pub-4c1bda179b984d73a1dd14ae74983504.r2.dev/static/banner_2_orig.png",
      rendering_img: [
        "https://pub-4c1bda179b984d73a1dd14ae74983504.r2.dev/static/banner_2_result_1.png",
        "https://pub-4c1bda179b984d73a1dd14ae74983504.r2.dev/static/banner_2_result_2.png", 
        "https://pub-4c1bda179b984d73a1dd14ae74983504.r2.dev/static/banner_2_result_3.png"
      ]
    },
    {
      original_img: "https://pub-4c1bda179b984d73a1dd14ae74983504.r2.dev/static/banner_3_orig.png",
      rendering_img: [
        "https://pub-4c1bda179b984d73a1dd14ae74983504.r2.dev/static/banner_3_result_1.png",
        "https://pub-4c1bda179b984d73a1dd14ae74983504.r2.dev/static/banner_3_result_2.png", 
        "https://pub-4c1bda179b984d73a1dd14ae74983504.r2.dev/static/banner_3_result_3.png"
      ]
    },
  ];

  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showUploadPage, setShowUploadPage] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());

  // 预加载所有图片
  useEffect(() => {
    const preloadImages = async () => {
      const allImageUrls: string[] = [];
      
      // 收集所有图片URL
      imageGroups.forEach(group => {
        allImageUrls.push(group.original_img);
        allImageUrls.push(...group.rendering_img);
      });

      // 预加载图片
      const loadPromises = allImageUrls.map(url => {
        return new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(url);
          img.onerror = () => reject(url);
          img.src = url;
        });
      });

      try {
        const loadedUrls = await Promise.allSettled(loadPromises);
        const successfulUrls = new Set<string>();
        
        loadedUrls.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successfulUrls.add(allImageUrls[index]);
          } else {
            console.warn('Failed to preload image:', allImageUrls[index]);
          }
        });
        
        setPreloadedImages(successfulUrls);
        console.log(`Successfully preloaded ${successfulUrls.size}/${allImageUrls.length} images`);
      } catch (error) {
        console.error('Error preloading images:', error);
      }
    };

    preloadImages();
  }, []);

  // 轮播切换
  useEffect(() => {
    if (showUploadPage) return; // 在上传页面时停止轮播
    
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentGroupIndex((prev) => (prev + 1) % imageGroups.length);
        setIsAnimating(false);
      }, 300); // 切换动画时间
    }, 5000); // 5秒切换一次

    return () => clearInterval(interval);
  }, [imageGroups.length, showUploadPage]);

  const currentGroup = imageGroups[currentGroupIndex];

  // 检测浏览器类型
  const detectBrowser = () => {
    const userAgent = navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isChrome = /chrome/i.test(userAgent) && !/edge/i.test(userAgent);
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    
    return { isSafari, isChrome, isMobile };
  };

  // 使用 Compressor.js 进行图片压缩
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const { isSafari, isMobile } = detectBrowser();
      
      // 移动端Safari兼容性配置
      const options = {
        quality: isSafari && isMobile ? 0.9 : 0.8,
        maxWidth: isSafari && isMobile ? 1000 : 1200,
        maxHeight: isSafari && isMobile ? 1000 : 1200,
        convertSize: isSafari && isMobile ? 500000 : 1000000,
        mimeType: 'image/webp',
        useWebWorker: !(isSafari && isMobile),
        success: (result: any) => {
          console.log(`图片压缩完成: ${file.size} -> ${result.size} bytes`);
          resolve(result as File);
        },
        error: (err: any) => {
          console.warn('图片压缩失败，使用原图:', err);
          resolve(file);
        }
      };
      
      new Compressor(file, options);
    });
  };

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 保存原始文件
      setUploadedFile(file);
      
      // 显示预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

    // 处理图片生成
  const handleGenerate = async () => {
    if (!uploadedFile) {
      toast.error(t("errors.upload_required"));
      return;
    }

    setIsGenerating(true);
    
    try {
      // 1. 压缩图片
      toast.info(t("errors.processing_image"));
      console.log("开始压缩图片...");
      const compressedFile = await compressImage(uploadedFile);
      console.log(`图片压缩完成: ${uploadedFile.size} -> ${compressedFile.size} bytes`);

      // 2. 将压缩后的图片转换为base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        
        // 3. 保存压缩图片信息到 localStorage 并跳转到结果页面
        const imageData = {
          originalFile: {
            name: uploadedFile.name,
            type: uploadedFile.type,
            size: uploadedFile.size
          },
          compressedFile: {
            name: compressedFile.name,
            type: compressedFile.type,
            size: compressedFile.size,
            base64: base64Image
          }
        };
        
        localStorage.setItem('imageToGenerate', JSON.stringify(imageData));
        console.log('压缩图片已保存到 localStorage，跳转到结果页面');
        console.log('保存的图片数据:', imageData);
        
        toast.success("图片处理完成，正在生成...");
        
        // 跳转到结果页面
        router.push('/img-generation-result');
      };
      
      reader.readAsDataURL(compressedFile);

    } catch (error) {
      console.error('图片处理失败:', error);
      const errorMessage = error instanceof Error ? error.message : t("errors.generation_failed");
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // 图片上传组件
  const UploadComponent = () => (
    <div className="min-h-screen relative overflow-hidden">
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFA8F5] to-[#FF64DC]" />
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <button 
          onClick={() => setShowUploadPage(false)}
          className="mb-8 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-[#3D08FF] leading-tight mb-4"
            style={{ 
                fontWeight: '900'
            }}
          >
            {t("upload_title")} <span className="text-[#C8FB75]">{t("upload_title_highlight")}</span>
          </h1>
        </div>

        {/* 上传区域 */}
        <div className="max-w-sm lg:max-w-[720px] mx-auto">
          <div className={`bg-[#3D08FF]/12 backdrop-blur-sm rounded-3xl p-8 ${!uploadedImage ? 'lg:h-[312px]' : 'lg:min-h-[312px] lg:max-h-[600px]'} lg:flex lg:flex-col lg:justify-center lg:items-center`}>
            {/* 上传区域 - 始终显示 */}
            <div className={`bg-white rounded-2xl p-6 lg:p-8 text-center w-full lg:w-[364px] ${!uploadedImage ? 'lg:h-[228px] lg:flex lg:flex-col lg:justify-center lg:items-center' : 'lg:max-h-[500px] lg:flex lg:flex-col'}`}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col justify-center items-center">
                {!uploadedImage ? (
                  /* 未上传状态 */
                  <>
                    <div className="w-16 h-16 bg-gradient-to-br from-[#FFA8F5] to-[#FF64DC] rounded-full mb-4 flex items-center justify-center">
                      <Plus className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-gray-800 font-medium">{t("upload_placeholder")}</p>
                  </>
                ) : (
                  /* 图片预览状态 */
                  <div className="relative w-full flex-1 flex items-center justify-center">
                    <img 
                      src={uploadedImage} 
                      alt={t("alt_texts.uploaded_image")} 
                      className="w-full h-auto object-contain rounded-xl max-h-[400px] lg:max-h-[450px]"
                    />
                    {/* 更换图片提示 */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center opacity-0 hover:opacity-100">
                      <div className="text-white text-sm font-medium bg-black/70 px-3 py-1 rounded-full">
                        {t("change_photo_hint")}
                      </div>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* 生成按钮 */}
          <div className="text-center mt-8">
            <Button 
              size="lg" 
              onClick={handleGenerate}
              disabled={!uploadedFile || isGenerating}
              className="bg-black hover:bg-gray-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-4 text-lg font-semibold rounded-full flex items-center gap-3 h-auto mx-auto"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin text-xl">⏳</div>
                  {t("generating")}
                </>
              ) : (
                <>
                  <span className="text-lime-400 text-xl">✨</span>
                  {t("generate_button")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
     );

  // 如果显示上传页面，返回上传组件
  if (showUploadPage) {
    return <UploadComponent />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-pink-500 to-purple-600 relative overflow-hidden">
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>
      {/* 背景装饰形状 */}
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFA8F5] to-[#FF64DC]" />
      {/* <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-700/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-pink-700/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-2xl"></div>
      </div> */}

      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row items-center justify-between min-h-[60vh] lg:min-h-[80vh] gap-8 lg:gap-12">
          {/* 左侧内容区域 */}
          <div className="flex-1 max-w-2xl text-center lg:text-left order-1 lg:order-1 lg:pl-0">
            <div className="space-y-4 lg:space-y-6">
              {/* 主标题 */}
              <div className="space-y-1 lg:space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-7xl font-bold text-[#3D08FF] leading-tight"
                    style={{ 
                        fontWeight: '900'
                    }}
                >
                  {t("main_title_line1")} {t("main_title_line2")}
                </h1>
                <h2 className="text-3xl sm:text-4xl lg:text-7xl font-bold text-[#C8FB75] leading-tight">
                  {t("main_title_highlight")}
                </h2>
              </div>

              {/* 描述文字 */}
              <div className="space-y-1 lg:space-y-2">
                <p className="text-lg sm:text-xl lg:text-2xl text-gray-100 leading-relaxed">
                  {t("description_line1")}
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl text-gray-100 leading-relaxed">
                  {t("description_line2")}
                </p>
              </div>

              {/* 行动按钮 - 大屏幕显示在左侧内容区域 */}
              <div className="hidden lg:block">
                <Button 
                  size="lg" 
                  onClick={() => setShowUploadPage(true)}
                  className="bg-black hover:bg-gray-800 text-white px-6 py-3 text-lg font-semibold rounded-full flex items-center gap-3 h-auto"
                >
                  <img 
                    src="/imgs/lucy/hero_add_img_icon.png" 
                    alt={t("alt_texts.add_image")} 
                    width="60" 
                    height="60"
                    className="w-[60px] h-[60px]"
                    style={{ marginLeft: '0px' }}
                  />
                  <span style={{ marginLeft: '0px' }}>{t("cta_button")}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* 右侧图片展示区域 */}
          <div className="flex-1 w-full max-w-[570px] order-2 lg:order-2">
            <div className="bg-black backdrop-blur-sm rounded-[10px] border border-white/20 p-2 pt-3">
              
              <div className="flex gap-1 sm:gap-2 justify-start sm:justify-center overflow-x-auto sm:overflow-visible sm:px-0 relative scrollbar-hide">
                {/* 图片1 - 用户原图，保持最左侧 */}
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={`original-${currentGroupIndex}`}
                    className="flex-shrink-0 w-[100px] h-[133px] sm:w-[130px] sm:h-[173px] bg-gray-300 rounded-[10px] flex items-center justify-center relative z-10"
                    style={{ position: 'relative', zIndex: 20 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    {preloadedImages.has(currentGroup.original_img) ? (
                      <>
                        <img 
                          src={currentGroup.original_img} 
                          alt="Original" 
                          className="w-full h-full object-cover"
                          style={{ opacity: 1 }}
                        />
                        {/* 黑色半透明遮罩 */}
                        <div className="absolute inset-0 bg-black/40 rounded-[10px]"></div>
                      </>
                      
                    ) : (
                      <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                        <div className="text-gray-400 text-xs">Loading...</div>
                      </div>
                    )}
                    
                    {/* 向上箭头图标 */}
                    <motion.div 
                        key={`arrow-${currentGroupIndex}`}
                        style={{ 
                            position: 'absolute',
                            bottom: '5px',
                            right: '-25px',
                            zIndex: 20
                        }}
                        initial={{ opacity: 0, y: 15, scale: 0.6 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.6 }}
                        transition={{ 
                          duration: 0.5, 
                          delay: 0.35, // 在原图动画(0.3s)完成后开始
                          ease: "easeIn",
                          type: "spring",
                          stiffness: 200,
                          damping: 15
                        }}
                    >
                        <img 
                          src="/imgs/lucy/ori_img_bottom_icon_new.png" 
                          alt={t("alt_texts.arrow_icon")} 
                          width="95" 
                          height="55"
                          className="w-[57px] h-[33px]"
                          style={{
                            filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))'
                          }}
                        />
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
                
                {/* 效果图1 */}
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={`effect1-${currentGroupIndex}`}
                    className="flex-shrink-0 w-[100px] h-[133px] sm:w-[130px] sm:h-[173px] bg-gray-300 rounded-[10px] flex items-center justify-center relative z-10"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: 0.1, 
                      ease: [0.25, 0.46, 0.45, 0.94],
                      type: "spring",
                      stiffness: 150,
                      damping: 12
                    }}
                  >
                    {preloadedImages.has(currentGroup.rendering_img[0]) ? (
                      <img 
                        src={currentGroup.rendering_img[0]} 
                        alt="Effect 1" 
                        className="w-full h-full object-cover"
                        style={{ opacity: 1 }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                        <div className="text-gray-400 text-xs">Loading...</div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
                
                {/* 效果图2 */}
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={`effect2-${currentGroupIndex}`}
                    className="flex-shrink-0 w-[100px] h-[133px] sm:w-[130px] sm:h-[173px] bg-gray-300 rounded-[10px] flex items-center justify-center relative z-10"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: 0.2, 
                      ease: [0.25, 0.46, 0.45, 0.94],
                      type: "spring",
                      stiffness: 150,
                      damping: 12
                    }}
                  >
                    {preloadedImages.has(currentGroup.rendering_img[1]) ? (
                      <img 
                        src={currentGroup.rendering_img[1]} 
                        alt="Effect 2" 
                        className="w-full h-full object-cover"
                        style={{ opacity: 1 }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                        <div className="text-gray-400 text-xs">Loading...</div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
                
                {/* 效果图3 - 超出容器边界 */}
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={`effect3-${currentGroupIndex}`}
                    className="flex-shrink-0 w-[100px] h-[133px] sm:w-[130px] sm:h-[173px] bg-gray-300 rounded-[10px] flex items-center justify-center relative z-20"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: 0.3, 
                      ease: [0.25, 0.46, 0.45, 0.94],
                      type: "spring",
                      stiffness: 150,
                      damping: 12
                    }}
                  >
                    {preloadedImages.has(currentGroup.rendering_img[2]) ? (
                      <img 
                        src={currentGroup.rendering_img[2]} 
                        alt="Effect 3" 
                        className="w-full h-full object-cover"
                        style={{ opacity: 1 }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                        <div className="text-gray-400 text-xs">Loading...</div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* 轮播指示器 */}
              <div className="flex justify-center gap-2 mt-3">
                {imageGroups.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentGroupIndex ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 行动按钮 - 移动端显示在底部 */}
          <div className="w-full order-3 lg:hidden mt-8">
            <div className="text-center">
                <Button 
                  size="lg" 
                  onClick={() => setShowUploadPage(true)}
                  className="bg-black hover:bg-gray-800 text-white px-6 py-3 text-base font-semibold rounded-full flex items-center gap-3 h-auto mx-auto"
                >
                  <img 
                    src="/imgs/lucy/hero_add_img_icon.png" 
                    alt={t("alt_texts.add_image")} 
                    width="60" 
                    height="60"
                    className="w-[60px] h-[60px]"
                    style={{ marginLeft: '0px' }}
                  />
                  <span style={{ marginLeft: '0px' }}>{t("cta_button")}</span>
                </Button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}