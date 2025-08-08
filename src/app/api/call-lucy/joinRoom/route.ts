import { NextRequest, NextResponse } from 'next/server';

// 声网对话式 AI 代理配置接口
interface AgoraAIAgentRequest {
  name: string;
  properties: {
    channel: string;
    agent_rtc_uid: string;
    remote_rtc_uids: string[];
    enable_string_uid: boolean;
    idle_timeout: number;
    parameters: {
      transcript: {
        enable: boolean;
        protocol_version: string;
        enable_words: boolean;
        redundant: boolean;
      };
      enable_metrics: boolean;
      audio_scenario: string;
      data_channel: string;
      enable_error_message: boolean;
    };
    advanced_features: {
      enable_aivad: boolean;
      enable_rtm: boolean;
    };
    vad: {
      interrupt_duration_ms: number;
      prefix_padding_ms: number;
      silence_duration_ms: number;
      threshold: number;
    };
    llm: {
      url: string;
      api_key: string;
      max_history: number;
      system_messages: Array<{
        role: string;
        content: string;
      }>;
      params: {
        model: string;
        max_token: number;
      };
      greeting_message: string;
      failure_message: string;
    };
    asr: {
      vendor: string;
      language: string;
    };
    tts: {
      vendor: string;
      params: {
        group_id: string;
        key: string;
        model: string;
        voice_setting: {
          voice_id: string;
          speed: number;
          vol: number;
          pitch: number;
        };
        audio_setting: {
          sample_rate: number;
        };
        token: string;
        app_id: string;
        cluster: string;
        voice_type: string;
        speed_ratio: number;
        volume_ratio: number;
        pitch_ratio: number;
        emotion: string;
      };
    };
  };
}

// 获取环境变量配置
function getAgoraConfig() {
  const projectId = process.env.AGORA_AI_PROJECT_ID || "1e1a08c756194660b8fb64e0ba85caa5";
  const basicAuth = process.env.AGORA_AI_BASIC_AUTH || "ZWRmNGM0MDE0MThiNDdmM2ExOTI4Yzg1YWNmNjA5OTQ6NTg5MTQ2OTgyMTgwNDdiNDliOTQ5ZDZhMTI4ZGE4ZmY=" ; // Basic Auth 格式: base64(username:password)
  const openaiApiKey = process.env.OPENAI_API_KEY || "sk-LCaAqd7cGUKKztDD4c24FcBf7dE64fF8Af796fDb20F4371c" ;
  const openaiBaseUrl = 'https://api.openai-next.com/v1/chat/completions';
  const minimaxGroupId = process.env.MINIMAX_GROUP_ID || "1855950250527691177";
  const minimaxKey = process.env.MINIMAX_KEY || "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJCZXRhIiwiVXNlck5hbWUiOiJCZXRhIiwiQWNjb3VudCI6IiIsIlN1YmplY3RJRCI6IjE4NTU5NTAyNTA1MzYwNzk3ODUiLCJQaG9uZSI6IjEzMTYxOTI4OTY3IiwiR3JvdXBJRCI6IjE4NTU5NTAyNTA1Mjc2OTExNzciLCJQYWdlTmFtZSI6IiIsIk1haWwiOiIiLCJDcmVhdGVUaW1lIjoiMjAyNS0wOC0wNSAyMToyNzo1MiIsIlRva2VuVHlwZSI6MSwiaXNzIjoibWluaW1heCJ9.ZoWcNEVGK0m9b_lcUd1Be-omXlNDnEoEwhHz4OEBA9T4-02eUAbW5wTdtCn6332X9o3ZDgilyaekYHyUoo5WWlT6xKDEWs4VLPAGCOTKPOFDaXuPQKo10cRX2QDjL6sOlOUf-lzw7OwEJZIHEtN6sFYukaAcMcCkWZhjIbEjNOKM2bHwjB2Gu-YyAKNtpWVTogNs1keOBYNS0DTFOIBoD1q3Keg1PxIBy149k8iWOfeWXiELw0sTMbnYQGxQaIaI52vCW49UBM8fqGcXtLE3wng0vVD1T4oM9PI3unIbjRwAIEuDGcSRXaBotQJb3uwZSYbpSzcNLp9eIfOI6tKJyw";

  if (!projectId) {
    throw new Error('AGORA_AI_PROJECT_ID is required');
  }
  if (!basicAuth) {
    throw new Error('AGORA_AI_BASIC_AUTH is required');
  }
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }
  if (!minimaxGroupId) {
    throw new Error('MINIMAX_GROUP_ID is required');
  }
  if (!minimaxKey) {
    throw new Error('MINIMAX_KEY is required');
  }

  return {
    projectId,
    basicAuth,
    openaiApiKey,
    openaiBaseUrl,
    minimaxGroupId,
    minimaxKey
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel, uid, userSystemMessage } = body;

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

    // 生成唯一的代理名称
    const agentName = `lucy_agent_${Date.now()}`;
    const agentUid = Math.floor(Math.random() * 10000).toString();

    // 构建请求数据
    const agoraRequest: AgoraAIAgentRequest = {
      name: agentName,
      properties: {
        channel: channel,
        agent_rtc_uid: agentUid,
        remote_rtc_uids: ["*"], // 允许所有用户
        enable_string_uid: true,
        idle_timeout: 120,
        parameters: {
          transcript: {
            enable: true,
            protocol_version: "v2",
            enable_words: false,
            redundant: false
          },
          enable_metrics: true,
          audio_scenario: "default",
          data_channel: "rtm",
          enable_error_message: true
        },
        advanced_features: {
          enable_aivad: true,
          enable_rtm: true
        },
        vad: {
          interrupt_duration_ms: 160,
          prefix_padding_ms: 300,
          silence_duration_ms: 480,
          threshold: 0.5
        },
        llm: {
          url: config.openaiBaseUrl,
          api_key: config.openaiApiKey,
          max_history: 10,
          system_messages: [
            {
              role: "system",
              content: "你是一个恋爱教练，你能根据用户上传的图片资料分析解读，包括图片中的画面和文字内容，从多个维度分析其优劣势，并给出具体的优化建议，帮助他们提升在交友网站上的吸引力，早日结交自己的伴侣。你像朋友一样，能够真诚坦率的指出问题，从不避讳，并给出更好的建议。"
            },
            {
              role: "system",
              content: "引导用户上传一张自己或者感兴趣的个人资料照片，并给出分析报告; 你只关注作为恋爱教练的职责，不要关注其他内容。注意回复使用纯自然语言，不要Markdown格式"
            }
          ],
          params: {
            model: "gpt-4o-mini",
            max_token: 1024
          },
          greeting_message: "Hi,我是Lucy,您的专属恋爱教练,有什么可以帮您？",
          failure_message: "我出错了，请稍等！"
        },
        asr: {
          vendor: "fengming",
          language: "zh-CN"
        },
        tts: {
          vendor: "bytedance",
          params: {
            group_id: config.minimaxGroupId,
            key: config.minimaxKey,
            model: "speech-01-turbo-240228",
            voice_setting: {
              voice_id: "female-shaonv",
              speed: 1,
              vol: 1,
              pitch: 0
            },
            audio_setting: {
              sample_rate: 32000
            },
            token: "3DKzkGzbao4onv9dsBamfvusei9oGQYT",
            app_id: "8944225950",
            cluster: "volcano_tts",
            voice_type: "BV700_streaming",
            speed_ratio: 1,
            volume_ratio: 1,
            pitch_ratio: 1,
            emotion: ""
          }
        }
      }
    };


    // 调用声网对话式 AI 代理 API
    const agoraApiUrl = `https://api.agora.io/cn/api/conversational-ai-agent/v2/projects/${config.projectId}/join/`;
    
    const response = await fetch(agoraApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${config.basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(agoraRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Agora API error:', response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to join AI agent to room: ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const agoraResponse = await response.json();

    // 检查声网响应中的 agent_id
    if (!agoraResponse.agent_id) {
      console.error('Agora response missing agent_id:', agoraResponse);
      return NextResponse.json(
        {
          success: false,
          error: 'AI agent created but missing agent_id',
          details: agoraResponse
        },
        { status: 500 }
      );
    }

    // 记录成功日志
    console.log('AI Agent successfully joined room:', {
      channel,
      agentName,
      agentUid,
      userUid: uid,
      agentId: agoraResponse.agent_id,
      status: agoraResponse.status,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'AI Agent successfully joined room',
      data: {
        channel,
        userUid: uid,
        agentName,
        agentUid,   // 返回声网的 agent_uid
        agentId: agoraResponse.agent_id, // 返回声网的 agent_id
        status: agoraResponse.status,
        createTs: agoraResponse.create_ts,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error joining AI agent to room:', error);
    
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
        error: 'Failed to join AI agent to room',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Join room endpoint is available',
    endpoints: {
      POST: 'Join AI agent to room',
      parameters: {
        channel: 'string (required) - RTC channel name',
        uid: 'string|number (required) - User UID',
        userSystemMessage: 'string (optional) - Custom system message for AI'
      }
    }
  });
}
