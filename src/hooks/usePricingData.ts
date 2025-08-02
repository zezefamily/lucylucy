import { useState, useEffect } from 'react';
import { Pricing } from '@/types/blocks/pricing';
import { useLocale } from 'next-intl';

// 直接导入定价数据
import pricingEn from '@/i18n/pages/pricing/en.json';
import pricingZh from '@/i18n/pages/pricing/zh.json';
import pricingEs from '@/i18n/pages/pricing/es.json';

export function usePricingData() {
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();

  useEffect(() => {
    try {
      setLoading(true);
      setError(null);
      
      let pricingData;
      
      // 根据语言选择对应的定价数据 
      switch (locale) {
        case 'zh':
        case 'zh-CN':
          pricingData = pricingZh.pricing as Pricing;
          break;
        case 'es':
          pricingData = pricingEs.pricing as Pricing;
          break;
        case 'en':
        default:
          pricingData = pricingEn.pricing as Pricing;
          break;
      }
      
      console.log('Loading pricing data for locale:', locale, 'Data:', pricingData);
      setPricing(pricingData);
    } catch (err) {
      console.error('Failed to load pricing data:', err);
      setError('Failed to load pricing data');
      // 设置一个基础的定价数据作为回退
      setPricing(pricingEn.pricing as Pricing);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  return { pricing, loading, error };
} 