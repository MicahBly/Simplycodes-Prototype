import { ModelLoader, LLMInference, CouponRanker } from '@/ml';
import { MockDataService } from '@/services/mock-data-service';
import { ExtensionMessage, ModelConfig, ChatMessage } from '@/types';

// Model configurations
const MODELS: Record<string, ModelConfig> = {
  llm: {
    name: 'tinyllama-1.1b',
    path: '/models/tinyllama-1.1b-chat-v1.0.Q5_K_M.onnx',
    format: 'onnx',
    size: 638 * 1024 * 1024, // ~638MB
    quantization: 'Q5_K_M',
    provider: 'webgpu',
  },
  ranker: {
    name: 'coupon-ranker-xgb',
    path: '/models/coupon_ranker_xgboost.onnx',
    format: 'onnx',
    size: 256 * 1024, // ~256KB
    provider: 'wasm',
  },
};

// Service worker state
class ServiceWorkerState {
  private modelLoader: ModelLoader;
  private llmInference: LLMInference;
  private couponRanker: CouponRanker;
  private modelsLoaded = false;
  private loadingPromise?: Promise<void>;

  constructor() {
    this.modelLoader = ModelLoader.getInstance();
    this.llmInference = new LLMInference();
    this.couponRanker = new CouponRanker();
  }

  async ensureModelsLoaded(): Promise<void> {
    if (this.modelsLoaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = this.loadModels();
    await this.loadingPromise;
  }

  private async loadModels(): Promise<void> {
    try {
      console.log('Starting model loading...');
      
      // Load models with progress reporting
      const loadPromises = [
        this.modelLoader.loadModel(MODELS.llm, (progress) => {
          this.broadcastProgress('llm', progress);
        }),
        this.modelLoader.loadModel(MODELS.ranker, (progress) => {
          this.broadcastProgress('ranker', progress);
        }),
      ];

      await Promise.all(loadPromises);

      // Initialize inference engines
      await this.llmInference.initialize(MODELS.llm.name);
      await this.couponRanker.initialize(MODELS.ranker.name);

      this.modelsLoaded = true;
      console.log('Models loaded successfully');
      
      // Notify all tabs that models are ready
      this.broadcastModelStatus('ready');
    } catch (error) {
      console.error('Failed to load models:', error);
      this.broadcastModelStatus('error');
      throw error;
    }
  }

  private broadcastProgress(model: string, progress: { percentage: number }) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'MODEL_PROGRESS',
            payload: { model, progress: progress.percentage },
          });
        }
      });
    });
  }

  private broadcastModelStatus(status: 'loading' | 'ready' | 'error') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'MODEL_STATUS',
            payload: { status },
          });
        }
      });
    });
  }

  async handleMessage(message: ExtensionMessage, sender: chrome.runtime.MessageSender) {
    switch (message.type) {
      case 'GET_COUPONS':
        return this.handleGetCoupons(message.payload);
      
      case 'APPLY_COUPON':
        return this.handleApplyCoupon(message.payload, sender);
      
      case 'CHAT_MESSAGE':
        return this.handleChatMessage(message.payload);
      
      case 'MODEL_STATUS':
        return { status: this.modelsLoaded ? 'ready' : 'loading' };
      
      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  }

  private async handleGetCoupons(payload: { domain: string; cartTotal?: number }) {
    // Simulate API delay
    await MockDataService.simulateApiDelay();

    // Get merchant hash for privacy
    const merchantHash = MockDataService.getMerchantHash(payload.domain);
    
    // Get coupons from mock data
    const coupons = MockDataService.getCoupons(payload.domain);

    // Rank coupons if cart total is provided and ranker is loaded
    if (payload.cartTotal && this.modelsLoaded) {
      try {
        const rankedCoupons = await this.couponRanker.rankCoupons(
          coupons,
          payload.cartTotal
        );
        return { coupons: rankedCoupons, merchantHash };
      } catch (error) {
        console.error('Ranking failed, returning unranked:', error);
      }
    }

    return { coupons, merchantHash };
  }

  private async handleApplyCoupon(
    payload: { code: string; tabId: number },
    sender: chrome.runtime.MessageSender
  ) {
    const tabId = payload.tabId || sender.tab?.id;
    if (!tabId) {
      throw new Error('No tab ID provided');
    }

    // Get site config
    const tab = await chrome.tabs.get(tabId);
    const url = new URL(tab.url || '');
    const siteConfig = MockDataService.getSiteConfig(url.hostname);

    if (!siteConfig) {
      throw new Error('Site not supported');
    }

    // Inject code to apply coupon
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: applyCouponCode,
      args: [payload.code, siteConfig.selectors],
    });

    return results[0]?.result;
  }

  private async handleChatMessage(payload: { messages: ChatMessage[] }) {
    await this.ensureModelsLoaded();

    // Create a promise that will be resolved with the complete response
    let completeResponse = '';
    
    const response = await this.llmInference.generate(
      payload.messages,
      {
        maxTokens: 150,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        repetitionPenalty: 1.1,
      },
      (token) => {
        completeResponse += token;
        // In a real implementation, we'd stream this to the client
      }
    );

    return { response: completeResponse };
  }
}

// Function to inject into page for applying coupon
function applyCouponCode(
  code: string,
  selectors: { couponInput: string; applyButton: string }
): { success: boolean; message: string } {
  try {
    // Find coupon input
    const input = document.querySelector(selectors.couponInput) as HTMLInputElement;
    if (!input) {
      return { success: false, message: 'Coupon input not found' };
    }

    // Clear and fill input
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.value = code;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Find and click apply button
    const button = document.querySelector(selectors.applyButton) as HTMLElement;
    if (!button) {
      return { success: false, message: 'Apply button not found' };
    }

    button.click();
    return { success: true, message: 'Coupon applied successfully' };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Initialize service worker
const state = new ServiceWorkerState();

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('SimplyCodes extension installed');
  
  // Set default storage values
  chrome.storage.local.set({
    settings: {
      autoApply: true,
      showNotifications: true,
      privacyMode: true,
    },
    statistics: {
      totalSaved: 0,
      couponsApplied: 0,
    },
  });
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle async response
  (async () => {
    try {
      const response = await state.handleMessage(message, sender);
      sendResponse({ success: true, data: response });
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  })();

  // Return true to indicate async response
  return true;
});

// Handle tab updates to check for supported sites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);
    
    if (MockDataService.isSiteSupported(url.hostname)) {
      // Show page action
      chrome.action.setBadgeText({ text: '✓', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#22c55e', tabId });
    }
  }
});

// Export for testing
export { ServiceWorkerState };