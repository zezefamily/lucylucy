// 分析结果接口
export interface AnalysisResult {
  score: number;
  category: string;
  suggestions: {
    photos: string[];
    bio: string[];
    overall: string[];
  };
  strengths: string[];
  improvements: string[];
}

// API响应接口
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

// 分析API响应
export type AnalysisApiResponse = ApiResponse<AnalysisResult>; 