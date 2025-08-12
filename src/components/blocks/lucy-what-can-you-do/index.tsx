"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function LucyWhatCanYouDo() {
  const features = [
    {
      icon: "/imgs/lucy/what_can_you_do_icon_1.png",
      title: "Create an Irresistible Dating Profile",
      description: "Generates multiple high-impact profile versions based on your photos, interests, and profession. Adapts tone and language for different platforms like Tinder, Bumble, Hinge. Avoids generic bios—stand out from the crowd with unique, engaging intros."
    },
    {
      icon: "/imgs/lucy/what_can_you_do_icon_2.png", 
      title: "Write High-Response Openers",
      description: "Analyzes your match's profile to identify interests and personality cues. Creates multiple openers that feel natural, personal, and targeted. Boosts your reply rate and makes cold starts feel effortless."
    },
    {
      icon: "/imgs/lucy/what_can_you_do_icon_3.png",
      title: "Get Personalized Dating Coach Feedback", 
      description: "Evaluates compatibility between you and your match. Identifies weak points and areas to improve in your conversations. Offers strategic advice to attract the kind of people you actually want."
    }
  ];

  return (
    <motion.section 
      className="relative w-full py-16 lg:py-24 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* 渐变背景 - 与LucyHero一致 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF64DC] to-[#FFA8F5]" />
      
      {/* 主要内容容器 */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          {/* 标题部分 */}
          <motion.div 
            className="text-center mb-12 lg:mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">
              <span className="text-black">What Can You Do with </span>
              <span style={{ color: '#C8FB75', fontWeight: '900' }}>Lucy AI</span>
              <span className="text-black">?</span>
            </h2>
            <p className="text-lg lg:text-xl text-black/80 font-medium max-w-2xl mx-auto"
                style={{
                color: '#ffffff',
                }}>
              Unlock the power of AI to transform your dating experience
            </p>
          </motion.div>

          {/* 功能卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.4 + index * 0.1, 
                  ease: "easeOut" 
                }}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="bg-white shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer h-96">
                  {/* 上半部分 - 图标区域 */}
                  <div 
                    className="h-32 flex items-center justify-center bg-[#C8FB75]"
                  >
                    <div className="group-hover:scale-110 transition-transform duration-300">
                      <Image
                        src={feature.icon}
                        alt={feature.title}
                        width={60}
                        height={60}
                        className="object-contain"
                      />
                    </div>
                  </div>

                  {/* 下半部分 - 内容区域 */}
                  <div className="bg-white p-6 h-64 flex flex-col text-center">
                    <div className="flex-1 flex flex-col justify-start pt-4">
                      <h3 className="text-lg lg:text-xl font-bold mb-4 leading-tight text-black min-h-[3.5rem] flex items-center justify-center">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
} 