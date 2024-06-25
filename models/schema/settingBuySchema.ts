import mongoose, { Document, Schema } from 'mongoose';


export interface SettingBuyModel extends Document {
  wallet: string;
  gasFee: number;
  investSolAmount: number;
  buySlippage: number;
  tokenAddress: string
  walletAddress: string
  xProfit: number
  yProfit: number
  zProfit: number
  xAmount: number
  yAmount: number
  zAmount: number
  status: boolean
  totalProfit: number,
}


const settingBuySchema = new Schema<SettingBuyModel>({
  wallet: { type: String, required: true },
  gasFee: { type: Number, required: true },
  investSolAmount: { type: Number, required: true },
  buySlippage: { type: Number, required: true },
  tokenAddress: String,
  walletAddress: String,
  xProfit: Number,
  yProfit: Number,
  zProfit: Number,
  xAmount: Number,
  yAmount: Number,
  zAmount: Number,
  status: Boolean,
  totalProfit: Number,
});

const SettingBuy = mongoose.model<SettingBuyModel>('SettingBuy', settingBuySchema);
export default SettingBuy;
