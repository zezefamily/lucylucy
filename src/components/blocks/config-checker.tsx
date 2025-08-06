'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ConfigItem {
  name: string;
  value: string | undefined;
  required: boolean;
  description: string;
}

export function ConfigChecker() {
  const [isChecking, setIsChecking] = useState(false);

  const configs: ConfigItem[] = [
    {
      name: 'NEXT_PUBLIC_AGORA_APP_ID',
      value: process.env.NEXT_PUBLIC_AGORA_APP_ID,
      required: true,
      description: '声网应用 ID'
    },
    {
      name: 'NEXT_PUBLIC_AGORA_DEFAULT_CHANNEL',
      value: process.env.NEXT_PUBLIC_AGORA_DEFAULT_CHANNEL,
      required: false,
      description: '默认频道名称'
    },
    {
      name: 'AGORA_AI_PROJECT_ID',
      value: process.env.AGORA_AI_PROJECT_ID,
      required: true,
      description: '声网 AI 项目 ID'
    },
    {
      name: 'AGORA_AI_BASIC_AUTH',
      value: process.env.AGORA_AI_BASIC_AUTH,
      required: true,
      description: '声网 AI 认证信息'
    },
    {
      name: 'OPENAI_API_KEY',
      value: process.env.OPENAI_API_KEY,
      required: true,
      description: 'OpenAI API 密钥'
    },
    {
      name: 'MINIMAX_GROUP_ID',
      value: process.env.MINIMAX_GROUP_ID,
      required: true,
      description: 'Minimax 组 ID'
    },
    {
      name: 'MINIMAX_KEY',
      value: process.env.MINIMAX_KEY,
      required: true,
      description: 'Minimax JWT 密钥'
    }
  ];

  const getConfigStatus = (config: ConfigItem) => {
    if (!config.value || config.value === '') {
      return config.required ? 'error' : 'warning';
    }
    if (config.value === 'your_agora_app_id_here' || config.value.includes('your_')) {
      return 'error';
    }
    return 'success';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return '已配置';
      case 'warning':
        return '可选';
      case 'error':
        return '缺失';
      default:
        return '未知';
    }
  };

  const testConnection = async () => {
    setIsChecking(true);
    // 模拟连接测试
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsChecking(false);
  };

  const hasErrors = configs.some(config => 
    config.required && getConfigStatus(config) === 'error'
  );

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          配置检查
          <Button
            variant="outline"
            size="sm"
            onClick={testConnection}
            disabled={isChecking}
          >
            {isChecking ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isChecking ? '检查中...' : '重新检查'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {configs.map((config) => {
          const status = getConfigStatus(config);
          return (
            <div key={config.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-gray-200 px-2 py-1 rounded">
                    {config.name}
                  </code>
                  <Badge variant={config.required ? 'destructive' : 'secondary'} className="text-xs">
                    {config.required ? '必需' : '可选'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                {config.value && (
                  <p className="text-xs text-gray-500 mt-1 font-mono truncate">
                    值: {config.value.substring(0, 20)}...
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(status)}
                <span className="text-sm">{getStatusText(status)}</span>
              </div>
            </div>
          );
        })}
        
        <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">配置状态总结</h3>
          {hasErrors ? (
            <p className="text-sm text-red-700">
              ❌ 发现配置问题，请检查标记为"缺失"的必需环境变量
            </p>
          ) : (
            <p className="text-sm text-green-700">
              ✅ 所有必需的配置项都已设置
            </p>
          )}
        </div>

        {hasErrors && (
          <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <h3 className="font-medium text-yellow-900 mb-2">解决方案</h3>
            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
              <li>检查项目根目录的 <code>.env.development</code> 文件</li>
              <li>确保所有必需的环境变量都已正确设置</li>
              <li>重启开发服务器使环境变量生效</li>
              <li>参考 <code>VOICE_CALL_SETUP.md</code> 文件获取详细配置说明</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 