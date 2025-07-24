import { Coupon, Product, CommunityContributor, SupportedSite } from '@/types';
import Fuse from 'fuse.js';

// Import mock data
import couponsData from '@/data/coupons.json';
import productsData from '@/data/products.json';
import contributorsData from '@/data/contributors.json';
import supportedSitesData from '@/data/supported-sites.json';

// Type assertions for imported data
const coupons = couponsData as Coupon[];
const products = productsData as Product[];
const contributors = contributorsData as CommunityContributor[];
const supportedSites = supportedSitesData as SupportedSite[];

// Initialize Fuse.js for fuzzy search
const productFuse = new Fuse(products, {
  keys: ['name', 'description', 'categories'],
  threshold: 0.4,
  includeScore: true,
});

export class MockDataService {
  /**
   * Get coupons for a specific merchant
   */
  static getCoupons(merchantId: string): Coupon[] {
    return coupons.filter(coupon => 
      coupon.merchant_id === merchantId || 
      coupon.merchant_id === this.extractMerchantId(merchantId)
    );
  }

  /**
   * Get all coupons
   */
  static getAllCoupons(): Coupon[] {
    return [...coupons];
  }

  /**
   * Get coupon by ID
   */
  static getCouponById(id: string): Coupon | undefined {
    return coupons.find(coupon => coupon.id === id);
  }

  /**
   * Search products by query
   */
  static searchProducts(query: string, limit: number = 10): Product[] {
    const results = productFuse.search(query, { limit });
    return results.map(result => result.item);
  }

  /**
   * Get product by ID
   */
  static getProductById(id: string): Product | undefined {
    return products.find(product => product.id === id);
  }

  /**
   * Get products by category
   */
  static getProductsByCategory(category: string): Product[] {
    return products.filter(product => 
      product.categories.some(cat => 
        cat.toLowerCase().includes(category.toLowerCase())
      )
    );
  }

  /**
   * Get all products
   */
  static getAllProducts(): Product[] {
    return [...products];
  }

  /**
   * Get contributor info
   */
  static getContributor(id: string): CommunityContributor | undefined {
    return contributors.find(contrib => contrib.contributor_id === id);
  }

  /**
   * Get top contributors
   */
  static getTopContributors(limit: number = 10): CommunityContributor[] {
    return [...contributors]
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, limit);
  }

  /**
   * Get supported site config
   */
  static getSiteConfig(domain: string): SupportedSite | undefined {
    return supportedSites.find(site => 
      domain.includes(site.domain) || site.domain.includes(domain)
    );
  }

  /**
   * Check if site is supported
   */
  static isSiteSupported(domain: string): boolean {
    return supportedSites.some(site => 
      domain.includes(site.domain) || site.domain.includes(domain)
    );
  }

  /**
   * Get all supported sites
   */
  static getAllSupportedSites(): SupportedSite[] {
    return [...supportedSites];
  }

  /**
   * Extract merchant ID from domain
   */
  private static extractMerchantId(domain: string): string {
    // Extract base merchant name from domain
    const match = domain.match(/(?:www\.)?([^.]+)\./);
    return match ? match[1].toLowerCase() : domain.toLowerCase();
  }

  /**
   * Simulate API delay
   */
  static async simulateApiDelay(ms: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get merchant hash (for privacy)
   */
  static getMerchantHash(domain: string): string {
    // Simple hash function for demo
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
      const char = domain.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

// Export types and data
export { coupons, products, contributors, supportedSites };
export type { Coupon, Product, CommunityContributor, SupportedSite };