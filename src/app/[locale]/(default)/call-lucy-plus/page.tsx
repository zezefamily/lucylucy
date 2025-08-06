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
  X
} from 'lucide-react';
import { useAgoraClient, AgoraConfig } from '@/components/voice-call/agora-client';
import { RealTimeSubtitle } from '@/components/blocks/real-time-subtitle';
import { toast } from 'sonner';

// 导入 AgoraRTM
import AgoraRTM, { type RTMClient } from 'agora-rtm';

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
  const [agentId, setAgentId] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isListening, setIsListening] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [subtitleRtmClient, setSubtitleRtmClient] = useState<RTMClient | null>(null);

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

  // 语音活动检测
  useEffect(() => {
    if (callState === 'connected' && state.isJoined) {
      const interval = setInterval(() => {
        setIsListening(prev => !prev);
      }, 1500);
      return () => clearInterval(interval);
    } else {
      setIsListening(false);
    }
  }, [callState, state.isJoined]);

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
        setAgentId(result.data.agentId);
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
  const removeAIFromRoom = async (): Promise<void> => {
    if (!agentId) return;
    
    try {
      await fetch('/api/call-lucy/levelRoom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: config.channel,
          uid: config.uid,
          agentId: agentId,
        }),
      });
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
        // 1. 用户加入声网房间
        await actions.join(config);
        console.log('User joined Agora room successfully');

        // 2. 邀请 AI 加入房间
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
        toast.error('连接失败，请检查网络连接', { id: 'call-status' });
        // 清理连接
        try {
          await actions.leave();
        } catch (leaveError) {
          console.warn('Error during cleanup:', leaveError);
        }
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
            await subtitleRtmClient.logout();
            setSubtitleRtmClient(null);
            console.log('字幕 RTM 客户端已清理');
          }
        } catch (error) {
          console.warn('字幕 RTM 客户端清理失败:', error);
        }
        
        // 4. 重置状态
        setCallState('idle');
        setAgentId(null);
        setCallDuration(0);
        setShowSubtitle(false);
        toast.success('通话已结束', { id: 'call-status' });
      } catch (error) {
        console.error('Error ending call:', error);
        // 强制重置状态
        setCallState('idle');
        setAgentId(null);
        setCallDuration(0);
        setShowSubtitle(false);
        setSubtitleRtmClient(null);
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
                  与 <span className="text-blue-600 font-medium">Lucy</span> 对话
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
                    background: 'linear-gradient(135deg, #3b82f6, #60a5fa, #93c5fd)',
                    boxShadow: '0 0 40px rgba(59, 130, 246, 0.4), 0 0 80px rgba(59, 130, 246, 0.2)'
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
                    className="px-12 py-6 rounded-full text-xl font-medium shadow-lg bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300"
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
                      className="absolute inset-0 rounded-full border-4 border-blue-200"
                      animate={{
                        scale: isListening ? [1, 1.1, 1] : [1, 1.05, 1],
                        opacity: isListening ? [0.3, 0.6, 0.3] : [0.2, 0.4, 0.2],
                      }}
                      transition={{
                        duration: isListening ? 1.5 : 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />

                    {/* 核心头像 */}
                    <motion.div
                      className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center"
                      animate={{
                        scale: isListening ? [1, 1.05, 1] : 1,
                      }}
                      transition={{
                        duration: 1,
                        repeat: isListening ? Infinity : 0,
                        ease: "easeInOut"
                      }}
                    >
                      <span className="text-4xl font-bold text-white">L</span>
                    </motion.div>

                    {/* 语音波纹 */}
                    {isListening && (
                      <>
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute inset-0 rounded-full border-2 border-blue-400/30"
                            initial={{ scale: 1, opacity: 0.6 }}
                            animate={{
                              scale: [1, 1.5, 2],
                              opacity: [0.6, 0.3, 0],
                            }}
                            transition={{
                              duration: 2,
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
                      {callState === 'connected' && isListening && '正在聆听...'}
                      {callState === 'connected' && !isListening && '思考中...'}
                      {callState === 'connecting' && '正在加入通话...'}
                      {callState === 'disconnecting' && '正在离开...'}
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

                  {/* 控制按钮 */}
                  <div className="flex items-center justify-center space-x-4">
                    {/* 静音按钮 */}
                    {callState === 'connected' && (
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          onClick={toggleMute}
                          variant="outline"
                          size="lg"
                          className={`rounded-full p-4 ${
                            isMuted ? 'bg-red-100 border-red-300 text-red-600' : 'bg-blue-100 border-blue-300 text-blue-600'
                          }`}
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
                          className={`rounded-full p-4 ${
                            showSubtitle 
                              ? 'bg-purple-100 border-purple-300 text-purple-600' 
                              : 'bg-gray-100 border-gray-300 text-gray-600'
                          }`}
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
                          className={`rounded-full p-4 ${
                            state.isAIDenoiseEnabled 
                              ? 'bg-green-100 border-green-300 text-green-600' 
                              : 'bg-gray-100 border-gray-300 text-gray-600'
                          }`}
                          title="AI 降噪"
                        >
                          <Waves className="w-6 h-6" />
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
                                          {subtitleRtmClient && rtcClient && state.isJoined ? (
                       <RealTimeSubtitle
                         className="border-0 shadow-none rounded-none h-full"
                         rtcEngine={rtcClient}
                         rtmEngine={subtitleRtmClient}
                         channelName={config.channel}
                         maxMessages={20}
                         showTimestamp={true}
                         showUserControls={false}
                         enableLog={true}
                         onConnectionChange={handleConnectionChange}
                       />
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
                         </div>
                         {(!rtcClient || !subtitleRtmClient || !state.isJoined) && (
                           <div className="mt-4">
                             <p className="text-xs text-yellow-500">
                               等待通话连接建立完成...
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
      </div>
    </div>
  );
}