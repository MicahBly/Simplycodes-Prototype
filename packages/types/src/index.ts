// Coupon types
export interface Coupon {
  id: string;
  code: string;
  merchant_id: string;
  discount_type: 'percentage' | 'fixed' | 'free_shipping' | 'bogo';
  discount_value: number;
  description: string;
  success_rate: number; // 0-1
  last_verified_ts: number;
  expires_at?: number;
  minimum_purchase?: number;
  categories?: string[];
}

// Ranked coupon with ML score
export interface RankedCoupon extends Coupon {
  score: number;
  confidence: number;
}

// Product types
export interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  rating: number;
  review_count: number;
  categories: string[];
  merchant_id: string;
  image_url?: string;
  description?: string;
}

// Community trust types
export interface CommunityContributor {
  contributor_id: string;
  reputation: number; // 0-100
  rank_badge: 'bronze' | 'silver' | 'gold' | 'platinum';
  total_verifications: number;
  success_rate: number;
}

// Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  citations?: Citation[];
}

export interface Citation {
  type: 'coupon' | 'product' | 'knowledge';
  id: string;
  text: string;
}

// ML Model types
export interface ModelConfig {
  name: string;
  path: string;
  format: 'onnx' | 'gguf';
  size: number; // bytes
  quantization?: string;
  provider: 'webgpu' | 'wasm';
}

// Extension message types
export interface ExtensionMessage {
  type: 'GET_COUPONS' | 'APPLY_COUPON' | 'CHAT_MESSAGE' | 'MODEL_STATUS';
  payload: any;
  tabId?: number;
}

// Site detection
export interface SupportedSite {
  domain: string;
  selectors: {
    priceElement: string;
    couponInput: string;
    applyButton: string;
    cartTotal?: string;
  };
}