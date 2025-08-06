'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  ConnectionState,
  UID
} from 'agora-rtc-sdk-ng';
// @ts-ignore
import AgoraAIDenoise from 'agora-conversational-ai-denoiser';

export interface AgoraConfig {
  appId: string;
  channel: string;
  token?: string;
  uid?: UID;
}

export interface AgoraClientState {
  isJoined: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  connectionState: ConnectionState;
  remoteUsers: IAgoraRTCRemoteUser[];
  localAudioTrack: IMicrophoneAudioTrack | null;
  isAIDenoiseEnabled: boolean;
  aiDenoiseProcessor: any | null;
}

export interface AgoraClientActions {
  join: (config: AgoraConfig) => Promise<void>;
  leave: () => Promise<void>;
  toggleMute: () => Promise<void>;
  toggleAIDenoise: () => Promise<void>;
  destroy: () => void;
}

interface UseAgoraClientReturn {
  state: AgoraClientState;
  actions: AgoraClientActions;
  rtcClient: IAgoraRTCClient | null;
}

export const useAgoraClient = (): UseAgoraClientReturn => {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [state, setState] = useState<AgoraClientState>({
    isJoined: false,
    isConnecting: false,
    isMuted: false,
    connectionState: 'DISCONNECTED',
    remoteUsers: [],
    localAudioTrack: null,
    isAIDenoiseEnabled: false,
    aiDenoiseProcessor: null,
  });

  // 初始化客户端
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = AgoraRTC.createClient({ 
        mode: 'rtc', 
        codec: 'vp8'
      });

      console.log('Agora RTC 客户端已创建');

      const client = clientRef.current;

      // 监听用户加入
      client.on('user-joined', (user) => {
        console.log('User joined:', user.uid);
        setState(prev => ({
          ...prev,
          remoteUsers: [...prev.remoteUsers, user]
        }));
      });

      // 监听用户离开
      client.on('user-left', (user) => {
        console.log('User left:', user.uid);
        setState(prev => ({
          ...prev,
          remoteUsers: prev.remoteUsers.filter(u => u.uid !== user.uid)
        }));
      });

      // 监听用户发布音频
      client.on('user-published', async (user, mediaType) => {
        if (mediaType === 'audio') {
          console.log('User published audio:', user.uid);
          await client.subscribe(user, mediaType);
          const remoteAudioTrack = user.audioTrack as IRemoteAudioTrack;
          remoteAudioTrack?.play();
          
          setState(prev => ({
            ...prev,
            remoteUsers: prev.remoteUsers.map(u => 
              u.uid === user.uid ? user : u
            )
          }));
        }
      });

      // 监听用户取消发布音频
      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'audio') {
          console.log('User unpublished audio:', user.uid);
          setState(prev => ({
            ...prev,
            remoteUsers: prev.remoteUsers.map(u => 
              u.uid === user.uid ? user : u
            )
          }));
        }
      });

      // 监听连接状态变化
      client.on('connection-state-change', (curState) => {
        console.log('Connection state changed:', curState);
        setState(prev => ({
          ...prev,
          connectionState: curState
        }));
      });
    }

    return () => {
      console.log('useAgoraClient cleanup: 开始清理 Agora 客户端');
      
      if (clientRef.current) {
        // 移除所有事件监听器
        try {
          clientRef.current.removeAllListeners();
          console.log('已移除所有 RTC 事件监听器');
        } catch (error) {
          console.warn('移除 RTC 事件监听器时出错:', error);
        }
        
        // 如果客户端仍在连接状态，尝试离开房间
        try {
          clientRef.current.leave().catch((error) => {
            console.warn('组件卸载时离开房间失败:', error);
          });
        } catch (error) {
          console.warn('调用 leave 方法时出错:', error);
        }
        
        // 清空客户端引用
        clientRef.current = null;
      }
      
      console.log('useAgoraClient cleanup: 清理完成');
    };
  }, []);

  // 加入房间
  const join = useCallback(async (config: AgoraConfig) => {
    if (!clientRef.current) return;

    try {
      setState(prev => ({ ...prev, isConnecting: true }));

      const client = clientRef.current;
      
      // 加入频道
      await client.join(
        config.appId,
        config.channel,
        config.token || null,
        config.uid || null
      );

      // 创建本地音频轨道
      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      
      // 检查麦克风状态
      console.log('麦克风轨道创建成功:', {
        trackId: localAudioTrack.getTrackId(),
        enabled: localAudioTrack.enabled,
        muted: localAudioTrack.muted,
        volume: localAudioTrack.getVolumeLevel()
      });
      
      // 监听音频级别变化
      localAudioTrack.on('track-ended', () => {
        console.warn('麦克风轨道已结束');
      });
      
      // 初始化 AI 降噪处理器
      let aiDenoiseProcessor: any = null;
      try {
        // TODO: 修复 AgoraAIDenoise 的正确使用方式
        // 暂时跳过初始化，避免类型错误
        console.log('AI Denoise available but not initialized yet');
        
        setState(prev => ({
          ...prev,
          isAIDenoiseEnabled: false,
          aiDenoiseProcessor: null
        }));
      } catch (error) {
        console.warn('Failed to initialize AI Denoise:', error);
        // 降噪初始化失败不影响通话
      }
      
      await client.publish([localAudioTrack]);

      setState(prev => ({
        ...prev,
        isJoined: true,
        isConnecting: false,
        localAudioTrack
      }));

      console.log('Successfully joined channel:', config.channel);
    } catch (error) {
      console.error('Failed to join channel:', error);
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        name: error instanceof Error ? error.name : 'Unknown',
        config: {
          appId: config.appId,
          channel: config.channel,
          hasToken: !!config.token,
          uid: config.uid
        }
      });
      setState(prev => ({ 
        ...prev, 
        isConnecting: false 
      }));
      throw error;
    }
  }, []);

  // 离开房间
  const leave = useCallback(async () => {
    if (!clientRef.current) return;

    try {
      const client = clientRef.current;

      // 停止并关闭本地音频轨道
      if (state.localAudioTrack) {
        state.localAudioTrack.stop();
        state.localAudioTrack.close();
      }

      // 离开频道
      await client.leave();

      setState({
        isJoined: false,
        isConnecting: false,
        isMuted: false,
        connectionState: 'DISCONNECTED',
        remoteUsers: [],
        localAudioTrack: null,
        isAIDenoiseEnabled: false,
        aiDenoiseProcessor: null,
      });

      console.log('Successfully left channel');
    } catch (error) {
      console.error('Failed to leave channel:', error);
      throw error;
    }
  }, [state.localAudioTrack]);

  // 切换静音状态
  const toggleMute = useCallback(async () => {
    if (!state.localAudioTrack) return;

    try {
      await state.localAudioTrack.setMuted(!state.isMuted);
      setState(prev => ({
        ...prev,
        isMuted: !prev.isMuted
      }));
      console.log('Mute toggled:', !state.isMuted);
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      throw error;
    }
  }, [state.localAudioTrack, state.isMuted]);

  // 切换 AI 降噪
  const toggleAIDenoise = useCallback(async () => {
    if (!state.localAudioTrack || !state.aiDenoiseProcessor) {
      console.warn('AI Denoise not available');
      return;
    }

    try {
      if (state.isAIDenoiseEnabled) {
        // 禁用降噪
        await state.localAudioTrack.unpipe();
        setState(prev => ({
          ...prev,
          isAIDenoiseEnabled: false
        }));
        console.log('AI Denoise disabled');
      } else {
        // 启用降噪
        await state.localAudioTrack.pipe(state.aiDenoiseProcessor).pipe(state.localAudioTrack.processorDestination);
        setState(prev => ({
          ...prev,
          isAIDenoiseEnabled: true
        }));
        console.log('AI Denoise enabled');
      }
    } catch (error) {
      console.error('Failed to toggle AI Denoise:', error);
      throw error;
    }
  }, [state.localAudioTrack, state.aiDenoiseProcessor, state.isAIDenoiseEnabled]);

  // 销毁客户端
  const destroy = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.removeAllListeners();
      clientRef.current = null;
    }
  }, []);

  return {
    state,
    actions: {
      join,
      leave,
      toggleMute,
      toggleAIDenoise,
      destroy
    },
    rtcClient: clientRef.current
  };
};

export default useAgoraClient; 