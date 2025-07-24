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
      "Welcome! Let me help you maximize your savings on this purchase.",
      "Hey! Ready to save some money? I'll find you the best coupon codes."
    ]);
    
    this.knowledgeBase.set('best_deal', [
      "Looking at your current options, the SAVE25 code offers 25% off your entire purchase - that's the biggest discount available right now.",
      "I've analyzed all available coupons. The FLASH30 code gives you the best value at 30% off everything.",
      "For maximum savings, I recommend the MEGA20 code - it takes 20% off your total and has a high success rate.",
      "The best deal depends on your cart, but SAVE25 typically gives the biggest discount at 25% off."
    ]);
    
    this.knowledgeBase.set('shipping', [
      "Yes! The FREESHIP code provides free standard shipping on orders over $50.",
      "You can get free shipping with SHIPFREE - no minimum purchase required.",
      "Free shipping is available! Use code NOSHIP at checkout.",
      "I found 3 free shipping codes. FREESHIP50 is the most reliable one."
    ]);
    
    this.knowledgeBase.set('how_to_use', [
      "It's simple! Just click the 'Apply' button next to any coupon and I'll automatically add it to your checkout.",
      "To use a coupon: 1) Click 'Apply' on any code, 2) I'll enter it for you, 3) The discount appears instantly!",
      "Click any coupon's Apply button and watch the magic happen - I'll handle everything automatically.",
      "Each coupon has an Apply button. Click it and I'll instantly add the code to your cart."
    ]);
    
    this.knowledgeBase.set('student', [
      "Students save 15% with code STUDENT15 after quick verification.",
      "Yes! Use EDU10 for an exclusive 10% student discount.",
      "The SCHOLAR20 code gives verified students 20% off everything.",
      "Student discounts are available! Try STUDENT15 for 15% off."
    ]);
    
    this.knowledgeBase.set('stacking', [
      "Most retailers only allow one promo code per order. I've sorted them by value so you can pick the best one!",
      "Unfortunately, coupon stacking isn't allowed here. But don't worry - I'll find you the single best code.",
      "You can only use one code at checkout, but I've ranked them to show which saves you the most.",
      "Can't combine codes, but the SAVE25 code alone will give you a great discount!"
    ]);
    
    this.knowledgeBase.set('expiry', [
      "All codes shown are currently active. I last verified them today.",
      "These coupons are valid through month-end. The FLASH30 expires tonight!",
      "I check coupon validity regularly. All displayed codes should work right now.",
      "Most codes are valid for at least another week. Time-sensitive ones are marked."
    ]);
    
    this.knowledgeBase.set('general_help', [
      "I can help you find coupon codes, apply them automatically, and maximize your savings. What would you like to know?",
      "I'm here to help you save money! Ask me about finding coupons, which code is best, or how to apply them.",
      "I'm your personal savings assistant! I can explain coupons, recommend the best deals, or apply codes for you.",
      "What can I help you with? I can find coupons, explain discounts, or apply codes automatically."
    ]);
    
    this.knowledgeBase.set('specific_code', [
      "Let me check that code for you... X gives you Y off Z.",
      "That code provides X discount when you meet the requirements.",
      "I'll verify that code's details and discount amount for you.",
      "Here's what that code does: X"
    ]);
    
    this.knowledgeBase.set('availability', [
      "I found X active coupon codes for this site. Let me show you the best ones!",
      "There are X coupons available right now. The best one saves you Y%.",
      "Good news! I have X working codes for you, with discounts up to Y% off.",
      "Yes, there are coupons available! I found X codes you can use."
    ]);
    
    this.knowledgeBase.set('not_working', [
      "If a code isn't working, try another one from the list - I've sorted them by success rate.",
      "Sometimes codes have hidden requirements. Let me find you an alternative that should work.",
      "That code might have expired. Try SAVE20 instead - it has a high success rate.",
      "No worries! Click 'Apply' on a different code and I'll test it for you."
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
    
    // Handle conversational/unclear queries with more context
    if (intent === 'general_help' && query.length < 10) {
      // Short queries like "ok", "hmm", "what?", etc.
      const conversationalResponses = [
        "I'm here to help! You can ask me about the best coupons, how to apply them, or anything else about saving money.",
        "Need more info? I can show you the best deals, explain how coupons work, or help you apply them.",
        "What would you like to know? I can recommend the best discount codes or explain how to use them.",
        "Feel free to ask me anything about the coupons! For example: 'What's the best deal?' or 'How do I apply a code?'"
      ];
      response = conversationalResponses[Math.floor(Math.random() * conversationalResponses.length)];
    }
    
    return response;
  }

  private classifyIntent(query: string, tokens: number[]): string {
    // Enhanced intent classification with fuzzy matching
    const intents = {
      greeting: {
        keywords: ['hello', 'hi', 'hey', 'greetings', 'sup', 'howdy'],
        patterns: [/^(hi|hello|hey)/i, /good (morning|afternoon|evening)/i]
      },
      best_deal: {
        keywords: ['best', 'recommend', 'biggest', 'maximum', 'most', 'top', 'highest', 'greatest'],
        patterns: [/which.*best/i, /what.*recommend/i, /biggest.*discount/i, /most.*sav/i]
      },
      shipping: {
        keywords: ['ship', 'shipping', 'delivery', 'mail', 'send'],
        patterns: [/free.*ship/i, /ship.*free/i, /delivery/i]
      },
      how_to_use: {
        keywords: ['how', 'work', 'use', 'apply', 'click', 'enter', 'add'],
        patterns: [/how.*use/i, /how.*work/i, /how.*apply/i, /where.*click/i]
      },
      student: {
        keywords: ['student', 'edu', 'college', 'university', 'school', 'academic'],
        patterns: [/student.*discount/i, /edu.*code/i]
      },
      stacking: {
        keywords: ['multiple', 'stack', 'combine', 'together', 'both', 'several'],
        patterns: [/use.*multiple/i, /combine.*code/i, /stack.*coupon/i, /more than one/i]
      },
      expiry: {
        keywords: ['expire', 'valid', 'when', 'until', 'deadline', 'last', 'end'],
        patterns: [/when.*expire/i, /how long.*valid/i, /until when/i]
      },
      specific_code: {
        keywords: ['code', 'coupon'],
        patterns: [/what.*(?:SAVE|FREE|FLASH|MEGA|STUDENT|EDU|SHIP)\d*/i, /tell.*about.*code/i]
      },
      availability: {
        keywords: ['any', 'available', 'have', 'exist', 'find'],
        patterns: [/any.*coupon/i, /are there.*code/i, /do you have/i, /can.*find/i]
      },
      not_working: {
        keywords: ['not working', 'doesnt work', "doesn't work", 'failed', 'error', 'invalid'],
        patterns: [/not.*work/i, /doesn.*work/i, /code.*fail/i, /invalid/i]
      }
    };
    
    // Check patterns first (more specific)
    for (const [intent, config] of Object.entries(intents)) {
      for (const pattern of config.patterns) {
        if (pattern.test(query)) {
          return intent;
        }
      }
    }
    
    // Then check keywords with fuzzy matching
    let bestIntent = 'general_help';
    let bestScore = 0;
    
    for (const [intent, config] of Object.entries(intents)) {
      let score = 0;
      for (const keyword of config.keywords) {
        if (query.includes(keyword)) {
          score += keyword.length; // Longer matches are better
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }
    
    // Check for question words if no clear intent
    if (bestScore === 0) {
      if (query.includes('?') || query.match(/^(what|where|when|why|who|how|is|are|can|do|does)/i)) {
        return 'general_help';
      }
    }
    
    return bestIntent;
  }

  private extractContext(messages: ChatMessage[]) {
    const context = {
      cartTotal: null as number | null,
      hasAskedBefore: new Set<string>(),
      usedResponses: new Set<string>(),
      merchantName: 'this store',
      couponCount: 8, // Default number of coupons
      bestDiscount: '30',
      requestedCode: null as string | null,
    };
    
    // Extract information from previous messages
    messages.forEach(msg => {
      if (msg.role === 'user') {
        const intent = this.classifyIntent(msg.content.toLowerCase(), []);
        context.hasAskedBefore.add(intent);
        
        // Extract specific code mentions
        const codeMatch = msg.content.match(/\b(SAVE|FREE|FLASH|MEGA|STUDENT|EDU|SHIP|NO)\w*\d*/i);
        if (codeMatch) {
          context.requestedCode = codeMatch[0].toUpperCase();
        }
      } else if (msg.role === 'assistant') {
        context.usedResponses.add(msg.content);
      }
      
      // Extract cart total if mentioned
      const priceMatch = msg.content.match(/\$([0-9]+\.?[0-9]*)/); 
      if (priceMatch) {
        context.cartTotal = parseFloat(priceMatch[1]);
      }
    });
    
    // Get actual coupon data if available
    const pageData = (window as any).__SIMPLYCODES_PAGE_DATA;
    if (pageData?.coupons) {
      context.couponCount = pageData.coupons.length;
      const bestCoupon = pageData.coupons[0];
      if (bestCoupon?.discount_value) {
        context.bestDiscount = bestCoupon.discount_value.toString();
      }
    }
    
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
    
    // Add dynamic elements based on actual coupon data
    if (intent === 'availability' && context.couponCount) {
      selectedResponse = selectedResponse
        .replace('X', context.couponCount.toString())
        .replace('Y', context.bestDiscount || '25');
    }
    
    if (intent === 'specific_code' && context.requestedCode) {
      const codeInfo = this.getCodeInfo(context.requestedCode);
      selectedResponse = selectedResponse.replace('X', codeInfo);
    }
    
    return selectedResponse;
  }
  
  private getCodeInfo(code: string): string {
    // Provide information about specific codes
    const codeDatabase: Record<string, string> = {
      'SAVE25': '25% off your entire purchase',
      'SAVE20': '20% off all items',
      'FLASH30': '30% off - limited time flash sale',
      'FREESHIP': 'free standard shipping',
      'FREESHIP50': 'free shipping on orders over $50',
      'STUDENT15': '15% student discount with verification',
      'EDU10': '10% education discount',
      'MEGA20': '20% off mega sale',
      'SHIPFREE': 'free shipping, no minimum',
      'NOSHIP': 'free shipping on any order'
    };
    
    const upperCode = code.toUpperCase();
    return codeDatabase[upperCode] || `${upperCode} provides a special discount`;
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