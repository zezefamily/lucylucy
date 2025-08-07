import { NextRequest } from "next/server";
import { newStorage } from "@/lib/storage";
import { respData, respErr } from "@/lib/resp";
import { genUUID } from "@/lib/utils";

// 支持的文件类型
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
// 最大文件大小 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    console.log('=== 图片上传 API 开始 ===');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const prefix = formData.get('prefix') as string || 'call-lucy';
    
    console.log('接收到文件:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      prefix
    });
    
    if (!file) {
      console.error('没有接收到文件');
      return respErr("请选择要上传的图片文件");
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error('文件类型不支持:', file.type);
      return respErr("仅支持 JPG、PNG、WEBP 格式的图片");
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      console.error('文件太大:', file.size);
      return respErr("文件大小不能超过10MB");
    }

    // 检查存储环境变量
    const requiredEnvs = ['STORAGE_ENDPOINT', 'STORAGE_ACCESS_KEY', 'STORAGE_SECRET_KEY', 'STORAGE_BUCKET'];
    const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
    
    if (missingEnvs.length > 0) {
      console.error('缺少存储环境变量:', missingEnvs);
      return respErr(`存储配置错误，缺少环境变量: ${missingEnvs.join(', ')}`);
    }

    console.log('存储配置检查通过');

    // 创建存储实例
    const storage = newStorage();
    
    // 生成唯一文件名
    const uuid = genUUID();
    const fileExtension = file.type.split('/')[1];
    const filename = `${prefix}_${uuid}.${fileExtension}`;
    const key = `images/${filename}`;
    
    console.log('生成文件信息:', { uuid, filename, key, fileExtension });
    
    // 将文件转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('文件转换完成，Buffer 大小:', buffer.length);
    
    // 上传到存储服务
    console.log('开始上传到存储服务...');
    const uploadResult = await storage.uploadFile({
      body: buffer,
      key,
      contentType: file.type,
      disposition: "inline",
    });

    console.log('图片上传成功:', uploadResult);

    const result = {
      url: uploadResult.url,
      filename: uploadResult.filename,
      key: uploadResult.key,
      size: file.size,
      type: file.type,
      originalName: file.name
    };

    console.log('返回结果:', result);
    return respData(result);

  } catch (error) {
    console.error('图片上传 API 错误:', error);
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
    
    // 返回更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return respErr(`图片上传失败: ${errorMessage}`);
  }
} 