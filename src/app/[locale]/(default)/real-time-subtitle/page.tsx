'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RealTimeSubtitle } from '@/components/blocks/real-time-subtitle'
import { Settings, Play, Square, Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import AgoraRTC, { type IAgoraRTCClient } from 'agora-rtc-sdk-ng'
import AgoraRTM, { type RTMClient } from 'agora-rtm'
import { toast } from 'sonner'

interface ConnectionConfig {
  appId: string
  token: string
  channelName: string
  userId: string
}

export default function RealTimeSubtitleDemo() {
  const [config, setConfig] = useState<ConnectionConfig>({
    appId: '',
    token: '',
    channelName: 'test-channel',
    userId: 'user-' + Math.random().toString(36).substr(2, 9)
  })
  
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [micEnabled, setMicEnabled] = useState(true)
  const [rtcClient, setRtcClient] = useState<IAgoraRTCClient | null>(null)
  const [rtmClient, setRtmClient] = useState<RTMClient | null>(null)
  const [subtitleConnected, setSubtitleConnected] = useState(false)

  // 连接到声网服务
  const handleConnect = async () => {
    if (!config.appId || !config.token || !config.channelName) {
      toast.error('请填写完整的连接配置')
      return
    }

    setIsConnecting(true)
    try {
      // 初始化 RTC 客户端
      const newRtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      await newRtcClient.join(config.appId, config.channelName, config.token, config.userId)
      
      // 创建并发布音频轨道
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
      await newRtcClient.publish([audioTrack])
      
      setRtcClient(newRtcClient)

      // 初始化 RTM 客户端
      const newRtmClient = new AgoraRTM.RTM(config.appId, config.userId)
      await newRtmClient.login({ token: config.token })
      await newRtmClient.subscribe(config.channelName)
      
      setRtmClient(newRtmClient)
      setIsConnected(true)
      
      toast.success('连接成功！')
    } catch (error) {
      console.error('连接失败:', error)
      toast.error('连接失败: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setIsConnecting(false)
    }
  }

  // 断开连接
  const handleDisconnect = async () => {
    try {
      if (rtcClient) {
        await rtcClient.leave()
        setRtcClient(null)
      }
      
      if (rtmClient) {
        await rtmClient.logout()
        setRtmClient(null)
      }
      
      setIsConnected(false)
      setSubtitleConnected(false)
      toast.success('已断开连接')
    } catch (error) {
      console.error('断开连接失败:', error)
      toast.error('断开连接失败')
    }
  }

  // 切换麦克风状态
  const toggleMic = async (enabled: boolean) => {
    try {
      if (rtcClient) {
        const audioTracks = rtcClient.localTracks.filter(track => track.trackMediaType === 'audio')
        if (audioTracks.length > 0) {
          await audioTracks[0].setEnabled(enabled)
          setMicEnabled(enabled)
        }
      }
    } catch (error) {
      console.error('切换麦克风状态失败:', error)
      toast.error('切换麦克风状态失败')
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">实时字幕演示</h1>
        <p className="text-muted-foreground mt-2">
          基于声网 RTM 和 conversational-ai-api 的实时字幕功能演示
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 配置面板 */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Settings className="h-5 w-5" />
            <div>
              <CardTitle>连接配置</CardTitle>
              <CardDescription>配置声网 RTC 和 RTM 连接参数</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appId">App ID</Label>
              <Input
                id="appId"
                value={config.appId}
                onChange={(e) => setConfig(prev => ({ ...prev, appId: e.target.value }))}
                placeholder="请输入声网 App ID"
                disabled={isConnected}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Input
                id="token"
                value={config.token}
                onChange={(e) => setConfig(prev => ({ ...prev, token: e.target.value }))}
                placeholder="请输入 Token"
                disabled={isConnected}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="channelName">频道名称</Label>
              <Input
                id="channelName"
                value={config.channelName}
                onChange={(e) => setConfig(prev => ({ ...prev, channelName: e.target.value }))}
                placeholder="请输入频道名称"
                disabled={isConnected}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userId">用户 ID</Label>
              <Input
                id="userId"
                value={config.userId}
                onChange={(e) => setConfig(prev => ({ ...prev, userId: e.target.value }))}
                placeholder="请输入用户 ID"
                disabled={isConnected}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? 'default' : 'secondary'}>
                  {isConnected ? '已连接' : '未连接'}
                </Badge>
                {subtitleConnected && (
                  <Badge variant="default">字幕已启用</Badge>
                )}
              </div>
              
              {!isConnected ? (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {isConnecting ? '连接中...' : '连接'}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleMic(!micEnabled)}
                    className={cn(
                      'flex items-center gap-2',
                      !micEnabled && 'text-red-500'
                    )}
                  >
                    {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    {micEnabled ? '静音' : '取消静音'}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    className="flex items-center gap-2"
                  >
                    <Square className="h-4 w-4" />
                    断开
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 实时字幕面板 */}
        <Card>
          <CardHeader>
            <CardTitle>实时字幕</CardTitle>
            <CardDescription>显示实时语音转文字结果</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <RealTimeSubtitle
              className="border-0 shadow-none"
              rtcEngine={rtcClient || undefined}
              rtmEngine={rtmClient || undefined}
              channelName={config.channelName}
              maxMessages={20}
              showTimestamp={true}
              showUserControls={false}
              enableLog={true}
              onConnectionChange={setSubtitleConnected}
            />
          </CardContent>
        </Card>
      </div>

      {/* 使用说明 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">步骤 1: 配置连接</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 输入声网 App ID</li>
                <li>• 输入有效的 Token</li>
                <li>• 设置频道名称</li>
                <li>• 配置用户 ID（可选）</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">步骤 2: 开始演示</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 点击"连接"按钮</li>
                <li>• 等待连接成功</li>
                <li>• 开始说话查看实时字幕</li>
                <li>• 可以切换麦克风状态</li>
              </ul>
            </div>
          </div>
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>注意：</strong>此演示需要有效的声网 App ID 和 Token。
              请确保您的浏览器已授权麦克风权限。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 