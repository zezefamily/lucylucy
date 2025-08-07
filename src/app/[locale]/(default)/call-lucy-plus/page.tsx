'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Signal,
  Volume2,
  VolumeX,
  Settings,
  Waves,
  MessageSquare,
  X,
  Image
} from 'lucide-react';
import { useAgoraClient, AgoraConfig } from '@/components/voice-call/agora-client';
import { toast } from 'sonner';

// 导入 AgoraRTM
import AgoraRTM, { type RTMClient } from 'agora-rtm';

// 导入 ConversationalAIAPI 相关
import { ConversationalAIAPI } from '@/conversational-ai-api';
import {
  type IUserTranscription,
  type IAgentTranscription,
  type ISubtitleHelperItem,
  EConversationalAIAPIEvents,
  ESubtitleHelperMode,
  ETurnStatus,
  TMessageReceipt,
  EModuleType
} from '@/conversational-ai-api/type';

import { EChatMessageType, EChatMessagePriority } from '@/conversational-ai-api/type'
import { genUUID } from '@/lib/utils';
import { progressiveImageCompression, validateImageFile, formatFileSize } from '@/lib/image-utils';
import imageCompression from 'browser-image-compression';

export default function CallLucyPlus() {
  // 声网配置
  const [config] = useState<AgoraConfig>({
    appId: process.env.NEXT_PUBLIC_AGORA_APP_ID || '',
    channel: process.env.NEXT_PUBLIC_AGORA_DEFAULT_CHANNEL || 'lucy-voice-call',
    token: undefined,
    uid: 123456
  });

  // 状态管理
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'connected' | 'disconnecting'>('idle');
  const [agentId, setAgentId] = useState<string>('');
  const [agentUid, setAgentUid] = useState<string>('');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isListening, setIsListening] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [subtitleRtmClient, setSubtitleRtmClient] = useState<RTMClient | null>(null);
  
  // AI 状态管理
  const [aiState, setAiState] = useState<'waiting' | 'listening' | 'thinking' | 'speaking'>('waiting');
  
  // Agent 缓存管理
  const AGENT_CACHE_KEY = 'lucy_agent_cache';
  const AGENT_CACHE_TIMESTAMP_KEY = 'lucy_agent_cache_timestamp';
  const CACHE_DURATION = 10 * 60 * 1000; // 10分钟缓存过期
  
  // 字幕相关状态
  const [chatHistory, setChatHistory] = useState<
    ISubtitleHelperItem<Partial<IUserTranscription | IAgentTranscription>>[]
  >([]);
  const [isConversationalAPIInitialized, setIsConversationalAPIInitialized] = useState(false);
  const conversationalAPIRef = useRef<ConversationalAIAPI | null>(null);
  
  // 麦克风状态监控
  const [microphoneLevel, setMicrophoneLevel] = useState(0);
  const microphoneLevelRef = useRef<NodeJS.Timeout | null>(null);
  
  // 使用 ref 保存最新的值，避免闭包问题
  const microphoneLevelLatest = useRef(microphoneLevel);
  const chatHistoryLatest = useRef(chatHistory);
  
  // 更新 ref 值
  useEffect(() => {
    microphoneLevelLatest.current = microphoneLevel;
  }, [microphoneLevel]);
  
  useEffect(() => {
    chatHistoryLatest.current = chatHistory;
  }, [chatHistory]);
  
  // 网络状态监控
  const [networkQuality, setNetworkQuality] = useState<{ uplinkNetworkQuality: number; downlinkNetworkQuality: number } | null>(null);
  const [connectionState, setConnectionState] = useState<string>('DISCONNECTED');
  
  // 图片上传状态
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 声网客户端
  const { state, actions, rtcClient } = useAgoraClient();

  // 通话计时器
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 检查配置有效性
  const isConfigValid = config.appId && 
    config.appId !== 'your_agora_app_id_here' &&
    process.env.NEXT_PUBLIC_AGORA_APP_ID;

  // 通话计时
  useEffect(() => {
    if (callState === 'connected' && state.isJoined) {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      if (callState === 'idle') {
        setCallDuration(0);
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callState, state.isJoined]);

  // 真实语音活动检测和 AI 状态管理
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (callState === 'connected' && state.isJoined) {
      // 基于麦克风音量级别判断是否在说话
      interval = setInterval(() => {
        const currentLevel = microphoneLevelLatest.current;
        const currentChatHistory = chatHistoryLatest.current;
        const threshold = 0.05; // 音量阈值，可以调整
        
        if (!state.isMuted && currentLevel > threshold) {
          // 用户正在说话，AI 应该在聆听
          setIsListening(true);
          setAiState('listening');
        } else {
          // 用户没有说话，AI 在思考或等待
          setIsListening(false);
          
          // 根据字幕内容判断 AI 状态
          const hasRecentMessages = currentChatHistory.length > 0;
          const lastMessage = currentChatHistory[currentChatHistory.length - 1];
          
                     if (hasRecentMessages && lastMessage?.uid === 'agent' && lastMessage?.status === ETurnStatus.IN_PROGRESS) {
             setAiState('speaking');
           } else if (hasRecentMessages && lastMessage?.uid === 'user') {
            setAiState('thinking');
          } else {
            setAiState('waiting');
          }
        }
      }, 200); // 更频繁的检测，200ms
      
      console.log('语音活动检测定时器已启动');
    } else {
      setIsListening(false);
      setAiState('waiting');
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
        console.log('语音活动检测定时器已清理');
      }
    };
  }, [callState, state.isJoined, state.isMuted]); // 移除 microphoneLevel 和 chatHistory 依赖，减少重复创建



  // 格式化通话时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 邀请 AI 加入房间
  const inviteAIToRoom = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/call-lucy/joinRoom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: config.channel,
          uid: config.uid,
          userSystemMessage: '你是 Lucy，一个专业的恋爱教练和交友资料分析师。你能够帮助用户分析和优化他们的交友资料，提供真诚、友好且专业的建议。请用中文对话，保持温暖而专业的语气。'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        const newAgentId = result.data.agentId;
        setAgentId(newAgentId);
        const agentUid = result.data.agentUid;
        setAgentUid(agentUid);
        // 缓存新的 Agent ID
        setCachedAgentId(newAgentId);
        console.log('AI 加入成功，Agent ID 已缓存:', newAgentId);
        return true;
      } else {
        throw new Error(result.error || 'Failed to invite AI to room');
      }
    } catch (error) {
      console.error('Error inviting AI to room:', error);
      return false;
    }
  };

  // 让 AI 离开房间
  const removeAIFromRoom = async (targetAgentId?: string): Promise<void> => {
    const currentAgentId = targetAgentId || agentId;
    if (!currentAgentId) return;
    
    try {
      console.log('正在让 Agent 离开房间:', currentAgentId);
      await fetch('/api/call-lucy/levelRoom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: config.channel,
          uid: config.uid,
          agentId: currentAgentId,
        }),
      });
      console.log('Agent 已离开房间:', currentAgentId);
    } catch (error) {
      console.warn('Error making AI leave room:', error);
    }
  };



  // 主要通话控制函数
  const handleCallToggle = async () => {
    if (!isConfigValid) {
      toast.error('请先配置声网服务和相关 API');
      return;
    }

    if (callState === 'idle') {
      // 开始通话
      setCallState('connecting');
      toast.loading('正在连接 Lucy...', { id: 'call-status' });

      try {
        // 0. 检查并清理缓存的 Agent
        await cleanupCachedAgent();

        // 1. 检查麦克风状态
        const microphoneOk = await checkMicrophoneStatus();
        if (!microphoneOk) {
          setCallState('idle');
          toast.error('麦克风访问失败，请检查权限设置', { id: 'call-status' });
          return;
        }

        // 2. 用户加入声网房间
        await actions.join(config);
        console.log('User joined Agora room successfully');

        // 3. 邀请 AI 加入房间
        const aiJoined = await inviteAIToRoom();
        
                if (aiJoined) {
          setCallState('connected');
          
          // 为字幕功能创建独立的 RTM 客户端
          try {
            const subtitleRtm = new AgoraRTM.RTM(config.appId, `${config.uid}`);
            // if (config.token) {
              await subtitleRtm.login({ token: "007eJxTYMi0aHlRMUFhqtHZ9VYpl/TfrK63+aR/+L6G1+zpF47wa9cqMBimGiYaWCSbm5oZWpqYmRkkWaQlmZmkGiQlWpgmJyaa6hpPzmgIZGQo6fzIysjAxMAIhCA+G4OhkbGJqRkAYOEfSA==" });
              await subtitleRtm.subscribe(config.channel);
              setSubtitleRtmClient(subtitleRtm);
              console.log('字幕 RTM 客户端初始化成功');
            // }
          } catch (error) {
            console.warn('字幕 RTM 客户端初始化失败:', error);
          }
          
          toast.success('已连接到 Lucy！开始对话吧', { id: 'call-status' });
        } else {
          // AI 加入失败，用户也离开
          await actions.leave();
          setCallState('idle');
          toast.error('无法连接到 Lucy，请重试', { id: 'call-status' });
        }
      } catch (error) {
        console.error('Error starting call:', error);
        setCallState('idle');
        
        // 根据错误类型提供更具体的错误信息
        let errorMessage = '连接失败，请检查网络连接';
        if (error instanceof Error) {
          if (error.message.includes('STUN') || error.message.includes('ICE')) {
            errorMessage = '网络连接问题，请检查防火墙设置或尝试更换网络';
          } else if (error.message.includes('permission')) {
            errorMessage = '权限被拒绝，请检查麦克风权限';
          } else if (error.message.includes('timeout')) {
            errorMessage = '连接超时，请检查网络状况';
          }
        }
        
        toast.error(errorMessage, { id: 'call-status' });
        
        // 清理连接
        try {
          await actions.leave();
        } catch (leaveError) {
          console.warn('Error during cleanup:', leaveError);
        }
        
        // 连接失败时也清理缓存
        clearAgentCache();
        console.log('连接失败，Agent 缓存已清理');
      }
    } else if (callState === 'connected') {
      // 结束通话
      setCallState('disconnecting');
      toast.loading('正在结束通话...', { id: 'call-status' });

      try {
        // 1. AI 离开房间
        await removeAIFromRoom();
        
        // 2. 用户离开房间
        await actions.leave();
        
        // 3. 清理字幕 RTM 客户端
        try {
          if (subtitleRtmClient) {
            // 移除所有事件监听器
            subtitleRtmClient.removeAllListeners();
            
            // 取消订阅频道
            await subtitleRtmClient.unsubscribe(config.channel);
            
            // 退出登录
            await subtitleRtmClient.logout();
            
            setSubtitleRtmClient(null);
            console.log('字幕 RTM 客户端已完全清理');
          }
        } catch (error) {
          console.warn('字幕 RTM 客户端清理失败:', error);
          // 即使清理失败，也要设置为 null 避免内存泄漏
          setSubtitleRtmClient(null);
        }
        
        // 4. 重置状态
        setCallState('idle');
        setAgentId('');
        setAgentUid('');
        setCallDuration(0);
        setShowSubtitle(false);
        
        // 5. 正常挂断，清空缓存
        clearAgentCache();
        console.log('正常挂断，Agent 缓存已清理');
        
        toast.success('通话已结束', { id: 'call-status' });
      } catch (error) {
        console.error('Error ending call:', error);
        // 强制重置状态
        setCallState('idle');
        setAgentId('');
        setAgentUid('');
        setCallDuration(0);
        setShowSubtitle(false);
        
        // 清理 RTM 客户端
        try {
          if (subtitleRtmClient) {
            subtitleRtmClient.removeAllListeners();
            await subtitleRtmClient.unsubscribe(config.channel).catch(() => {});
            await subtitleRtmClient.logout().catch(() => {});
          }
        } catch (error) {
          console.warn('异常情况下 RTM 清理失败:', error);
        }
        setSubtitleRtmClient(null);
        
        // 异常挂断，也清空缓存
        clearAgentCache();
        console.log('异常挂断，Agent 缓存已清理');
        
        toast.success('通话已结束', { id: 'call-status' });
      }
    }
  };

  // 切换静音
  const toggleMute = async () => {
    try {
      await actions.toggleMute();
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Error toggling mute:', error);
      toast.error('静音切换失败');
    }
  };

  // 切换 AI 降噪
  const toggleAIDenoise = async () => {
    try {
      await actions.toggleAIDenoise();
      toast.success(state.isAIDenoiseEnabled ? 'AI 降噪已关闭' : 'AI 降噪已开启');
    } catch (error) {
      console.error('Error toggling AI denoise:', error);
      toast.error('AI 降噪切换失败');
    }
  };

  // 字幕连接状态变化回调 - 使用 useCallback 避免重新创建
  const handleConnectionChange = useCallback((connected: boolean) => {
    console.log('字幕连接状态:', connected);
  }, []);

  // Agent 缓存管理函数
  const getCachedAgentId = useCallback(() => {
    try {
      const cachedAgentId = localStorage.getItem(AGENT_CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(AGENT_CACHE_TIMESTAMP_KEY);
      
      if (!cachedAgentId || !cachedTimestamp) {
        return null;
      }
      
      const timestamp = parseInt(cachedTimestamp, 10);
      const now = Date.now();
      
      // 检查缓存是否过期
      if (now - timestamp > CACHE_DURATION) {
        console.log('Agent 缓存已过期，清理缓存');
        clearAgentCache();
        return null;
      }
      
      console.log('找到缓存的 Agent ID:', cachedAgentId);
      return cachedAgentId;
    } catch (error) {
      console.warn('读取 Agent 缓存失败:', error);
      return null;
    }
  }, [AGENT_CACHE_KEY, AGENT_CACHE_TIMESTAMP_KEY, CACHE_DURATION]);

  const setCachedAgentId = useCallback((agentId: string) => {
    try {
      localStorage.setItem(AGENT_CACHE_KEY, agentId);
      localStorage.setItem(AGENT_CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log('Agent ID 已缓存:', agentId);
    } catch (error) {
      console.warn('缓存 Agent ID 失败:', error);
    }
  }, [AGENT_CACHE_KEY, AGENT_CACHE_TIMESTAMP_KEY]);

  const clearAgentCache = useCallback(() => {
    try {
      localStorage.removeItem(AGENT_CACHE_KEY);
      localStorage.removeItem(AGENT_CACHE_TIMESTAMP_KEY);
      console.log('Agent 缓存已清理');
    } catch (error) {
      console.warn('清理 Agent 缓存失败:', error);
    }
  }, [AGENT_CACHE_KEY, AGENT_CACHE_TIMESTAMP_KEY]);

  // 清理缓存中的 Agent
  const cleanupCachedAgent = useCallback(async () => {
    const cachedAgentId = getCachedAgentId();
    if (cachedAgentId) {
      console.log('发现缓存的 Agent，尝试清理:', cachedAgentId);
      toast.loading('正在清理之前的会话...', { id: 'cleanup-agent' });
      
      try {
        await removeAIFromRoom(cachedAgentId);
        toast.success('之前的会话已清理', { id: 'cleanup-agent' });
      } catch (error) {
        console.warn('清理缓存 Agent 失败:', error);
        toast.warning('清理之前的会话时出现问题，但不影响新会话', { id: 'cleanup-agent' });
      } finally {
        clearAgentCache();
      }
    }
  }, [getCachedAgentId, clearAgentCache, config.channel, config.uid]);

  // 图片压缩函数 - 使用 browser-image-compression
  const compressImage = useCallback(async (
    file: File, 
    maxSizeMB: number = 5,
    onProgress?: (progress: number) => void
  ): Promise<File> => {
    try {
      const options = {
        maxSizeMB: maxSizeMB, // 最大文件大小（MB）
        maxWidthOrHeight: 1920, // 最大宽度或高度
        useWebWorker: true, // 使用 Web Worker 提升性能
        fileType: 'image/jpeg', // 输出格式
        initialQuality: 0.8, // 初始质量
        alwaysKeepResolution: false, // 允许降低分辨率
        maxIteration: 10, // 最大迭代次数
        exifOrientation: 1, // 保持图片方向
        onProgress: onProgress || ((progress: number) => {
          console.log(`压缩进度: ${Math.round(progress * 100)}%`);
        }),
      };

      console.log(`开始压缩图片: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) -> 目标: ${maxSizeMB}MB`);
      
      const compressedFile = await imageCompression(file, options);
      
      console.log(`图片压缩完成: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      
      return compressedFile;
    } catch (error) {
      console.error('图片压缩失败:', error);
      throw new Error(`图片压缩失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, []);

  // 处理图片上传
  const handleImageUpload = useCallback(async (file: File) => {
    console.log('=== 图片上传调试信息 ===');
    console.log('conversationalAPIRef.current:', !!conversationalAPIRef.current);
    console.log('agentId:', agentId);
    console.log('agentUid:', agentUid);
    console.log('callState:', callState);
    
    if (!conversationalAPIRef.current) {
      console.log('❌ 检查失败 - conversationalAPIRef 为空');
      toast.error('请先连接到 Lucy');
      return;
    }
    
    if (!agentUid) {
      console.log('❌ 检查失败 - agentUid 为空:', agentUid);
      toast.error('Agent UID 不可用，请重新连接');
      return;
    }

    setIsUploadingImage(true);
    
    try {
      // 验证文件
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || '图片文件验证失败');
        return;
      }

      console.log(`原始文件: ${file.name}, 大小: ${formatFileSize(file.size)}`);

      // 使用新的渐进式压缩
      toast.loading('正在处理图片...', { id: 'send-image' });
      
             const compressionResult = await progressiveImageCompression(
         file,
         5, // 5MB 目标
         (progress: number, stage: string) => {
           const percentage = Math.round(progress);
           toast.loading(`${stage}... ${percentage}%`, { id: 'send-image' });
         }
       );

      if (!compressionResult.success) {
        toast.error(compressionResult.error || '图片处理失败，请重试');
        return;
      }

      const processedFile = compressionResult.file;
      
      // 显示压缩结果
      if (compressionResult.compressionRatio > 0) {
        console.log(`压缩完成: ${formatFileSize(compressionResult.originalSize)} → ${formatFileSize(compressionResult.compressedSize)} (节省 ${compressionResult.compressionRatio.toFixed(1)}%)`);
        toast.loading(`压缩完成，节省${compressionResult.compressionRatio.toFixed(1)}%，正在上传...`, { id: 'send-image' });
      } else {
        toast.loading('正在上传图片...', { id: 'send-image' });
      }


      // 上传图片到存储服务
      const formData = new FormData();
      formData.append('file', processedFile);
      formData.append('prefix', 'call-lucy');

      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      console.log('上传响应状态:', uploadResponse.status, uploadResponse.statusText);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('上传失败响应:', errorText);
        throw new Error(`上传失败 (${uploadResponse.status}): ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      console.log('上传结果:', uploadResult);
      
      if (!uploadResult.success) {
        console.error('上传结果错误:', uploadResult);
        throw new Error(uploadResult.message || '上传失败');
      }

      const imageUrl = uploadResult.data.url;
      console.log('图片上传成功，URL:', imageUrl);

      toast.loading('正在发送图片消息...', { id: 'send-image' });

      // 发送图片消息到对话
      const uuid = genUUID();
      console.log('发送图片消息，agentUid:', agentUid);
      await conversationalAPIRef.current.chat(agentUid, {
        messageType: EChatMessageType.IMAGE,
        uuid: uuid,
        url: imageUrl
      });
      
      // 发送分析请求
      await conversationalAPIRef.current.chat(agentUid, {
        messageType: EChatMessageType.TEXT,
        priority: EChatMessagePriority.INTERRUPTED,
        responseInterruptable: true,
        text: "照片上传了，请帮我分析一下"
      });

      toast.success('图片发送成功', { id: 'send-image' });
      console.log(`图片上传并发送成功，最终大小: ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`);

    } catch (error) {
      console.error('图片上传失败:', error);
      const errorMessage = error instanceof Error ? error.message : '图片上传失败，请重试';
      toast.error(errorMessage, { id: 'send-image' });
    } finally {
      setIsUploadingImage(false);
    }
  }, [agentId, agentUid, compressImage]);

  // 处理文件选择
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // 清空输入框，允许选择同一个文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleImageUpload]);

  // 触发文件选择
  const triggerImageUpload = useCallback(() => {
    if (!conversationalAPIRef.current || !agentId) {
      toast.error('请先连接到 Lucy1111111');
      return;
    }
    fileInputRef.current?.click();
  }, [agentId, agentUid]);

  // 检查是否为图片消息的辅助函数
  const isImageMessage = useCallback((message: ISubtitleHelperItem<Partial<IUserTranscription | IAgentTranscription>>) => {
    return message.metadata && 
           typeof message.metadata === 'object' && 
           'messageType' in message.metadata && 
           (message.metadata as any).messageType === 'IMAGE';
  }, []);

  // 获取图片URL的辅助函数
  const getImageUrl = useCallback((message: ISubtitleHelperItem<Partial<IUserTranscription | IAgentTranscription>>) => {
    if (!isImageMessage(message)) return null;
    const metadata = message.metadata as any;
    if (metadata.base64) {
      return `data:image/jpeg;base64,${metadata.base64}`;
    }
    return metadata.url || null;
  }, [isImageMessage]);

  // 检查麦克风权限和状态
  const checkMicrophoneStatus = useCallback(async (showToast = false) => {
    try {
      if (showToast) {
        toast.loading('正在检查麦克风...', { id: 'mic-check' });
      }

      // 检查浏览器是否支持麦克风
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('浏览器不支持麦克风访问');
        if (showToast) {
          toast.error('浏览器不支持麦克风访问', { id: 'mic-check' });
        }
        return false;
      }

      // 检查麦克风权限
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('麦克风权限状态:', permission.state);

      // 尝试获取音频设备列表
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      console.log('可用的音频输入设备:', audioInputs);

      if (audioInputs.length === 0) {
        console.warn('没有找到可用的音频输入设备');
        if (showToast) {
          toast.error('没有找到可用的音频输入设备', { id: 'mic-check' });
        }
        return false;
      }

      // 测试麦克风访问
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('麦克风访问测试成功');
        
        // 立即关闭测试流
        stream.getTracks().forEach(track => track.stop());
        
        if (showToast) {
          toast.success(`麦克风测试成功！找到 ${audioInputs.length} 个音频设备`, { id: 'mic-check' });
        }
        return true;
      } catch (error) {
        console.error('麦克风访问被拒绝:', error);
        if (showToast) {
          toast.error('麦克风访问被拒绝，请检查浏览器权限设置', { id: 'mic-check' });
        }
        return false;
      }
    } catch (error) {
      console.error('检查麦克风状态时出错:', error);
      if (showToast) {
        toast.error('麦克风检查失败', { id: 'mic-check' });
      }
      return false;
    }
  }, []);

  // 初始化 ConversationalAIAPI
  const initializeConversationalAPI = useCallback(async () => {
    if (!rtcClient || !subtitleRtmClient || conversationalAPIRef.current) {
      return;
    }

    try {
      console.log('开始初始化 ConversationalAIAPI...');
      
      // 初始化组件
      const api = ConversationalAIAPI.init({
        rtcEngine: rtcClient,
        rtmEngine: subtitleRtmClient,
        /**
         * 设置转录字幕渲染模式，可选值：
         * - `ESubtitleHelperMode.WORD`：逐字渲染模式，即回调接收的字幕内容将逐字渲染到 UI 上。
         * - `ESubtitleHelperMode.TEXT`：逐句渲染模式，即回调接收的字幕内容将全量渲染到 UI 上。
         * 
         * 不指定则自动根据消息判断模式，或手动指定模式
         */
        // renderMode: ESubtitleHelperMode.WORD,
        enableLog: true
      });

      conversationalAPIRef.current = api;

      // 注册字幕回调
      // 监听转录内容更新，用于实时显示字幕转录内容
      api.on(EConversationalAIAPIEvents.TRANSCRIPTION_UPDATED, (transcriptions) => {
        console.log('字幕更新:', transcriptions);
        setChatHistory(transcriptions);
      });
      // 监听消息回执更新
      api.on(EConversationalAIAPIEvents.MESSAGE_RECEIPT_UPDATED, (agentUserId: string,  messageReceipt: TMessageReceipt) => {
        // 第一步：检查消息类型是否为 Context
        if (messageReceipt.moduleType !== EModuleType.CONTEXT) {
            return
        }
        // 第二步：解析 receipt.message 为 JSON 对象
        try {
            const receiptMessage = JSON.parse(messageReceipt.message)
            // 第三步：检查是否包含 uuid 字段
            const uuid = receiptMessage.uuid
            if (!uuid) {
                return
            }
            // 第四步：播报发送成功状态
            console.log(`消息发送成功，UUID: ${uuid}`) // 这里可以替换为实际的播报逻辑
        } catch (error) {
            console.error('解析消息失败:', error)
        }
    })
    
      // 监听智能体错误事件
      api.on(EConversationalAIAPIEvents.MESSAGE_ERROR, (agentUserId, error) => {
        console.error(`Message error for agent ${agentUserId}:`, error);
        if (error.type === EChatMessageType.IMAGE) {
          try {
              const errorData = JSON.parse(error.message);
              if (errorData?.uuid) {
                  console.warn(`Image error for agent ${agentUserId} with UUID: ${errorData.uuid}`);
              }
          } catch (e) {
              console.error(`Failed to handle image error for agent ${agentUserId}:`, e);
          }
        }
      })

      // 监听智能体状态变化
      api.on(EConversationalAIAPIEvents.AGENT_STATE_CHANGED, (agentId, state) => {
        console.log('智能体状态变化:', agentId, state);
      })
      // 监听智能体性能指标
      api.on(EConversationalAIAPIEvents.AGENT_METRICS, (agentId, metrics) => {
        console.log('智能体性能指标:', agentId, metrics);
      })
      // 监听智能体错误事件
      api.on(EConversationalAIAPIEvents.AGENT_ERROR, (agentId, error) => {
        console.error(`智能体错误: ${agentId}`, error);
      })

    
      // 订阅频道消息
      api.subscribeMessage(config.channel);
      
      setIsConversationalAPIInitialized(true);
      console.log('ConversationalAIAPI 初始化成功');
      
    } catch (error) {
      console.error('ConversationalAIAPI 初始化失败:', error);
    }
  }, [rtcClient, subtitleRtmClient, config.channel]);

    // 清理 ConversationalAIAPI
  const cleanupConversationalAPI = useCallback(() => {
    if (conversationalAPIRef.current) {
      try {
        // 取消订阅频道消息
        conversationalAPIRef.current.unsubscribe();
        
        // 移除事件监听器
        conversationalAPIRef.current.removeAllEventListeners();
        
        // 销毁实例
        conversationalAPIRef.current.destroy();
        
        console.log('ConversationalAIAPI 已完全清理和销毁');
      } catch (error) {
        console.warn('清理 ConversationalAIAPI 时出错:', error);
      }
      
      conversationalAPIRef.current = null;
      setIsConversationalAPIInitialized(false);
      setChatHistory([]);
        }
   }, []);

  // 初始化 ConversationalAIAPI 当 RTC 和 RTM 都准备好时
  useEffect(() => {
    if (rtcClient && subtitleRtmClient && state.isJoined && callState === 'connected' && !isConversationalAPIInitialized) {
      initializeConversationalAPI();
    }
  }, [rtcClient, subtitleRtmClient, state.isJoined, callState, isConversationalAPIInitialized, initializeConversationalAPI]);

  // 清理 ConversationalAIAPI 当通话结束时
  useEffect(() => {
    if (callState === 'idle' && isConversationalAPIInitialized) {
      cleanupConversationalAPI();
    }
  }, [callState, isConversationalAPIInitialized, cleanupConversationalAPI]);

  // 组件卸载时清理 RTM 客户端
  useEffect(() => {
    return () => {
      if (subtitleRtmClient) {
        console.log('组件卸载，清理 RTM 客户端');
        try {
          subtitleRtmClient.removeAllListeners();
          subtitleRtmClient.logout().catch((error) => {
            console.warn('组件卸载时 RTM logout 失败:', error);
          });
        } catch (error) {
          console.warn('组件卸载时清理 RTM 客户端失败:', error);
        }
      }
    };
  }, [subtitleRtmClient]);

  // 麦克风音量级别监控
  useEffect(() => {
    if (callState === 'connected' && state.localAudioTrack && !state.isMuted) {
      microphoneLevelRef.current = setInterval(() => {
        const level = state.localAudioTrack?.getVolumeLevel() || 0;
        setMicrophoneLevel(level);
      }, 100); // 每100ms检查一次音量级别
      
      return () => {
        if (microphoneLevelRef.current) {
          clearInterval(microphoneLevelRef.current);
          microphoneLevelRef.current = null;
        }
      };
    } else {
      setMicrophoneLevel(0);
      if (microphoneLevelRef.current) {
        clearInterval(microphoneLevelRef.current);
        microphoneLevelRef.current = null;
      }
    }
  }, [callState, state.localAudioTrack, state.isMuted]);

  // 组件加载时检查麦克风
  useEffect(() => {
    checkMicrophoneStatus();
  }, [checkMicrophoneStatus]);

  // 组件加载时检查并显示缓存状态
  useEffect(() => {
    const cachedAgentId = getCachedAgentId();
    if (cachedAgentId) {
      console.log('页面加载时发现缓存的 Agent ID:', cachedAgentId);
      toast.info('检测到之前的会话，下次通话时将自动清理', { 
        id: 'cached-agent-info',
        duration: 3000
      });
    }
  }, [getCachedAgentId]);

  // 监听网络质量和连接状态
  useEffect(() => {
    if (rtcClient && callState === 'connected') {
      // 监听网络质量
      const handleNetworkQuality = (quality: any) => {
        setNetworkQuality(quality);
        console.log('网络质量:', quality);
      };

      // 监听连接状态变化
      const handleConnectionStateChange = (curState: string, revState: string, reason?: string) => {
        setConnectionState(curState);
        console.log('连接状态变化:', { current: curState, previous: revState, reason });
        
        if (curState === 'DISCONNECTED' || curState === 'FAILED') {
          toast.error(`连接状态: ${curState}${reason ? ` (${reason})` : ''}`);
        }
      };

      // 监听异常事件
      const handleException = (event: any) => {
        console.warn('连接异常:', event);
        if (event.code === 'NETWORK_ERROR') {
          toast.warning('网络连接不稳定，正在尝试重连...');
        }
      };

      try {
        rtcClient.on('network-quality', handleNetworkQuality);
        rtcClient.on('connection-state-change', handleConnectionStateChange);
        rtcClient.on('exception', handleException);

        return () => {
          rtcClient.off('network-quality', handleNetworkQuality);
          rtcClient.off('connection-state-change', handleConnectionStateChange);
          rtcClient.off('exception', handleException);
        };
      } catch (error) {
        console.warn('设置网络监听器失败:', error);
      }
    }
  }, [rtcClient, callState]);

  // 页面卸载时的清理逻辑
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('页面即将卸载，开始清理资源');
      
      // 清理所有定时器
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
        console.log('通话计时器已清理');
      }
      
      if (microphoneLevelRef.current) {
        clearInterval(microphoneLevelRef.current);
        microphoneLevelRef.current = null;
        console.log('麦克风音量监控定时器已清理');
      }
      
             // 清理 ConversationalAI API
       if (conversationalAPIRef.current) {
         try {
           conversationalAPIRef.current.unsubscribe();
           conversationalAPIRef.current.removeAllEventListeners();
           conversationalAPIRef.current.destroy();
           conversationalAPIRef.current = null;
           console.log('ConversationalAI API 已完全清理和销毁');
         } catch (error) {
           console.warn('清理 ConversationalAI API 时出错:', error);
         }
       }
      
      // 如果正在通话中，标记缓存供下次清理
      if (callState === 'connected' && agentId) {
        console.log('页面卸载，保留 Agent 缓存供下次清理');
      }
    };

    const handleVisibilityChange = () => {
      // 页面隐藏时不做处理，因为用户可能只是切换标签页
      if (document.hidden) {
        console.log('页面隐藏，保持 Agent 状态');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('移除页面事件监听器');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // 组件卸载时的最终清理
      handleBeforeUnload();
    };
  }, [callState, agentId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen items-center justify-center px-6">
        {/* 主界面 - 空闲状态 */}
        <AnimatePresence mode="wait">
          {callState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-lg w-full"
            >
              {/* 标题 */}
              <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-16"
              >
                <h1 className="text-5xl font-light text-gray-800 mb-4">
                  与 <span className="text-blue-600 font-medium" style={{
                    background: 'linear-gradient(135deg, #9174FF, #FDB7FD)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>Lucy</span> 通话
                </h1>
                <p className="text-xl text-gray-600">
                  您的专属恋爱教练，随时为您提供建议
                </p>
              </motion.div>

              {/* 中央装饰球体 */}
              <motion.div
                className="relative mx-auto mb-20"
                style={{ width: '280px', height: '280px' }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #9174FF, #FDB7FD)',
                    boxShadow: '0 0 40px rgba(145, 116, 255, 0.4), 0 0 80px rgba(145, 116, 255, 0.2)'
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Phone className="w-12 h-12 text-white drop-shadow-lg" />
                  </div>
                </motion.div>
              </motion.div>

              {/* 主通话按钮 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleCallToggle}
                    disabled={callState !== 'idle'}
                    className="px-12 py-6 rounded-full text-xl font-medium shadow-lg text-white transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, #9174FF 0%, #FDB7FD 100%)',
                      boxShadow: '0 0 20px rgba(145, 116, 255, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #8461FF 0%, #FC9EFC 100%)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #9174FF 0%, #FDB7FD 100%)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Phone className="w-6 h-6 mr-3" />
                    Call Lucy
                  </Button>
                </motion.div>
              </motion.div>

              {/* 配置提示 */}
              {!isConfigValid && (
                <motion.div
                  className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  <p className="text-sm text-yellow-700">
                    请配置声网服务相关环境变量以启用 AI 语音通话功能
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 通话界面 - 连接中和已连接状态 */}
          {(callState === 'connecting' || callState === 'connected' || callState === 'disconnecting') && (
            <motion.div
              key="calling"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-lg w-full"
            >
              {/* 通话状态卡片 */}
              <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-8">
                  {/* 状态指示 */}
                  <div className="flex items-center justify-center mb-6">
                    <Badge 
                      variant={callState === 'connected' ? 'default' : 'secondary'}
                      className={`px-4 py-2 text-sm ${
                        callState === 'connected' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-500 text-white'
                      }`}
                    >
                      <Signal className="w-4 h-4 mr-2" />
                      {callState === 'connecting' && '连接中...'}
                      {callState === 'connected' && '已连接'}
                      {callState === 'disconnecting' && '断开中...'}
                    </Badge>
                  </div>

                  {/* Lucy 头像和状态 */}
                  <motion.div
                    className="relative mx-auto mb-6"
                    style={{ width: '200px', height: '200px' }}
                  >
                    {/* 外层光环 */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-4"
                      style={{
                        background: 'linear-gradient(135deg, #9174FF, #FDB7FD)',
                        boxShadow: '0 0 40px rgba(145, 116, 255, 0.4), 0 0 80px rgba(145, 116, 255, 0.2)'
                      }}
                      animate={{
                        scale: aiState === 'listening' ? [1, 1.1, 1] : aiState === 'speaking' ? [1, 1.08, 1] : [1, 1.05, 1],
                        opacity: aiState === 'listening' ? [0.3, 0.6, 0.3] : aiState === 'speaking' ? [0.4, 0.7, 0.4] : [0.2, 0.4, 0.2],
                      }}
                      transition={{
                        duration: aiState === 'listening' ? 1.5 : aiState === 'speaking' ? 2 : 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />

                                        {/* 核心头像 */}
                    <motion.div
                      className="absolute inset-4 rounded-full flex items-center justify-center overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #9174FF, #FDB7FD)',
                        boxShadow: '0 0 40px rgba(145, 116, 255, 0.4), 0 0 80px rgba(145, 116, 255, 0.2)'
                      }}
                      animate={{
                        scale: aiState === 'listening' || aiState === 'speaking' ? [1, 1.05, 1] : 1,
                      }}
                      transition={{
                        duration: 1,
                        repeat: (aiState === 'listening' || aiState === 'speaking') ? Infinity : 0,
                        ease: "easeInOut"
                      }}
                    >
                      {/* Lucy 标识 */}
                      <div className="relative flex items-center justify-center w-full h-full">
                        <span 
                          className="text-6xl font-bold select-none"
                          style={{ 
                            color: 'white',
                            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                            fontFamily: 'var(--font-serif)'
                          }}
                        >
                          L
                        </span>
                        
                        {/* 状态指示器 */}
                        <motion.div
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                          style={{
                            background: aiState === 'listening' 
                              ? '#CCFF00' 
                              : aiState === 'thinking'
                              ? '#9174FF'
                              : aiState === 'speaking'
                              ? '#FDB7FD'
                              : '#9174FF',
                            color: aiState === 'listening' ? '#000' : '#fff',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                          }}
                          animate={{
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          {aiState === 'listening' ? '👂' : 
                           aiState === 'thinking' ? '🤔' : 
                           aiState === 'speaking' ? '💬' : '💤'}
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* 语音波纹 - 根据状态显示不同的波纹 */}
                    {(aiState === 'listening' || aiState === 'speaking') && (
                      <>
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute inset-0 rounded-full border-2"
                            style={{
                              borderColor: aiState === 'listening' 
                                ? 'rgba(204, 255, 0, 0.3)' // 荧光绿波纹
                                : 'rgba(253, 183, 253, 0.3)' // 粉色波纹
                            }}
                            initial={{ scale: 1, opacity: 0.6 }}
                            animate={{
                              scale: [1, 1.5, 2],
                              opacity: [0.6, 0.3, 0],
                            }}
                            transition={{
                              duration: aiState === 'listening' ? 2 : 2.5,
                              repeat: Infinity,
                              delay: i * 0.4,
                              ease: "easeOut"
                            }}
                          />
                        ))}
                      </>
                    )}
                  </motion.div>

                  {/* Lucy 信息 */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-2">Lucy</h3>
                    <p className="text-gray-600">
                      {callState === 'connecting' && '正在加入通话...'}
                      {callState === 'disconnecting' && '正在离开...'}
                      {callState === 'connected' && aiState === 'listening' && '🎧 正在聆听...'}
                      {callState === 'connected' && aiState === 'thinking' && '🤔 分析中...'}
                      {callState === 'connected' && aiState === 'speaking' && '💬 回复中...'}
                      {callState === 'connected' && aiState === 'waiting' && '😊 等待对话...'}
                    </p>
                  </div>

                  {/* 通话时长 */}
                  {callState === 'connected' && (
                    <div className="mb-6">
                      <p className="text-lg font-mono text-gray-700">
                        {formatDuration(callDuration)}
                      </p>
                    </div>
                  )}

                  {/* 麦克风状态指示器 */}
                  {callState === 'connected' && (
                    <div className="mb-6">
                      <div className="flex items-center justify-center gap-3">
                        <Mic className={`w-5 h-5 ${
                          state.isMuted ? 'text-red-500' : 'text-green-500'
                        }`} />
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-600 mb-1">
                            {state.isMuted ? '麦克风已静音' : '麦克风音量'}
                          </span>
                          {!state.isMuted && (
                            <div className="flex items-center gap-1">
                              {/* 音量级别可视化 */}
                              {[...Array(10)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1 h-4 rounded-full ${
                                    i < Math.floor(microphoneLevel * 10)
                                      ? 'bg-green-500'
                                      : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-gray-500 ml-2">
                                {Math.round(microphoneLevel * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 网络状态显示 */}
                  {callState === 'connected' && (
                    <div className="mb-6">
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                          <Signal className="w-4 h-4 text-blue-500" />
                          <span className="text-xs text-gray-600">
                            连接: {connectionState}
                          </span>
                        </div>
                        {networkQuality && (
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-gray-500">上行</span>
                              <div className="flex gap-1">
                                {[...Array(6)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1 h-3 rounded-sm ${
                                      i < networkQuality.uplinkNetworkQuality
                                        ? 'bg-green-500'
                                        : 'bg-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-gray-500">下行</span>
                              <div className="flex gap-1">
                                {[...Array(6)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1 h-3 rounded-sm ${
                                      i < networkQuality.downlinkNetworkQuality
                                        ? 'bg-blue-500'
                                        : 'bg-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 控制按钮 */}
                  <div className="flex items-center justify-center space-x-4">
                    {/* 静音按钮 */}
                    {callState === 'connected' && (
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          onClick={toggleMute}
                          variant="outline"
                          size="lg"
                          className="rounded-full p-4"
                          style={{
                            background: isMuted 
                              ? 'linear-gradient(135deg, #ff6b6b, #ff8e8e)' 
                              : 'linear-gradient(135deg, #9174FF, #b69aff)',
                            borderColor: isMuted ? '#ff6b6b' : '#9174FF',
                            color: 'white'
                          }}
                        >
                          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </Button>
                      </motion.div>
                    )}

                    {/* 字幕按钮 */}
                    {callState === 'connected' && (
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          onClick={() => setShowSubtitle(!showSubtitle)}
                          variant="outline"
                          size="lg"
                          className="rounded-full p-4"
                          style={{
                            background: showSubtitle 
                              ? 'linear-gradient(135deg, #FDB7FD, #CCFF00)' 
                              : 'linear-gradient(135deg, #e5e7eb, #f3f4f6)',
                            borderColor: showSubtitle ? '#FDB7FD' : '#e5e7eb',
                            color: showSubtitle ? 'white' : '#6b7280'
                          }}
                          title="实时字幕"
                        >
                          <MessageSquare className="w-6 h-6" />
                        </Button>
                      </motion.div>
                    )}

                    {/* AI 降噪按钮 */}
                    {callState === 'connected' && (
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          onClick={toggleAIDenoise}
                          variant="outline"
                          size="lg"
                          className="rounded-full p-4"
                          style={{
                            background: state.isAIDenoiseEnabled 
                              ? 'linear-gradient(135deg, #CCFF00, #9174FF)' 
                              : 'linear-gradient(135deg, #e5e7eb, #f3f4f6)',
                            borderColor: state.isAIDenoiseEnabled ? '#CCFF00' : '#e5e7eb',
                            color: state.isAIDenoiseEnabled ? 'white' : '#6b7280'
                          }}
                          title="AI 降噪"
                        >
                          <Waves className="w-6 h-6" />
                        </Button>
                      </motion.div>
                    )}

                    {/* 图片上传按钮 */}
                    {callState === 'connected' && (
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          onClick={triggerImageUpload}
                          disabled={isUploadingImage}
                          variant="outline"
                          size="lg"
                          className="rounded-full p-4"
                          style={{
                            background: isUploadingImage 
                              ? 'linear-gradient(135deg, #9174FF, #FDB7FD)' 
                              : 'linear-gradient(135deg, #CCFF00, #9174FF)',
                            borderColor: '#9174FF',
                            color: 'white',
                            opacity: isUploadingImage ? 0.7 : 1
                          }}
                          title={isUploadingImage ? "正在处理图片..." : "发送图片 (支持自动压缩)"}
                        >
                          {isUploadingImage ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Image className="w-6 h-6" />
                            </motion.div>
                          ) : (
                            <Image className="w-6 h-6" />
                          )}
                        </Button>
                      </motion.div>
                    )}

                    {/* 挂断按钮 */}
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        onClick={handleCallToggle}
                        disabled={callState === 'connecting' || callState === 'disconnecting'}
                        className="rounded-full p-4 bg-red-500 hover:bg-red-600 text-white"
                        size="lg"
                      >
                        <PhoneOff className="w-6 h-6" />
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 实时字幕面板 */}
        <AnimatePresence>
          {showSubtitle && callState === 'connected' && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="fixed bottom-6 right-6 z-20"
              style={{ 
                width: '400px',
                maxWidth: 'calc(100vw - 3rem)'
              }}
            >
              <Card className="bg-white/95 backdrop-blur-md border-0 shadow-2xl">
                <CardContent className="p-0">
                  {/* 字幕标题栏 */}
                  <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-800">实时字幕</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSubtitle(false)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                                                        {/* 字幕内容 */}
                   <div className="h-80">
                                          {isConversationalAPIInitialized ? (
                       /* 自定义字幕显示组件 */
                       <div className="h-full flex flex-col">
                         {/* 字幕状态栏 */}
                         <div className="flex items-center justify-between p-2 border-b bg-gray-50">
                           <div className="flex items-center gap-2">
                             <MessageSquare className="w-4 h-4 text-blue-600" />
                             <span className="text-sm font-medium">实时字幕</span>
                             <Badge variant="default" className="bg-green-500">
                               已连接
                             </Badge>
                           </div>
                           <span className="text-xs text-gray-500">
                             共 {chatHistory.length} 条消息
                           </span>
                         </div>
                         
                         {/* 字幕内容区域 */}
                         <div className="flex-1 overflow-y-auto p-4 space-y-3">
                           {chatHistory.length === 0 ? (
                             <div className="flex items-center justify-center h-full text-gray-500">
                               等待对话开始...
                             </div>
                           ) : (
                             chatHistory.map((message, index) => (
                               <div
                                 key={`${message.uid}-${message.turn_id}-${index}`}
                                 className={`flex flex-col space-y-1 ${
                                   message.uid === 'agent' ? 'items-start' : 'items-end'
                                 }`}
                               >
                                 {/* 消息气泡 */}
                                 <div
                                   className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                     message.uid === 'agent'
                                       ? 'bg-gray-100 text-gray-800'
                                       : 'bg-blue-500 text-white'
                                   }`}
                                 >
                                   <div className="flex items-center gap-2 mb-1">
                                     <span className="text-xs font-medium">
                                       {message.uid === 'agent' ? 'AI' : '用户'}
                                     </span>
                                     {/* 显示消息类型图标 */}
                                     {isImageMessage(message) && (
                                       <Image className="w-3 h-3 opacity-70" />
                                     )}
                                   </div>
                                   
                                   {/* 检查是否为图片消息 */}
                                   {isImageMessage(message) ? (
                                     <div className="space-y-2">
                                       {/* 显示图片预览 */}
                                       {getImageUrl(message) && (
                                         <img
                                           src={getImageUrl(message)!}
                                           alt="发送的图片"
                                           className="max-w-full h-auto rounded border"
                                           style={{ maxHeight: '200px' }}
                                           onError={(e) => {
                                             e.currentTarget.style.display = 'none';
                                           }}
                                         />
                                       )}
                                       <p className="leading-relaxed text-xs opacity-80">
                                         {message.text || '发送了一张图片'}
                                       </p>
                                     </div>
                                   ) : (
                                     <p className="leading-relaxed">
                                       {message.text || '...'}
                                     </p>
                                   )}
                                 </div>
                                 
                                 {/* 时间戳 */}
                                 <span className="text-xs text-gray-400">
                                   {new Date(message._time).toLocaleTimeString('zh-CN', {
                                     hour12: false,
                                     hour: '2-digit',
                                     minute: '2-digit',
                                     second: '2-digit'
                                   })}
                                 </span>
                               </div>
                             ))
                           )}
                         </div>
                       </div>
                     ) : (
                       /* 字幕功能提示 */
                       <div className="flex flex-col items-center justify-center h-full text-center p-6">
                         <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
                         <h4 className="text-lg font-medium text-gray-700 mb-2">初始化字幕服务</h4>
                         <p className="text-sm text-gray-500 mb-4">
                           正在准备实时字幕功能...
                         </p>
                         <div className="text-xs text-gray-400 space-y-1">
                           <p>• RTC 连接: {rtcClient ? '✓' : '×'}</p>
                           <p>• RTM 连接: {subtitleRtmClient ? '✓' : '×'}</p>
                           <p>• 频道状态: {state.isJoined ? '已加入' : '未加入'}</p>
                           <p>• ConversationalAI: {isConversationalAPIInitialized ? '已初始化' : '未初始化'}</p>
                           <p>• Agent 缓存: {getCachedAgentId() ? '有缓存' : '无缓存'}</p>
                         </div>
                         {(!rtcClient || !subtitleRtmClient || !state.isJoined) && (
                           <div className="mt-4">
                             <p className="text-xs text-yellow-500">
                               等待通话连接建立完成...
                             </p>
                           </div>
                         )}
                         {(rtcClient && subtitleRtmClient && state.isJoined && !isConversationalAPIInitialized) && (
                           <div className="mt-4">
                             <p className="text-xs text-blue-500">
                               正在初始化 ConversationalAI API...
                             </p>
                           </div>
                         )}
                       </div>
                     )}
                   </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}