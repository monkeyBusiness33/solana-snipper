import mongoose, { Document, Schema } from 'mongoose';


export interface SettingBuyModel extends Document {
  wallet: string;
  gasFee: number;
  investSolAmount: number;
  buySlippage: number;

}


const settingBuySchema = new Schema<SettingBuyModel>({
  wallet: { type: String, required: true },
  gasFee: { type: Number, required: true },
  investSolAmount: { type: Number, required: true },
  buySlippage: { type: Number, required: true },
});

const SettingBuy = mongoose.model<SettingBuyModel>('SettingBuy', settingBuySchema);
export default SettingBuy;
