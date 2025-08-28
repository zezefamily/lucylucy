import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return new NextResponse('Missing image URL', { status: 400 });
    }

    // 验证URL是否为有效的图片URL
    if (!imageUrl.startsWith('http')) {
      return new NextResponse('Invalid image URL', { status: 400 });
    }

    let response;
    try {
      // 获取图片
      response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)',
        },
        // 添加超时设置
        signal: AbortSignal.timeout(10000), // 10秒超时
      });
    } catch (error) {
      console.error('Fetch error:', error);
      return new NextResponse('Failed to fetch image', { status: 500 });
    }

    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // 检查是否为图片类型
    if (!contentType.startsWith('image/')) {
      return new NextResponse('Not an image', { status: 400 });
    }

    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // 缓存1小时（减少本地资源的缓存时间）
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch (error) {
    console.error('Proxy image error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 