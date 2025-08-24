import ApiInstance from './api.instance';

// Cache for analytics data to reduce API calls
let analyticsCache: AnalyticsData | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // Increased to 60 seconds for better performance

// Type definitions
export interface DashboardStats {
  weeklySales: {
    total: number;
    percent: number;
    chart: {
      categories: string[];
      series: number[];
    };
  };
  newUsers: {
    total: number;
    percent: number;
    chart: {
      categories: string[];
      series: number[];
    };
  };
  purchaseOrders: {
    total: number;
    percent: number;
    chart: {
      categories: string[];
      series: number[];
    };
  };
  messages: {
    total: number;
    percent: number;
    chart: {
      categories: string[];
      series: number[];
    };
  };
}

export interface CurrentVisits {
  series: Array<{ label: string; value: number }>;
}

export interface WebsiteVisits {
  categories: string[];
  series: Array<{ name: string; data: number[] }>;
}

export interface AnalyticsData {
  stats: DashboardStats;
  currentVisits: CurrentVisits;
  websiteVisits: WebsiteVisits;
}

// Check if cache is valid
const isCacheValid = (): boolean => 
  analyticsCache !== null && (Date.now() - cacheTimestamp) < CACHE_DURATION;

// Main analytics API object
export const analyticsAPI = {
  // Get dashboard analytics with caching
  async getDashboardAnalytics(): Promise<AnalyticsData> {
    // Return cached data if valid
    if (isCacheValid()) {
      return analyticsCache!;
    }

    try {
      const response = await ApiInstance.get('/analytics/test');
      
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = response.data;
      
      // Extract the actual data from the response structure
      if (responseData.success && responseData.data) {
        const data = responseData.data;
        
        // Cache the successful response
        analyticsCache = data;
        cacheTimestamp = Date.now();
        
        return data;
      } else {
        throw new Error('Invalid API response structure');
      }
    } catch (error) {
      console.error('Analytics: API call failed:', error);
      throw new Error('Failed to fetch analytics data. Please check your connection and try again.');
    }
  },

  // Get stats with caching
  async getStats(): Promise<DashboardStats> {
    const data = await this.getDashboardAnalytics();
    return data.stats;
  },

  // Get current visits with caching
  async getCurrentVisits(): Promise<CurrentVisits> {
    const data = await this.getDashboardAnalytics();
    return data.currentVisits;
  },

  // Get website visits with caching
  async getWebsiteVisits(): Promise<WebsiteVisits> {
    const data = await this.getDashboardAnalytics();
    return data.websiteVisits;
  },

  // Get real-time data (only when needed)
  async getRealTimeData(): Promise<Partial<AnalyticsData>> {
    try {
      const response = await ApiInstance.get('/analytics/realtime');
      
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = response.data;
      
      // Update cache with new data
      if (analyticsCache) {
        analyticsCache = { ...analyticsCache, ...data };
        cacheTimestamp = Date.now();
      }
      
      return data;
    } catch (error) {
      console.warn('Failed to fetch real-time data:', error);
      return {};
    }
  },

  // Clear cache (useful for manual refresh)
  clearCache(): void {
    analyticsCache = null;
    cacheTimestamp = 0;
  },
};

export default analyticsAPI;
