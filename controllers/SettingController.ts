import { Request, Response } from 'express';
import { getBuyAllSettings, getSellAllSettings, updateBuySettings, updateSellSettings, createBuySetting, createSellSetting } from '../models/Setting';

export const updateBuySetting = async (req: Request, res: Response): Promise<void> => {
  try {
    const newData = {
      wallet: req.body.wallet,
      investSolAmount: req.body.investAmount,
      buySlippage: req.body.slippageAmount,
      gasFee: req.body.gasFee,
    };
    const result = await updateBuySettings(newData);
    res.status(200).send(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal server error");
  }
};

export const updateSellSetting = async (req: Request, res: Response): Promise<void> => {
  try {
    const {sellSetting} = req.body
    const newData = {
      wallet: sellSetting.wallet,
      xAmount: sellSetting.xAmount,
      zProfit: sellSetting.zProfit,
      xProfit: 20,
      yProfit: 30,
      yAmount: sellSetting.yAmount,
      zAmount: sellSetting.zAmount,
    };
    const result = await updateSellSettings(newData);
    res.status(200).send(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal server error");
  }
};

export const getBuyData = async (req: Request, res: Response): Promise<void> => {
  try {
    const {wallet} = req.body
    const result = await getBuyAllSettings(wallet);
    res.status(200).send(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal server error");
  }
};

export const getSellData = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getSellAllSettings();
    res.status(200).send(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal server error");
  }
};
