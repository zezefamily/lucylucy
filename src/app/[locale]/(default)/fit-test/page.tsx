"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from 'browser-image-compression';
import { toast } from "sonner";

// 上传组件
function UploadProfiles({ onBack }: { onBack: () => void }) {
  const [yourBioImages, setYourBioImages] = useState<File[]>([]);
  const [theirBioImages, setTheirBioImages] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  const handleImageUpload = (files: FileList | null, type: 'your' | 'their') => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    const currentImages = type === 'your' ? yourBioImages : theirBioImages;
    const setImages = type === 'your' ? setYourBioImages : setTheirBioImages;
    
    // 限制最多8张图片
    const remainingSlots = 8 - currentImages.length;
    const filesToAdd = newFiles.slice(0, remainingSlots);
    
    setImages([...currentImages, ...filesToAdd]);
  };

  const removeImage = (index: number, type: 'your' | 'their') => {
    const currentImages = type === 'your' ? yourBioImages : theirBioImages;
    const setImages = type === 'your' ? setYourBioImages : setTheirBioImages;
    
    const newImages = currentImages.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleAnalyze = async () => {
    // 验证是否有上传图片
    if (yourBioImages.length === 0 || theirBioImages.length === 0) {
      toast.error("Please upload at least one image for both profiles");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      console.log('Starting analysis process...', {
        yourImagesCount: yourBioImages.length,
        theirImagesCount: theirBioImages.length
      });

      toast.info("Compressing images...");
      
      // 图片压缩配置
      const compressionOptions = {
        maxSizeMB: 1, // 最大1MB
        maxWidthOrHeight: 1920, // 最大宽高
        useWebWorker: true,
        initialQuality: 0.8
      };

      // 压缩所有图片
      const compressedYourImages = await Promise.all(
        yourBioImages.map(async (file, index) => {
          try {
            console.log(`Compressing your image ${index + 1}/${yourBioImages.length}`);
            return await imageCompression(file, compressionOptions);
          } catch (error) {
            console.error(`Image compression failed for your image ${index + 1}:`, error);
            return file; // 如果压缩失败，使用原图
          }
        })
      );

      const compressedTheirImages = await Promise.all(
        theirBioImages.map(async (file, index) => {
          try {
            console.log(`Compressing their image ${index + 1}/${theirBioImages.length}`);
            return await imageCompression(file, compressionOptions);
          } catch (error) {
            console.error(`Image compression failed for their image ${index + 1}:`, error);
            return file; // 如果压缩失败，使用原图
          }
        })
      );

      console.log('Compression completed:', {
        yourImagesCompressed: compressedYourImages.length,
        theirImagesCompressed: compressedTheirImages.length
      });

      toast.info("Uploading images...");

      // 上传您的图片
      const uploadYourImages = async (files: File[]) => {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file);
        });
        formData.append('prefix', 'fit-test-profile1');

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload failed:', errorText);
          throw new Error('Failed to upload your images');
        }

        const result = await response.json();
        console.log('Upload result for profile1:', result);
        
        // API返回格式：{ code: 0, message: "ok", data: ... }
        // 成功：code === 0，失败：code === -1
        if (result.code !== 0) {
          throw new Error(result.message || 'Upload failed');
        }

        if (!result.data) {
          throw new Error('No data in upload response');
        }

        // 单文件上传格式：data: { url: "...", ... }
        if (result.data.url) {
          return [result.data.url];
        }
        
        // 多文件上传格式：data: { results: [{ url: "..." }, ...] }
        if (result.data.results && Array.isArray(result.data.results)) {
          return result.data.results.map((item: any) => item.url);
        }
        
        throw new Error(`Unexpected upload response format: ${JSON.stringify(result)}`);
      };

      // 上传对方的图片
      const uploadTheirImages = async (files: File[]) => {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file);
        });
        formData.append('prefix', 'fit-test-profile2');

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload failed:', errorText);
          throw new Error('Failed to upload their images');
        }

        const result = await response.json();
        console.log('Upload result for profile2:', result);
        
        // API返回格式：{ code: 0, message: "ok", data: ... }
        // 成功：code === 0，失败：code === -1
        if (result.code !== 0) {
          throw new Error(result.message || 'Upload failed');
        }

        if (!result.data) {
          throw new Error('No data in upload response');
        }

        // 单文件上传格式：data: { url: "...", ... }
        if (result.data.url) {
          return [result.data.url];
        }
        
        // 多文件上传格式：data: { results: [{ url: "..." }, ...] }
        if (result.data.results && Array.isArray(result.data.results)) {
          return result.data.results.map((item: any) => item.url);
        }
        
        throw new Error(`Unexpected upload response format: ${JSON.stringify(result)}`);
      };

      // 并行上传两组图片
      const [yourImageUrls, theirImageUrls] = await Promise.all([
        uploadYourImages(compressedYourImages),
        uploadTheirImages(compressedTheirImages)
      ]);

      toast.info("Analyzing compatibility...");

      console.log('Starting analysis with URLs:', {
        profile1: yourImageUrls,
        profile2: theirImageUrls
      });

      // 调用契合度分析API
      const analysisResponse = await fetch('/api/fit-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile1: yourImageUrls,
          profile2: theirImageUrls,
          locale: 'en', // 可以根据需要修改
          chatHistory: undefined // 如果需要可以添加聊天记录输入
        }),
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error('Analysis failed with status:', analysisResponse.status, errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Analysis failed');
        } catch {
          throw new Error(`Analysis failed with status ${analysisResponse.status}`);
        }
      }

      const analysisResult = await analysisResponse.json();
      console.log('Analysis result:', analysisResult);
      
      toast.success("Analysis complete!");

      // 验证分析结果格式 - API返回格式：{ code: 0, message: "ok", data: ... }
      if (analysisResult.code !== 0) {
        throw new Error(analysisResult.message || 'Analysis failed');
      }

      if (!analysisResult.data) {
        throw new Error('No analysis data in response');
      }

      // 将结果保存到localStorage并跳转到结果页面
      localStorage.setItem('fitTestResult', JSON.stringify(analysisResult.data));
      console.log('Saved analysis result to localStorage');
      
      // 跳转到结果页面
      router.push('/fit-report');

    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error(error instanceof Error ? error.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div 
      className="relative z-10 flex flex-col items-center justify-start h-full px-4 lg:px-8"
      style={{ paddingTop: '80px' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="text-center space-y-6 max-w-4xl mx-auto w-full">
        
        {/* 标题 */}
        <motion.h1 
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#3D08FF] mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ 
              fontWeight: '900'
          }}
        >
          Upload Profiles
        </motion.h1>

        {/* 副标题 */}
        <motion.p 
          className="text-base md:text-lg text-white font-medium px-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Please upload photos containing both people's avatars, <br />
          optionally add chat records for deeper analysis ✨
        </motion.p>

                 {/* 上传区域 */}
         <motion.div 
           className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 md:p-8 border-2 border-[#3D08FF]/50"
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.8, delay: 0.6 }}
         >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Your Bio */}
            <div>
                             <div className="flex items-center mb-4">
                 <div className="rounded-full flex items-center justify-center mr-3">
                   <Image
                     src="/imgs/lucy/your_bio_icon.png"
                     alt="Your Bio Icon"
                     width={40}
                     height={40}
                     className="w-full h-full object-contain"
                   />
                 </div>
                 <h3 className="text-lg font-semibold text-white">Your Bio</h3>
               </div>
              
                             {/* 图片网格 - 只在有图片时显示 */}
               {yourBioImages.length > 0 && (
                 <div className="grid grid-cols-4 gap-2 mb-4">
                   {yourBioImages.map((image, index) => (
                     <div key={index} className="aspect-square relative">
                       <div className="relative w-full h-full">
                         <img
                           src={URL.createObjectURL(image)}
                           alt={`Your bio ${index + 1}`}
                           className="w-full h-full object-cover rounded-lg"
                         />
                         <button
                           onClick={() => removeImage(index, 'your')}
                           className="absolute -top-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center text-white text-xs"
                         >
                           ×
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
              
                             {/* 上传按钮 */}
               {yourBioImages.length < 8 && (
                 <label className="block">
                   <input
                     type="file"
                     multiple
                     accept="image/*"
                     className="hidden"
                     onChange={(e) => handleImageUpload(e.target.files, 'your')}
                   />
                   <div className="w-full bg-white rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#FF64DC] transition-colors" style={{ height: yourBioImages.length > 0 ? '80px' : '264px' }}>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-[#FF64DC] rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-white text-lg">+</span>
                      </div>
                      <span className="text-gray-600 text-sm">
                        {yourBioImages.length === 0 ? 'Upload first image' : 'Add another image'}
                      </span>
                    </div>
                  </div>
                </label>
              )}
              
                             <p className="text-center text-white/80 text-sm mt-2">
                 {yourBioImages.length}/8 images
               </p>
            </div>

            {/* Their Bio */}
            <div>
                <div className="flex items-center mb-4">
                 <div className="rounded-full flex items-center justify-center mr-3">
                   <Image
                     src="/imgs/lucy/their_bio_icon.png"
                     alt="Their Bio Icon"
                     width={40}
                     height={40}
                     className="w-full h-full object-contain"
                   />
                 </div>
                 <h3 className="text-lg font-semibold text-white">Their Bio</h3>
               </div>
              
                             {/* 图片网格 - 只在有图片时显示 */}
               {theirBioImages.length > 0 && (
                 <div className="grid grid-cols-4 gap-2 mb-4">
                   {theirBioImages.map((image, index) => (
                     <div key={index} className="aspect-square relative">
                       <div className="relative w-full h-full">
                         <img
                           src={URL.createObjectURL(image)}
                           alt={`Their bio ${index + 1}`}
                           className="w-full h-full object-cover rounded-lg"
                         />
                         <button
                           onClick={() => removeImage(index, 'their')}
                           className="absolute -top-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center text-white text-xs"
                         >
                           ×
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
              
                             {/* 上传按钮 */}
               {theirBioImages.length < 8 && (
                 <label className="block">
                   <input
                     type="file"
                     multiple
                     accept="image/*"
                     className="hidden"
                     onChange={(e) => handleImageUpload(e.target.files, 'their')}
                   />
                   <div className="w-full bg-white rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#FF64DC] transition-colors" style={{ height: theirBioImages.length > 0 ? '80px' : '264px' }}>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-[#FF64DC] rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-white text-lg">+</span>
                      </div>
                      <span className="text-gray-600 text-sm">
                        {theirBioImages.length === 0 ? 'Upload first image' : 'Add another image'}
                      </span>
                    </div>
                  </div>
                </label>
              )}
              
                             <p className="text-center text-white/80 text-sm mt-2">
                 {theirBioImages.length}/8 images
               </p>
            </div>
          </div>
        </motion.div>

        {/* Analyze 按钮 */}
        <motion.div
          className="pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="mx-auto flex justify-center">
            <div className="w-[320px] md:w-[400px] h-[70px] md:h-[80px]">
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || yourBioImages.length === 0 || theirBioImages.length === 0}
                className="group bg-black hover:bg-gray-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full font-semibold text-lg md:text-xl transition-all duration-300 flex items-center w-full h-full relative"
              >
                <div className="absolute left-4 flex items-center justify-center bg-gradient-to-r from-[#FF64DC] to-[#FFA8F5] rounded-full w-12 h-12">
                  {isAnalyzing ? (
                    <div className="animate-spin text-xl">⏳</div>
                  ) : (
                    <span className="text-2xl">💕</span>
                  )}
                </div>
                <span className="flex-1 text-center pl-8">
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Compatibility'}
                </span>
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

export default function FitTest() {
  const [showUpload, setShowUpload] = useState(false);

  if (showUpload) {
    return (
      <motion.section 
        className="relative w-full min-h-screen h-screen max-h-[900px] overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* 渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFA8F5] to-[#FF64DC]" />
        
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

        <UploadProfiles onBack={() => setShowUpload(false)} />
      </motion.section>
    );
  }

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
                  <button 
                    onClick={() => setShowUpload(true)}
                    className="group bg-black hover:bg-gray-800 text-white rounded-full font-semibold text-lg md:text-xl lg:text-lg transition-all duration-300 flex items-center w-full h-full relative"
                  >
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