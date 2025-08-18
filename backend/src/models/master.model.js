import mongoose from "mongoose";

const masterSchema = new mongoose.Schema({
  productName: { type: String, required: true },              
  premiumPayingTerm: {min:{type: Number, required: true}, max:{type: Number, default:null} },        
  policyTerm: { type: Number, required: true },               
  policyNumber: { type: String, unique: true, required: true }, 
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
}, { timestamps: true });

export default mongoose.model("Master", masterSchema);
