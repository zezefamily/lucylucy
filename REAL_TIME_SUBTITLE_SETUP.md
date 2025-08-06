# 实时字幕功能实现说明

基于声网 RTM SDK 和 conversational-ai-api 实现的实时字幕功能。

## 功能概述

实时字幕功能能够将语音实时转换为文字并显示在界面上，支持用户和 AI 的双向语音识别。

### 主要特性

- ✅ 实时语音转文字
- ✅ 支持用户和 AI 语音识别
- ✅ 实时消息显示和滚动
- ✅ 连接状态监控
- ✅ 错误处理和用户反馈
- ✅ 可配置的消息历史数量
- ✅ 时间戳显示
- ✅ 麦克风和扬声器控制

## 技术架构

### 核心组件

1. **RealTimeSubtitle 组件** (`src/components/blocks/real-time-subtitle.tsx`)
   - 实时字幕显示界面
   - 消息列表管理
   - 用户控制界面

2. **useRealTimeSubtitle Hook** (`src/hooks/use-real-time-subtitle.ts`)
   - 字幕状态管理
   - ConversationalAIAPI 集成
   - 事件处理和生命周期管理

3. **ConversationalAIAPI 集成** (`src/conversational-ai-api/`)
   - 声网 RTC/RTM 服务封装
   - 字幕数据处理
   - 事件分发机制

### 依赖关系

```
实时字幕组件
    ↓
useRealTimeSubtitle Hook
    ↓
ConversationalAIAPI
    ↓
声网 RTC/RTM SDK
```

## 安装和配置

### 1. 添加依赖

项目已包含必要的依赖：
- `agora-rtc-sdk-ng`: 声网 RTC SDK
- `agora-rtm`: 声网 RTM SDK

### 2. 环境配置

需要从声网控制台获取以下信息：
- App ID
- Token (临时或永久)
- 频道名称

## 使用方法

### 基础使用

```tsx
import { RealTimeSubtitle } from '@/components/blocks/real-time-subtitle'
import AgoraRTC from 'agora-rtc-sdk-ng'
import AgoraRTM from 'agora-rtm'

function MyComponent() {
  const [rtcClient, setRtcClient] = useState<IAgoraRTCClient>()
  const [rtmClient, setRtmClient] = useState<RTMClient>()
  
  // 初始化客户端...
  
  return (
    <RealTimeSubtitle
      rtcEngine={rtcClient}
      rtmEngine={rtmClient}
      channelName="my-channel"
      maxMessages={50}
      showTimestamp={true}
      onConnectionChange={(connected) => {
        console.log('字幕连接状态:', connected)
      }}
    />
  )
}
```

### 使用 Hook

```tsx
import { useRealTimeSubtitle } from '@/hooks/use-real-time-subtitle'

function MyComponent() {
  const {
    messages,
    isConnected,
    isInitialized,
    error,
    initialize,
    startListening,
    stopListening,
    clearMessages
  } = useRealTimeSubtitle({
    maxMessages: 50,
    enableLog: true
  })
  
  // 初始化
  useEffect(() => {
    if (rtcEngine && rtmEngine) {
      initialize({
        rtcEngine,
        rtmEngine,
        channelName: 'my-channel'
      })
    }
  }, [rtcEngine, rtmEngine])
  
  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          {message.type}: {message.text}
        </div>
      ))}
    </div>
  )
}
```

## API 参考

### RealTimeSubtitle 组件属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `className` | `string` | - | 自定义样式类名 |
| `rtcEngine` | `IAgoraRTCClient` | - | 声网 RTC 客户端实例 |
| `rtmEngine` | `RTMClient` | - | 声网 RTM 客户端实例 |
| `channelName` | `string` | - | 频道名称 |
| `maxMessages` | `number` | `50` | 最大消息显示数量 |
| `showTimestamp` | `boolean` | `true` | 是否显示时间戳 |
| `showUserControls` | `boolean` | `true` | 是否显示用户控制按钮 |
| `enableLog` | `boolean` | `false` | 是否启用调试日志 |
| `onConnectionChange` | `(connected: boolean) => void` | - | 连接状态变化回调 |
| `onMicToggle` | `(enabled: boolean) => void` | - | 麦克风状态变化回调 |
| `onSpeakerToggle` | `(enabled: boolean) => void` | - | 扬声器状态变化回调 |

### useRealTimeSubtitle Hook

#### 参数

```tsx
interface UseRealTimeSubtitleOptions {
  maxMessages?: number      // 最大消息数量
  enableLog?: boolean       // 启用日志
}
```

#### 返回值

```tsx
interface UseRealTimeSubtitleReturn {
  messages: SubtitleMessage[]           // 字幕消息列表
  isConnected: boolean                  // 是否已连接
  isInitialized: boolean               // 是否已初始化
  error: string | null                 // 错误信息
  initialize: (config) => Promise<void> // 初始化函数
  startListening: () => Promise<void>   // 开始监听
  stopListening: () => Promise<void>    // 停止监听
  clearMessages: () => void             // 清空消息
  destroy: () => void                   // 销毁实例
}
```

#### 消息对象结构

```tsx
interface SubtitleMessage {
  id: string          // 唯一标识
  type: 'user' | 'agent'  // 消息类型
  text: string        // 文字内容
  timestamp: number   // 时间戳
  isComplete: boolean // 是否完整
  turnId: number      // 对话轮次ID
}
```

## 演示页面

访问 `/real-time-subtitle` 查看完整的演示页面，包括：

1. 连接配置界面
2. 实时字幕显示
3. 音频控制
4. 状态监控
5. 使用说明

### 演示页面功能

- **配置管理**: 输入 App ID、Token、频道名称等
- **连接控制**: 连接/断开声网服务
- **音频控制**: 麦克风静音/取消静音
- **实时显示**: 语音转文字实时显示
- **状态监控**: 连接状态和错误信息显示

## 注意事项

### 1. 权限要求

- 浏览器麦克风权限
- HTTPS 环境（生产环境）

### 2. 声网配置

- 确保 App ID 有效
- Token 需要对应正确的频道和用户
- RTM 和 RTC 需要使用相同的 App ID

### 3. 网络要求

- 稳定的网络连接
- 支持 WebRTC 的浏览器

### 4. 性能优化

- 合理设置 `maxMessages` 避免内存占用过高
- 在组件卸载时正确清理资源
- 根据需要启用/禁用日志功能

## 故障排除

### 常见问题

1. **连接失败**
   - 检查 App ID 和 Token 是否正确
   - 确认网络连接状态
   - 查看浏览器控制台错误信息

2. **无字幕显示**
   - 确认麦克风权限已授予
   - 检查音频设备是否正常工作
   - 验证 conversational-ai-api 配置

3. **字幕延迟**
   - 检查网络质量
   - 确认服务器响应时间
   - 考虑调整缓冲区设置

### 调试建议

1. 启用 `enableLog` 查看详细日志
2. 使用浏览器开发者工具监控网络请求
3. 检查 conversational-ai-api 事件触发情况
4. 验证声网服务连接状态

## 扩展功能

### 可能的增强

1. **多语言支持**: 添加语言检测和切换
2. **语音识别精度**: 优化识别算法参数
3. **历史记录**: 添加字幕历史保存功能
4. **导出功能**: 支持字幕导出为文件
5. **主题定制**: 支持自定义界面主题
6. **实时翻译**: 集成翻译API

### 集成建议

1. **语音通话**: 与现有的语音通话功能结合
2. **录制功能**: 添加音频和字幕同步录制
3. **分析功能**: 语音内容分析和统计
4. **云端存储**: 字幕数据云端同步

## 更新日志

### v1.0.0 (当前版本)
- ✅ 基础实时字幕功能
- ✅ 声网 RTM 集成
- ✅ React Hook 封装
- ✅ 演示页面
- ✅ 完整文档

---

如有问题或建议，请查看项目文档或联系开发团队。 