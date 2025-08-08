"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function LucyFeatures() {
  const features = [
    {
      id: 1,
      icon: "/imgs/lucy/feature_icon_1.png",
      title: "Transform Your Dating Profile with Personalized AI Coaching",
      description: "Get AI-powered insights to optimize your profile and make a lasting first impression"
    },
    {
      id: 2,
      icon: "/imgs/lucy/feature_icon_2.png",
      title: "Unlock Tailored Chat Openers to Improve Your Match Success",
      description: "Generate personalized conversation starters that spark meaningful connections"
    },
    {
      id: 3,
      icon: "/imgs/lucy/feature_icon_3.png",
      title: "Enhance Your Profile with Photo Ratings and Optimization",
      description: "Receive detailed feedback on your photos to maximize your profile's appeal"
    }
  ];

  return (
    <section className="relative py-16 lg:py-24 bg-white overflow-hidden">
      {/* 背景装饰 - 紫色曲线 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <svg
          className="absolute top-20 left-0 w-full h-full"
          viewBox="0 0 1200 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 300C300 200, 600 80, 900 120C1000 100, 1100 200, 1200 320"
            stroke="#FFD5FA"
            strokeWidth="35"
            fill="none"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* 右上角绿色 # 符号 */}
      <div className="absolute top-8 right-8 lg:top-16 lg:right-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <div 
            className="text-6xl lg:text-8xl font-bold opacity-80"
            style={{ color: '#C8FB75' }}
          >
            #
          </div>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* 标题部分 */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span style={{ color: '#3D08FF' }}>Your AI Dating Coach:</span>
            <span className="text-black"> Perfect Your Dating Profile and Start Meaningful Conversations</span>
          </h2>
        </motion.div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              className="relative"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.15 + 0.3,
                ease: "easeOut" 
              }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div className="bg-white shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer h-96">
                {/* 上半部分 - 图标区域 */}
                <div 
                  className="h-48 flex items-center justify-center"
                  style={{ backgroundColor: '#5D30FF' }}
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
                <div className="bg-white p-6 h-48 flex flex-col justify-center text-center">
                  {/* 标题 */}
                  <h3 className="text-lg lg:text-xl font-bold mb-4 leading-tight text-black">
                    {feature.title}
                  </h3>

                  {/* 描述 */}
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 