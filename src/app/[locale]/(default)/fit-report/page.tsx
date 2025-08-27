"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Check, X, Lightbulb } from "lucide-react"
import { motion } from "framer-motion"

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
    }, 800);

    return () => {
      clearTimeout(timer);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [targetValue, duration]);

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
    }, 1000);

    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <motion.div 
      className="flex flex-col items-center space-y-2"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true }}
    >
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
            className="transition-all duration-1500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold" style={{ color }}>
            <AnimatedNumber targetValue={percentage} duration={1500} />%
          </span>
        </div>
      </div>
      <span className="text-xs text-gray-600 text-center font-medium">
        {label}
      </span>
    </motion.div>
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
  // 模拟数据
  const compatibilityScore = 88
  const userAvatarUrl = "/imgs/lucy/banner_hero_img_new.png"
  const partnerAvatarUrl = "/imgs/lucy/banner_hero_img_new.png"
  
  const metrics = [
    { label: "Vibes", percentage: 90, color: "#8B5CF6" },
    { label: "Interests", percentage: 90, color: "#A855F7" },
    { label: "Personality", percentage: 90, color: "#84CC16" },
    { label: "Relationship Intent", percentage: 60, color: "#EC4899" }
  ]

  const greenFlags = [
    "Similar values and future visions align beautifully",
    "你们都喜欢于行旅摄影，有共同的探索精神。",
    "你们都喜欢于行旅摄影，有共同的探索精神。",
    "你们都喜欢于行旅摄影，有共同的探索精神。",
    "你们都喜欢于行旅摄影，有共同的探索精神。",
    "你们都喜欢于行旅摄影，有共同的探索精神。"
  ]

  const redFlags = [
    "你们都喜欢于行旅摄影，有共同的探索精神。",
    "你们都喜欢于行旅摄影，有共同的探索精神。",
    "你们都喜欢于行旅摄影，有共同的探索精神。"
  ]

  const suggestions = [
    { title: "建议 1 深度对话", description: "多进行深度对话，分享彼此的心境感悟和想法" },
    { title: "建议 1 深度对话", description: "多进行深度对话，分享彼此的心境感悟和想法" },
    { title: "建议 1 深度对话", description: "多进行深度对话，分享彼此的心境感悟和想法" }
  ]

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-[#FF64DC] to-[#FFA8F5] relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"
          animate={{ 
            x: [0, 20, 0],
            y: [0, -15, 0],
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        ></motion.div>
        <motion.div 
          className="absolute bottom-32 right-16 w-24 h-24 bg-white/10 rounded-full blur-xl"
          animate={{ 
            x: [0, -25, 0],
            y: [0, 20, 0],
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        ></motion.div>
        <motion.div 
          className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
        ></motion.div>
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
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </motion.div>
          <motion.div 
            className="text-center"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h1 className="text-white text-lg font-semibold">Compatibility Report</h1>
            <p className="text-white/80 text-sm">AI has decoded your connection</p>
          </motion.div>
          <div className="w-10"></div> {/* 占位符保持居中 */}
        </motion.div>

        {/* 用户头像 */}
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="relative">
            <div className="flex items-center space-x-2 lg:space-x-4">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                whileHover={{ scale: 1.05 }}
              >
                <Avatar className="w-16 h-16 lg:w-20 lg:h-20 border-4 border-white shadow-lg">
                  <AvatarImage src={userAvatarUrl} alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </motion.div>
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                whileHover={{ scale: 1.05 }}
              >
                <Avatar className="w-16 h-16 lg:w-20 lg:h-20 border-4 border-white shadow-lg">
                  <AvatarImage src={partnerAvatarUrl} alt="Partner" />
                  <AvatarFallback>P</AvatarFallback>
                </Avatar>
              </motion.div>
            </div>
            {/* 心形连接 */}
            <motion.div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/80"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: 1
              }}
              transition={{
                opacity: { duration: 0.6, delay: 1.2 },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.2 }
              }}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </motion.div>
          </div>
        </motion.div>

        {/* 匹配度卡片 */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          whileHover={{ y: -5 }}
        >
          <Card className="mb-6 bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <motion.div 
                className="text-center mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.6 }}
              >
                <div className="text-5xl lg:text-6xl font-bold text-gray-800 mb-2 flex items-center justify-center">
                  <motion.span 
                    className="text-pink-500 mr-2 lg:mr-3"
                    animate={{ rotate: [0, 10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    🦋
                  </motion.span>
                  <AnimatedNumber targetValue={compatibilityScore} duration={2000} />
                  <span className="text-2xl lg:text-3xl text-gray-600 ml-1">%</span>
                  <motion.span 
                    className="text-pink-500 ml-2 lg:ml-3"
                    animate={{ rotate: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  >
                    🦋
                  </motion.span>
                </div>
                <p className="text-gray-600 text-sm lg:text-base">
                  Like Dali and Gala, art and passion ignite sparks between you
                </p>
              </motion.div>
            
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
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="flex items-center space-x-2 mb-4"
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.div 
              className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.2, rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <Check className="w-4 h-4 text-white" />
            </motion.div>
            <h2 className="text-white text-lg font-semibold">Green Flags</h2>
          </motion.div>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
          >
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 space-y-3">
                {greenFlags.map((flag, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <FlagItem text={`${index + 1}. ${flag}`} type="green" />
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Red Flags */}
        <motion.div 
          className="mb-6"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="flex items-center space-x-2 mb-4"
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.div 
              className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.2, rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <X className="w-4 h-4 text-white" />
            </motion.div>
            <h2 className="text-white text-lg font-semibold">Red Flags</h2>
          </motion.div>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
          >
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 space-y-3">
                {redFlags.map((flag, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <FlagItem text={`${index + 1}. ${flag}`} type="red" />
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Suggestions */}
        <motion.div 
          className="mb-8"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="flex items-center space-x-2 mb-4"
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.div 
              className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.2, rotate: 180 }}
              animate={{ 
                rotate: [0, 10, 0],
              }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: 0.3 }
              }}
            >
              <Lightbulb className="w-4 h-4 text-white" />
            </motion.div>
            <h2 className="text-white text-lg font-semibold">Suggestions</h2>
          </motion.div>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
          >
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 space-y-3">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <SuggestionItem 
                      title={suggestion.title} 
                      description={suggestion.description} 
                    />
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* 分享按钮 */}
        <motion.div 
          className="text-center"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-full font-semibold shadow-lg">
              Share Compatibility Card
            </Button>
          </motion.div>
          <motion.p 
            className="text-white/70 text-xs mt-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
          >
            Generate a beautiful card to share your connection
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}