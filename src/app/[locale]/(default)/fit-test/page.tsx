"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function FitTest() {
  return (
    <motion.section 
      className="relative w-full min-h-screen h-screen max-h-[900px] overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFA8F5] to-[#FF64DC]" />
      
      {/* 左侧贝塞尔曲线图片 */}
      {/* <motion.div 
        className="absolute left-0 top-0 h-full z-0 hidden md:block"
        style={{ 
          transform: 'scale(0.5)',
          transformOrigin: 'left center'
        }}
        animate={{ 
          x: [0, 8, 0],
          y: [0, -3, 0] 
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image
          src="/imgs/lucy/left_path_img.png"
          alt="Left Path"
          width={100}
          height={200}
          className="h-full w-auto object-contain opacity-70"
        />
      </motion.div> */}

      {/* 右侧贝塞尔曲线图片 */}
      {/* <motion.div 
        className="absolute right-0 top-0 h-full z-0 hidden md:block"
        style={{ 
          transform: 'scale(0.5)',
          transformOrigin: 'right center'
        }}
        animate={{ 
          x: [0, -8, 0],
          y: [0, 3, 0] 
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4
        }}
      >
        <Image
          src="/imgs/lucy/right_path_img.png"
          alt="Right Path"
          width={350}
          height={700}
          className="h-full w-auto object-contain opacity-70"
        />
      </motion.div> */}

      {/* 中央旋转背景图片 */}
      <motion.div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-1"
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <Image
          src="/imgs/lucy/fit-test_bg_effect_Img.png"
          alt="Background Effect"
          width={1200}
          height={1200}
          className="opacity-50 w-[600px] sm:w-[700px] md:w-[900px] lg:w-[1000px] xl:w-[1200px] h-auto"
        />
      </motion.div>

      {/* 装饰形状 */}
      {/* 正方形 */}
      <motion.div 
        className="absolute top-[15%] left-[10%] w-4 h-4 bg-[#D3FD51] rotate-45"
        animate={{ 
          y: [0, -10, 0],
          rotate: [45, 75, 45]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute top-[25%] right-[15%] w-6 h-6 bg-[#3D08FF] rotate-45"
        animate={{ 
          y: [0, 15, 0],
          rotate: [45, 15, 45]
        }}
        transition={{ 
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />

      {/* 三角形 */}
      <motion.div 
        className="absolute top-[70%] left-[8%]"
        animate={{ 
          x: [0, 10, 0],
          y: [0, -8, 0],
          rotate: [0, 20, 0]
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      >
        <div 
          className="w-0 h-0 border-l-[15px] border-r-[15px] border-b-[25px] border-l-transparent border-r-transparent border-b-[#D3FD51]"
        />
      </motion.div>
      <motion.div 
        className="absolute top-[75%] right-[12%]"
        animate={{ 
          x: [0, -8, 0],
          y: [0, 12, 0],
          rotate: [0, -15, 0]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
      >
        <div 
          className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-[#3D08FF]"
        />
      </motion.div>

      {/* 圆形 */}
      {/* <motion.div 
        className="absolute top-[20%] left-[20%] w-10 h-10 bg-[#3D08FF] rounded-full"
        animate={{ 
          scale: [1, 1.2, 1],
          y: [0, -15, 0]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      /> */}
      <motion.div 
        className="absolute top-[65%] right-[25%] w-7 h-7 bg-[#D3FD51] rounded-full"
        animate={{ 
          scale: [1, 0.8, 1],
          x: [0, 12, 0]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      {/* 前景内容 */}
      <div className="relative z-10 flex flex-col items-center justify-start h-full px-4 lg:px-8" style={{ paddingTop: '80px' }}>
        <div className="text-center space-y-6 md:space-y-8 lg:space-y-6 max-w-4xl mx-auto">
          
          {/* 标题 */}
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#3D08FF] mb-3 py-6 md:py-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ 
                fontWeight: '900'
            }}
          >
            Are they really <span className="text-[#D3FD51]">the one ?</span>
          </motion.h1>

          {/* 副标题 */}
          <motion.p 
            className="text-lg md:text-xl lg:text-2xl text-white font-medium px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Upload your profiles. See how well you really match.
          </motion.p>

          {/* 兼容性报告卡片示意 */}
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Image
              src="/imgs/lucy/test_fit_demo_img.png"
              alt="Compatibility Report Demo"
              width={280}
              height={312}
              className="shadow-2xl w-[280px] md:w-[320px] lg:w-[280px] h-auto"
            />
          </motion.div>

          {/* Find out now 按钮区域 - 298x80px */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
                        <div className="mx-auto flex justify-center pt-4">
              <div className="w-[280px] md:w-[320px] lg:w-[298px] h-[70px] md:h-[80px]">
                <button className="group bg-black hover:bg-gray-800 text-white rounded-full font-semibold text-lg md:text-xl lg:text-lg transition-all duration-300 flex items-center w-full h-full relative">
                  <div className="absolute left-4 flex items-center justify-center bg-gradient-to-r from-[#FF64DC] to-[#FFA8F5] rounded-full">
                    <Image
                      src="/imgs/lucy/hero_add_img_icon.png"
                      alt="Upload Icon"
                      width={60}
                      height={60}
                      className="group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <span className="flex-1 text-center pl-8">Find out now</span>
                </button>
              </div>
              </div>
            <p className="text-black/80 text md:text-base lg:text-sm text-center px-4">
              Results in 10 seconds
            </p>
          </motion.div>

        </div>
      </div>
    </motion.section>
  );
}