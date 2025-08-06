# Lucy 语音通话功能配置指南

## 🚀 快速开始

### 1. 获取声网 App ID

1. 访问 [声网控制台](https://console.agora.io/)
2. 注册并登录账户
3. 创建新项目
4. 获取 App ID

### 2. 配置环境变量

在项目根目录创建 `.env.development` 文件（如果不存在），添加以下配置：

```bash
# Agora RTC Configuration
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id_here
NEXT_PUBLIC_AGORA_APP_CERTIFICATE=your_agora_app_certificate_here
NEXT_PUBLIC_AGORA_DEFAULT_CHANNEL=lucy-voice-call

# Agora AI Agent Configuration (用于对话式 AI)
AGORA_AI_PROJECT_ID=your_agora_ai_project_id_here
AGORA_AI_BASIC_AUTH=your_base64_encoded_basic_auth_here

# OpenAI Configuration (AI 对话需要)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai-next.com/v1/chat/completions

# Minimax TTS Configuration (语音合成需要)
MINIMAX_GROUP_ID=your_minimax_group_id_here
MINIMAX_KEY=your_minimax_jwt_key_here
```

#### 环境变量说明：

- `AGORA_AI_PROJECT_ID`: 声网对话式 AI 项目 ID
- `AGORA_AI_BASIC_AUTH`: Basic Auth 认证字符串，格式为 base64(username:password)
- `OPENAI_API_KEY`: OpenAI API 密钥，用于 AI 对话
- `OPENAI_BASE_URL`: OpenAI API 基础 URL，可自定义
- `MINIMAX_GROUP_ID`: Minimax 语音合成服务的组 ID  
- `MINIMAX_KEY`: Minimax 语音合成服务的 JWT 密钥

### 3. 启动开发服务器

```bash
pnpm dev
```

### 4. 访问语音通话页面

打开浏览器访问：`http://localhost:3000/call-lucy`

## 🎙️ 功能特性

- ✅ 实时语音通话（用户 ↔ AI 对话）
- ✅ 智能静音控制
- ✅ 连接状态监控
- ✅ 双重连接管理（用户 RTC + AI 代理）
- ✅ 流畅动画效果
- ✅ 响应式设计
- ✅ 异步连接处理
- ✅ 错误恢复机制

## 🔧 技术栈

- **声网 Agora RTC SDK**: 实时音视频通信
- **React Hooks**: 状态管理
- **Framer Motion**: 动画效果
- **Tailwind CSS**: 样式设计
- **Shadcn UI**: UI 组件库

## 📱 使用说明

1. **麦克风权限**: 首次使用需要授权浏览器麦克风权限
2. **网络环境**: 建议在稳定的网络环境下使用
3. **浏览器支持**: 支持现代浏览器（Chrome、Firefox、Safari、Edge）
4. **环境要求**: 建议在安静环境中进行通话

### 🔄 通话流程

1. **点击 "Call Lucy"**:
   - 显示 VoiceCallInterface 语音通话界面
   - VoiceCallInterface 自动处理用户的声网 SDK 连接
   - 同时调用 `/api/call-lucy/joinRoom` 邀请 AI 加入房间

2. **通话进行中**:
   - 用户通过 VoiceCallInterface 管理麦克风、连接状态等
   - AI 通过声网对话式 AI 代理在同一房间内响应
   - 用户和 AI 进行实时语音对话

3. **结束通话**:
   - 用户可以在主界面或 VoiceCallInterface 中结束通话
   - 自动调用 `/api/call-lucy/levelRoom` 让 AI 离开房间
   - VoiceCallInterface 处理用户的声网连接断开
   - 清理所有连接状态

## 🛠️ 常见问题

### Q: 无法加入通话
A: 请检查以下项：
- 环境变量配置是否正确
- 声网 App ID 是否有效
- 浏览器是否授权麦克风权限
- 网络连接是否正常

### Q: 无法听到声音
A: 请检查：
- 设备音量设置
- 浏览器音频权限
- 耳机或扬声器连接

### Q: 连接不稳定
A: 建议：
- 检查网络稳定性
- 尝试刷新页面重新连接
- 确认声网服务状态

## 📞 API 接口

项目包含以下 API 接口：

### `POST /api/call-lucy/joinRoom` - 加入房间

**功能**: 将 AI 代理加入到指定的 RTC 房间，开始语音对话

**请求参数**:
```json
{
  "channel": "string (必需) - RTC 频道名称",
  "uid": "string|number (必需) - 用户 UID",
  "userSystemMessage": "string (可选) - 自定义 AI 系统消息"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "AI Agent successfully joined room",
  "data": {
    "channel": "lucy-voice-call",
    "userUid": "123456",
    "agentName": "lucy_agent_1704093600000",
    "agentUid": "7284",
    "agentId": "1NT29X10YHxxxxxWJOXLYHNYB",
    "status": "RUNNING",
    "createTs": 1737111452,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### `POST /api/call-lucy/levelRoom` - 离开房间

**功能**: 让 AI 代理离开房间，断开语音连接

**请求参数**:
```json
{
  "channel": "string (必需) - RTC 频道名称",
  "uid": "string|number (必需) - 用户 UID",
  "agentId": "string (可选) - AI 代理 ID，用于停止特定代理"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "Successfully left room and AI agent disconnected",
  "data": {
    "channel": "lucy-voice-call",
    "userUid": "123456",
    "agentId": "1NT29X10YHxxxxxWJOXLYHNYB",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## 🔐 安全配置

对于生产环境，建议：

1. 使用 Token 验证
2. 配置 App Certificate
3. 限制频道访问权限
4. 启用数据加密

## 🎨 自定义配置

可以通过环境变量自定义：

- `NEXT_PUBLIC_AGORA_DEFAULT_CHANNEL`: 默认频道名称
- 其他声网相关配置

## 📊 性能优化

- 使用 React.memo 优化渲染
- Framer Motion 动画性能优化
- 音频流的智能管理
- 连接状态的实时监控

## 🎯 后续扩展

可以考虑添加：
- 视频通话功能
- 屏幕共享
- 录音功能
- 实时转录
- AI 语音识别

---

如有问题，请查看 [声网官方文档](https://docs.agora.io/) 或联系技术支持。 