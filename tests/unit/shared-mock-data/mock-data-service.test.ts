import { MockDataService } from '@simplycodes/shared-mock-data';

describe('MockDataService', () => {
  describe('getCoupons', () => {
    it('should return coupons for a specific merchant', () => {
      const coupons = MockDataService.getCoupons('amazon.com');
      expect(coupons).toBeDefined();
      expect(Array.isArray(coupons)).toBe(true);
      expect(coupons.length).toBeGreaterThan(0);
      expect(coupons[0].merchant_id).toBe('amazon');
    });

    it('should return empty array for unsupported merchant', () => {
      const coupons = MockDataService.getCoupons('unknown.com');
      expect(coupons).toEqual([]);
    });
  });

  describe('searchProducts', () => {
    it('should find products by name', () => {
      const results = MockDataService.searchProducts('headphones');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name.toLowerCase()).toContain('headphone');
    });

    it('should respect limit parameter', () => {
      const results = MockDataService.searchProducts('', 5);
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products in a specific category', () => {
      const products = MockDataService.getProductsByCategory('electronics');
      expect(products.length).toBeGreaterThan(0);
      products.forEach(product => {
        expect(product.categories).toContain('electronics');
      });
    });
  });

  describe('getSiteConfig', () => {
    it('should return config for supported sites', () => {
      const config = MockDataService.getSiteConfig('amazon.com');
      expect(config).toBeDefined();
      expect(config?.selectors).toBeDefined();
      expect(config?.selectors.priceElement).toBeTruthy();
    });

    it('should return undefined for unsupported sites', () => {
      const config = MockDataService.getSiteConfig('unknown.com');
      expect(config).toBeUndefined();
    });
  });

  describe('isSiteSupported', () => {
    it('should return true for supported sites', () => {
      expect(MockDataService.isSiteSupported('amazon.com')).toBe(true);
      expect(MockDataService.isSiteSupported('www.amazon.com')).toBe(true);
      expect(MockDataService.isSiteSupported('bestbuy.com')).toBe(true);
    });

    it('should return false for unsupported sites', () => {
      expect(MockDataService.isSiteSupported('unknown.com')).toBe(false);
    });
  });

  describe('getTopContributors', () => {
    it('should return contributors sorted by reputation', () => {
      const contributors = MockDataService.getTopContributors(5);
      expect(contributors.length).toBe(5);
      
      for (let i = 1; i < contributors.length; i++) {
        expect(contributors[i-1].reputation)
          .toBeGreaterThanOrEqual(contributors[i].reputation);
      }
    });
  });

  describe('getMerchantHash', () => {
    it('should generate consistent hashes', () => {
      const hash1 = MockDataService.getMerchantHash('amazon.com');
      const hash2 = MockDataService.getMerchantHash('amazon.com');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different domains', () => {
      const hash1 = MockDataService.getMerchantHash('amazon.com');
      const hash2 = MockDataService.getMerchantHash('ebay.com');
      expect(hash1).not.toBe(hash2);
    });
  });
});