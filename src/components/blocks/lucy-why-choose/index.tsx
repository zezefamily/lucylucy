'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function LucyWhyChoose() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [replyCount, setReplyCount] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // 只在元素进入视窗且还没有动画过时才执行
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
          
          // 延迟一点开始动画，确保用户看到
          setTimeout(() => {
            // 数字增长动画
            const matchTimer = setInterval(() => {
              setMatchCount(prev => {
                if (prev >= 3) {
                  clearInterval(matchTimer);
                  return 3;
                }
                return prev + 1;
              });
            }, 300);

            const replyTimer = setInterval(() => {
              setReplyCount(prev => {
                if (prev >= 5) {
                  clearInterval(replyTimer);
                  return 5;
                }
                return prev + 1;
              });
            }, 250);
          }, 200);

          // 动画完成后停止观察
          observer.disconnect();
        }
      },
      { 
        threshold: 0.5, // 增加阈值，确保元素更多部分可见时才触发
        rootMargin: '-50px 0px' // 添加边距，确保元素更多进入视窗才触发
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section ref={sectionRef} className="py-16 lg:py-24" style={{ backgroundColor: '#5D30FF' }}>
      <div className="container mx-auto px-4">
        {/* 标题 */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-6xl font-bold text-transparent bg-gradient-to-r from-[#C8FF47] to-[#47D7FF] bg-clip-text">
            <span className="text-[#C8FB75]">Why Choose </span><span className="text-[#FFFFFF]">Lucy AI ?</span> 
          </h2>
        </div>

        {/* 内容区域 */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* 左侧：用户引用 */}
          <div className="space-y-8">
            <blockquote className="text-white text-lg lg:text-xl font-medium italic">
              "After optimizing my profile with Lucy, my match rate tripled."
            </blockquote>
            
            <blockquote className="text-white text-lg lg:text-xl font-medium italic">
              "Lucy's openers increased my reply rate by 5x—conversations actually started flowing."
            </blockquote>
          </div>

          {/* 右侧：数据展示 */}
          <div className="space-y-12">
            {/* Match rate 3X */}
            <div className="space-y-4">
              <div className="flex items-end">
                <span className="text-white text-lg lg:text-xl font-black">Match rate</span>
                <span className="text-[#FFA8F5] text-4xl lg:text-5xl font-black ml-2 transition-all duration-300 transform">
                  {matchCount}X
                </span>
              </div>
              {/* 渐变刻度进度条 */}
              <div className="relative overflow-hidden">
                <div className="w-full h-10 overflow-hidden" style={{
                  background: 'linear-gradient(90deg, #FFD2F5 0%, #FF64DC 100%)'
                }}>
                  {/* 动画填充效果 */}
                  <div 
                    className="absolute inset-0 transition-all duration-1000 ease-out"
                    style={{
                      background: 'linear-gradient(90deg, #FFD2F5 0%, #FF64DC 100%)',
                      transform: isVisible ? 'translateX(0%)' : 'translateX(-100%)'
                    }}
                  />
                  
                  {/* 密集刻度线 - 放在动画层之上 */}
                  <div className="absolute inset-0 flex z-10">
                    {[...Array(30)].map((_, i) => (
                      <div 
                        key={i}
                        className="flex-1 border-r border-white/50 last:border-r-0"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Reply rate 5X */}
            <div className="space-y-4">
              <div className="flex items-end">
                <span className="text-white text-lg lg:text-xl font-black">Reply rate</span>
                <span className="text-[#C8FB75] text-4xl lg:text-5xl font-black ml-2 transition-all duration-300 transform">
                  {replyCount}X
                </span>
              </div>
              {/* 绿色到白色渐变进度条 */}
              <div className="relative overflow-hidden">
                <div className="w-full h-10 rounded-full bg-white">
                  <div 
                    className="h-full rounded-full transition-all duration-1200 ease-out"
                    style={{
                      background: 'linear-gradient(90deg, #C8FB75 0%, #C8FB75 70%, #FFFFFF 100%)',
                      width: isVisible ? '80%' : '0%'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 