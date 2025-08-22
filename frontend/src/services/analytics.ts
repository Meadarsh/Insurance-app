const API_BASE_URL = 'http://localhost:3001/api';

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

// Health check with timeout
export const healthCheck = async (timeout = 3000): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
      method: 'GET',
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Test connection with more details
export const testConnection = async (): Promise<{ status: string; responseTime: number }> => {
  const startTime = Date.now();
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return { status: 'Connected', responseTime };
    } else {
      return { status: 'Error', responseTime };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return { status: 'Failed', responseTime };
  }
};

// Main analytics API object
export const analyticsAPI = {
  // Get dashboard analytics with caching
  async getDashboardAnalytics(): Promise<AnalyticsData> {
    // Return cached data if valid
    if (isCacheValid()) {
      return analyticsCache!;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(5000),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the successful response
      analyticsCache = data;
      cacheTimestamp = Date.now();
      
      return data;
    } catch (error) {
      console.warn('Using fallback data due to API error:', error);
      return getFallbackAnalyticsData();
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
      const response = await fetch(`${API_BASE_URL}/analytics/realtime`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
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

  // Health check
  healthCheck,
  
  // Test connection
  testConnection,
};

// Enhanced fallback data when API is not available
function getFallbackAnalyticsData(): AnalyticsData {
  return {
    stats: {
      weeklySales: {
        total: 714000,
        percent: 11,
        chart: {
          categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
          series: [22, 8, 35, 50, 82, 84, 77, 12],
        },
      },
      newUsers: {
        total: 116000,
        percent: 23,
        chart: {
          categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
          series: [56, 47, 40, 62, 73, 30, 23, 54],
        },
      },
      purchaseOrders: {
        total: 560000,
        percent: 2.6,
        chart: {
          categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
          series: [40, 70, 50, 28, 70, 75, 7, 64],
        },
      },
      messages: {
        total: 123000,
        percent: 5.6,
        chart: {
          categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
          series: [56, 30, 23, 54, 47, 40, 62, 73],
        },
      },
    },
    currentVisits: {
      series: [
        { label: 'America', value: 3500 },
        { label: 'Asia', value: 2500 },
        { label: 'Europe', value: 1500 },
        { label: 'Africa', value: 500 },
      ],
    },
    websiteVisits: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      series: [
        {
          name: 'Team A',
          data: [20, 34, 45, 56, 67, 78, 89, 100],
        },
        {
          name: 'Team B',
          data: [10, 24, 35, 46, 57, 68, 79, 90],
        },
      ],
    },
  };
}

export default analyticsAPI;
