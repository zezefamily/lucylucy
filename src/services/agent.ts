// 简单的 agent 服务模拟
interface AgentTokenResponse {
  data: {
    appId: string;
    token: string;
  };
  success: boolean;
}

interface AgentTokenOptions {
  expireTime?: number;
  devMode?: boolean;
}

export async function getAgentToken(
  userId: string,
  channel?: string,
  options?: AgentTokenOptions
): Promise<AgentTokenResponse> {
  try {
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    if (!appId) {
      throw new Error('Agora App ID not configured');
    }
    
    // 模拟 token 响应
    return {
      data: {
        appId: appId,
        token: ''
      },
      success: true
    };
  } catch (error) {
    console.error('Error getting agent token:', error);
    throw error;
  }
}

export async function createAgent(config: any) {
  throw new Error('createAgent not implemented');
}

export async function destroyAgent(agentId: string) {
  throw new Error('destroyAgent not implemented');
} 