'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { IAgoraRTCClient } from 'agora-rtc-sdk-ng'
import type { RTMClient } from 'agora-rtm'
import { ConversationalAIAPI } from '@/conversational-ai-api'
import type { 
  ISubtitleHelperItem, 
  IUserTranscription, 
  IAgentTranscription,
  EConversationalAIAPIEvents 
} from '@/conversational-ai-api/type'
import { ETurnStatus, ESubtitleHelperMode } from '@/conversational-ai-api/type'

interface SubtitleMessage {
  id: string
  type: 'user' | 'agent'
  text: string
  timestamp: number
  isComplete: boolean
  turnId: number
}

interface UseRealTimeSubtitleOptions {
  rtcEngine?: IAgoraRTCClient
  rtmEngine?: RTMClient
  channelName?: string
  maxMessages?: number
  enableLog?: boolean
}

interface UseRealTimeSubtitleReturn {
  messages: SubtitleMessage[]
  isConnected: boolean
  isInitialized: boolean
  error: string | null
  initialize: (options: Required<Pick<UseRealTimeSubtitleOptions, 'rtcEngine' | 'rtmEngine' | 'channelName'>>) => Promise<void>
  startListening: () => Promise<void>
  stopListening: () => Promise<void>
  clearMessages: () => void
  destroy: () => void
}

export function useRealTimeSubtitle(options: UseRealTimeSubtitleOptions = {}): UseRealTimeSubtitleReturn {
  const [messages, setMessages] = useState<SubtitleMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const apiRef = useRef<ConversationalAIAPI | null>(null)
  const channelNameRef = useRef<string>('')
  const maxMessagesRef = useRef(options.maxMessages || 50)

  // 处理字幕更新的回调函数
  const handleTranscriptionUpdate = useCallback((
    transcriptions: ISubtitleHelperItem<Partial<IUserTranscription | IAgentTranscription>>[]
  ) => {
    const newMessages: SubtitleMessage[] = transcriptions.map((item) => ({
      id: `${item.uid}-${item.turn_id}-${item._time}`,
      type: item.uid === 'agent' ? 'agent' : 'user',
      text: item.text || '',
      timestamp: item._time,
      isComplete: item.status === ETurnStatus.END,
      turnId: item.turn_id
    }))

    setMessages(prev => {
      // 合并新消息并限制数量
      const combined = [...prev, ...newMessages]
      return combined.slice(-maxMessagesRef.current)
    })
  }, [])

  // 初始化 API
  const initialize = useCallback(async (config: Required<Pick<UseRealTimeSubtitleOptions, 'rtcEngine' | 'rtmEngine' | 'channelName'>>) => {
    try {
      setError(null)
      
      if (apiRef.current) {
        console.warn('ConversationalAIAPI already initialized')
        return
      }

      // 初始化 API 实例
      apiRef.current = ConversationalAIAPI.init({
        rtcEngine: config.rtcEngine,
        rtmEngine: config.rtmEngine,
        renderMode: ESubtitleHelperMode.TEXT, // 使用文本模式
        enableLog: options.enableLog || false
      })

      channelNameRef.current = config.channelName
      setIsInitialized(true)

      // 注册事件监听器
      apiRef.current.on('transcription_updated' as any, handleTranscriptionUpdate)

      console.log('实时字幕初始化成功')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初始化失败'
      setError(errorMessage)
      console.error('实时字幕初始化失败:', err)
      throw err
    }
  }, [options.enableLog, handleTranscriptionUpdate])

  // 开始监听字幕
  const startListening = useCallback(async () => {
    try {
      setError(null)
      
      if (!apiRef.current || !channelNameRef.current) {
        throw new Error('请先初始化 API')
      }

      // 订阅频道消息
      await apiRef.current.subscribeMessage(channelNameRef.current)
      setIsConnected(true)
      
      console.log('开始监听实时字幕')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '开始监听失败'
      setError(errorMessage)
      console.error('开始监听实时字幕失败:', err)
      throw err
    }
  }, [])

  // 停止监听字幕
  const stopListening = useCallback(async () => {
    try {
      if (!apiRef.current || !channelNameRef.current) {
        return
      }

      // 取消订阅频道消息
      apiRef.current.unsubscribe()
      setIsConnected(false)
      
      console.log('停止监听实时字幕')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '停止监听失败'
      setError(errorMessage)
      console.error('停止监听实时字幕失败:', err)
    }
  }, [])

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // 销毁实例
  const destroy = useCallback(() => {
    if (apiRef.current) {
      // 移除事件监听器
      apiRef.current.off('transcription_updated' as any, handleTranscriptionUpdate)
      
      // 如果还在连接状态，先停止监听
      if (isConnected) {
        stopListening().catch(console.error)
      }
      
      // 销毁 API 实例
      apiRef.current.destroy()
      apiRef.current = null
    }
    
    setIsInitialized(false)
    setIsConnected(false)
    setError(null)
    setMessages([])
    
    console.log('实时字幕实例已销毁')
  }, [isConnected, stopListening, handleTranscriptionUpdate])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      destroy()
    }
  }, [destroy])

  return {
    messages,
    isConnected,
    isInitialized,
    error,
    initialize,
    startListening,
    stopListening,
    clearMessages,
    destroy
  }
} 