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
    };
    advanced_features: {
      enable_aivad: boolean;
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
      };
    };
  };
}

// 获取环境变量配置
function getAgoraConfig() {
  const projectId = process.env.AGORA_AI_PROJECT_ID || "1e1a08c756194660b8fb64e0ba85caa5";
  const basicAuth = process.env.AGORA_AI_BASIC_AUTH || "ZWRmNGM0MDE0MThiNDdmM2ExOTI4Yzg1YWNmNjA5OTQ6NTg5MTQ2OTgyMTgwNDdiNDliOTQ5ZDZhMTI4ZGE4ZmY=" ; // Basic Auth 格式: base64(username:password)
  const openaiApiKey = process.env.OPENAI_API_KEY || "sk-LCaAqd7cGUKKztDD4c24FcBf7dE64fF8Af796fDb20F4371c" ;
  const openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai-next.com/v1/chat/completions';
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
          audio_scenario: "default"
        },
        advanced_features: {
          enable_aivad: true
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
              content: userSystemMessage || "你是一个恋爱教练，你能根据用户的资料分析解读，包括图片中的画面和文字内容，从多个维度分析其优劣势，并给出具体的优化建议，帮助他们提升在交友网站上的吸引力，早日结交自己的伴侣。\n你像朋友一样，能够真诚坦率的指出问题，从不避讳，并给出更好的建议。\n重要提醒：在分析多张图片时，图片是按特定顺序呈现的。你回复中的photoIndex必须与图片出现的顺序完全对应。你看到的第一张图片应该是photoIndex: 1，第二张图片应该是photoIndex: 2，以此类推。请务必不要搞混顺序。\n请按下面的结构，给出分析报告：\n分析报告结构：\n1. 你会先给资料页打一个总体评价和评分，满分 10 分\n2. 而后，你会给每张照片进行评分，评价，以及改进建议（严格按照图片出现的顺序）\n3. 最后，你会给一个最终的建议，可用 1 2 3 点进行罗列\n表达要自然坦率真诚，但不能太啰嗦。\n分析重点：\n1. 多图片的整体协调性和一致性\n2. 不同角度和场景的展示效果\n3. 照片质量、构图、光线等技术层面\n4. 个人形象的多样性展示\n5. 整体给人的印象和吸引力\n6. 单张照片的分析和建议（保持正确顺序）\n7. 图片中如果有文案需要识别并分析和建议\n评分标准（1-10分制）：\n- 9-10分：极具吸引力，照片完美展示个人魅力\n- 8-8.9分：非常有吸引力，照片呈现很优秀\n- 7-7.9分：很有吸引力，照片搭配不错\n- 6-6.9分：有吸引力，有改进空间\n- 5-5.9分：一般，需要较多改进\n- 4分以下：需要大幅改进"
            }
          ],
          params: {
            model: "gpt-4o-mini",
            max_token: 1024
          },
          greeting_message: "Hi,我是Lucy,很高兴认识你，有什么可以帮您？",
          failure_message: "我出错了，请稍等！"
        },
        asr: {
          vendor: "fengming",
          language: "zh-CN"
        },
        tts: {
          vendor: "minimax",
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
            }
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
        agentUid,
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
