import SettingBuy, { SettingBuyModel } from './schema/settingBuySchema';
import SettingSell, { SettingSellModel } from './schema/settingSellSchema';
//-------------------------BUY---------------------------
// Create a new setting
export async function createBuySetting(data: any): Promise<SettingBuyModel> {
  try {
    const newSetting = new SettingBuy(data);
    const savedSetting = await newSetting.save();
    return savedSetting;
  } catch (error) {
    console.error('Error creating setting:', error);
    throw error;
  }
}

export async function getAllSettings(): Promise<SettingBuyModel | null> {
  try {
    const settings = await SettingBuy.find({}, 'wallet walletAddress tokenAddress status investSolAmount totalProfit');
    return settings as any;
  } catch (error) {
    console.log('Error getting settings:', error);
    throw error;
  }
}

export async function getwalletInfo(address: string): Promise<SettingBuyModel[] | []> {
  try {
    const settings = await SettingBuy.find({
      $or: [
        { tokenAddress: address },
        { walletAddress: address }
      ]
    });
    return settings as any;
  } catch (error) {
    console.log('Error getting settings:', error);
    throw error;
  }
}
export async function setwalletInfo(obj: any): Promise<SettingBuyModel | null> {
  try {
    const newData = {
      ...obj,
      status : !obj.status,
    }
    const settings = await SettingBuy.findByIdAndUpdate(obj._id, newData, { new: true });
    return settings as any;
  } catch (error) {
    console.log('Error getting settings:', error);
    throw error;
  }
}

// Get all settings
export async function getBuyAllSettings(wallet: string): Promise<SettingBuyModel | null> {
  try {
    const settings = await SettingBuy.findOne({});
    return settings ?? null; // Return null if settings are null
  } catch (error) {
    console.log('Error getting settings:', error);
    throw error;
  }
}
export async function getBuySettings(): Promise<SettingBuyModel | null> {
  try {
    const settings = await SettingBuy.findOne({});
    return settings ?? null; // Return null if settings are null
  } catch (error) {
    console.log('Error getting settings:', error);
    throw error;
  }
}

// Get setting by ID
export async function getBuySettingById(id: string): Promise<SettingBuyModel | null> {
  try {
    const setting = await SettingBuy.findById(id);
    return setting;
  } catch (error) {
    console.error(`Error getting setting with ID ${id}:`, error);
    throw error;
  }
}

// Update setting by ID
export async function updateBuySettings(data: any): Promise<SettingBuyModel> {
  try {

    let updatedSetting: any
    if (data.tokenAddress) {
      updatedSetting = await SettingBuy.findOne({ wallet: data.wallet, tokenAddress: data.tokenAddress });
    }
    if (data.walletAddress) {
      updatedSetting = await SettingBuy.findOne({ wallet: data.wallet, walletAddress: data.walletAddress });
    }

    if (!updatedSetting) {
      const newSetting = new SettingBuy(data);
      const savedSetting = await newSetting.save();
      return savedSetting;
    } else {
      const result = await SettingBuy.findOneAndUpdate({ wallet: data.wallet }, data, { new: true });
      if (!result) {
        throw new Error('Failed to update setting');
      }
      return result;
    }
  } catch (error) {
    console.error('Error updating setting:', error);
    throw error;
  }
}
//-------------------------SELL---------------------------
// Create a new setting
export async function createSellSetting(data: any): Promise<SettingSellModel> {
  try {
    const newSetting = new SettingSell(data);
    const savedSetting = await newSetting.save();
    return savedSetting;
  } catch (error) {
    console.error('Error creating setting:', error);
    throw error;
  }
}

// Get all settings
export async function getSellAllSettings(): Promise<SettingSellModel | null> {
  try {
    const settings = await SettingSell.findOne();
    return settings ?? null; // Return null if settings are null
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
}

// Get setting by ID
export async function getSellSettingById(id: string): Promise<SettingSellModel | null> {
  try {
    const setting = await SettingSell.findById(id);
    return setting;
  } catch (error) {
    console.error(`Error getting setting with ID ${id}:`, error);
    throw error;
  }
}

// Update setting by ID
export async function updateSellSettings(data: any): Promise<SettingSellModel> {
  try {
    const updatedSetting = await SettingSell.findOne({});
    if (!updatedSetting) {
      const newSetting = new SettingSell(data);
      const savedSetting = await newSetting.save();
      return savedSetting;
    } else {
      const result = await SettingSell.findOneAndUpdate({}, data, { new: true });
      if (!result) {
        throw new Error('Failed to update setting');
      }
      return result;
    }
  } catch (error) {
    console.error('Error updating setting:', error);
    throw error;
  }
}
