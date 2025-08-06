# 声网 AI 降噪集成指南

## 🎯 概述

本项目已集成 `agora-conversational-ai-denoiser` 扩展，用于提供高质量的 AI 降噪功能，优化语音通话体验。

## 📦 安装

```bash
pnpm install agora-conversational-ai-denoiser
```

## 🔧 配置步骤

### 1. 下载降噪资源文件

从声网官方下载 AI 降噪的 WebAssembly 资源文件：

```bash
# 创建资源目录
mkdir -p public/agora-ai-denoise

# 下载所需的 WASM 文件和模型文件
# 这些文件通常包括:
# - ai_denoise_processor.js
# - ai_denoise_processor.wasm
# - model files (.onnx)
```

**注意**: 您需要从声网开发者控制台下载这些资源文件，或者联系声网技术支持获取。

### 2. 文件结构

确保您的 `public` 目录结构如下：

```
public/
└── agora-ai-denoise/
    ├── ai_denoise_processor.js
    ├── ai_denoise_processor.wasm
    └── models/
        └── [模型文件]
```

### 3. 环境变量配置

在 `.env.development` 文件中添加：

```bash
# AI 降噪配置
NEXT_PUBLIC_AI_DENOISE_ENABLED=true
NEXT_PUBLIC_AI_DENOISE_ASSETS_PATH=/agora-ai-denoise
```

## 🎮 功能特性

### 当前实现

- ✅ AI 降噪扩展集成
- ✅ 降噪开关按钮
- ✅ 实时降噪状态指示
- ✅ 错误处理和降级

### 降噪模式

支持两种降噪模式：
- `stationary`: 适用于稳定的背景噪音
- `nsng`: 适用于变化的背景噪音

## 📱 用户界面

在通话界面中，用户可以：

1. **查看降噪状态**: 通过波浪图标的颜色状态
   - 🟢 绿色: AI 降噪已启用
   - 🔘 灰色: AI 降噪已禁用

2. **切换降噪**: 点击波浪图标切换 AI 降噪开关

3. **状态提示**: Toast 提示显示降噪状态变化

## 🔧 技术实现

### 代码结构

```typescript
// agora-client.tsx
interface AgoraClientState {
  // ... 其他状态
  isAIDenoiseEnabled: boolean;
  aiDenoiseProcessor: any | null;
}

interface AgoraClientActions {
  // ... 其他方法
  toggleAIDenoise: () => Promise<void>;
}
```

### 初始化流程

1. 用户加入房间时创建音频轨道
2. 尝试初始化 AI 降噪处理器
3. 如果成功，自动启用降噪
4. 如果失败，降级为普通音频处理

### 运行时控制

```typescript
// 启用降噪
await localAudioTrack.pipe(aiDenoiseProcessor).pipe(localAudioTrack.processorDestination);

// 禁用降噪
await localAudioTrack.unpipe();
```

## 🐛 故障排除

### 常见问题

1. **降噪按钮显示为灰色**
   - 检查资源文件是否正确放置在 `public/agora-ai-denoise/` 目录
   - 确认网络可以访问这些资源文件

2. **初始化失败**
   ```
   Failed to initialize AI Denoise: [错误信息]
   ```
   - 检查浏览器控制台的详细错误信息
   - 确认 WASM 文件完整且未损坏
   - 检查浏览器是否支持 WebAssembly

3. **性能问题**
   - AI 降噪会消耗额外的 CPU 资源
   - 在低性能设备上可能导致音频延迟
   - 可以通过降噪按钮手动关闭

### 浏览器兼容性

- ✅ Chrome 84+
- ✅ Firefox 79+
- ✅ Safari 14+
- ✅ Edge 84+

## 📊 性能指标

- **延迟增加**: 通常 < 20ms
- **CPU 使用**: 增加 10-30%
- **内存占用**: 增加 20-50MB
- **降噪效果**: 可减少 15-30dB 背景噪音

## 🔄 未来优化

### 计划中的功能

- [ ] 动态降噪强度调节
- [ ] 不同场景的预设模式
- [ ] 实时音频质量监控
- [ ] 自适应降噪参数

### 性能优化

- [ ] 模型文件懒加载
- [ ] WebWorker 集成
- [ ] 资源缓存策略

## 📞 技术支持

如遇到问题，请：

1. 查看浏览器控制台错误信息
2. 检查网络连接和资源文件
3. 参考声网官方文档
4. 联系技术支持团队

---

**注意**: AI 降噪功能需要额外的计算资源，建议在网络条件良好且设备性能足够的情况下使用。 