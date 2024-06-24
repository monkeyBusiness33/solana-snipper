import mongoose, { Document, Schema } from 'mongoose';

export interface WalletModel extends Document {
  walletName: string;
  publicAddress: string;
  secretKey: string;
  status: boolean;
  investAmount: string;
  profit: string
}

const walletSchema = new Schema<WalletModel>({
  walletName: {
    type: String,
    required: true
  },
  publicAddress: {
    type: String,
    required: true,
    unique: true,
  },
  secretKey: {
    type: String,
    required: true,
    select: false // Hides the secret key by default when fetching data
  },
  status: {
    type: Boolean,
    required: true,
    default: false
  },
  investAmount: {
    type: String,
  },
  profit: {
    type: String,
  }
});

const Wallet = mongoose.model<WalletModel>('Wallet', walletSchema);
export default Wallet;
