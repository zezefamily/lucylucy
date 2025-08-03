"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

// 数值动画组件
const AnimatedNumber = ({ targetValue, duration = 2000 }: { targetValue: number; duration?: number }) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // 使用 easeOutCubic 缓动函数
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);
      
      setCurrentValue(Math.floor(targetValue * easedProgress));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    // 延迟开始动画
    const timer = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, 500);

    return () => {
      clearTimeout(timer);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [targetValue, duration]);

  return <span>{currentValue}</span>;
};

export default function LucyHero() {
  return (
    <motion.section 
      className="relative w-full min-h-screen lg:min-h-[80vh] xl:min-h-[70vh] overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF64DC] to-[#FFA8F5]" />
      
      {/* 主要内容容器 */}
      <div className="relative z-10 min-h-screen lg:min-h-[80vh] xl:min-h-[70vh] flex items-center py-8 lg:py-16 xl:py-20">
                  <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            
            {/* 左侧内容 */}
            <motion.div 
              className="text-left space-y-6 relative"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              {/* 主标题 */}
              <div className="relative">
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  <span style={{ color: '#3D08FF', fontWeight: '900' }}>Your Personal AI</span>
                  <br />
                  <span 
                    className="inline-block font-bold py-2 rounded-full"
                    style={{ 
                      color: '#C8FB75',
                      fontWeight: '900'
                    }}
                  >
                    Dating Coach
                  </span>
                </h1>
                
                {/* 副标题 */}
                <p className="text-xl lg:text-2xl text-black font-medium max-w-lg mt-6">
                  Create a profile that gets more matches and replies
                </p>
                
                {/* 标题装饰背景 */}
                <motion.div 
                  className="absolute top-16 -left-20 -z-10"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.8, scale: 1 }}
                  transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                >
                  <img 
                    src="/imgs/lucy/hero_title_bg.png"
                    alt="title decoration"
                    className="w-220 h-auto"
                  />
                </motion.div>
              </div>
              
              {/* 上传按钮 */}
              <motion.div 
                className="pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
              >
                <Link href="">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Button 
                      size="lg" 
                      className="bg-black text-white hover:bg-gray-800 font-semibold px-8 pl-2 pr-4 py-8 rounded-full text-lg"
                    >
                    <img 
                      src="/imgs/lucy/hero_add_img_icon.png" 
                      alt="upload icon" 
                      className="mr-1 w-10 h-10"
                    />
                      Upload your dating bio
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
              
              {/* 统计数据 */}
              <motion.div 
                className="flex gap-8 pt-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1, ease: "easeOut" }}
              >
                <div 
                  className="text-black text-lg"
                  style={{ fontWeight: '900' }}
                >
                  Match rate <span 
                    className="text-4xl"
                    style={{ color: '#C8FB75', fontWeight: '900' }}
                  >
                    <AnimatedNumber targetValue={300} />%
                  </span>
                </div>
                <div 
                  className="text-black text-lg"
                  style={{ fontWeight: '900' }}
                >
                  Reply rate <span 
                    className="text-4xl"
                    style={{ color: '#C8FB75', fontWeight: '900' }}
                  >
                    <AnimatedNumber targetValue={500} />%
                  </span>
                </div>
              </motion.div>
            </motion.div>
            
            {/* 右侧图片内容 */}
            <motion.div 
              className="relative flex items-center justify-center mt-8 lg:mt-0"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
              <div className="w-full max-w-sm lg:max-w-lg">
                <img 
                  src="/imgs/lucy/banner_hero_img.png"
                  alt="Dating Profile Analysis"
                  className="w-full h-auto object-contain"
                />
              </div>
            </motion.div>
            
          </div>
        </div>
      </div>
      
      {/* 底部文字装饰 */}
      <div className="absolute bottom-4 left-0 right-0">
        <div className="container mx-auto px-4">
                      <div 
              className="text-center text-xs lg:text-sm tracking-[0.3em] font-light"
              style={{ color: '#FF64DC' }}
            >
              D &nbsp;&nbsp;&nbsp;A &nbsp;&nbsp;&nbsp;T &nbsp;&nbsp;&nbsp;I &nbsp;&nbsp;&nbsp;N &nbsp;&nbsp;&nbsp;G &nbsp;&nbsp;&nbsp; P&nbsp;&nbsp;&nbsp; H&nbsp;&nbsp;&nbsp; O&nbsp;&nbsp;&nbsp; T&nbsp;&nbsp;&nbsp; O &nbsp;&nbsp;&nbsp; A &nbsp;&nbsp;&nbsp;N &nbsp;&nbsp;&nbsp;A &nbsp;&nbsp;&nbsp;L &nbsp;&nbsp;&nbsp;Y &nbsp;&nbsp;&nbsp;Z &nbsp;&nbsp;&nbsp;E &nbsp;&nbsp;&nbsp;R
            </div>
        </div>
      </div>
    </motion.section>
  );
} 