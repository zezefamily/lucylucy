"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Sparkles, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { ConversationStarter, ConversationStarterResponse } from "@/types/conversation-starter";

// 打字机效果组件
const TypewriterText = ({ 
  text, 
  speed = 30, 
  onComplete 
}: { 
  text: string; 
  speed?: number; 
  onComplete?: () => void;
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setDisplayedText("");
    setIsTyping(true);
    let index = 0;

    const type = () => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
        timeoutRef.current = setTimeout(type, speed);
      } else {
        setIsTyping(false);
        onComplete?.();
      }
    };

    type();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, onComplete]);

  return (
    <span className="inline-block">
      {displayedText}
      {isTyping && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
};

export default function ConversationStarterPage() {
  const t = useTranslations("conversation_starter");
  const params = useParams();
  const locale = params.locale as string;
  
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<ConversationStarter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleStarters, setVisibleStarters] = useState<number[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // 使用 ref 来追踪当前处理的结果，避免重复执行
  const processedResultRef = useRef<ConversationStarter | null>(null);
  const streamingTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // 清除所有定时器
  const clearStreamingTimeouts = () => {
    streamingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    streamingTimeoutsRef.current = [];
  };

  // 模拟流式输出效果
  useEffect(() => {
    // 如果没有结果，或者已经处理过这个结果，或者正在流式输出，则跳过
    if (!result || processedResultRef.current === result || isStreaming) {
      return;
    }

    // 标记当前结果已处理
    processedResultRef.current = result;
    setIsStreaming(true);
    setVisibleStarters([]);

    // 清除之前的定时器
    clearStreamingTimeouts();
    
    // 逐行显示开场白
    result.starters.forEach((starter, index) => {
      const timeout = setTimeout(() => {
        setVisibleStarters(prev => [...prev, index]);
        
        // 如果是最后一行，等待打字完成后结束流式效果
        if (index === result.starters.length - 1) {
          // 计算最后一行打字完成的时间
          const textLength = starter.length;
          const typingDuration = textLength * 30; // 30ms per character
          
          const endTimeout = setTimeout(() => {
            setIsStreaming(false);
          }, typingDuration + 500); // 额外等待500ms
          streamingTimeoutsRef.current.push(endTimeout);
        }
      }, index * 1200); // 每行延迟1200ms，给打字机效果留出时间
      
      streamingTimeoutsRef.current.push(timeout);
    });

    // 清理函数
    return () => {
      clearStreamingTimeouts();
    };
  }, [result]); // 只依赖 result

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      clearStreamingTimeouts();
    };
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error(t("error"));
      return;
    }

    // 清理之前的状态和定时器
    clearStreamingTimeouts();
    setIsLoading(true);
    setResult(null);
    setVisibleStarters([]);
    setIsStreaming(false);
    processedResultRef.current = null;
    
    try {
      const response = await fetch("/api/conversation-starter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: topic.trim(), locale }),
      });

      const data = await response.json();

      if (data.success && data.starters?.length > 0) {
        setResult(data);
        toast.success("Generated successfully!");
      } else {
        toast.error(t("no_results"));
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copied"));
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy");
    }
  };

  const handleClear = () => {
    clearStreamingTimeouts();
    setResult(null);
    setVisibleStarters([]);
    setTopic("");
    setIsStreaming(false);
    processedResultRef.current = null;
  };

  const handleTryAgain = () => {
    if (topic.trim()) {
      handleGenerate();
    }
  };

  const exampleTopics = t.raw("examples.items") as string[];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          {t("title")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("description")}
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">
            {t("title")}
          </CardTitle>
          <CardDescription>
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t("placeholder")}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleGenerate()}
              className="flex-1"
            />
            <Button 
              onClick={handleGenerate} 
              disabled={isLoading || !topic.trim()}
              className="whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {t("generating")}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t("generate")}
                </>
              )}
            </Button>
          </div>

          {/* Example Topics */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("examples.title")}
            </p>
            <div className="flex flex-wrap gap-2">
              {exampleTopics.map((example, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setTopic(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>{t("generating")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Results with Streaming Effect */}
      {result && !isLoading && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">{t("result_title")}</CardTitle>
              <CardDescription>
                Topic: <span className="font-medium">{result.topic}</span>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTryAgain}
                disabled={isLoading || isStreaming}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t("try_again")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={isStreaming}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t("clear")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 显示已流式输出的开场白 */}
            {result.starters.map((starter, index) => (
              <div
                key={`starter-${index}`}
                className={`transition-opacity duration-700 ease-out ${
                  visibleStarters.includes(index)
                    ? 'opacity-100'
                    : 'opacity-0'
                }`}
              >
                {visibleStarters.includes(index) && (
                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors duration-300 group shadow-sm hover:shadow-md">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 text-sm leading-relaxed">
                      <TypewriterText 
                        text={starter} 
                        speed={30}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(starter)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            {/* 正在流式输出时显示的加载指示器 */}
            {isStreaming && visibleStarters.length < result.starters.length && (
              <div 
                key="loading-indicator" 
                className="flex items-start gap-3 p-4 rounded-lg border bg-card/50 opacity-60 animate-pulse"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {visibleStarters.length + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-muted rounded flex-1 animate-pulse"></div>
                    <div className="h-2 bg-muted rounded w-20 animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-muted rounded w-3/4 animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}