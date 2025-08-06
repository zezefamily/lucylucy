'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Signal,
  Volume2
} from 'lucide-react';
import { useAgoraClient, AgoraConfig } from './agora-client';
import { toast } from 'sonner';

interface VoiceCallInterfaceProps {
  config: AgoraConfig;
  onCallEnd?: () => void;
}

export const VoiceCallInterface: React.FC<VoiceCallInterfaceProps> = ({
  config,
  onCallEnd
}) => {
  const { state, actions } = useAgoraClient();
  const [callDuration, setCallDuration] = useState(0);
  const [isCallStarted, setIsCallStarted] = useState(false);

  // 通话计时器
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.isJoined && isCallStarted) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.isJoined, isCallStarted]);

  // 格式化通话时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 开始通话
  const handleStartCall = async () => {
    try {
      await actions.join(config);
      setIsCallStarted(true);
      setCallDuration(0);
      toast.success('成功加入语音通话');
    } catch (error) {
      console.error('Failed to start call:', error);
      toast.error('加入通话失败，请重试');
    }
  };

  // 结束通话
  const handleEndCall = async () => {
    try {
      await actions.leave();
      setIsCallStarted(false);
      setCallDuration(0);
      toast.success('通话已结束');
      onCallEnd?.();
    } catch (error) {
      console.error('Failed to end call:', error);
      toast.error('结束通话失败');
    }
  };

  // 切换静音
  const handleToggleMute = async () => {
    try {
      await actions.toggleMute();
      toast.success(state.isMuted ? '已取消静音' : '已静音');
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      toast.error('切换静音状态失败');
    }
  };

  // 获取连接状态颜色
  const getConnectionStatusColor = () => {
    switch (state.connectionState) {
      case 'CONNECTED':
        return 'bg-green-500';
      case 'CONNECTING':
      case 'RECONNECTING':
        return 'bg-yellow-500';
      case 'DISCONNECTED':
      case 'DISCONNECTING':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 获取连接状态文本
  const getConnectionStatusText = () => {
    switch (state.connectionState) {
      case 'CONNECTED':
        return '已连接';
      case 'CONNECTING':
        return '连接中';
      case 'RECONNECTING':
        return '重连中';
      case 'DISCONNECTED':
        return '未连接';
      case 'DISCONNECTING':
        return '断开中';
      default:
        return '未知';
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="bg-white/90 backdrop-blur-lg border-0 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            {/* Lucy头像区域 */}
            <motion.div 
              className="flex flex-col items-center space-y-6"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* 头像和状态 */}
              <div className="relative">
                <motion.div
                  animate={{ 
                    scale: state.isJoined ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ 
                    repeat: state.isJoined ? Infinity : 0,
                    duration: 2,
                    ease: "easeInOut"
                  }}
                >
                  <Avatar className="w-32 h-32 ring-4 ring-white shadow-xl">
                    <AvatarImage src="/imgs/lucy/banner_hero_img.png" alt="Lucy" />
                    <AvatarFallback className="text-2xl">Lucy</AvatarFallback>
                  </Avatar>
                </motion.div>
                
                {/* 在线状态指示器 */}
                <motion.div 
                  className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white shadow-lg ${
                    state.isJoined ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                  animate={{ 
                    scale: state.isJoined ? [1, 1.2, 1] : 1,
                  }}
                  transition={{ 
                    repeat: state.isJoined ? Infinity : 0,
                    duration: 1.5,
                    ease: "easeInOut"
                  }}
                />
              </div>
              
              {/* 名称和标题 */}
              <motion.div 
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-2xl font-bold text-gray-900">Lucy</h3>
                <p className="text-gray-600 mt-1">AI 语音助手</p>
              </motion.div>

              {/* 连接状态 */}
              <motion.div 
                className="flex items-center space-x-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Signal className="w-4 h-4" />
                <Badge 
                  variant="outline" 
                  className={`${getConnectionStatusColor()} text-white border-0 px-3 py-1`}
                >
                  {getConnectionStatusText()}
                </Badge>
              </motion.div>

              {/* 通话时长 */}
              <AnimatePresence>
                {state.isJoined && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-3xl font-mono font-bold text-gray-900"
                  >
                    {formatDuration(callDuration)}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 远程用户音频指示器 */}
              <AnimatePresence>
                {state.remoteUsers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center space-x-2 text-green-600"
                  >
                    <Volume2 className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {state.remoteUsers.length} 位参与者在线
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 通话控制按钮 */}
              <motion.div 
                className="flex justify-center space-x-6 pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <AnimatePresence mode="wait">
                  {!state.isJoined ? (
                    <motion.div
                      key="start-call"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleStartCall}
                        disabled={state.isConnecting}
                        className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-xl"
                        size="lg"
                      >
                        <Phone className="w-6 h-6 mr-2" />
                        {state.isConnecting ? '连接中...' : '开始通话'}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="call-controls"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex space-x-4"
                    >
                      {/* 静音按钮 */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          onClick={handleToggleMute}
                          variant={state.isMuted ? "destructive" : "default"}
                          className="rounded-full p-4 shadow-xl"
                          size="lg"
                        >
                          <motion.div
                            animate={{ rotate: state.isMuted ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {state.isMuted ? (
                              <MicOff className="w-6 h-6" />
                            ) : (
                              <Mic className="w-6 h-6" />
                            )}
                          </motion.div>
                        </Button>
                      </motion.div>

                      {/* 结束通话按钮 */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          onClick={handleEndCall}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-xl"
                          size="lg"
                        >
                          <PhoneOff className="w-6 h-6" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* 状态提示 */}
              <AnimatePresence>
                {state.isJoined && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <motion.p 
                      className="text-sm text-gray-600"
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      {state.isMuted ? '🔇 你已静音' : '🎙️ 正在通话中...'}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VoiceCallInterface; 