import express from 'express';
import { getBuyData, getSellData, updateBuySetting, updateSellSetting, getAllData } from '../controllers/SettingController';

const router = express.Router();

// setting routes
router.post("/buy", getBuyData);
router.get("/all", getAllData);
router.get("/sell", getSellData);
router.post("/buy/update", updateBuySetting);
router.post("/sell/update", updateSellSetting);

export default router;
