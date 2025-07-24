import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { getUserHighestSubscriptionTier } from "@/services/user";
import { SubscriptionTier } from "@/types/user";

export async function POST(req: NextRequest) {
  try {
    // 获取用户最高订阅等级
    const subscription = await getUserHighestSubscriptionTier();
    
    // 获取请求参数
    const { analysisType, imageCount } = await req.json();
    
    // 根据订阅等级检查权限
    const tierCheckResult = checkTierPermissions(subscription.tier, analysisType, imageCount);
    
    if (!tierCheckResult.allowed) {
      return respErr(tierCheckResult.message || "权限检查失败");
    }
    
    // 根据订阅等级提供不同的功能
    const analysisResult = await performAnalysis(subscription.tier, analysisType, imageCount);
    
    return respData({
      ...analysisResult,
      userTier: subscription.tier,
      isActive: subscription.isActive,
      features: getTierFeatures(subscription.tier)
    });
    
  } catch (error: any) {
    console.log("分析API错误: ", error);
    return respErr("分析过程中发生错误: " + error.message);
  }
}

/**
 * 检查订阅等级权限
 */
function checkTierPermissions(tier: SubscriptionTier, analysisType: string, imageCount: number) {
  switch (tier) {
    case SubscriptionTier.STARTER:
      // Starter 用户限制
      if (analysisType === 'advanced' || analysisType === 'batch') {
        return {
          allowed: false,
          message: "高级分析功能需要 Pro 或 Elite 订阅",
          requiredTier: SubscriptionTier.PRO
        };
      }
      if (imageCount > 1) {
        return {
          allowed: false,
          message: "Starter 用户每次只能分析1张图片，多图分析需要 Pro 订阅",
          requiredTier: SubscriptionTier.PRO
        };
      }
      break;
      
    case SubscriptionTier.PRO:
      // Pro 用户限制
      if (analysisType === 'professional_report') {
        return {
          allowed: false,
          message: "专业报告功能仅限 Elite 用户使用",
          requiredTier: SubscriptionTier.ELITE
        };
      }
      if (imageCount > 5) {
        return {
          allowed: false,
          message: "Pro 用户最多可分析5张图片，更多图片需要 Elite 订阅",
          requiredTier: SubscriptionTier.ELITE
        };
      }
      break;
      
    case SubscriptionTier.ELITE:
      // Elite 用户无限制
      break;
      
    default:
      // 无订阅用户
      return {
        allowed: false,
        message: "请先订阅任意套餐以使用分析功能",
        requiredTier: SubscriptionTier.STARTER
      };
  }
  
  return { allowed: true };
}

/**
 * 根据订阅等级执行不同的分析逻辑
 */
async function performAnalysis(tier: SubscriptionTier, analysisType: string, imageCount: number) {
  const baseResult = {
    analysisId: generateAnalysisId(),
    timestamp: new Date().toISOString(),
    analysisType
  };

  switch (tier) {
    case SubscriptionTier.STARTER:
      return {
        ...baseResult,
        result: "基础分析结果：包含基本评分和建议",
        score: 75,
        suggestions: [
          "改善照片光线",
          "调整拍摄角度"
        ],
        features: ["基础评分", "简单建议"]
      };
      
    case SubscriptionTier.PRO:
      return {
        ...baseResult,
        result: "进阶分析结果：包含详细分析和优化建议",
        score: 75,
        detailedAnalysis: {
          composition: "构图良好",
          lighting: "光线需要改善",
          expression: "表情自然"
        },
        suggestions: [
          "改善照片光线",
          "调整拍摄角度",
          "优化背景选择",
          "考虑表情训练"
        ],
        features: ["详细评分", "多维度分析", "优化建议", "多图对比"]
      };
      
    case SubscriptionTier.ELITE:
      return {
        ...baseResult,
        result: "专业分析结果：包含全面分析、专业建议和个性化报告",
        score: 75,
        detailedAnalysis: {
          composition: "构图良好，符合黄金分割原则",
          lighting: "光线偏暗，建议使用自然光或补光设备",
          expression: "表情自然真诚，有亲和力",
          styling: "着装得体，颜色搭配协调",
          background: "背景简洁，不分散注意力"
        },
        professionalReport: {
          overallImpression: "整体印象良好，具有较强的吸引力",
          marketAnalysis: "在目标群体中具有竞争优势",
          improvementPriority: ["光线优化", "角度调整", "表情练习"]
        },
        suggestions: [
          "改善照片光线 - 建议在上午10点或下午4点拍摄",
          "调整拍摄角度 - 尝试略微仰拍以增强气质",
          "优化背景选择 - 考虑使用纯色背景",
          "表情训练 - 练习更自然的微笑",
          "着装建议 - 选择更突出个人特色的服装"
        ],
        features: ["专业评分", "全维度分析", "市场分析", "个性化报告", "优先级建议", "无限制使用"]
      };
      
    default:
      throw new Error("无效的订阅等级");
  }
}

/**
 * 获取订阅等级对应的功能列表
 */
function getTierFeatures(tier: SubscriptionTier): string[] {
  switch (tier) {
    case SubscriptionTier.STARTER:
      return [
        "基础图片分析",
        "简单评分",
        "基础建议",
        "单图分析"
      ];
      
    case SubscriptionTier.PRO:
      return [
        "详细图片分析",
        "多维度评分",
        "优化建议",
        "多图对比分析（最多5张）",
        "批量处理"
      ];
      
    case SubscriptionTier.ELITE:
      return [
        "专业图片分析",
        "全面评分报告",
        "个性化建议",
        "无限制多图分析",
        "专业市场分析",
        "优先级建议",
        "专属客服支持"
      ];
      
    default:
      return [];
  }
}

/**
 * 生成分析ID
 */
function generateAnalysisId(): string {
  return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 获取用户当前订阅信息的端点
export async function GET() {
  try {
    const subscription = await getUserHighestSubscriptionTier();
    
    return respData({
      currentTier: subscription.tier,
      isActive: subscription.isActive,
      productId: subscription.productId,
      productName: subscription.productName,
      expiredAt: subscription.expiredAt,
      features: getTierFeatures(subscription.tier),
      limits: getTierLimits(subscription.tier)
    });
    
  } catch (error: any) {
    console.log("获取订阅信息错误: ", error);
    return respErr("获取订阅信息失败: " + error.message);
  }
}

/**
 * 获取订阅等级对应的限制
 */
function getTierLimits(tier: SubscriptionTier) {
  switch (tier) {
    case SubscriptionTier.STARTER:
      return {
        maxImagesPerAnalysis: 1,
        maxAnalysesPerDay: 10,
        availableAnalysisTypes: ['basic']
      };
      
    case SubscriptionTier.PRO:
      return {
        maxImagesPerAnalysis: 5,
        maxAnalysesPerDay: 50,
        availableAnalysisTypes: ['basic', 'advanced', 'batch']
      };
      
    case SubscriptionTier.ELITE:
      return {
        maxImagesPerAnalysis: -1, // 无限制
        maxAnalysesPerDay: -1, // 无限制
        availableAnalysisTypes: ['basic', 'advanced', 'batch', 'professional_report']
      };
      
    default:
      return {
        maxImagesPerAnalysis: 0,
        maxAnalysesPerDay: 0,
        availableAnalysisTypes: []
      };
  }
} 