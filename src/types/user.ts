export interface User {
  id?: number;
  uuid?: string;
  email: string;
  created_at?: string | Date;
  nickname: string;
  avatar_url: string;
  locale?: string;
  signin_type?: string;
  signin_ip?: string;
  signin_provider?: string;
  signin_openid?: string;
  credits?: UserCredits;
  invite_code?: string;
  invited_by?: string;
  is_affiliate?: boolean;
}

export interface UserCredits {
  one_time_credits?: number;
  monthly_credits?: number;
  total_credits?: number;
  used_credits?: number;
  left_credits: number;
  free_credits?: number;
  is_recharged?: boolean;
  is_pro?: boolean;
}

// 订阅等级枚举
export enum SubscriptionTier {
  NONE = "none",
  STARTER = "starter", 
  PRO = "pro",
  ELITE = "elite"
}

// 用户订阅信息
export interface UserSubscription {
  tier: SubscriptionTier;
  productId?: string;
  productName?: string;
  isActive: boolean;
  expiredAt?: Date;
  interval?: string;
} 