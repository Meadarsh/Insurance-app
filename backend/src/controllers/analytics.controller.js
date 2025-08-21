import Policy from '../models/policy.model.js';
import Vendor from '../models/vendor.model.js';
import Master from '../models/master.model.js';
import FileUpload from '../models/fileUpload.model.js';
import { Types } from 'mongoose';

export const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user?._id ;
    
    // Get total counts
    const [
      totalPolicies,
      totalVendors,
      totalProducts,
      totalFileUploads,
      totalPremium,
      totalSumAssured,
      policiesByProduct,
      policiesByMonth,
      topVendors
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
      ])
    ]);

    // Calculate growth percentages (simplified - would compare with previous period in real implementation)
    const growth = {
      policies: 0, // Would calculate based on previous period
      premium: 0,
      vendors: 0
    };
console.log("userId",totalPolicies);

    res.status(200).json({
      success: true,
      data: {
        stats: [
          { title: 'Total Policies', total: totalPolicies, growth: growth.policies, icon: 'ic_policy' },
          { title: 'Total Premium', total: totalPremium[0]?.total || 0, growth: growth.premium, icon: 'ic_money' },
          { title: 'Total Sum Assured', total: totalSumAssured[0]?.total || 0, growth: 0, icon: 'ic_shield' },
          { title: 'Active Products', total: totalProducts, growth: 0, icon: 'ic_product' },
          { title: 'Vendors', total: totalVendors, growth: growth.vendors, icon: 'ic_vendor' },
          { title: 'File Uploads', total: totalFileUploads, growth: 0, icon: 'ic_upload' },
        ],
        charts: {
          policiesByProduct: policiesByProduct.map(item => ({
            label: item._id || 'Unknown',
            value: item.count,
            totalPremium: item.totalPremium
          })),
          policiesByMonth: policiesByMonth.map(item => ({
            month: item._id,
            count: item.count,
            totalPremium: item.totalPremium
  })),
          topVendors: topVendors.map(item => ({
            name: item._id || 'Unknown',
            policies: item.count,
            premium: item.totalPremium
          }))
        }
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
