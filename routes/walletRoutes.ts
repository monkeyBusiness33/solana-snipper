import express from 'express';
import { getWallets, createNewWallet, addImportSol, changeStatus, delWallet } from '../controllers/WalletController';

const router = express.Router();

// wallet routes
router.get("/all", getWallets);
router.post("/create", createNewWallet); 
router.post("/sol", addImportSol);
router.post("/status", changeStatus);
router.post("/delete", delWallet);

export default router;
