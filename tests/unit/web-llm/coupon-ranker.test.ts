import { CouponRanker } from '@simplycodes/web-llm';
import { Coupon } from '@simplycodes/types';
import * as ort from 'onnxruntime-web';

// Mock onnxruntime-web
jest.mock('onnxruntime-web');

// Mock ModelLoader
jest.mock('@simplycodes/web-llm/model-loader', () => ({
  ModelLoader: {
    getInstance: () => ({
      getSession: jest.fn().mockReturnValue({
        run: jest.fn().mockResolvedValue({
          scores: new ort.Tensor('float32', new Float32Array([0.9, 0.7, 0.5]), [3]),
          confidence: new ort.Tensor('float32', new Float32Array([0.95, 0.85, 0.75]), [3]),
        }),
      }),
    }),
  },
}));

describe('CouponRanker', () => {
  let ranker: CouponRanker;
  
  const mockCoupons: Coupon[] = [
    {
      id: '1',
      code: 'SAVE20',
      merchant_id: 'test',
      discount_type: 'percentage',
      discount_value: 20,
      description: '20% off',
      success_rate: 0.9,
      last_verified_ts: Date.now() - 86400000, // 1 day ago
    },
    {
      id: '2',
      code: 'SHIP10',
      merchant_id: 'test',
      discount_type: 'fixed',
      discount_value: 10,
      description: '$10 off',
      success_rate: 0.8,
      last_verified_ts: Date.now() - 172800000, // 2 days ago
    },
    {
      id: '3',
      code: 'FREESHIP',
      merchant_id: 'test',
      discount_type: 'free_shipping',
      discount_value: 0,
      description: 'Free shipping',
      success_rate: 0.95,
      last_verified_ts: Date.now(),
    },
  ];

  beforeEach(() => {
    ranker = new CouponRanker();
  });

  describe('rankCoupons', () => {
    it('should rank coupons and return them sorted by score', async () => {
      await ranker.initialize('test-model');
      const ranked = await ranker.rankCoupons(mockCoupons, 100);

      expect(ranked).toHaveLength(3);
      expect(ranked[0].score).toBe(0.9);
      expect(ranked[1].score).toBe(0.7);
      expect(ranked[2].score).toBe(0.5);
      
      // Check that coupons are sorted by score descending
      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i-1].score).toBeGreaterThanOrEqual(ranked[i].score);
      }
    });

    it('should handle empty coupon list', async () => {
      await ranker.initialize('test-model');
      const ranked = await ranker.rankCoupons([], 100);
      expect(ranked).toEqual([]);
    });

    it('should calculate effective discount for percentage coupons', async () => {
      await ranker.initialize('test-model');
      
      // Spy on private method through prototype
      const extractFeaturesSpy = jest.spyOn(ranker as any, 'extractFeatures');
      
      await ranker.rankCoupons([mockCoupons[0]], 100);
      
      expect(extractFeaturesSpy).toHaveBeenCalled();
      const features = extractFeaturesSpy.mock.results[0].value;
      expect(features.discount_value).toBe(20); // 20% of $100
    });
  });

  describe('getBestCoupon', () => {
    it('should return the highest scoring coupon above confidence threshold', async () => {
      await ranker.initialize('test-model');
      const best = await ranker.getBestCoupon(mockCoupons, 100, 0.8);

      expect(best).toBeDefined();
      expect(best?.score).toBe(0.9);
      expect(best?.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should return null if no coupons meet confidence threshold', async () => {
      await ranker.initialize('test-model');
      const best = await ranker.getBestCoupon(mockCoupons, 100, 0.99);

      expect(best).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should throw error if model not initialized', async () => {
      await expect(ranker.rankCoupons(mockCoupons, 100))
        .rejects.toThrow('Ranking model not initialized');
    });
  });
});