import { ChatMessage, Coupon, RankedCoupon } from '@/types';

// Simple tokenizer for text processing
class SimpleTokenizer {
  private vocab: Map<string, number> = new Map();
  private reverseVocab: Map<number, string> = new Map();
  
  constructor() {
    // Build a simple vocabulary for common words
    const commonWords = [
      'hello', 'hi', 'how', 'are', 'you', 'the', 'is', 'at', 'which', 'on',
      'coupon', 'code', 'save', 'discount', 'free', 'shipping', 'best', 'deal',
      'apply', 'cart', 'checkout', 'order', 'price', 'total', 'help', 'use',
      'student', 'multiple', 'stack', 'combine', 'expire', 'valid', 'work',
      'recommend', 'biggest', 'savings', 'money', 'percent', 'off', 'entire',
      'purchase', 'yes', 'no', 'simply', 'click', 'button', 'automatically',
      'find', 'deals', 'based', 'current', 'offers', 'value', 'with', 'your',
      'provides', 'standard', 'orders', 'over', 'gives', 'verification',
      'i', 'me', 'my', 'we', 'us', 'they', 'them', 'it', 'this', 'that',
      '!', '?', '.', ',', ':', ';', '-', '$', '%', '<UNK>', '<PAD>', '<START>', '<END>'
    ];
    
    commonWords.forEach((word, idx) => {
      this.vocab.set(word.toLowerCase(), idx);
      this.reverseVocab.set(idx, word);
    });
  }
  
  tokenize(text: string): number[] {
    const tokens = text.toLowerCase()
      .replace(/[^a-z0-9\s!?.,;:$%-]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 0);
    
    return tokens.map(token => 
      this.vocab.get(token) ?? this.vocab.get('<UNK>')!
    );
  }
  
  detokenize(tokens: number[]): string {
    return tokens
      .map(t => this.reverseVocab.get(t) ?? '<UNK>')
      .join(' ')
      .replace(/ ([!?.,;:])/g, '$1');
  }
}

export class AIService {
  private static instance: AIService;
  private tokenizer: SimpleTokenizer;
  private isLoading = false;
  private isReady = false;
  private knowledgeBase: Map<string, string[]> = new Map();

  private constructor() {
    this.tokenizer = new SimpleTokenizer();
    this.initializeKnowledgeBase();
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private initializeKnowledgeBase() {
    // Build a knowledge base of responses categorized by intent
    this.knowledgeBase.set('greeting', [
      "Hello! I'm SimplyCodes AI, here to help you save money with the best coupon codes.",
      "Hi there! I can help you find the best deals and apply coupons automatically.",
      "Welcome! Let me help you maximize your savings on this purchase."
    ]);
    
    this.knowledgeBase.set('best_deal', [
      "Based on your cart total of $X, the SAVE25 code offers the best value with 25% off your entire purchase.",
      "I've analyzed all available coupons - the FLASH30 code gives you the biggest discount at 30% off.",
      "The MEGA20 code is currently your best option, saving you 20% on everything in your cart."
    ]);
    
    this.knowledgeBase.set('shipping', [
      "Yes! The FREESHIP code provides free standard shipping on orders over $50.",
      "You can get free shipping with SHIPFREE on any order today.",
      "Free shipping is available with the NOSHIP code - no minimum required!"
    ]);
    
    this.knowledgeBase.set('how_to_use', [
      "It's simple! Just click the 'Apply' button next to any coupon and I'll automatically add it to your checkout.",
      "To use a coupon, click 'Apply' and I'll handle entering the code for you. I'll test each one to find what works!",
      "Click on any coupon's Apply button and I'll instantly add it to your cart. I can also help you find the best deals."
    ]);
    
    this.knowledgeBase.set('student', [
      "Students save 15% with code STUDENT15 after quick verification.",
      "Yes! Use EDU10 for an exclusive 10% student discount.",
      "The SCHOLAR20 code gives verified students 20% off everything."
    ]);
    
    this.knowledgeBase.set('stacking', [
      "Most sites only allow one promo code per order. I've already sorted them by savings amount for you!",
      "Unfortunately, you can typically only use one coupon code at checkout. I'll help you pick the best one.",
      "Coupon stacking isn't usually allowed, but I'll find you the single best code to maximize your savings."
    ]);
    
    this.knowledgeBase.set('expiry', [
      "These coupons are valid through the end of this month. I'll let you know if any are expiring soon.",
      "All current codes are active and verified. The FLASH30 code expires tonight at midnight!",
      "These deals are currently active. I check them regularly to ensure they're working."
    ]);
    
    this.knowledgeBase.set('general_help', [
      "I can help you find coupon codes, apply them automatically, and maximize your savings. What would you like to know?",
      "I'm here to help you save money! I can find the best coupons, explain how they work, or apply them for you.",
      "Ask me anything about coupons, discounts, or saving money on your purchase. I'm here to help!"
    ]);
  }

  async initialize() {
    if (this.isReady) return;
    if (this.isLoading) return;

    this.isLoading = true;
    
    try {
      console.log('Initializing AI service...');
      
      // Simulate model loading time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('AI service ready!');
      this.isReady = true;
    } catch (error) {
      console.error('Failed to initialize AI:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async processChat(messages: ChatMessage[]): Promise<string> {
    if (!this.isReady) {
      await this.initialize();
    }

    const lastMessage = messages[messages.length - 1];
    const query = lastMessage.content.toLowerCase();
    const tokens = this.tokenizer.tokenize(query);
    
    // Analyze intent based on keywords
    const intent = this.classifyIntent(query, tokens);
    
    // Get context from conversation history
    const context = this.extractContext(messages);
    
    // Generate response based on intent and context
    let response = this.generateResponse(intent, context);
    
    // Personalize response with context
    if (context.cartTotal) {
      response = response.replace('$X', `$${context.cartTotal.toFixed(2)}`);
    }
    
    if (context.hasAskedBefore.has(intent)) {
      // Provide a different response if they've asked similar questions
      const alternatives = this.knowledgeBase.get(intent) || [];
      const unused = alternatives.filter(r => !context.usedResponses.has(r));
      if (unused.length > 0) {
        response = unused[Math.floor(Math.random() * unused.length)];
      }
    }
    
    return response;
  }

  private classifyIntent(query: string, tokens: number[]): string {
    // Simple intent classification based on keywords
    const intents = {
      greeting: ['hello', 'hi', 'hey', 'greetings'],
      best_deal: ['best', 'recommend', 'biggest', 'maximum', 'most', 'top'],
      shipping: ['ship', 'shipping', 'delivery', 'free shipping'],
      how_to_use: ['how', 'work', 'use', 'apply', 'click'],
      student: ['student', 'edu', 'college', 'university'],
      stacking: ['multiple', 'stack', 'combine', 'together'],
      expiry: ['expire', 'valid', 'when', 'until', 'deadline'],
    };
    
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        return intent;
      }
    }
    
    return 'general_help';
  }

  private extractContext(messages: ChatMessage[]) {
    const context = {
      cartTotal: null as number | null,
      hasAskedBefore: new Set<string>(),
      usedResponses: new Set<string>(),
      merchantName: 'this store',
    };
    
    // Extract information from previous messages
    messages.forEach(msg => {
      if (msg.role === 'user') {
        const intent = this.classifyIntent(msg.content.toLowerCase(), []);
        context.hasAskedBefore.add(intent);
      } else if (msg.role === 'assistant') {
        context.usedResponses.add(msg.content);
      }
      
      // Extract cart total if mentioned
      const priceMatch = msg.content.match(/\$([0-9]+\.?[0-9]*)/); 
      if (priceMatch) {
        context.cartTotal = parseFloat(priceMatch[1]);
      }
    });
    
    return context;
  }

  private generateResponse(intent: string, context: any): string {
    const responses = this.knowledgeBase.get(intent) || this.knowledgeBase.get('general_help')!;
    
    // Use AI-like selection based on context
    let selectedResponse: string;
    
    if (context.usedResponses.size === 0) {
      // First response - pick the most informative one
      selectedResponse = responses[0];
    } else {
      // Subsequent responses - pick one we haven't used
      const unused = responses.filter(r => !context.usedResponses.has(r));
      selectedResponse = unused.length > 0 
        ? unused[Math.floor(Math.random() * unused.length)]
        : responses[Math.floor(Math.random() * responses.length)];
    }
    
    return selectedResponse;
  }

  async rankCoupons(coupons: Coupon[], cartTotal: number): Promise<RankedCoupon[]> {
    // Intelligent ranking algorithm
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
          potentialSavings = (cartTotal * coupon.discount_value) / 200;
          score = 0.6 + coupon.success_rate * 0.4;
          break;
      }

      // Apply minimum purchase penalty
      if (coupon.minimum_purchase && cartTotal < coupon.minimum_purchase) {
        score = 0;
      }

      // Boost score for recently verified coupons
      const daysSinceVerified = (Date.now() - coupon.last_verified_ts) / (1000 * 60 * 60 * 24);
      if (daysSinceVerified < 1) {
        score *= 1.2;
      } else if (daysSinceVerified > 7) {
        score *= 0.9;
      }

      return {
        ...coupon,
        score: Math.min(Number(score.toFixed(3)), 1),
        confidence: 0.85 + Math.random() * 0.15,
      } as RankedCoupon;
    });

    return rankedCoupons.sort((a, b) => b.score - a.score);
  }

  getLoadingStatus() {
    return {
      isLoading: this.isLoading,
      isReady: this.isReady
    };
  }
}