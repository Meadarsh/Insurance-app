import mongoose from "mongoose";

const masterSchema = new mongoose.Schema({
  productName: { type: String, required: true },              
  premiumPayingTerm: {min:{type: Number, required: true}, max:{type: Number, default:null} },        
  policyTerm: { type: Number, required: true },               
  policyNumber: { type: String, required: true }, // Removed unique constraint to allow duplicates
  policyPrices: [
    {
      price: { type: Number, required: true },
      date: { type: Date, required: true }
    }
  ],
  productVariant: { type: String },                          
  totalRate: { type: Number },    // in %                            
  commission: { type: Number },   // in %                            
  reward: { type: Number },       // in %        
  userId: { type: String, required: true }, // Changed to String with default     
  fileUpload: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileUpload',
    default: null
  }                   
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for file upload details
masterSchema.virtual('fileDetails', {
  ref: 'FileUpload',
  localField: 'fileUpload',
  foreignField: '_id',
  justOne: true
});

export default mongoose.model("Master", masterSchema);
