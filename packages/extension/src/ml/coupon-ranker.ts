import * as ort from 'onnxruntime-web';
import { ModelLoader } from './model-loader';
import { Coupon } from '@/types';

export interface RankingFeatures {
  success_rate: number;
  discount_value: number;
  discount_type_encoded: number;
  days_since_verified: number;
  cart_total: number;
  is_expired: number;
}

export interface RankedCoupon extends Coupon {
  score: number;
  confidence: number;
}

export class CouponRanker {
  private modelLoader: ModelLoader;
  private session?: ort.InferenceSession;

  constructor() {
    this.modelLoader = ModelLoader.getInstance();
  }

  async initialize(modelName: string): Promise<void> {
    this.session = await this.modelLoader.getSession(modelName);
    if (!this.session) {
      throw new Error(`Ranking model ${modelName} not loaded`);
    }
  }

  async rankCoupons(
    coupons: Coupon[],
    cartTotal: number
  ): Promise<RankedCoupon[]> {
    if (!this.session) {
      throw new Error('Ranking model not initialized');
    }

    if (coupons.length === 0) {
      return [];
    }

    // Extract features for all coupons
    const featuresArray = coupons.map(coupon => 
      this.extractFeatures(coupon, cartTotal)
    );

    // Create input tensor
    const numFeatures = Object.keys(featuresArray[0]).length;
    const flatFeatures = new Float32Array(coupons.length * numFeatures);
    
    featuresArray.forEach((features, i) => {
      const values = Object.values(features);
      values.forEach((value, j) => {
        flatFeatures[i * numFeatures + j] = value;
      });
    });

    const inputTensor = new ort.Tensor('float32', 
      flatFeatures, 
      [coupons.length, numFeatures]
    );

    // Run inference
    const feeds = { features: inputTensor };
    const results = await this.session.run(feeds);
    
    // Extract scores
    const scores = results.scores.data as Float32Array;
    const confidences = results.confidence?.data as Float32Array || 
      new Float32Array(coupons.length).fill(1.0);

    // Combine with original coupons and sort
    const rankedCoupons: RankedCoupon[] = coupons.map((coupon, i) => ({
      ...coupon,
      score: scores[i],
      confidence: confidences[i],
    }));

    // Sort by score descending
    rankedCoupons.sort((a, b) => b.score - a.score);

    return rankedCoupons;
  }

  private extractFeatures(coupon: Coupon, cartTotal: number): RankingFeatures {
    const now = Date.now();
    const daysSinceVerified = (now - coupon.last_verified_ts) / (1000 * 60 * 60 * 24);
    
    // Encode discount type
    const discountTypeMap: Record<string, number> = {
      'percentage': 0,
      'fixed': 1,
      'free_shipping': 2,
      'bogo': 3,
    };

    // Calculate effective discount value
    let effectiveDiscount = coupon.discount_value;
    if (coupon.discount_type === 'percentage') {
      effectiveDiscount = (coupon.discount_value / 100) * cartTotal;
    }

    return {
      success_rate: coupon.success_rate,
      discount_value: effectiveDiscount,
      discount_type_encoded: discountTypeMap[coupon.discount_type] || 0,
      days_since_verified: Math.min(daysSinceVerified, 365), // Cap at 1 year
      cart_total: cartTotal,
      is_expired: coupon.expires_at && coupon.expires_at < now ? 1 : 0,
    };
  }

  async getBestCoupon(
    coupons: Coupon[],
    cartTotal: number,
    minConfidence: number = 0.7
  ): Promise<RankedCoupon | null> {
    const ranked = await this.rankCoupons(coupons, cartTotal);
    
    // Filter by minimum confidence
    const confident = ranked.filter(c => c.confidence >= minConfidence);
    
    return confident.length > 0 ? confident[0] : null;
  }
}