"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import imageCompression from 'browser-image-compression';
import { toast } from "sonner";
import Compressor from 'compressorjs';

// 存储键名
const STORAGE_KEYS = {
  YOUR_BIO_IMAGES: 'fitTest_yourBioImages',
  THEIR_BIO_IMAGES: 'fitTest_theirBioImages'
};

// 文件信息（轻量级存储）
interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  // 不存储二进制数据，只存储文件信息
}

// 将File对象转换为轻量级信息格式
const fileToInfo = (file: File): FileInfo => {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  };
};

// 检查localStorage可用空间
const checkStorageQuota = (dataSize: number): boolean => {
  try {
    const estimatedTotalQuota = 5 * 1024 * 1024; // 5MB
    const currentUsage = JSON.stringify(localStorage).length;
    const availableSpace = estimatedTotalQuota - currentUsage;
    
    console.log(`存储空间检查: 当前使用 ${(currentUsage / 1024).toFixed(2)}KB, 可用 ${(availableSpace / 1024).toFixed(2)}KB, 需要 ${(dataSize / 1024).toFixed(2)}KB`);
    
    return dataSize < availableSpace * 0.8;
  } catch (error) {
    console.warn('无法检查存储空间:', error);
    return false;
  }
};

// 清理localStorage中的图片数据
const clearImageStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.YOUR_BIO_IMAGES);
    localStorage.removeItem(STORAGE_KEYS.THEIR_BIO_IMAGES);
    console.log('已清理图片存储数据');
  } catch (error) {
    console.warn('清理存储失败:', error);
  }
};

// 检查是否有保存的图片信息
const checkHasSavedImages = (): boolean => {
  try {
    const savedYourImages = localStorage.getItem(STORAGE_KEYS.YOUR_BIO_IMAGES);
    const savedTheirImages = localStorage.getItem(STORAGE_KEYS.THEIR_BIO_IMAGES);
    return !!(savedYourImages || savedTheirImages);
  } catch (error) {
    console.warn('检查保存的图片失败:', error);
    return false;
  }
};

// 使用 Compressor.js 进行快速预处理
const fastPreprocess = (file: File): Promise<File> => {
  return new Promise((resolve: (value: File) => void, reject: (reason?: any) => void) => {
    const { isSafari, isMobile } = detectBrowser();
    
    // 移动端Safari兼容性配置
    const options = {
      quality: isSafari && isMobile ? 0.9 : 0.8, // Safari移动端使用更高质量
      maxWidth: isSafari && isMobile ? 1000 : 1200, // Safari移动端使用更小尺寸
      maxHeight: isSafari && isMobile ? 1000 : 1200,
      convertSize: isSafari && isMobile ? 500000 : 1000000, // Safari移动端更早转换
      mimeType: 'image/webp',
      useWebWorker: !(isSafari && isMobile), // Safari移动端禁用Web Worker
      success: (result: any) => {
        console.log(`⚡ 快速预处理完成: ${file.size} -> ${result.size} bytes (${isSafari && isMobile ? 'Safari移动端' : '标准'})`);
        resolve(result as File);
      },
      error: (err: any) => {
        console.warn('快速预处理失败，使用原图:', err);
        resolve(file);
      }
    };
    
    new Compressor(file, options);
  });
};

// 批量并发处理
const batchProcess = async (files: File[], processor: (file: File, index: number) => Promise<File>, batchSize = 4) => {
  const results: File[] = [];
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((file, index) => processor(file, i + index))
    );
    results.push(...batchResults);
    
    // 短暂延迟避免阻塞
    if (i + batchSize < files.length) {
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    }
  }
  
  return results;
};

// 检测浏览器类型
const detectBrowser = () => {
  const userAgent = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isChrome = /chrome/i.test(userAgent) && !/edge/i.test(userAgent);
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
  
  return { isSafari, isChrome, isMobile };
};

// 带超时的fetch请求
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }
    throw error;
  }
};

// 重试机制
const retryWithBackoff = async (
  fn: () => Promise<any>, 
  maxRetries = 3, 
  baseDelay = 1000
): Promise<any> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (i === maxRetries - 1) {
        throw lastError;
      }
      
      // 指数退避
      const delay = baseDelay * Math.pow(2, i);
      console.log(`重试 ${i + 1}/${maxRetries}，等待 ${delay}ms`);
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// 上传组件
function UploadProfiles({ onBack }: { onBack: () => void }) {
  const [yourBioImages, setYourBioImages] = useState<File[]>([]);
  const [theirBioImages, setTheirBioImages] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('');
  const router = useRouter();

  // 从localStorage恢复图片状态
  useEffect(() => {
    const loadSavedImages = async () => {
      try {
        const savedYourImages = localStorage.getItem(STORAGE_KEYS.YOUR_BIO_IMAGES);
        const savedTheirImages = localStorage.getItem(STORAGE_KEYS.THEIR_BIO_IMAGES);

        if (savedYourImages || savedTheirImages) {
          console.log('检测到之前上传的图片信息，但页面刷新后需要重新选择图片');
          toast.info('检测到之前的图片信息，请重新选择图片');
          
          // 清理旧的存储信息，因为无法恢复文件
          clearImageStorage();
        }
      } catch (error) {
        console.error('Error loading saved images:', error);
        // 如果恢复失败，清理localStorage
        clearImageStorage();
      }
    };

    loadSavedImages();
  }, []);

  // 保存图片到localStorage
  const saveImagesToStorage = async (images: File[], key: string) => {
    try {
      if (images.length === 0) {
        localStorage.removeItem(key);
        return;
      }
      
      const infoList = images.map(fileToInfo);
      const dataToStore = JSON.stringify(infoList);
      const dataSize = new Blob([dataToStore]).size;
      
      // 检查存储空间
      if (!checkStorageQuota(dataSize)) {
        console.warn('存储空间不足，跳过保存图片数据');
        toast.warning('图片数据较大，将不会保存到本地存储');
        return;
      }
      
      localStorage.setItem(key, dataToStore);
      console.log(`成功保存 ${images.length} 张图片引用到存储 (${(dataSize / 1024).toFixed(2)}KB)`);
    } catch (error) {
      console.error('Error saving images to storage:', error);
      
      // 如果是配额超出错误，清理存储并提示用户
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('存储配额超出，清理旧数据');
        clearImageStorage();
        toast.warning('存储空间不足，已清理旧数据');
      }
    }
  };

  // 监听图片状态变化并保存
  useEffect(() => {
    saveImagesToStorage(yourBioImages, STORAGE_KEYS.YOUR_BIO_IMAGES);
  }, [yourBioImages]);

  useEffect(() => {
    saveImagesToStorage(theirBioImages, STORAGE_KEYS.THEIR_BIO_IMAGES);
  }, [theirBioImages]);

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
    setProcessStatus('Preparing...');
    
    // 记录总开始时间
    const totalStartTime = performance.now();
    console.log('🚀 开始分析流程');
    
    try {
      console.log('Starting analysis process...', {
        yourImagesCount: yourBioImages.length,
        theirImagesCount: theirBioImages.length
      });

      // === 图片压缩阶段 ===
      const compressionStartTime = performance.now();
      setProcessStatus('Preprocessing images...');
      toast.info("Preprocessing images...");
      console.log('📦 开始图片预处理阶段');
      
      // 预处理统计
      let totalProcessed = 0;
      let totalSkipped = 0;
      
      // 快速预处理函数 - 使用 Compressor.js
      const quickPreprocess = async (file: File, index: number, total: number, prefix: string) => {
        const fileSizeMB = file.size / (1024 * 1024);
        const { isSafari, isMobile } = detectBrowser();
        
        // 如果文件已经很小且是WebP格式，跳过处理
        if (fileSizeMB <= 0.8 && file.type === 'image/webp') {
          console.log(`⚡ ${prefix}图片 ${index + 1}/${total} 已符合要求，跳过处理 (${fileSizeMB.toFixed(2)}MB)`);
          totalSkipped++;
          return file;
        }
        
        // 否则进行快速预处理
        console.log(`🔄 ${prefix}图片 ${index + 1}/${total} 进行快速预处理 (${fileSizeMB.toFixed(2)}MB)`);
        totalProcessed++;
        
        // 移动端Safari特殊处理
        if (isSafari && isMobile) {
          console.log(`📱 移动端Safari检测，使用兼容性处理`);
          // Safari移动端可能需要更保守的压缩设置
          return await fastPreprocess(file);
        }
        
        return await fastPreprocess(file);
      };

      // 预处理您的图片 - 使用并发控制
      setProcessStatus('Preprocessing your photos...');
      const yourPreprocessStartTime = performance.now();
      const preprocessedYourImages = await batchProcess(
        yourBioImages, 
        (file, index) => quickPreprocess(file, index, yourBioImages.length, '您的'),
        4 // 每批4张图片
      );
      const yourPreprocessTime = performance.now() - yourPreprocessStartTime;
      console.log(`✅ 您的图片预处理完成，耗时: ${yourPreprocessTime.toFixed(2)}ms`);

      setProcessStatus('Preprocessing their photos...');
      const theirPreprocessStartTime = performance.now();
      const preprocessedTheirImages = await batchProcess(
        theirBioImages, 
        (file, index) => quickPreprocess(file, index, theirBioImages.length, '对方'),
        4 // 每批4张图片
      );
      const theirPreprocessTime = performance.now() - theirPreprocessStartTime;
      console.log(`✅ 对方图片预处理完成，耗时: ${theirPreprocessTime.toFixed(2)}ms`);

      const totalPreprocessTime = performance.now() - compressionStartTime;
      console.log(`🎯 图片预处理阶段总耗时: ${totalPreprocessTime.toFixed(2)}ms`);
      console.log(`📊 预处理统计: 跳过 ${totalSkipped} 张，处理 ${totalProcessed} 张`);
      console.log(`🚀 平均每张图片处理时间: ${(totalPreprocessTime / (yourBioImages.length + theirBioImages.length)).toFixed(2)}ms`);

      console.log('Preprocessing completed:', {
        yourImagesProcessed: preprocessedYourImages.length,
        theirImagesProcessed: preprocessedTheirImages.length
      });

      // === 图片上传阶段 ===
      const uploadStartTime = performance.now();
      setProcessStatus('Uploading images...');
      toast.info("Uploading images...");
      console.log('📤 开始图片上传阶段');

      // 上传您的图片
      const uploadYourImages = async (files: File[]) => {
        const { isSafari, isMobile } = detectBrowser();
        console.log('浏览器信息:', { isSafari, isMobile });
        
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file);
        });
        formData.append('prefix', 'fit-test-profile1');

        // 移动端Safari特殊处理
        const timeout = isSafari && isMobile ? 60000 : 30000; // Safari移动端给更长时间
        
        const response = await retryWithBackoff(async () => {
          return await fetchWithTimeout('/api/upload-image', {
            method: 'POST',
            body: formData,
          }, timeout);
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload failed:', errorText);
          throw new Error(`上传失败: ${response.status} ${response.statusText}`);
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
        const { isSafari, isMobile } = detectBrowser();
        
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file);
        });
        formData.append('prefix', 'fit-test-profile2');

        // 移动端Safari特殊处理
        const timeout = isSafari && isMobile ? 60000 : 30000;
        
        const response = await retryWithBackoff(async () => {
          return await fetchWithTimeout('/api/upload-image', {
            method: 'POST',
            body: formData,
          }, timeout);
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload failed:', errorText);
          throw new Error(`上传失败: ${response.status} ${response.statusText}`);
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
      setProcessStatus('Uploading your photos...');
      const [yourImageUrls, theirImageUrls] = await Promise.all([
        uploadYourImages(preprocessedYourImages),
        uploadTheirImages(preprocessedTheirImages)
      ]);
      
      const uploadTime = performance.now() - uploadStartTime;
      console.log(`✅ 图片上传完成，耗时: ${uploadTime.toFixed(2)}ms`);
      
      setProcessStatus('Upload completed...');

      // === 兼容性分析阶段 ===
      const analysisStartTime = performance.now();
      setProcessStatus('Analyzing compatibility...');
      toast.info("Analyzing compatibility...");
      console.log('🔍 开始兼容性分析阶段');

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
      const analysisTime = performance.now() - analysisStartTime;
      console.log(`✅ 兼容性分析完成，耗时: ${analysisTime.toFixed(2)}ms`);
      console.log('Analysis result:', analysisResult);
      
      toast.success("Analysis complete!");

      // 验证分析结果格式 - API返回格式：{ code: 0, message: "ok", data: ... }
      if (analysisResult.code !== 0) {
        throw new Error(analysisResult.message || 'Analysis failed');
      }

      if (!analysisResult.data) {
        throw new Error('No analysis data in response');
      }

      // 将结果和图片URLs保存到localStorage并跳转到结果页面
      const resultWithImages = {
        ...analysisResult.data,
        profile1Images: yourImageUrls,
        profile2Images: theirImageUrls
      };
      localStorage.setItem('fitTestResult', JSON.stringify(resultWithImages));
      console.log('Saved analysis result and image URLs to localStorage');
      
      setProcessStatus('Analysis complete!');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 显示完成状态1秒
      
      // 清理保存的图片（分析完成）
      clearImageStorage();
      
      // 输出总耗时统计
      const totalTime = performance.now() - totalStartTime;
      console.log('\n📊 === 分析流程耗时统计 ===');
      console.log(`📦 图片预处理: ${totalPreprocessTime.toFixed(2)}ms (${(totalPreprocessTime/totalTime*100).toFixed(1)}%)`);
      console.log(`📤 图片上传: ${uploadTime.toFixed(2)}ms (${(uploadTime/totalTime*100).toFixed(1)}%)`);
      console.log(`🔍 Nnext API 分析: ${analysisTime.toFixed(2)}ms (${(analysisTime/totalTime*100).toFixed(1)}%)`);
      console.log(`⏱️ 总耗时: ${totalTime.toFixed(2)}ms`);
      console.log('🎉 分析流程完成');
      
      // 跳转到结果页面
      router.push('/fit-report');

    } catch (error) {
      const totalTime = performance.now() - totalStartTime;
      console.error('❌ 分析失败:', error);
      console.log(`⏱️ 失败前总耗时: ${totalTime.toFixed(2)}ms`);
      toast.error(error instanceof Error ? error.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setProcessStatus('');
    }
  };

  // 清理所有数据并重新开始
  const handleClearAll = () => {
    setYourBioImages([]);
    setTheirBioImages([]);
    clearImageStorage(); // 使用新的清理函数
    onBack();
  };

  return (
    <motion.div 
      className="relative z-10 flex flex-col items-center justify-start px-3 sm:px-4 lg:px-8 pb-24 sm:pb-6"
      style={{ paddingTop: '60px' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="text-center space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full">
        
        {/* 标题 */}
        <motion.h1 
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#3D08FF] mb-2 sm:mb-4 text-center"
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
          className="text-sm sm:text-base md:text-lg text-white font-medium px-2 sm:px-4 mb-4 sm:mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Please upload photos containing both people's avatars, <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>optionally add chat records for deeper analysis ✨
        </motion.p>

        {/* 重新开始按钮 - 当有图片时显示 */}
        {(yourBioImages.length > 0 || theirBioImages.length > 0) && (
          <motion.div 
            className="flex justify-end mb-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <button
              onClick={handleClearAll}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors border border-white/30"
            >
              Start Over
            </button>
          </motion.div>
        )}

                 {/* 上传区域 */}
         <motion.div 
           className="bg-white/20 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-3 sm:p-6 md:p-8 border-2 border-[#3D08FF]/50"
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.8, delay: 0.6 }}
         >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            
            {/* Your Bio */}
            <div>
                             <div className="flex items-center mb-3 sm:mb-4">
                 <div className="rounded-full flex items-center justify-center mr-2 sm:mr-3">
                   <Image
                     src="/imgs/lucy/your_bio_icon.png"
                     alt="Your Bio Icon"
                     width={40}
                     height={40}
                     className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                   />
                 </div>
                 <h3 className="text-base sm:text-lg font-semibold text-white">Your Bio</h3>
               </div>
              
                             {/* 图片网格 - 只在有图片时显示 */}
               {yourBioImages.length > 0 && (
                 <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-3 sm:mb-4">
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
                           className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-black rounded-full flex items-center justify-center text-white text-xs"
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
                   <div 
                     className="w-full bg-white rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#FF64DC] transition-colors" 
                     style={{ height: yourBioImages.length > 0 ? '60px' : '180px' }}
                   >
                    <div className="text-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#FF64DC] rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                        <span className="text-white text-sm sm:text-lg">+</span>
                      </div>
                      <span className="text-gray-600 text-xs sm:text-sm">
                        {yourBioImages.length === 0 ? 'Upload first image' : 'Add another image'}
                      </span>
                    </div>
                  </div>
                </label>
              )}
              
                             <p className="text-center text-white/80 text-xs sm:text-sm mt-2">
                 {yourBioImages.length}/8 images
               </p>
            </div>

            {/* Their Bio */}
            <div>
                <div className="flex items-center mb-3 sm:mb-4">
                 <div className="rounded-full flex items-center justify-center mr-2 sm:mr-3">
                   <Image
                     src="/imgs/lucy/their_bio_icon.png"
                     alt="Their Bio Icon"
                     width={40}
                     height={40}
                     className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                   />
                 </div>
                 <h3 className="text-base sm:text-lg font-semibold text-white">Their Bio</h3>
               </div>
              
                             {/* 图片网格 - 只在有图片时显示 */}
               {theirBioImages.length > 0 && (
                 <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-3 sm:mb-4">
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
                           className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-black rounded-full flex items-center justify-center text-white text-xs"
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
                   <div 
                     className="w-full bg-white rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#FF64DC] transition-colors" 
                     style={{ height: theirBioImages.length > 0 ? '60px' : '180px' }}
                   >
                    <div className="text-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#FF64DC] rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                        <span className="text-white text-sm sm:text-lg">+</span>
                      </div>
                      <span className="text-gray-600 text-xs sm:text-sm">
                        {theirBioImages.length === 0 ? 'Upload first image' : 'Add another image'}
                      </span>
                    </div>
                  </div>
                </label>
              )}
              
                             <p className="text-center text-white/80 text-xs sm:text-sm mt-2">
                 {theirBioImages.length}/8 images
               </p>
            </div>
          </div>
        </motion.div>

        {/* Analyze 按钮 */}
        <motion.div
          className="pt-4 sm:pt-6 md:pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="mx-auto flex justify-center px-4">
            <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[400px] h-[60px] sm:h-[70px] md:h-[80px]">
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || yourBioImages.length === 0 || theirBioImages.length === 0}
                className="group bg-black hover:bg-gray-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full font-semibold text-base sm:text-lg md:text-xl transition-all duration-300 flex items-center w-full h-full relative"
              >
                <div className="absolute left-3 sm:left-4 flex items-center justify-center rounded-full w-10 h-10 sm:w-12 sm:h-12">
                  {isAnalyzing ? (
                    <div className="animate-spin text-lg sm:text-xl">⏳</div>
                  ) : (
                    <Image
                      src="/imgs/lucy/button_heart_icon.png"
                      alt="Heart Icon"
                      width={55}
                      height={34}
                      className="w-6 h-auto sm:w-7 sm:h-auto"
                    />
                  )}
                </div>
                <span className="flex-1 text-center pl-6 sm:pl-8 px-2">
                  {isAnalyzing ? processStatus || 'Processing...' : 'Analyze Compatibility'}
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

  // 在客户端初始化时检查是否有保存的图片
  useEffect(() => {
    const hasStoredImages = checkHasSavedImages();
    if (hasStoredImages) {
      setShowUpload(true);
    }
  }, []);

  if (showUpload) {
    return (
      <motion.section 
        className="relative w-full min-h-screen"
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
      className="relative w-full min-h-screen"
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
            <p className="text-black/80 text md:text-base lg:text-sm text-center px-4 mb-8 sm:mb-12">
              Results in 10 seconds
            </p>
          </motion.div>

        </div>
      </div>
    </motion.section>
  );
}