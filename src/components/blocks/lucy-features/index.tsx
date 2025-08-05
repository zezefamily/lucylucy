"use client";

import { motion } from "framer-motion";

export default function LucyFeatures() {
  const features = [
    {
      id: 1,
      icon: (
        <svg width="50" height="50" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M32 8C23.16 8 16 15.16 16 24C16 32.84 23.16 40 32 40C40.84 40 48 32.84 48 24C48 15.16 40.84 8 32 8ZM32 16C35.31 16 38 18.69 38 22C38 25.31 35.31 28 32 28C28.69 28 26 25.31 26 22C26 18.69 28.69 16 32 16ZM32 52C25.5 52 19.71 48.6 16.8 43.2C16.94 37.6 27.2 35 32 35C36.76 35 47.06 37.6 47.2 43.2C44.29 48.6 38.5 52 32 52Z" 
            fill="currentColor"
          />
        </svg>
      ),
      title: "Transform Your Dating Profile with Personalized AI Coaching",
      description: "Get AI-powered insights to optimize your profile and make a lasting first impression"
    },
    {
      id: 2,
      icon: (
        <svg width="50" height="50" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M50 12H14C10.69 12 8 14.69 8 18V42C8 45.31 10.69 48 14 48H18L24 54L30 48H50C53.31 48 56 45.31 56 42V18C56 14.69 53.31 12 50 12ZM20 32C18.9 32 18 31.1 18 30C18 28.9 18.9 28 20 28C21.1 28 22 28.9 22 30C22 31.1 21.1 32 20 32ZM32 32C30.9 32 30 31.1 30 30C30 28.9 30.9 28 32 28C33.1 28 34 28.9 34 30C34 31.1 33.1 32 32 32ZM44 32C42.9 32 42 31.1 42 30C42 28.9 42.9 28 44 28C45.1 28 46 28.9 46 30C46 31.1 45.1 32 44 32Z" 
            fill="currentColor"
          />
        </svg>
      ),
      title: "Unlock Tailored Chat Openers to Improve Your Match Success",
      description: "Generate personalized conversation starters that spark meaningful connections"
    },
    {
      id: 3,
      icon: (
        <svg width="50" height="50" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M52 12H12C8.69 12 6 14.69 6 18V46C6 49.31 8.69 52 12 52H52C55.31 52 58 49.31 58 46V18C58 14.69 55.31 12 52 12ZM52 46H12V18H52V46ZM21 34L26 40L37 27L50 42H14L21 34Z" 
            fill="currentColor"
          />
          <path 
            d="M32 36C29.79 36 28 34.21 28 32C28 29.79 29.79 28 32 28C34.21 28 36 29.79 36 32C36 34.21 34.21 36 32 36Z" 
            fill="currentColor"
          />
        </svg>
      ),
      title: "Enhance Your Profile with Photo Ratings and Optimization",
      description: "Receive detailed feedback on your photos to maximize your profile's appeal"
    }
  ];

  return (
    <section className="relative py-16 lg:py-24 bg-white overflow-hidden">
      {/* 背景装饰 - 紫色曲线 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <svg
          className="absolute top-0 left-0 w-full h-full"
          viewBox="0 0 1200 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-100 400C200 300, 400 500, 600 400C800 300, 1000 500, 1300 400V800H-100V400Z"
            fill="#FFD5FA"
            opacity="0.3"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
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
              <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer">
                {/* 上半部分 - 图标区域 */}
                <div 
                  className="h-40 flex items-center justify-center"
                  style={{ backgroundColor: '#5D30FF' }}
                >
                  <div className="text-white group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                </div>

                {/* 下半部分 - 内容区域 */}
                <div className="bg-white p-8">
                  {/* 标题 */}
                  <h3 className="text-xl lg:text-2xl font-bold mb-4 leading-tight text-black">
                    {feature.title}
                  </h3>

                  {/* 描述 */}
                  <p className="text-gray-600 leading-relaxed text-base">
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