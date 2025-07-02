"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Loader2, Heart } from "lucide-react";

interface AnalysisThinkingProcessStreamProps {
  files: File[];
  locale: string;
  onStreamComplete: () => void;
  isVisible: boolean;
}

export default function AnalysisThinkingProcessStream({ 
  files, 
  locale, 
  onStreamComplete, 
  isVisible 
}: AnalysisThinkingProcessStreamProps) {
  const t = useTranslations("profile_analyzer");
  const [streamText, setStreamText] = useState<string>("");
  const [bufferedText, setBufferedText] = useState<string>(""); // 缓冲区：存储从服务器接收的完整内容
  const [displayIndex, setDisplayIndex] = useState<number>(0); // 当前显示到的字符位置
  const [isStreaming, setIsStreaming] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false); // 是否正在从缓冲区输出
  const [error, setError] = useState<string | null>(null);
  const [canScroll, setCanScroll] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isAutoScrollRef = useRef<boolean>(true);
  const displayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isStreamingRef = useRef<boolean>(false);
  const bufferedTextRef = useRef<string>("");
  
  // 同步 ref 与 state
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);
  
  useEffect(() => {
    bufferedTextRef.current = bufferedText;
  }, [bufferedText]);
  
  // 控制显示速度的配置
  const DISPLAY_SPEED = 15; // 毫秒/字符，可调整显示速度

  // 从缓冲区逐字符显示内容
  const startDisplayTimer = () => {
    if (displayTimerRef.current) {
      clearInterval(displayTimerRef.current);
    }
    
    setIsBuffering(true);
    console.log('开始显示定时器');
    
    displayTimerRef.current = setInterval(() => {
      setDisplayIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        const currentBufferedLength = bufferedTextRef.current.length;
        const currentIsStreaming = isStreamingRef.current;
        
        // 添加调试日志
        if (nextIndex % 50 === 0) { // 每50个字符打印一次日志
          console.log('显示进度:', {
            nextIndex,
            currentBufferedLength,
            currentIsStreaming,
            progress: `${nextIndex}/${currentBufferedLength}`
          });
        }
        
        // 检查是否已经显示完当前缓冲区的所有内容
        if (nextIndex >= currentBufferedLength) {
          // 如果缓冲区是空的，等待内容
          if (currentBufferedLength === 0) {
            return prevIndex; // 等待第一批内容
          }
          
          // 如果服务器还在传输，就等待更多内容
          if (currentIsStreaming) {
            // console.log('等待更多内容...', { nextIndex, currentBufferedLength });
            return prevIndex; // 保持当前位置，等待更多内容
          } else {
            // 服务器传输完成且显示也完成，触发完成回调
            console.log('显示完成，准备触发完成回调', { nextIndex, currentBufferedLength });
            if (displayTimerRef.current) {
              clearInterval(displayTimerRef.current);
              displayTimerRef.current = null;
            }
            setIsBuffering(false);
            
            setTimeout(() => {
              console.log('触发完成回调');
              onStreamComplete();
            }, 1000);
            
            return nextIndex;
          }
        }
        
        return nextIndex;
      });
    }, DISPLAY_SPEED);
  };

  // 停止显示定时器
  const stopDisplayTimer = () => {
    if (displayTimerRef.current) {
      clearInterval(displayTimerRef.current);
      displayTimerRef.current = null;
    }
    setIsBuffering(false);
  };

  // 更新显示文本
  useEffect(() => {
    if (bufferedText && displayIndex <= bufferedText.length) {
      setStreamText(bufferedText.substring(0, displayIndex));
    }
  }, [bufferedText, displayIndex]);

  // 自动滚动到底部
  const scrollToBottom = () => {
    if (contentRef.current && isAutoScrollRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  };

  // 检查用户是否在底部附近，同时检查是否可滚动
  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      const needsScroll = scrollHeight > clientHeight;
      
      isAutoScrollRef.current = isNearBottom;
      setCanScroll(needsScroll);
    }
  };

  // 当有新内容时自动滚动并检查是否需要滚动
  useEffect(() => {
    scrollToBottom();
    
    // 延迟检查滚动状态，确保DOM已更新
    const timer = setTimeout(() => {
      if (contentRef.current) {
        const { scrollHeight, clientHeight } = contentRef.current;
        setCanScroll(scrollHeight > clientHeight);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [streamText]);

  // 开始流式分析思考过程
  const startStreamingProcess = async () => {
    if (files.length === 0) return;
    
    setIsStreaming(true);
    setStreamText("");
    setBufferedText("");
    setDisplayIndex(0);
    setError(null);
    setCanScroll(false);
    isAutoScrollRef.current = true;
    
    // 停止之前的显示定时器
    stopDisplayTimer();
    
    // 创建 AbortController 用于取消请求
    abortControllerRef.current = new AbortController();
    
    // 开始显示定时器，边接收边显示
    startDisplayTimer();
    
    try {
      // 创建FormData对象
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      formData.append('fileCount', files.length.toString());
      formData.append('locale', locale);
      
      // 发起流式请求
      const response = await fetch('/api/analyze-thinking', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No reader available');
      }
      
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                setError(data.error);
                setIsStreaming(false);
                stopDisplayTimer();
                return;
              }
              
              if (data.done) {
                console.log('服务器流式传输完成');
                setIsStreaming(false);
                // 服务器流式传输完成，显示定时器会自动处理剩余内容
                return;
              }
              
              if (data.content) {
                // 将内容添加到缓冲区，显示定时器会自动跟上
                setBufferedText(prev => {
                  const newText = prev + data.content;
                  if (newText.length % 100 === 0) { // 每100个字符打印一次
                    console.log('缓冲区更新:', { 
                      length: newText.length, 
                      newContent: data.content.length 
                    });
                  }
                  return newText;
                });
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Streaming process request was aborted');
        return;
      }
      
      console.error('思考过程流式请求错误:', error);
      setError(
        locale === 'zh' 
          ? "思考过程分析失败，请重试" 
          : "Thinking process analysis failed, please try again"
      );
      setIsStreaming(false);
      stopDisplayTimer();
    }
  };

  // 停止流式输出
  const stopStreamingProcess = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    stopDisplayTimer();
  };

  // 当组件可见时开始思考过程
  useEffect(() => {
    if (isVisible && files.length > 0) {
      startStreamingProcess();
    }
    
    // 清理函数
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      stopDisplayTimer();
    };
  }, [isVisible, files.length]);

  // 如果不可见，不渲染
  if (!isVisible) return null;

  return (
    <Card className="pt-0 pb-6 border-1 border-primary/20 bg-gradient-to-br from-primary/5 via-white to-secondary/5 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-primary/20 flex items-center h-16 rounded-t-2xl">
        <CardTitle className="pt-6 flex items-center justify-between text-xl w-full min-h-[2.5rem]">
          <div className="flex items-center">
            {/* 爱心图标 */}
            <span className={`mr-2 text-primary transition-all duration-1000 ${
              (isStreaming || isBuffering) ? 'animate-pulse' : ''
            }`}>
              <Heart className="w-5 h-5" />
            </span>
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t("ai_thinking_process")}
            </span>
          </div>
          
          {/* 状态指示器 */}
          {(isStreaming || isBuffering) && (
            <div className="flex items-center space-x-2 text-sm text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {isStreaming 
                  ? t("thinking_in_progress") 
                  : (locale === 'zh' ? '正在输出思考过程...' : 'Outputting thinking process...')
                }
              </span>
            </div>
          )}
          
          {!isStreaming && !isBuffering && streamText && !error && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>{t("thinking_complete")}</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {error ? (
          <div className="text-red-600 text-center py-8 px-6">
            <div className="text-lg font-medium mb-2">{t("thinking_error")}</div>
            <div className="text-sm">{error}</div>
          </div>
        ) : (
          <div className="relative">
            {/* 动态高度的滚动容器 - 最大高度限制，内容为空时高度为0 */}
            <div 
              ref={contentRef}
              onScroll={handleScroll}
              className={`overflow-y-auto scrollbar-thin scrollbar-thumb-primary/60 scrollbar-track-gray-100 transition-all duration-300 ${
                streamText || isStreaming || isBuffering ? 'max-h-60 p-6' : 'max-h-0 p-0'
              }`}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'hsl(var(--primary)) #f3f4f6'
              }}
            >
              {/* 渐变背景装饰 - 只在有内容时显示 */}
              {(streamText || isStreaming || isBuffering) && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none"></div>
              )}
              
              <div className="relative z-10">
                {/* 思考内容显示 */}
                {(streamText || isStreaming || isBuffering) && (
                  <div className="space-y-2">
                    {streamText.split('\n').map((line, index) => (
                      <div key={index} className="text-sm leading-relaxed">
                        {line.trim() ? (
                          <div className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0 opacity-60"></div>
                            <span className="text-primary dark:text-primary">{line}</span>
                          </div>
                        ) : (
                          <div className="h-3"></div>
                        )}
                      </div>
                    ))}
                    
                    {/* 流式输入指示器 */}
                    {(isStreaming || isBuffering) && (
                      <div className="flex items-center space-x-2 mt-4">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        {/* <span className="text-xs text-primary font-medium">
                          {isStreaming 
                            ? (locale === 'zh' ? '...' : '...') 
                            : (locale === 'zh' ? '...' : '...')
                          }
                        </span> */}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* 底部渐变遮罩 - 只在有内容且可滚动时显示 */}
            {(streamText || isStreaming || isBuffering) && canScroll && (
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"></div>
            )}
            
            {/* 滚动提示 - 只在有内容且可滚动时显示 */}
            {(streamText || isStreaming || isBuffering) && canScroll && !isAutoScrollRef.current && isStreaming && (
              <div className="absolute bottom-2 right-2">
                <button
                  onClick={scrollToBottom}
                  className="px-3 py-1 bg-primary text-white text-xs rounded-full shadow-lg hover:bg-primary/80 transition-colors"
                >
                  {locale === 'zh' ? '↓ 查看最新' : '↓ View Latest'}
                </button>
              </div>
            )}
            
            {/* 空状态提示 - 独立显示，不占用滚动容器空间 */}
            {!streamText && !isStreaming && !isBuffering && !error && (
              <div className="text-center text-muted-foreground py-12 px-6">
                <Brain className="w-12 h-12 mx-auto mb-4 text-primary/30" />
                <p className="text-sm">
                  {locale === 'zh' ? '等待开始分析思考过程...' : 'Waiting to start analysis thinking process...'}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 