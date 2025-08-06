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
  const enableLogRef = useRef(options.enableLog || false)

  // 处理字幕更新的回调函数 - 使用 useCallback 避免重新创建
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
  }, [])  // 空依赖数组，确保函数引用稳定

  // 初始化 API
  const initialize = useCallback(async (config: Required<Pick<UseRealTimeSubtitleOptions, 'rtcEngine' | 'rtmEngine' | 'channelName'>>) => {
    try {
      setError(null)
      
      if (apiRef.current) {
        console.warn('ConversationalAIAPI already initialized, skipping...')
        return
      }

      // 初始化 API 实例
      apiRef.current = ConversationalAIAPI.init({
        rtcEngine: config.rtcEngine,
        rtmEngine: config.rtmEngine,
        renderMode: ESubtitleHelperMode.TEXT, // 使用文本模式
        enableLog: enableLogRef.current
      })
      
      // 确保单例实例正确设置
      if (!apiRef.current) {
        throw new Error('Failed to get ConversationalAIAPI instance')
      }

      channelNameRef.current = config.channelName
      setIsInitialized(true)

      // 注册事件监听器
      apiRef.current.on('transcription_updated' as any, handleTranscriptionUpdate)

      if (enableLogRef.current) {
        console.log('实时字幕初始化成功')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初始化失败'
      setError(errorMessage)
      console.error('实时字幕初始化失败:', err)
      throw err
    }
  }, [handleTranscriptionUpdate])  // 移除 options.enableLog 依赖

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
      
      if (enableLogRef.current) {
        console.log('开始监听实时字幕')
      }
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
      
      if (enableLogRef.current) {
        console.log('停止监听实时字幕')
      }
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

  // 销毁实例 - 移除不必要的依赖项避免重复调用
  const destroy = useCallback(() => {
    if (apiRef.current) {
      // 移除所有事件监听器
      try {
        apiRef.current.removeAllEventListeners()
      } catch (error) {
        console.warn('移除事件监听器时出错:', error)
      }
      
      // 停止监听
      try {
        apiRef.current.unsubscribe()
      } catch (error) {
        console.warn('停止监听时出错:', error)
      }
      
      // 注意：不要销毁全局单例，只清理本地引用
      // apiRef.current.destroy()
      apiRef.current = null
    }
    
    setIsInitialized(false)
    setIsConnected(false)
    setError(null)
    setMessages([])
    
    if (enableLogRef.current) {
      console.log('实时字幕实例已清理')
    }
  }, [])  // 移除所有依赖项，直接在函数内部使用最新的引用

  // 组件卸载时清理 - 使用空依赖数组避免重复调用
  useEffect(() => {
    return () => {
      // 在组件真正卸载时清理
      if (apiRef.current) {
        try {
          apiRef.current.removeAllEventListeners()
        } catch (error) {
          console.warn('组件卸载清理事件监听器时出错:', error)
        }
        apiRef.current = null
      }
      if (enableLogRef.current) {
        console.log('实时字幕组件卸载清理')
      }
    }
  }, [])  // 空依赖数组，只在组件卸载时执行

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