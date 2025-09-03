"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function ImageGeneration() {
  // 图片数据
  const imageGroups = [
    {
      original_img: "原图1",
      rendering_img: ["效果图1", "效果图2", "效果图3"]
    },
    {
      original_img: "原图2", 
      rendering_img: ["效果图1", "效果图2", "效果图3"]
    },
    {
      original_img: "原图3",
      rendering_img: ["效果图1", "效果图2", "效果图3"]
    }
  ];

  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // 轮播切换
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentGroupIndex((prev) => (prev + 1) % imageGroups.length);
        setIsAnimating(false);
      }, 300); // 切换动画时间
    }, 5000); // 5秒切换一次

    return () => clearInterval(interval);
  }, [imageGroups.length]);

  const currentGroup = imageGroups[currentGroupIndex];
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
                  Generate dating photos.
                </h1>
                <h2 className="text-3xl sm:text-4xl lg:text-7xl font-bold text-[#C8FB75] leading-tight">
                  3x your matches
                </h2>
              </div>

              {/* 描述文字 */}
              <div className="space-y-1 lg:space-y-2">
                <p className="text-lg sm:text-xl lg:text-2xl text-gray-100 leading-relaxed">
                  Upload your photos and get an irresistible
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl text-gray-100 leading-relaxed">
                  dating profile in seconds.
                </p>
              </div>

              {/* 行动按钮 - 大屏幕显示在左侧内容区域 */}
              <div className="hidden lg:block">
                <Button 
                  size="lg" 
                  className="bg-black hover:bg-gray-800 text-white px-8 py-6 text-lg font-semibold rounded-xl flex items-center gap-3 h-auto"
                >
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <Plus className="w-5 h-5 text-black" />
                  </div>
                  Create My Profile
                </Button>
              </div>
            </div>
          </div>

          {/* 右侧图片展示区域 */}
          <div className="flex-1 w-full max-w-[570px] order-2 lg:order-2">
            <div className="bg-black backdrop-blur-sm rounded-[10px] border border-white/20 p-2 pt-3">
              
              <div className="flex gap-1 sm:gap-2 justify-start sm:justify-center overflow-visible sm:px-0 relative">
                {/* 图片1 - 用户原图，保持最左侧 */}
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={`original-${currentGroupIndex}`}
                    className="flex-shrink-0 w-[100px] h-[133px] sm:w-[130px] sm:h-[173px] bg-gray-300 rounded-[10px] flex items-center justify-center relative z-10"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-gray-600 font-medium text-xs sm:text-sm">{currentGroup.original_img}</span>
                    
                    {/* 向上箭头图标 */}
                    <div className="absolute"
                        style={{ 
                            bottom: '0px',
                            right: '0px'
                        }}
                    >
                      <img 
                        src="imgs/lucy/ori_img_bottom_icon.png" 
                        alt="向上箭头" 
                        width="36" 
                        height="43"
                        className="w-9 h-11"
                      />
                    </div>
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
                      duration: 0.3, 
                      delay: 0.1, 
                      ease: [0.25, 0.46, 0.45, 0.94],
                      type: "spring",
                      stiffness: 150,
                      damping: 12
                    }}
                  >
                    <span className="text-gray-600 font-medium text-xs sm:text-sm">{currentGroup.rendering_img[0]}</span>
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
                      duration: 0.3, 
                      delay: 0.2, 
                      ease: [0.25, 0.46, 0.45, 0.94],
                      type: "spring",
                      stiffness: 150,
                      damping: 12
                    }}
                  >
                    <span className="text-gray-600 font-medium text-xs sm:text-sm">{currentGroup.rendering_img[1]}</span>
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
                      duration: 0.3, 
                      delay: 0.3, 
                      ease: [0.25, 0.46, 0.45, 0.94],
                      type: "spring",
                      stiffness: 150,
                      damping: 12
                    }}
                  >
                    <span className="text-gray-600 font-medium text-xs sm:text-sm">{currentGroup.rendering_img[2]}</span>
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
                className="bg-black hover:bg-gray-800 text-white px-6 py-4 text-base font-semibold rounded-xl flex items-center gap-3 h-auto mx-auto"
              >
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <Plus className="w-4 h-4 text-black" />
                </div>
                Create My Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}