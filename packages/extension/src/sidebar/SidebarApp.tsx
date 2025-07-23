import React, { useState, useEffect } from 'react';
import { Coupon, RankedCoupon, ChatMessage } from '@simplycodes/types';
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
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">SimplyCodes Assistant</h1>
          <ModelStatus status={pageData?.modelStatus || 'loading'} light />
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-primary-700 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'coupons'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('coupons')}
        >
          Coupons ({pageData?.coupons.length || 0})
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('chat')}
        >
          AI Assistant
        </button>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'coupons' ? (
          <div className="h-full flex flex-col">
            {pageData?.cartTotal && (
              <div className="px-4 py-3 bg-gray-50 border-b">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cart Total:</span>
                  <span className="font-semibold">${pageData.cartTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-auto">
              {pageData?.coupons.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
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
      <footer className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 text-center">
        Privacy-first AI • All processing happens locally
      </footer>
    </div>
  );
}