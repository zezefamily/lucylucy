'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import VoiceCallInterface from '@/components/voice-call/voice-call-interface';
import { AgoraConfig } from '@/components/voice-call/agora-client';
import { ArrowLeft, Phone, PhoneOff, Mic } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function CallLucy() {
  const router = useRouter();
  const [config, setConfig] = useState<AgoraConfig>({
    appId: process.env.NEXT_PUBLIC_AGORA_APP_ID || '',
    channel: process.env.NEXT_PUBLIC_AGORA_DEFAULT_CHANNEL || 'lucy-voice-call',
    token: undefined,
    uid: undefined
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // 生成随机用户ID
  useEffect(() => {
    if (!config.uid) {
      setConfig(prev => ({
        ...prev,
        uid: Math.floor(Math.random() * 1000000)
      }));
    }
  }, [config.uid]);

  // 检查配置
  const isConfigValid = config.appId && 
    config.appId !== 'your_agora_app_id_here' &&
    process.env.NEXT_PUBLIC_AGORA_APP_ID;

  // 通话结束回调（当 VoiceCallInterface 中的用户主动挂断时）
  const handleCallEnd = async () => {
    // 让 AI 也离开房间
    await removeAIFromRoom();
    // 更新状态
    setIsConnected(false);
    setIsListening(false);
    setAgentId(null);
    console.log('Call ended');
  };

  // 模拟语音活动检测
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setIsListening(prev => !prev);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setIsListening(false);
    }
  }, [isConnected]);

  // 邀请 AI 加入房间
  const inviteAIToRoom = async () => {
    try {
      const response = await fetch('/api/call-lucy/joinRoom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: config.channel,
          uid: config.uid,
          userSystemMessage: '你是 Lucy，一个友善的 AI 助手，可以帮助用户分析和优化他们的交友资料。请用中文对话，保持友好和专业的语气。'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setAgentId(result.data.agentId);
        toast.success('Lucy 已加入通话！');
        return true;
      } else {
        throw new Error(result.error || 'Failed to invite AI to room');
      }
    } catch (error) {
      console.error('Error inviting AI to room:', error);
      toast.error('无法邀请 Lucy 加入，请重试');
      return false;
    }
  };

  // 让 AI 离开房间
  const removeAIFromRoom = async () => {
    if (!agentId) return;
    
    try {
      const response = await fetch('/api/call-lucy/levelRoom', {
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

      const result = await response.json();
      if (!result.success) {
        console.warn('AI leave room warning:', result.error);
      }
    } catch (error) {
      console.warn('Error making AI leave room:', error);
    }
  };

  // 处理通话按钮点击
  const handleCallToggle = async () => {
    if (!isConfigValid) {
      toast.error('请先配置声网 App ID 和相关服务');
      return;
    }

    if (isJoining) {
      return; // 防止重复点击
    }

    if (isConnected) {
      // 结束通话：先让 AI 离开，然后更新状态（VoiceCallInterface 会处理用户的声网连接）
      setIsJoining(true);
      await removeAIFromRoom();
      setIsConnected(false);
      setAgentId(null);
      setIsJoining(false);
    } else {
      // 开始通话：先显示界面，VoiceCallInterface 会处理用户连接，然后邀请 AI
      setIsJoining(true);
      setIsConnected(true);
      // 邀请 AI 加入（异步进行，不阻塞界面显示）
      inviteAIToRoom().finally(() => {
        setIsJoining(false);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-300"></div>
      </div>


      <div className="relative z-10 flex flex-col min-h-screen items-center justify-center px-6">
        <div className="text-center max-w-lg w-full">
          {/* 标题 */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-16"
          >
            <h1 className="text-5xl font-light text-gray-800 mb-4">
                <p className="text-xl text-gray-600">
                开始与 <span className="text-blue-600 font-medium">Lucy 对话</span> 
                </p>
            </h1> 
          </motion.div>

          {/* 中央发光球体 */}
          <motion.div
            className="relative mx-auto mb-20"
            style={{ width: '280px', height: '280px' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {/* 外层光环 */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.1))',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}
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

            {/* 中层光环 */}
            <motion.div
              className="absolute inset-6 rounded-full"
              style={{
                background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.15), rgba(147, 197, 253, 0.15))',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
              animate={{
                scale: isListening ? [1, 1.08, 1] : [1, 1.03, 1],
                opacity: isListening ? [0.4, 0.7, 0.4] : [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: isListening ? 1.2 : 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
            />

            {/* 核心发光球体 */}
            <motion.div
              className="absolute inset-12 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #60a5fa, #93c5fd)',
                boxShadow: isListening 
                  ? '0 0 60px rgba(59, 130, 246, 0.6), 0 0 120px rgba(59, 130, 246, 0.3)' 
                  : '0 0 40px rgba(59, 130, 246, 0.4), 0 0 80px rgba(59, 130, 246, 0.2)'
              }}
              animate={{
                scale: isListening ? [1, 1.05, 1] : 1,
              }}
              transition={{
                duration: 1,
                repeat: isListening ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              {/* 内部高光 */}
              <motion.div
                className="absolute inset-3 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1), transparent)'
                }}
                animate={{
                  opacity: isListening ? [0.3, 0.6, 0.3] : [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* 中央图标 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ 
                    scale: isListening ? [1, 1.1, 1] : 1,
                    rotate: isConnected ? [0, 5, -5, 0] : 0
                  }}
                  transition={{
                    duration: isListening ? 1 : 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Mic className="w-10 h-10 text-white drop-shadow-lg" />
                </motion.div>
              </div>
            </motion.div>

            {/* 语音波纹效果 */}
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

          {/* 状态文本 */}
          {/* <motion.div
            className="mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {isConnected ? (
              <motion.p
                className="text-lg text-gray-600"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isListening ? '🎤 Lucy 正在聆听...' : '💭 Lucy 正在思考...'}
              </motion.p>
            ) : (
              <p className="text-lg text-gray-500">准备开始与 Lucy 的对话</p>
            )}
          </motion.div> */}

          {/* 通话按钮 */}
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
                disabled={isJoining}
                className={`
                  px-10 py-4 rounded-full text-lg font-medium shadow-lg transition-all duration-300 relative
                  ${isConnected 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : isJoining
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }
                `}
              >
                {isJoining ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    连接中...
                  </>
                ) : isConnected ? (
                  <>
                    <PhoneOff className="w-5 h-5 mr-2" />
                    结束通话
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5 mr-2" />
                    Call Lucy
                  </>
                )}
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
              <div className="text-sm text-yellow-700">
                <p className="mb-2">
                  请配置以下环境变量以启用 AI 语音通话功能：
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li><code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_AGORA_APP_ID</code> - 声网应用 ID</li>
                  <li><code className="bg-yellow-100 px-1 rounded">AGORA_AI_PROJECT_ID</code> - 声网 AI 项目 ID</li>
                  <li><code className="bg-yellow-100 px-1 rounded">AGORA_AI_BASIC_AUTH</code> - 声网 AI 认证</li>
                  <li><code className="bg-yellow-100 px-1 rounded">OPENAI_API_KEY</code> - OpenAI API 密钥</li>
                  <li><code className="bg-yellow-100 px-1 rounded">MINIMAX_GROUP_ID</code> 和 <code className="bg-yellow-100 px-1 rounded">MINIMAX_KEY</code> - Minimax 语音合成</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* 实际语音通话组件 */}
          <div className={isConnected ? "block" : "hidden"}>
            <VoiceCallInterface
              config={config}
              onCallEnd={handleCallEnd}
            />
          </div>
        </div>
      </div>
    </div>
  );
}