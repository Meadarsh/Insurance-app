// Overall dashboard analytics controller {Implement changes according to the new data models and requirements i.e amount (profited) , commission breakdown}
import Policy from '../models/policy.model.js';
import Vendor from '../models/vendor.model.js';
import Master from '../models/master.model.js';
import FileUpload from '../models/fileUpload.model.js';
import { Types } from 'mongoose';

// Helper function to calculate growth percentage
const calculateGrowthPercentage = (data, field = 'total') => {
  if (!data || data.length < 2) return 0;
  
  const current = data[0]?.[field] || 0;
  const previous = data[1]?.[field] || 0;
  
  if (previous === 0) return current > 0 ? 100 : 0;
  
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
};

export const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user?._id;
    
    // Get total counts and analytics data
    const [
      totalPolicies,
      totalVendors,
      totalProducts,
      totalFileUploads,
      totalPremium,
      totalSumAssured,
      policiesByProduct,
      policiesByMonth,
      topVendors,
      weeklySalesData,
      newUsersData,
      purchaseOrdersData,
      messagesData,
      currentVisitsData,
      websiteVisitsData
    ] = await Promise.all([
      // Total policies count
      Policy.countDocuments({ userId }),
      
      // Total vendors count
      Vendor.countDocuments({ userId }),
      
      // Total products count
      Master.countDocuments({ userId }),
      
      // Total file uploads count
      FileUpload.countDocuments({ userId }),
      
      // Total premium amount
      Policy.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: '$PREMIUM' } } }
      ]),
      
      // Total sum assured
      Policy.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: '$sumAssured' } } }
      ]),
      
      // Policies by product
      Policy.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        { $group: { _id: '$productName', count: { $sum: 1 }, totalPremium: { $sum: '$PREMIUM' } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      
      // Policies by month (last 6 months)
      Policy.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            transactionDate: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$transactionDate' } },
            count: { $sum: 1 },
            totalPremium: { $sum: '$PREMIUM' }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      
      // Top vendors by policy count
      Vendor.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        { $group: { _id: '$vendorName', count: { $sum: 1 }, totalPremium: { $sum: '$PREMIUM' } } },
        { $sort: { totalPremium: -1 } },
        { $limit: 5 }
      ]),

      // Weekly sales data (based on policies)
      Policy.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%U', date: '$transactionDate' } },
            total: { $sum: '$PREMIUM' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': -1 } },
        { $limit: 8 }
      ]),

      // New users data (based on new policies)
      Policy.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$transactionDate' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': -1 } },
        { $limit: 8 }
      ]),

      // Purchase orders data (based on policies)
      Policy.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$transactionDate' } },
            count: { $sum: 1 },
            total: { $sum: '$PREMIUM' }
          }
        },
        { $sort: { '_id': -1 } },
        { $limit: 8 }
      ]),

      // Messages data (simulated)
      Promise.resolve([{ count: 234 }]),

      // Current visits data (based on policies by region/product)
      Policy.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$productName',
            value: { $sum: 1 }
          }
        },
        { $sort: { value: -1 } },
        { $limit: 4 }
      ]),

      // Website visits data (based on policies by month)
      Policy.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$transactionDate' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } },
        { $limit: 9 }
      ])
    ]);

    // Calculate growth percentages and format data for frontend
    const weeklySales = {
      total: totalPremium[0]?.total || 0,
      percent: calculateGrowthPercentage(weeklySalesData),
      chart: {
        categories: weeklySalesData.map(item => {
          // Parse the week-based ID format (YYYY-WW)
          const [year, week] = item._id.split('-');
          const date = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
          return date.toLocaleDateString('en-US', { month: 'short' });
        }).reverse(),
        series: weeklySalesData.map(item => item.total || 0).reverse()
      }
    };

    const newUsers = {
      total: totalPolicies || 0,
      percent: calculateGrowthPercentage(newUsersData, 'count'),
      chart: {
        categories: newUsersData.map(item => {
          const date = new Date(item._id);
          return date.toLocaleDateString('en-US', { month: 'short' });
        }).reverse(),
        series: newUsersData.map(item => item.count || 0).reverse()
      }
    };

    const purchaseOrders = {
      total: totalPolicies || 0,
      percent: calculateGrowthPercentage(purchaseOrdersData, 'count'),
      chart: {
        categories: purchaseOrdersData.map(item => {
          const date = new Date(item._id);
          return date.toLocaleDateString('en-US', { month: 'short' });
        }).reverse(),
        series: purchaseOrdersData.map(item => item.count || 0).reverse()
      }
    };

    const messages = {
      total: messagesData[0]?.count || 0,
      percent: calculateGrowthPercentage(messagesData, 'count'),
      chart: {
        categories: messagesData.map(item => {
          const date = new Date(item._id);
          return date.toLocaleDateString('en-US', { month: 'short' });
        }).reverse(),
        series: messagesData.map(item => item.count || 0).reverse()
      }
    };

    const currentVisits = {
      series: currentVisitsData.length > 0 ? currentVisitsData.map(item => ({
        label: item._id || 'Unknown',
        value: item.value || 0
      })) : [
        { label: 'Direct', value: 0 },
        { label: 'Referral', value: 0 },
        { label: 'Social', value: 0 },
        { label: 'Search', value: 0 }
      ]
    };

    const websiteVisits = {
      categories: websiteVisitsData.length > 0 ? websiteVisitsData.map(item => {
        const date = new Date(item._id);
        return date.toLocaleDateString('en-US', { month: 'short' });
      }) : [],
      series: websiteVisitsData.length > 0 ? [
        {
          name: 'Visits',
          data: websiteVisitsData.map(item => item.count || 0)
        }
      ] : [
        {
          name: 'Visits',
          data: []
        }
      ]
    };

    // Return data in the format expected by frontend
    res.status(200).json({
      success: true,
      data: {
        stats: {
          weeklySales,
          newUsers,
          purchaseOrders,
          messages
        },
        currentVisits,
        websiteVisits
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching analytics data'
    });
  }
};
