"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Check, X, Lightbulb, Download } from "lucide-react"
import { motion } from "framer-motion"
import html2canvas from "html2canvas"
import { toast } from "sonner"
import Image from "next/image"

// 数值动画组件
const AnimatedNumber = ({ targetValue, duration = 2000 }: { targetValue: number; duration?: number }) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    // 简化的动画实现
    const timer = setTimeout(() => {
      setCurrentValue(targetValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [targetValue]);

  return <span>{currentValue}</span>;
};

// 圆形进度条组件
interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  color: string
  label: string
}

function CircularProgress({ 
  percentage, 
  size = 80, 
  strokeWidth = 8, 
  color, 
  label 
}: CircularProgressProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = `${circumference} ${circumference}`
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 300);

    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* 背景圆 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="opacity-20"
          />
          {/* 进度圆 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold" style={{ color }}>
            <AnimatedNumber targetValue={percentage} duration={700} />%
          </span>
        </div>
      </div>
      <span className="text-xs text-gray-600 text-center font-medium">
        {label}
      </span>
    </div>
  )
}

// 标记项组件
interface FlagItemProps {
  text: string
  type: 'green' | 'red'
}

function FlagItem({ text, type }: FlagItemProps) {
  const Icon = type === 'green' ? Check : X
  const iconColor = type === 'green' ? '#10B981' : '#EF4444'
  const bgColor = type === 'green' ? 'bg-green-50' : 'bg-red-50'
  
  return (
    <div className={`flex items-start space-x-3 p-3 rounded-lg ${bgColor}`}>
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: iconColor }} />
      <span className="text-sm text-gray-700 leading-relaxed">{text}</span>
    </div>
  )
}

// 建议项组件
interface SuggestionItemProps {
  title: string
  description: string
}

function SuggestionItem({ title, description }: SuggestionItemProps) {
  return (
    <div className="flex items-start space-x-3 p-4 bg-white/50 rounded-lg backdrop-blur-sm">
      <Lightbulb className="w-5 h-5 mt-0.5 text-yellow-500 flex-shrink-0" />
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export default function FitReport() {
  // 从localStorage读取分析结果
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingScreenshot, setIsGeneratingScreenshot] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('fitTestResult');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setAnalysisData(data);
      } catch (error) {
        console.error('Failed to parse stored result:', error);
      }
    }
    setIsLoading(false);
  }, []);

  // 如果没有数据，显示默认数据或错误信息
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FF64DC] to-[#FFA8F5] flex items-center justify-center">
        <div className="text-white text-xl">Loading analysis result...</div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FF64DC] to-[#FFA8F5] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-xl mb-4">No analysis result found</div>
          <button 
            onClick={() => window.location.href = '/fit-test'}
            className="bg-black text-white px-6 py-3 rounded-full"
          >
            Take the test again
          </button>
        </div>
      </div>
    );
  }

  // 使用分析结果数据
  const compatibilityScore = analysisData.overallScore || 88;
  const userAvatarUrl = analysisData.profile1Images?.[0] || "/imgs/lucy/banner_hero_img_new.png";
  const partnerAvatarUrl = analysisData.profile2Images?.[0] || "/imgs/lucy/banner_hero_img_new.png";
  
  const metrics = [
    { label: "Vibes", percentage: analysisData.fourDimensions?.vibes || 0, color: "#8B5CF6" },
    { label: "Interests", percentage: analysisData.fourDimensions?.interests || 0, color: "#A855F7" },
    { label: "Personality", percentage: analysisData.fourDimensions?.personality || 0, color: "#84CC16" },
    { label: "Intent", percentage: analysisData.fourDimensions?.intent || 0, color: "#EC4899" }
  ];

  const greenFlags = analysisData.greenFlags || [
    "Similar values and future visions align beautifully"
  ];

  const redFlags = analysisData.redFlags || [
    "Need more communication about expectations"
  ];

  const suggestions = analysisData.finalAdvice?.map((advice: string, index: number) => ({
    title: `Suggestion ${index + 1}`,
    description: advice
  })) || [
    { title: "Suggestion 1", description: "Continue building your connection" }
  ];

  // 生成兼容性报告截图并下载保存
  const handleShareScreenshot = async () => {
    if (!reportRef.current) {
      toast.error("Report not found");
      return;
    }

    setIsGeneratingScreenshot(true);
    toast.info("Generating compatibility card...");

    try {
      // 生成截图
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // 提高分辨率
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FF64DC', // 设置渐变起始色作为背景
        width: reportRef.current.offsetWidth,
        height: reportRef.current.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      });

      // 转换为图片
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // 创建下载链接
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `soul-compatibility-report-${timestamp}.png`;
      link.href = imgData;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Compatibility card saved successfully! 📸");
      
    } catch (error) {
      console.error('Screenshot generation failed:', error);
      toast.error("Failed to generate compatibility card");
    } finally {
      setIsGeneratingScreenshot(false);
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-[#FF64DC] to-[#FFA8F5] relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* 背景装饰 - 简化版 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-32 right-16 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
      </div>

      <motion.div 
        className="relative z-10 px-2 sm:px-4 lg:px-6 py-6 w-full max-w-sm sm:max-w-md lg:max-w-[750px] mx-auto"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* 头部 */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeIn" }}
        >
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="text-center">
            <h1 className="text-white text-lg font-semibold">Compatibility Report</h1>
            <p className="text-white/80 text-sm">AI has decoded your connection</p>
          </div>
          <div className="w-10"></div> {/* 占位符保持居中 */}
        </motion.div>

        {/* 截图区域开始 */}
        <div 
          ref={reportRef}
          className=""
        >

        {/* 用户头像 */}
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeIn", delay: 0.2 }}
        >
          <div className="relative">
            <div className="flex items-center space-x-2 lg:space-x-4">
              <Avatar className="w-40 h-40 lg:w-40 lg:h-40 border-4 border-white shadow-lg">
                <AvatarImage src={userAvatarUrl} alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <Avatar className="w-40 h-40 lg:w-40 lg:h-40 border-4 border-white shadow-lg">
                <AvatarImage src={partnerAvatarUrl} alt="Partner" />
                <AvatarFallback>P</AvatarFallback>
              </Avatar>
            </div>
            {/* 心形连接 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Image
                src="/imgs/lucy/fit_report_heart.png"
                alt="Heart Connection"
                width={109}
                height={95}
                className="w-[109px] h-[95px]"
              />
            </div>
          </div>
        </motion.div>

        {/* 匹配度卡片 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeIn", delay: 0.4 }}
        >
          <Card className="mb-6 bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-5xl lg:text-6xl font-bold text-gray-800 mb-2 flex items-center justify-center">
                  <div className="mr-2 lg:mr-3">
                    <Image
                      src="/imgs/lucy/fit_zhuangshi_left.png"
                      alt="Left Decoration"
                      width={33}
                      height={54}
                      className="w-[33px] h-[54px]"
                    />
                  </div>
                  <div className="flex items-end">
                    <AnimatedNumber targetValue={compatibilityScore} duration={1500} />
                    <span className="text-2xl lg:text-3xl text-gray-600 ml-1">%</span>
                  </div>
                  <div className="ml-2 lg:ml-3">
                    <Image
                      src="/imgs/lucy/fit_zhuangshi_right.png"
                      alt="Right Decoration"
                      width={33}
                      height={54}
                      className="w-[33px] h-[54px]"
                    />
                  </div>
                </div>
                <p className="text-gray-600 text-sm lg:text-base">
                  {analysisData.oneSentenceSummary || "Like Dali and Gala, art and passion ignite sparks between you"}
                </p>
              </div>
            
            {/* 四个维度的圆形进度条 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {metrics.map((metric, index) => (
                <CircularProgress
                  key={index}
                  percentage={metric.percentage}
                  color={metric.color}
                  label={metric.label}
                  size={80}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Green Flags */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeIn", delay: 0.6 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex items-center justify-center">
              <Image
                src="/imgs/lucy/fit_green_flags_icon.png"
                alt="Green Flags"
                width={36}
                height={36}
                className=""
              />
            </div>
            <h2 className="text-white text-lg font-semibold">Green Flags</h2>
          </div>
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 space-y-3">
              {greenFlags.map((flag: string, index: number) => (
                <FlagItem key={index} text={`${index + 1}. ${flag}`} type="green" />
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Red Flags */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeIn", delay: 0.8 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex items-center justify-center">
              <Image
                src="/imgs/lucy/fit_red_flags_icon.png"
                alt="Red Flags"
                width={36}
                height={36}
                className=""
              />
            </div>
            <h2 className="text-white text-lg font-semibold">Red Flags</h2>
          </div>
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 space-y-3">
              {redFlags.map((flag: string, index: number) => (
                <FlagItem key={index} text={`${index + 1}. ${flag}`} type="red" />
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Suggestions */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeIn", delay: 1.0 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex items-center justify-center">
              <Image
                src="/imgs/lucy/fit_suggestions_icon.png"
                alt="Suggestions"
                width={36}
                height={36}
                className=""
              />
            </div>
            <h2 className="text-white text-lg font-semibold">Suggestions</h2>
          </div>
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 space-y-3">
              {suggestions.map((suggestion: any, index: number) => (
                <SuggestionItem 
                  key={index}
                  title={suggestion.title} 
                  description={suggestion.description} 
                />
              ))}
            </CardContent>
          </Card>
        </motion.div>

        </div>
        {/* 截图区域结束 */}

        {/* 分享按钮 */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeIn", delay: 1.2 }}
        >
          <Button 
            onClick={handleShareScreenshot}
            disabled={isGeneratingScreenshot}
            className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-full font-semibold shadow-lg flex items-center justify-center gap-2"
          >
            {isGeneratingScreenshot ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Share Compatibility Card
              </>
            )}
          </Button>
          <p className="text-white/70 text-xs mt-2">
            Generate a beautiful card to share your connection
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}