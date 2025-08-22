import { BlogPost } from "@/types/blog";

/**
 * 获取博客列表
 * @param locale 语言（暂时未使用，为将来多语言支持保留）
 * @param limit 限制数量，默认8个（2行 x 4列）
 * @returns 博客文章列表
 */
export async function getBlogPosts(
  locale?: string,
  limit: number = 8
): Promise<BlogPost[]> {
  try {
    // 在服务端环境中，使用 import 来读取静态 JSON 文件
    const blogs: BlogPost[] = await import("@/data/blogs.json").then(
      (module) => module.default
    );
    
    console.log("成功读取博客数据:", { blogsLength: blogs.length, limit });
    
    // 限制返回数量
    const result = blogs.slice(0, limit);
    console.log("返回的博客数据:", { resultLength: result.length, firstItem: result[0] });
    
    return result;
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    return [];
  }
}

/**
 * 获取单个博客详情
 * @param id 博客ID（数组索引）
 * @returns 博客文章详情
 */
export async function getBlogPost(id: number): Promise<BlogPost | null> {
  try {
    const blogs: BlogPost[] = await import("@/data/blogs.json").then(
      (module) => module.default
    );
    
    if (id >= 0 && id < blogs.length) {
      return blogs[id];
    }
    
    console.warn("博客ID超出范围:", { id, totalBlogs: blogs.length });
    return null;
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
    return null;
  }
}

/**
 * 获取推荐博客列表（仅用于首页展示）
 * @param locale 语言
 * @returns 推荐博客文章列表
 */
export async function getFeaturedBlogPosts(locale: string): Promise<BlogPost[]> {
  return getBlogPosts(locale, 8);
} 