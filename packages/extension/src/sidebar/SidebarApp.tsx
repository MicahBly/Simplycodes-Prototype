import React, { useState, useEffect } from 'react';
import { Coupon, RankedCoupon, ChatMessage } from '@/types';
import { CouponList } from '../components/CouponList';
import { ChatInterface } from '../components/ChatInterface';
import { ModelStatus } from '../components/ModelStatus';

type TabType = 'coupons' | 'chat';

interface PageData {
  url: string;
  title: string;
  price: number | null;
  cartTotal: number | null;
  productInfo: any;
  coupons: (Coupon | RankedCoupon)[];
  modelStatus: 'loading' | 'ready' | 'error';
}

export function SidebarApp() {
  const [activeTab, setActiveTab] = useState<TabType>('coupons');
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Listen for messages from content script
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [messages]);

  const handleMessage = (event: MessageEvent) => {
    if (event.source !== window.parent) return;

    switch (event.data.type) {
      case 'PAGE_DATA':
        setPageData(event.data.payload);
        break;
      case 'MODEL_STATUS':
        if (pageData) {
          setPageData({
            ...pageData,
            modelStatus: event.data.payload.status,
          });
        }
        break;
      case 'COUPON_APPLIED':
        if (event.data.payload.success) {
          showNotification('Coupon applied successfully!', 'success');
        } else {
          showNotification(`Failed: ${event.data.payload.error}`, 'error');
        }
        break;
      case 'CHAT_RESPONSE':
        if (event.data.payload.success) {
          const assistantMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: event.data.payload.data.response,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
        setIsLoading(false);
        break;
    }
  };

  const handleApplyCoupon = (code: string) => {
    window.parent.postMessage({
      type: 'APPLY_COUPON',
      payload: { code },
    }, '*');
  };

  const handleSendMessage = (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    window.parent.postMessage({
      type: 'SEND_CHAT',
      payload: {
        messages: [...messages, userMessage],
      },
    }, '*');
  };

  const handleClose = () => {
    window.parent.postMessage({ type: 'CLOSE_SIDEBAR' }, '*');
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Simple notification implementation
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } animate-fade-in`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  return (
    <div className="h-screen flex flex-col bg-sc-darker rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <header className="bg-sc-dark text-white px-4 py-3 flex items-center justify-between rounded-t-2xl">
        <div className="flex items-center gap-3">
          {/* SimplyCodes Logo */}
          <div className="w-10 h-10 bg-sc-green rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-sc-dark font-black text-2xl">S</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">SimplyCodes</h1>
            <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">
              PROTOTYPE
            </span>
          </div>
          <ModelStatus status={pageData?.modelStatus || 'loading'} light />
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-sc-gray-800 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Tab Navigation */}
      <div className="flex border-b border-sc-gray-800 bg-sc-dark">
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'coupons'
              ? 'text-sc-green border-b-2 border-sc-green'
              : 'text-white/70 hover:text-white'
          }`}
          onClick={() => setActiveTab('coupons')}
        >
          Coupons ({pageData?.coupons.length || 0})
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'text-sc-green border-b-2 border-sc-green'
              : 'text-white/70 hover:text-white'
          }`}
          onClick={() => setActiveTab('chat')}
        >
          AI Assistant
        </button>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-hidden bg-sc-darker">
        {activeTab === 'coupons' ? (
          <div className="h-full flex flex-col">
            {pageData?.cartTotal && (
              <div className="px-4 py-3 bg-sc-card border-b border-sc-gray-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Cart Total:</span>
                  <span className="font-semibold text-white">${pageData.cartTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-auto">
              {pageData?.coupons.length === 0 ? (
                <div className="p-8 text-center text-white/70">
                  No coupons available for this site
                </div>
              ) : (
                <CouponList
                  coupons={pageData?.coupons || []}
                  onApply={handleApplyCoupon}
                />
              )}
            </div>
          </div>
        ) : (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            disabled={pageData?.modelStatus !== 'ready'}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="px-4 py-2 bg-sc-dark border-t border-sc-gray-800 text-xs text-white/50 text-center rounded-b-2xl">
        Privacy-first AI • All processing happens locally
      </footer>
    </div>
  );
}