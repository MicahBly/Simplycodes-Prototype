import React, { useState, useEffect } from 'react';
import { Coupon, RankedCoupon } from '@simplycodes/types';
import { MockDataService } from '@simplycodes/shared-mock-data';
import { CouponList } from '../components/CouponList';
import { ModelStatus } from '../components/ModelStatus';
import { useExtensionStore } from '../stores/extension-store';

export function PopupApp() {
  const [coupons, setCoupons] = useState<(Coupon | RankedCoupon)[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
  const [cartTotal, setCartTotal] = useState<number | null>(null);
  const { modelStatus, statistics } = useExtensionStore();

  useEffect(() => {
    loadCurrentTab();
  }, []);

  useEffect(() => {
    if (currentTab?.url) {
      loadCoupons();
    }
  }, [currentTab]);

  const loadCurrentTab = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    setCurrentTab(tab);
  };

  const loadCoupons = async () => {
    if (!currentTab?.url) return;

    setLoading(true);
    try {
      const url = new URL(currentTab.url);
      const response = await chrome.runtime.sendMessage({
        type: 'GET_COUPONS',
        payload: {
          domain: url.hostname,
          cartTotal: cartTotal,
        },
      });

      if (response.success) {
        setCoupons(response.data.coupons);
      }
    } catch (error) {
      console.error('Failed to load coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyBestDeal = async () => {
    if (coupons.length === 0 || !currentTab?.id) return;

    // Get the best coupon (first one if ranked)
    const bestCoupon = coupons[0];
    
    const response = await chrome.runtime.sendMessage({
      type: 'APPLY_COUPON',
      payload: {
        code: bestCoupon.code,
        tabId: currentTab.id,
      },
    });

    if (response.success) {
      // Update statistics
      await chrome.storage.local.set({
        statistics: {
          ...statistics,
          couponsApplied: statistics.couponsApplied + 1,
        },
      });
      
      // Show success notification
      alert('Coupon applied successfully!');
    } else {
      alert(`Failed to apply coupon: ${response.error}`);
    }
  };

  const isSupported = currentTab?.url && 
    MockDataService.isSiteSupported(new URL(currentTab.url).hostname);

  return (
    <div className="w-96 h-[600px] bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">SimplyCodes</h1>
          <ModelStatus status={modelStatus} />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {!isSupported ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Site Not Supported
            </h2>
            <p className="text-sm text-gray-600">
              SimplyCodes works on major e-commerce sites. Navigate to a supported site to see available deals.
            </p>
          </div>
        ) : loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              No Coupons Available
            </h2>
            <p className="text-sm text-gray-600">
              We couldn't find any active coupons for this site right now.
            </p>
          </div>
        ) : (
          <>
            <div className="p-4 bg-white border-b">
              <button
                onClick={handleApplyBestDeal}
                className="w-full btn-primary flex items-center justify-center gap-2"
                disabled={modelStatus !== 'ready'}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apply Best Deal
              </button>
              {cartTotal && (
                <p className="text-sm text-gray-600 text-center mt-2">
                  Cart Total: ${cartTotal.toFixed(2)}
                </p>
              )}
            </div>
            <CouponList coupons={coupons} onApply={() => {}} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            Total Saved: <span className="font-medium text-green-600">
              ${statistics.totalSaved.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="text-primary-600 hover:text-primary-700"
          >
            Settings
          </button>
        </div>
      </footer>
    </div>
  );
}