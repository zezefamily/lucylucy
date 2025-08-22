import { getBlogPost } from "@/services/blog";
import { notFound } from "next/navigation";
import Image from "next/image";
import BackButton from "./back-button";

interface BlogDetailPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { id, locale } = await params;
  const blogId = parseInt(id);
  
  // 验证ID是否为有效数字
  if (isNaN(blogId)) {
    notFound();
  }
  
  // 获取博客数据
  const blog = await getBlogPost(blogId);
  
  if (!blog) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 lg:px-16">
        {/* 返回按钮 */}
        <div className="mb-8">
          <BackButton />
        </div>
        
        {/* 博客内容 */}
        <article className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          {/* 封面图片 */}
          <div className="aspect-[16/9] relative overflow-hidden">
            <Image
              src={blog.cover_img}
              alt={blog.title}
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* 博客内容区域 */}
          <div className="p-8 lg:p-12">
            {/* 标题 */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              {blog.title}
            </h1>
            
            {/* 副标题 */}
            {/* {blog.sub_title && (
              <p className="text-xl text-gray-600 mb-8 leading-relaxed font-medium">
                {blog.sub_title}
              </p>
            )} */}
            
            {/* 分隔线 */}
            <div className="w-24 h-1 bg-blue-600 mb-8"></div>
            
            {/* 博客内容 */}
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {blog.content_detail}
              </div>
            </div>
            
            {/* 返回按钮（底部） */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <BackButton isBottomButton />
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}