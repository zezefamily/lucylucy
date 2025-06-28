"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Loader2 } from "lucide-react";

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
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canScroll, setCanScroll] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isAutoScrollRef = useRef<boolean>(true);

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
    setError(null);
    setCanScroll(false);
    isAutoScrollRef.current = true;
    
    // 创建 AbortController 用于取消请求
    abortControllerRef.current = new AbortController();
    
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
                return;
              }
              
              if (data.done) {
                setIsStreaming(false);
                
                // 延迟一点时间再触发完成回调，让用户看到完整的输出
                setTimeout(() => {
                  onStreamComplete();
                }, 1500);
                return;
              }
              
              if (data.content) {
                setStreamText(prev => prev + data.content);
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
    }
  };

  // 停止流式输出
  const stopStreamingProcess = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
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
    };
  }, [isVisible, files.length]);

  // 如果不可见，不渲染
  if (!isVisible) return null;

  return (
    <Card className="border-2 border-blue-200/50 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-100/50 to-purple-100/50 border-b border-blue-200/30 pb-4">
        <CardTitle className="flex items-center justify-between text-xl">
          <div className="flex items-center">
            <div className="relative">
              <Brain className="w-6 h-6 mr-3 text-blue-600" />
              {isStreaming && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t("ai_thinking_process")}
            </span>
          </div>
          
          {/* 状态指示器 */}
          {isStreaming && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("thinking_in_progress")}</span>
            </div>
          )}
          
          {!isStreaming && streamText && !error && (
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
              className={`overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100 transition-all duration-300 ${
                streamText || isStreaming ? 'max-h-80 p-6' : 'max-h-0 p-0'
              }`}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#93c5fd #f3f4f6'
              }}
            >
              {/* 渐变背景装饰 - 只在有内容时显示 */}
              {(streamText || isStreaming) && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20 pointer-events-none"></div>
              )}
              
              <div className="relative z-10">
                {/* 思考内容显示 */}
                {(streamText || isStreaming) && (
                  <div className="space-y-2">
                    {streamText.split('\n').map((line, index) => (
                      <div key={index} className="text-sm leading-relaxed">
                        {line.trim() ? (
                          <div className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0 opacity-60"></div>
                            <span className="text-gray-700 dark:text-gray-300">{line}</span>
                          </div>
                        ) : (
                          <div className="h-3"></div>
                        )}
                      </div>
                    ))}
                    
                    {/* 流式输入指示器 */}
                    {isStreaming && (
                      <div className="flex items-center space-x-2 mt-4">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-blue-600 font-medium">
                          {locale === 'zh' ? '正在思考...' : 'Thinking...'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* 底部渐变遮罩 - 只在有内容且可滚动时显示 */}
            {(streamText || isStreaming) && canScroll && (
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"></div>
            )}
            
            {/* 滚动提示 - 只在有内容且可滚动时显示 */}
            {(streamText || isStreaming) && canScroll && !isAutoScrollRef.current && isStreaming && (
              <div className="absolute bottom-2 right-2">
                <button
                  onClick={scrollToBottom}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full shadow-lg hover:bg-blue-600 transition-colors"
                >
                  {locale === 'zh' ? '↓ 查看最新' : '↓ View Latest'}
                </button>
              </div>
            )}
            
            {/* 空状态提示 - 独立显示，不占用滚动容器空间 */}
            {!streamText && !isStreaming && !error && (
              <div className="text-center text-gray-500 py-12 px-6">
                <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
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