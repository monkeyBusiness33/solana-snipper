import mongoose, { Document, Schema } from 'mongoose';


export interface SettingSellModel extends Document {
  xProfit: number
  yProfit: number
  zProfit: number
  xAmount: number
  yAmount: number
  zAmount: number
}

const settingSellSchema = new Schema<SettingSellModel>({
  xProfit: Number,
  yProfit: Number,
  zProfit: Number,
  xAmount: Number,
  yAmount: Number,
  zAmount: Number
});

const SettingSell = mongoose.model<SettingSellModel>('SettingSell', settingSellSchema);
export default SettingSell;
