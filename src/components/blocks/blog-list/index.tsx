"use client";

import { ArrowRight } from "lucide-react";
import { BlogPost } from "@/types/blog";
import { useRouter, useParams } from 'next/navigation';

interface BlogListProps {
  title?: string;
  subtitle?: string;

  posts: BlogPost[];
  readMoreText?: string;
}

export default function BlogList({ 
  title = "最新博客", 
  subtitle = "探索我们的最新文章和见解",
  posts, 
  readMoreText = "阅读更多" 
}: BlogListProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  
  // 调试信息
  console.log("BlogList 接收到的数据:", { posts, postsLength: posts?.length });
  
  // 临时测试数据（如果没有数据的话）
  const testPosts = [
    {
      title: "测试博客标题",
      cover_img: "/imgs/features/1.png", 
      sub_title: "测试副标题",
      content_detail: "这是测试内容，用来验证组件是否正常工作。"
    }
  ];
  
  // 如果没有传入数据，使用测试数据
  const displayPosts = posts && posts.length > 0 ? posts : testPosts;
  const shouldShowPlaceholder = false; // 暂时总是显示内容
  
  // 处理博客卡片点击
  const handleBlogClick = (index: number) => {
    router.push(`/${locale}/blog-detail/${index}`);
  };

  return (
    <section className="w-full py-16 bg-gray-50">
      <div className="container mx-auto px-4 lg:px-16">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>
        
        {/* 博客网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {shouldShowPlaceholder ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-500 text-lg mb-4">暂无博客内容</div>
              <div className="text-gray-400">请稍后再来查看最新内容</div>
            </div>
          ) : (
            displayPosts.map((post, idx) => (
            <div
              key={idx}
              id={`blog-card-${idx}`}
              onClick={() => handleBlogClick(idx)}
              className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
            >
              {/* 博客封面图片 */}
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={post.cover_img}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {/* 博客内容 */}
              <div className="p-6">
                {/* 标题 */}
                <h3 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                  {post.title}
                </h3>
                
                {/* 副标题 */}
                {post.sub_title && (
                  <p className="text-gray-500 text-sm mb-3 font-medium">
                    {post.sub_title}
                  </p>
                )}
                
                {/* 内容详情 */}
                <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                  {post.content_detail}
                </p>
                
                {/* 阅读更多按钮 */}
                <div className="flex items-center text-blue-600 group-hover:text-blue-700 font-medium">
                  {readMoreText}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
} 