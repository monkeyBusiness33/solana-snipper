import mongoose, { Document } from 'mongoose';
import Wallet, { WalletModel } from './schema/walletSchema'; // Assuming your schema is in a file named 'Wallet.ts'

// CREATE operation
export const createWallet = async (walletData: any): Promise<WalletModel> => {
  try {
    const exist = await Wallet.findOne({ secretKey: walletData.secretKey });
    if (exist) {
      const result = await Wallet.findOneAndUpdate({ secretKey: walletData.secretKey }, walletData, { new: true });
      if (!result) {
        throw new Error('Failed to update setting');
      }
      return result;
    } else {
      const newWallet = new Wallet(walletData);
      const savedWallet = await newWallet.save();
      return savedWallet;
    }
  } catch (error: any) {
    throw new Error(`Error creating wallet: ${error.message}`);
  }
};

// READ operation (Get all wallets)
export const getAllWallets = async (): Promise<WalletModel[]> => {
  try {
    const wallets = await Wallet.find({}, 'walletName publicAddress secretKey status investAmount profit');
    return wallets;
  } catch (error: any) {
    throw new Error(`Error fetching wallets: ${error.message}`);
  }
};

// READ operation (Get wallet by ID)
export const getWalletById = async (walletId: mongoose.Types.ObjectId): Promise<WalletModel | null> => {
  try {
    const wallet = await Wallet.findById(walletId);
    return wallet;
  } catch (error: any) {
    throw new Error(`Error fetching wallet: ${error.message}`);
  }
};
export const getWalletByKey = async (walletAddress: string): Promise<WalletModel | null> => {
  try {
    const wallet = await Wallet.findOne({ secretKey: walletAddress });
    return wallet;
  } catch (error: any) {
    throw new Error(`Error fetching wallet: ${error.message}`);
  }
};
// UPDATE operation
export const updateWalletInfo = async (walletId: string, newData: any): Promise<WalletModel | null> => {
  try {
    const updatedWallet = await Wallet.findOneAndUpdate({ secretKey: walletId }, newData, { new: true });
    return updatedWallet;
  } catch (error: any) {
    throw new Error(`Error updating wallet: ${error.message}`);
  }
};
// UPDATE operation
export const updateWallet = async (walletId: mongoose.Types.ObjectId, newData: any): Promise<WalletModel | null> => {
  try {
    const updatedWallet = await Wallet.findByIdAndUpdate(walletId, newData, { new: true });
    return updatedWallet;
  } catch (error: any) {
    throw new Error(`Error updating wallet: ${error.message}`);
  }
};

// DELETE operation
export const deleteWallet = async (walletId: mongoose.Types.ObjectId): Promise<WalletModel | null> => {
  try {
    const deletedWallet = await Wallet.findByIdAndDelete(walletId);
    return deletedWallet;
  } catch (error: any) {
    throw new Error(`Error deleting wallet: ${error.message}`);
  }
};

export const getActiveWallets = async (): Promise<WalletModel[]> => {
  try {
    const activeWallets = await Wallet.find({ status: true }, 'secretKey');
    return activeWallets;
  } catch (error: any) {
    console.error('Error fetching active wallets:', error);
    throw error;
  }
};
