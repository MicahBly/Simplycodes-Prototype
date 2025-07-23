import { MockDataService } from '@simplycodes/shared-mock-data';
import { ExtensionMessage } from '@simplycodes/types';
import './content.css';

class ContentScript {
  private sidebarIframe?: HTMLIFrameElement;
  private sidebarContainer?: HTMLDivElement;
  private isOpen = false;
  private modelStatus: 'loading' | 'ready' | 'error' = 'loading';

  constructor() {
    this.init();
  }

  private async init() {
    // Check if site is supported
    const hostname = window.location.hostname;
    if (!MockDataService.isSiteSupported(hostname)) {
      console.log('Site not supported:', hostname);
      return;
    }

    // Create sidebar toggle button
    this.createToggleButton();

    // Listen for messages from background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message);
    });

    // Check model status
    this.checkModelStatus();

    // Auto-open on checkout pages
    if (this.isCheckoutPage()) {
      setTimeout(() => this.openSidebar(), 1000);
    }
  }

  private createToggleButton() {
    const button = document.createElement('button');
    button.id = 'simplycodes-toggle';
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 11H7V13H9V11Z" fill="currentColor"/>
        <path d="M13 11H11V13H13V11Z" fill="currentColor"/>
        <path d="M17 11H15V13H17V11Z" fill="currentColor"/>
        <path d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4ZM20 18H4V8H20V18Z" fill="currentColor"/>
      </svg>
      <span class="simplycodes-badge">SC</span>
    `;
    
    // Style the button
    button.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 80px;
      width: 56px;
      height: 56px;
      border-radius: 28px;
      background: #0ea5e9;
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    `;

    // Add hover effect
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });

    // Toggle sidebar on click
    button.addEventListener('click', () => {
      if (this.isOpen) {
        this.closeSidebar();
      } else {
        this.openSidebar();
      }
    });

    document.body.appendChild(button);
  }

  private createSidebar() {
    // Create container
    this.sidebarContainer = document.createElement('div');
    this.sidebarContainer.id = 'simplycodes-sidebar-container';
    this.sidebarContainer.style.cssText = `
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      height: 100%;
      background: white;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
      z-index: 999999;
      transition: right 0.3s ease;
    `;

    // Create iframe for React app
    this.sidebarIframe = document.createElement('iframe');
    this.sidebarIframe.id = 'simplycodes-sidebar';
    this.sidebarIframe.src = chrome.runtime.getURL('sidebar/index.html');
    this.sidebarIframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
    `;

    this.sidebarContainer.appendChild(this.sidebarIframe);
    document.body.appendChild(this.sidebarContainer);

    // Setup message passing with iframe
    window.addEventListener('message', (event) => {
      if (event.source === this.sidebarIframe?.contentWindow) {
        this.handleIframeMessage(event.data);
      }
    });
  }

  private openSidebar() {
    if (!this.sidebarContainer) {
      this.createSidebar();
    }

    // Slide in
    setTimeout(() => {
      if (this.sidebarContainer) {
        this.sidebarContainer.style.right = '0';
        this.isOpen = true;
      }
    }, 100);

    // Get current page data
    this.sendPageData();
  }

  private closeSidebar() {
    if (this.sidebarContainer) {
      this.sidebarContainer.style.right = '-400px';
      this.isOpen = false;
    }
  }

  private async sendPageData() {
    const pageData = {
      url: window.location.href,
      title: document.title,
      price: this.extractPrice(),
      cartTotal: this.extractCartTotal(),
      productInfo: this.extractProductInfo(),
    };

    // Get coupons from background
    const response = await this.sendToBackground({
      type: 'GET_COUPONS',
      payload: {
        domain: window.location.hostname,
        cartTotal: pageData.cartTotal,
      },
    });

    if (response.success) {
      this.postToSidebar({
        type: 'PAGE_DATA',
        payload: {
          ...pageData,
          coupons: response.data.coupons,
          modelStatus: this.modelStatus,
        },
      });
    }
  }

  private extractPrice(): number | null {
    const siteConfig = MockDataService.getSiteConfig(window.location.hostname);
    if (!siteConfig) return null;

    const priceElement = document.querySelector(siteConfig.selectors.priceElement);
    if (!priceElement) return null;

    const priceText = priceElement.textContent || '';
    const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
    
    return isNaN(price) ? null : price;
  }

  private extractCartTotal(): number | null {
    const siteConfig = MockDataService.getSiteConfig(window.location.hostname);
    if (!siteConfig || !siteConfig.selectors.cartTotal) return null;

    const totalElement = document.querySelector(siteConfig.selectors.cartTotal);
    if (!totalElement) return null;

    const totalText = totalElement.textContent || '';
    const total = parseFloat(totalText.replace(/[^0-9.]/g, ''));
    
    return isNaN(total) ? null : total;
  }

  private extractProductInfo() {
    // Extract basic product information from the page
    const info: any = {
      title: document.title,
      url: window.location.href,
    };

    // Try to find product title
    const h1 = document.querySelector('h1');
    if (h1) {
      info.productName = h1.textContent?.trim();
    }

    // Try to find product image
    const productImage = document.querySelector('img[alt*="product"], img[alt*="item"], .product-image img');
    if (productImage instanceof HTMLImageElement) {
      info.imageUrl = productImage.src;
    }

    return info;
  }

  private isCheckoutPage(): boolean {
    const url = window.location.href.toLowerCase();
    const checkoutKeywords = ['checkout', 'cart', 'basket', 'order', 'payment'];
    return checkoutKeywords.some(keyword => url.includes(keyword));
  }

  private async checkModelStatus() {
    const response = await this.sendToBackground({
      type: 'MODEL_STATUS',
      payload: {},
    });

    if (response.success) {
      this.modelStatus = response.data.status;
      this.updateModelStatus(this.modelStatus);
    }
  }

  private updateModelStatus(status: 'loading' | 'ready' | 'error') {
    this.modelStatus = status;
    
    // Update toggle button appearance based on status
    const button = document.getElementById('simplycodes-toggle');
    if (button) {
      const badge = button.querySelector('.simplycodes-badge');
      if (badge) {
        switch (status) {
          case 'loading':
            badge.textContent = '...';
            break;
          case 'ready':
            badge.textContent = 'SC';
            break;
          case 'error':
            badge.textContent = '!';
            break;
        }
      }
    }

    // Notify sidebar
    if (this.isOpen) {
      this.postToSidebar({
        type: 'MODEL_STATUS',
        payload: { status },
      });
    }
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'MODEL_STATUS':
        this.updateModelStatus(message.payload.status);
        break;
      case 'MODEL_PROGRESS':
        // Could show progress in UI
        console.log('Model loading progress:', message.payload);
        break;
    }
  }

  private async handleIframeMessage(message: any) {
    switch (message.type) {
      case 'APPLY_COUPON':
        const response = await this.sendToBackground({
          type: 'APPLY_COUPON',
          payload: {
            code: message.payload.code,
            tabId: 0, // Will be filled by background
          },
        });
        
        this.postToSidebar({
          type: 'COUPON_APPLIED',
          payload: response,
        });
        break;
        
      case 'SEND_CHAT':
        const chatResponse = await this.sendToBackground({
          type: 'CHAT_MESSAGE',
          payload: message.payload,
        });
        
        this.postToSidebar({
          type: 'CHAT_RESPONSE',
          payload: chatResponse,
        });
        break;
        
      case 'CLOSE_SIDEBAR':
        this.closeSidebar();
        break;
    }
  }

  private sendToBackground(message: ExtensionMessage): Promise<any> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }

  private postToSidebar(message: any) {
    if (this.sidebarIframe?.contentWindow) {
      this.sidebarIframe.contentWindow.postMessage(message, '*');
    }
  }
}

// Initialize content script
new ContentScript();

// Add minimal styles for badge
const style = document.createElement('style');
style.textContent = `
  .simplycodes-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ef4444;
    color: white;
    font-size: 10px;
    font-weight: bold;
    padding: 2px 4px;
    border-radius: 8px;
    min-width: 16px;
    text-align: center;
  }
`;
document.head.appendChild(style);