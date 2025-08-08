'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Volume2, VolumeX, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRealTimeSubtitle } from '@/hooks/use-real-time-subtitle'
import type { IAgoraRTCClient } from 'agora-rtc-sdk-ng'
import type { RTMClient } from 'agora-rtm'

interface RealTimeSubtitleProps {
  className?: string
  rtcEngine?: IAgoraRTCClient
  rtmEngine?: RTMClient
  channelName?: string
  maxMessages?: number
  showTimestamp?: boolean
  showUserControls?: boolean
  enableLog?: boolean
  onMicToggle?: (enabled: boolean) => void
  onSpeakerToggle?: (enabled: boolean) => void
  onConnectionChange?: (connected: boolean) => void
}

export function RealTimeSubtitle({
  className,
  rtcEngine,
  rtmEngine,
  channelName,
  maxMessages = 50,
  showTimestamp = true,
  showUserControls = true,
  enableLog = false,
  onMicToggle,
  onSpeakerToggle,
  onConnectionChange
}: RealTimeSubtitleProps) {
  const [micEnabled, setMicEnabled] = useState(true)
  const [speakerEnabled, setSpeakerEnabled] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 使用实时字幕 hook
  const {
    messages,
    isConnected,
    isInitialized,
    error,
    initialize,
    startListening,
    stopListening,
    clearMessages: clearSubtitleMessages
  } = useRealTimeSubtitle({
    maxMessages,
    enableLog
  })

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 监听连接状态变化 - 使用 ref 避免频繁触发
  const prevConnectionStateRef = useRef(isConnected)
  useEffect(() => {
    if (prevConnectionStateRef.current !== isConnected) {
      prevConnectionStateRef.current = isConnected
      onConnectionChange?.(isConnected)
    }
  }, [isConnected, onConnectionChange])

  // 初始化实时字幕 - 使用 ref 来避免重复初始化
  const initializationKeyRef = useRef<string>('')
  useEffect(() => {
    if (rtcEngine && rtmEngine && channelName && !isInitialized) {
      const currentKey = `${rtcEngine.constructor.name}-${channelName}`
      if (initializationKeyRef.current !== currentKey) {
        initializationKeyRef.current = currentKey
        initialize({
          rtcEngine,
          rtmEngine,
          channelName
        }).catch(console.error)
      }
    }
  }, [rtcEngine, rtmEngine, channelName, isInitialized, initialize])

  // 自动开始监听
  useEffect(() => {
    if (isInitialized && !isConnected && !error) {
      startListening().catch(console.error)
    }
  }, [isInitialized, isConnected, error, startListening])

  // 麦克风控制
  const handleMicToggle = () => {
    const newState = !micEnabled
    setMicEnabled(newState)
    onMicToggle?.(newState)
  }

  // 扬声器控制
  const handleSpeakerToggle = () => {
    const newState = !speakerEnabled
    setSpeakerEnabled(newState)
    onSpeakerToggle?.(newState)
  }

  // 清空消息
  const clearMessages = () => {
    clearSubtitleMessages()
  }

  // 格式化时间戳
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <Card className={cn('flex flex-col h-96 w-full', className)}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">实时字幕</h3>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? '已连接' : '未连接'}
          </Badge>
        </div>
        
        {showUserControls && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMicToggle}
              className={cn(
                'h-8 w-8 p-0',
                !micEnabled && 'text-red-500'
              )}
            >
              {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSpeakerToggle}
              className={cn(
                'h-8 w-8 p-0',
                !speakerEnabled && 'text-red-500'
              )}
            >
              {speakerEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="text-xs"
            >
              清空
            </Button>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-y border-destructive/20">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {!isInitialized ? '正在初始化...' : !isConnected ? '正在连接...' : '等待对话开始...'}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex flex-col space-y-1',
                message.type === 'user' ? 'items-end' : 'items-start'
              )}
            >
              {/* 消息气泡 */}
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm',
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white border text-gray-800',
                  !message.isComplete && 'opacity-70 animate-pulse'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      'text-xs',
                      message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {message.type === 'user' ? '用户' : 'AI'}
                  </Badge>
                  {!message.isComplete && (
                    <span className="text-xs opacity-75">正在输入...</span>
                  )}
                </div>
                <p className="leading-relaxed">{message.text}</p>
              </div>

              {/* 时间戳 */}
              {showTimestamp && (
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(message.timestamp)}
                </span>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 状态栏 */}
      <div className="px-4 py-2 border-t bg-muted/50">
        <div className="text-xs text-muted-foreground text-center">
          {messages.length > 0 && `共 ${messages.length} 条消息`}
          {messages.length === maxMessages && ' (已达到最大显示数量)'}
        </div>
      </div>
    </Card>
  )
}

// 导出类型供外部使用
export type { RealTimeSubtitleProps } 