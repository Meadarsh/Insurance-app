import express from 'express';
import { getDashboardAnalytics } from '../controllers/analytics.controller.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Protected route (requires authentication)
router.get('/dashboard', protect, getDashboardAnalytics);

// Temporary test route without authentication - calls analytics logic directly
router.get('/test', async (req, res) => {
  try {
    console.log('🔍 Test analytics endpoint called');
    
    // Import the models and logic directly
    const Policy = (await import('../models/policy.model.js')).default;
    const User = (await import('../models/user.model.js')).default;
    
    // Simple test data
    const totalPolicies = await Policy.countDocuments();
    const totalUsers = await User.countDocuments();
    
    const testData = {
      success: true,
      data: {
        stats: {
          weeklySales: {
            total: totalPolicies * 1000,
            percent: 15,
            chart: {
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              series: [totalPolicies * 10, totalPolicies * 15, totalPolicies * 20, totalPolicies * 25, totalPolicies * 30, totalPolicies * 35]
            }
          },
          newUsers: {
            total: totalUsers * 100,
            percent: 25,
            chart: {
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              series: [totalUsers * 5, totalUsers * 10, totalUsers * 15, totalUsers * 20, totalUsers * 25, totalUsers * 30]
            }
          },
          purchaseOrders: {
            total: totalPolicies * 500,
            percent: 8,
            chart: {
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              series: [totalPolicies * 8, totalPolicies * 12, totalPolicies * 16, totalPolicies * 20, totalPolicies * 24, totalPolicies * 28]
            }
          },
          messages: {
            total: totalUsers * 50,
            percent: 12,
            chart: {
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              series: [totalUsers * 3, totalUsers * 6, totalUsers * 9, totalUsers * 12, totalUsers * 15, totalUsers * 18]
            }
          }
        },
        currentVisits: {
          series: [
            { label: 'Direct', value: totalPolicies * 100 },
            { label: 'Referral', value: totalUsers * 50 },
            { label: 'Social', value: totalPolicies * 75 },
            { label: 'Search', value: totalUsers * 25 }
          ]
        },
        websiteVisits: {
          categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          series: [
            {
              name: 'Visits',
              data: [totalPolicies * 20, totalPolicies * 30, totalPolicies * 40, totalPolicies * 50, totalPolicies * 60, totalPolicies * 70]
            }
          ]
        }
      }
    };
    
    console.log('🔍 Test endpoint sending data:', JSON.stringify(testData, null, 2));
    res.status(200).json(testData);
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ success: false, error: 'Test failed: ' + error.message });
  }
});

export default router;
