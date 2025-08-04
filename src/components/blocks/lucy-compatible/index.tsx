"use client";

import { motion } from "framer-motion";

// 暂时使用占位图片显示所有兼容应用

export default function LucyCompatible() {
  return (
    <motion.section 
      className="py-8 lg:py-10 bg-white"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center space-y-6">
          {/* 标题 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h2 
              className="text-3xl lg:text-4xl font-bold"
              style={{ 
                background: 'linear-gradient(135deg, #FF64DC, #FFA8F5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Compatible With
            </h2>
          </motion.div>

          {/* Logo网格 */}
          <motion.div 
            className="flex items-center justify-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="group"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.6,
                ease: "easeOut"
              }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center justify-center p-4 rounded-2xl bg-white transition-all duration-300">
                <img
                  src="/imgs/lucy/compatible_list_icon.png"
                  alt="Compatible dating apps"
                  className="w-full h-auto max-w-5xl lg:max-w-6xl object-contain"
                />
              </div>
            </motion.div>
          </motion.div>

          {/* 描述文字 */}
          {/* <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-600 text-lg leading-relaxed">
              Lucy AI 与所有主流约会平台完美兼容，
              为您提供跨平台的个性化建议和档案优化服务。
            </p>
          </motion.div> */}
        </div>
      </div>
    </motion.section>
  );
} 