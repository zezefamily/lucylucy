import { NextRequest, NextResponse } from 'next/server';

// 获取环境变量配置
function getAgoraConfig() {
  const projectId = process.env.AGORA_AI_PROJECT_ID || "1e1a08c756194660b8fb64e0ba85caa5";
  const basicAuth = process.env.AGORA_AI_BASIC_AUTH || "ZWRmNGM0MDE0MThiNDdmM2ExOTI4Yzg1YWNmNjA5OTQ6NTg5MTQ2OTgyMTgwNDdiNDliOTQ5ZDZhMTI4ZGE4ZmY=" ; // Basic Auth 格式: base64(username:password)
  
  if (!projectId) {
    throw new Error('AGORA_AI_PROJECT_ID is required');
  }
  if (!basicAuth) {
    throw new Error('AGORA_AI_BASIC_AUTH is required');
  }

  return {
    projectId,
    basicAuth
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel, uid, agentId } = body;

    // 验证必需参数
    if (!channel) {
      return NextResponse.json(
        { success: false, error: 'Channel is required' },
        { status: 400 }
      );
    }

    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'UID is required' },
        { status: 400 }
      );
    }

    // 获取配置
    const config = getAgoraConfig();

    // 如果提供了 agentId，尝试让 AI 代理离开房间
    if (agentId) {
      try {
        const agoraApiUrl = `https://api.agora.io/cn/api/conversational-ai-agent/v2/projects/${config.projectId}/agents/${agentId}/leave`;
        
        const response = await fetch(agoraApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${config.basicAuth}`,
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const agoraResponse = await response.json();
          console.log('AI Agent left room successfully:', {
            agentId,
            channel,
            userUid: uid,
            timestamp: new Date().toISOString()
          });

          return NextResponse.json({
            success: true,
            message: 'Successfully left room and AI agent disconnected',
            data: {
              channel,
              userUid: uid,
              agentId,
              agoraResponse,
              timestamp: new Date().toISOString()
            }
          });
        } else {
          // 如果让 AI 代理离开失败，记录错误但不阻断用户离开房间
          const errorText = await response.text();
          console.warn('Failed to make AI agent leave room:', response.status, errorText);
        }
      } catch (error) {
        console.warn('Error making AI agent leave room:', error);
        // 继续执行，不阻断用户离开房间
      }
    }

    // 记录用户离开房间的日志
    console.log('User left room:', {
      channel,
      userUid: uid,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully left room',
      data: {
        channel,
        userUid: uid,
        agentId: agentId || null,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error leaving room:', error);
    
    // 区分不同类型的错误
    if (error instanceof Error) {
      if (error.message.includes('required')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Configuration error',
            details: error.message
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to leave room',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Leave room endpoint is available',
    endpoints: {
      POST: 'Leave room and optionally disconnect AI agent',
      parameters: {
        channel: 'string (required) - RTC channel name',
        uid: 'string|number (required) - User UID',
        agentId: 'string (optional) - AI agent ID to disconnect'
      }
    }
  });
}
