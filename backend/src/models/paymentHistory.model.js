import mongoose from 'mongoose';

const paymentHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
      uppercase: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'requires_action', 'requires_payment_method'],
      default: 'pending',
    },
    transactionId: {
      type: String,
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'net_banking', 'upi', 'stripe', 'other'],
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    planType: {
      type: String,
      enum: ['monthly', 'yearly', 'custom'],
      required: true,
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add indexes for faster queries
paymentHistorySchema.index({ userId: 1, status: 1 });
paymentHistorySchema.index({ paymentDate: -1 });

// Virtual for formatted amount
paymentHistorySchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency || 'USD',
  }).format(this.amount / 100); // Convert cents to dollars
});

const PaymentHistory = mongoose.model('PaymentHistory', paymentHistorySchema);

export default PaymentHistory;
