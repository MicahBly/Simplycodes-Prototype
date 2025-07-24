import React from 'react';
import { Coupon, RankedCoupon } from '@/types';
import clsx from 'clsx';

interface CouponListProps {
  coupons: (Coupon | RankedCoupon)[];
  onApply: (code: string) => void;
}

export function CouponList({ coupons, onApply }: CouponListProps) {
  const isRanked = (coupon: Coupon | RankedCoupon): coupon is RankedCoupon => {
    return 'score' in coupon;
  };

  const getSuccessColor = (rate: number) => {
    if (rate >= 0.8) return 'text-green-600 bg-green-50';
    if (rate >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    switch (coupon.discount_type) {
      case 'percentage':
        return `${coupon.discount_value}% OFF`;
      case 'fixed':
        return `$${coupon.discount_value} OFF`;
      case 'free_shipping':
        return 'FREE SHIPPING';
      case 'bogo':
        return `BOGO ${coupon.discount_value}%`;
      default:
        return coupon.discount_value;
    }
  };

  return (
    <div className="divide-y divide-sc-gray-800">
      {coupons.map((coupon, index) => (
        <div
          key={coupon.id}
          className={clsx(
            'p-4 hover:bg-sc-gray-800 transition-colors',
            index === 0 && isRanked(coupon) && 'bg-sc-card hover:bg-sc-gray-700'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm font-semibold text-white">
                  {coupon.code}
                </span>
                {index === 0 && isRanked(coupon) && (
                  <span className="text-xs bg-sc-green text-sc-dark px-2 py-0.5 rounded-full font-bold">
                    BEST DEAL
                  </span>
                )}
              </div>
              
              <p className="text-sm text-white/70 mb-2">
                {coupon.description}
              </p>
              
              <div className="flex items-center gap-4 text-xs">
                <span className={clsx(
                  'px-2 py-1 rounded-full font-medium',
                  getSuccessColor(coupon.success_rate)
                )}>
                  {Math.round(coupon.success_rate * 100)}% success
                </span>
                
                <span className="text-white/60">
                  {getDiscountDisplay(coupon)}
                </span>
                
                {coupon.minimum_purchase && (
                  <span className="text-white/60">
                    Min: ${coupon.minimum_purchase}
                  </span>
                )}
                
                {isRanked(coupon) && (
                  <span className="text-primary-600 font-medium">
                    Score: {coupon.score.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => onApply(coupon.code)}
              className="btn-secondary text-sm px-3 py-1.5"
            >
              Apply
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}