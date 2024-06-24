import { Request, Response } from 'express';
import { getAllWallets, createWallet, updateWallet, getWalletById, deleteWallet, getWalletByKey, updateWalletInfo } from '../models/Wallet';

export const getWallets = async (req: Request, res: Response): Promise<void> => {
  try {
    const walletDatas = await getAllWallets();
    res.status(200).send(walletDatas);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal server error");
  }
};

export const createNewWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const walletData = await createWallet(data);
    res.status(200).send(walletData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal server error");
  }
};

export const changeStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    let wallet = await getWalletById(data.walletId);

    if (!wallet) {
      res.status(404).send("Wallet not found");
      return;
    }

    wallet.status = !wallet.status;
    const updatedWallet = await updateWallet(data.walletId, wallet);
    res.status(200).send(updatedWallet);
  } catch (error: any) {
    console.error("Error:", error);
    res.status(500).send("Internal server error");
  }
};

export const addImportSol = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    let wallet = await getWalletByKey(data.wallet);

    if (!wallet) {
      res.status(404).send("Wallet not found");
      return;
    }

    wallet.status = !wallet.status;
    const updatedWallet = await updateWalletInfo(data.wallet, data);
    res.status(200).send(updatedWallet);
  } catch (error: any) {
    console.error("Error:", error);
    res.status(500).send("Internal server error");
  }
};

export const delWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const updatedWallet = await deleteWallet(data.walletId);
    res.status(200).send(updatedWallet);
  } catch (error: any) {
    console.error("Error:", error);
    res.status(500).send("Internal server error");
  }
};
