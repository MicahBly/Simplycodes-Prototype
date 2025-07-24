import { ChatMessage, Coupon, RankedCoupon } from '@/types';

/**
 * Mock AI implementation for prototype testing
 * Simulates model behavior without requiring actual ONNX models
 */

export class MockLLMInference {
  private responses = [
    "Based on the available coupons, I recommend using the 20% off code for maximum savings on your current cart.",
    "Free shipping codes are great for smaller orders. The FREESHIP code will save you $9.99 on shipping.",
    "The SAVE25 code offers the best discount at 25% off your entire order. This would save you approximately $",
    "I notice you're shopping for electronics. The TECH15 code specifically applies to tech items and would save you 15%.",
    "For first-time customers, the WELCOME10 code provides a 10% discount. It's a great way to try out the store!",
    "The current best deal is the BOGO50 offer - buy one, get one at 50% off. Perfect for stocking up!",
    "Based on your cart total, the $10OFF50 code would apply since you're over the $50 minimum.",
    "Holiday sales are active! The HOLIDAY30 code gives you 30% off everything in your cart.",
  ];

  async initialize(modelName: string): Promise<void> {
    // Simulate model initialization
    console.log('Mock LLM initialized:', modelName);
    return Promise.resolve();
  }

  async generate(
    messages: ChatMessage[],
    options: any,
    onToken?: (token: string) => void
  ): Promise<string> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const lastMessage = messages[messages.length - 1];
    let response = this.generateContextualResponse(lastMessage.content);

    // Simulate token streaming
    if (onToken) {
      const words = response.split(' ');
      for (const word of words) {
        onToken(word + ' ');
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return response;
  }

  private generateContextualResponse(query: string): string {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('best') || lowerQuery.includes('recommend')) {
      return "Looking at your current cart, the SAVE25 code offers the best value with 25% off your entire purchase. This would save you more than any other available coupon.";
    }
    
    if (lowerQuery.includes('free shipping')) {
      return "Yes! The FREESHIP code provides free standard shipping on any order. This typically saves $5-10 depending on your location.";
    }
    
    if (lowerQuery.includes('how') || lowerQuery.includes('work')) {
      return "SimplyCodes automatically finds and tests coupon codes for you. Just click 'Apply' on any coupon to try it. I can help you find the best deals!";
    }
    
    if (lowerQuery.includes('product') || lowerQuery.includes('item')) {
      return "This product has great reviews! With the available coupons, you can save up to 25% on your purchase. Would you like me to find the best code for this specific item?";
    }

    // Return a random helpful response
    return this.responses[Math.floor(Math.random() * this.responses.length)];
  }
}

export class MockCouponRanker {
  async initialize(modelName: string): Promise<void> {
    console.log('Mock Coupon Ranker initialized:', modelName);
    return Promise.resolve();
  }

  async rankCoupons(coupons: Coupon[], cartTotal: number): Promise<RankedCoupon[]> {
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 200));

    // Simple ranking algorithm based on potential savings
    const rankedCoupons = coupons.map(coupon => {
      let score = 0;
      let potentialSavings = 0;

      switch (coupon.discount_type) {
        case 'percentage':
          potentialSavings = (cartTotal * coupon.discount_value) / 100;
          score = Math.min(potentialSavings / cartTotal, 1) * 0.8 + coupon.success_rate * 0.2;
          break;
        
        case 'fixed':
          potentialSavings = coupon.discount_value;
          score = Math.min(potentialSavings / cartTotal, 1) * 0.7 + coupon.success_rate * 0.3;
          break;
        
        case 'free_shipping':
          potentialSavings = 10; // Assume $10 shipping
          score = 0.5 + coupon.success_rate * 0.5;
          break;
        
        case 'bogo':
          potentialSavings = (cartTotal * coupon.discount_value) / 200; // BOGO value
          score = 0.6 + coupon.success_rate * 0.4;
          break;
      }

      // Apply minimum purchase penalty
      if (coupon.minimum_purchase && cartTotal < coupon.minimum_purchase) {
        score = 0;
      }

      return {
        ...coupon,
        score: Number(score.toFixed(3)),
        confidence: 0.85 + Math.random() * 0.15, // 85-100% confidence
      } as RankedCoupon;
    });

    // Sort by score descending
    return rankedCoupons.sort((a, b) => b.score - a.score);
  }
}

export class MockModelLoader {
  private static instance: MockModelLoader;
  private mockSessions = new Map<string, any>();

  static getInstance(): MockModelLoader {
    if (!MockModelLoader.instance) {
      MockModelLoader.instance = new MockModelLoader();
    }
    return MockModelLoader.instance;
  }

  async loadModel(config: any, onProgress?: (progress: any) => void): Promise<any> {
    // Simulate model loading with progress
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (onProgress) {
        onProgress({
          loaded: i * 10,
          total: steps * 10,
          percentage: (i / steps) * 100,
        });
      }
    }

    // Store mock session
    this.mockSessions.set(config.name, { loaded: true });
    return { loaded: true };
  }

  getSession(modelName: string): any {
    return this.mockSessions.get(modelName);
  }

  unloadModel(modelName: string): void {
    this.mockSessions.delete(modelName);
  }

  unloadAll(): void {
    this.mockSessions.clear();
  }
}