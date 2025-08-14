import mongoose from "mongoose";

const VendorSchema = new mongoose.Schema({
  // Basic Information
  SRC: { type: String },
  FIN_YR: { type: Number },
  FIN_MONTH: { type: Number },
  applicationNo: { type: String },
  policyNo: { type: String, index: true },
  CHDRSTCDB: { type: String },
  
  // Policy Details
  premiumPayingTerm: { type: Number },
  policyTerm: { type: Number },
  branchCode: { type: String },
  branchName: { type: String },
  productCode: { type: String },
  productName: { type: String },
  productVariant: { type: String },
  parNparUL: { type: String },
  campaign: { type: String },
  PIPS: { type: String },
  LOB: { type: String },
  STATCODE: { type: String },
  BILLFREQ: { type: String },
  PREMIUM: { type: Number },
  netPremium: { type: Number },
  sumAssured: { type: Number },
  FYWRP: { type: Number },
  EFFECT: { type: String },
  TRANSACTION_NO: { type: String },
  FYFLG: { type: String },
  lineGroup: { type: String },
  salesUnit: { type: String },
  ZBANCNUM: { type: String },
  REPNUM: { type: String },
  IACode: { type: String },
  channel: { type: String },
  subChannel: { type: String },
  
  // Payee/Agent Information
  payeeCode: { type: String },
  payeeName: { type: String },
  relationshipCode: { type: String },
  relationshipName: { type: String },
  clientId: { type: String },
  customerName: { type: String },
  agentNo: { type: String },
  agentName: { type: String },
  agentType: { type: String },
  agentAppointedDt: { type: Date },
  agentTerminatedDt: { type: Date },
  AGNTNUM_1_TO_MANY: { type: String },
  
  // Dates
  proposalDate: { type: Date },
  originalIssueDate: { type: Date },
  contractCommencementDate: { type: Date },
  transactionDate: { type: Date },
  transactionDateFinal: { type: Date },
  cancellationDate: { type: Date },
  
  // Backward compatibility aliases
  PAYCLT: { type: String }, // Alias for payeeCode
  BATCTRCD: { type: String }, // Alias for TRANSACTION_NO
  ORIGAMT: { type: Number }, // Alias for PREMIUM
  txnDesc: { type: String }, // Alias for EFFECT
  branchLocation: { type: String }, // Alias for branchName
  totalSumAssured: { type: Number }, // Alias for sumAssured
  vendorType: { type: String }, // Alias for agentType
  agentBranchCode: { type: String } // Alias for branchCode
}, {
  timestamps: true, // Adds createdAt & updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
VendorSchema.index({ policyNo: 1 });
VendorSchema.index({ payeeCode: 1 });
VendorSchema.index({ agentNo: 1 });
VendorSchema.index({ transactionDate: 1 });

// Virtual for policy status based on CHDRSTCDB
VendorSchema.virtual('policyStatus').get(function() {
  const statusMap = {
    'A': 'Active',
    'D': 'Deceased',
    'L': 'Lapsed',
    'S': 'Surrendered',
    'M': 'Matured'
  };
  return statusMap[this.CHDRSTCDB] || 'Unknown';
});

// Create and export model
export default mongoose.model('Vendor', VendorSchema);
