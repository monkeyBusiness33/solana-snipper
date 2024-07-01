import express from 'express';
import walletRoutes from './walletRoutes';
import settingRoutes from './settingRoutes';
import { Request, Response } from 'express';
import { makeBuyTransaction, makeSellTransaction } from '../config/createPoolSnipe'
import { getwalletInfo, setwalletInfo } from '../models/Setting';

const router = express.Router();

export const getWebHook = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Received a webhook request");
    const requestBody = req.body;
    // console.log("Received webhook data:------------", requestBody)

    // const result = requestBody.map((obj: any) => {
    //     return {
    //         accountData:  [...obj.accountData],
    //         timestamp: obj.timestamp,
    //         tokenTransfers: [...obj.tokenTransfers],
    //         type: obj.type,
    //         signature : obj.signature
    //     }
    // })
    // console.log("Process-----", result)
    if (requestBody[0].source === 'UNKNOWN' && requestBody[0].type === 'UNKNOWN') {
      console.log("-------------ADD-----------------")
      console.log("Received webhook data:------------", requestBody)
      const target = requestBody[0].feePayer;
      const info = await getwalletInfo(target)
      Promise.all(info?.map(async (obj: any) => {
        const tx = await makeBuyTransaction(obj);
        if (tx) setwalletInfo(obj)
        console.log("tx---", tx)
      }))

      console.log("/////////", info)
    }
    if (requestBody[0].tokenTransfers.length > 0 && requestBody[0].type === 'TRANSFER') {
      console.log("-------------Remove-----------------")
      console.log("Received webhook data:------------", requestBody)
      const target = requestBody[0].feePayer;
      const info = await getwalletInfo(target)
      Promise.all(info?.map(async (obj: any) => {
        if (!obj.stauts) {
          const tx = await makeSellTransaction(obj);
          if (tx) setwalletInfo(obj)
          console.log("tx--", tx);
        }
      }))
    }
    res.status(200).send("Webhook received successfully");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal server error");
  }
};

// Import and use wallet routes
router.use('/wallet', walletRoutes);

// Import and use setting routes
router.use('/settings', settingRoutes);
router.post('/webhooks', getWebHook);
// router.get('/webhooks', getWebHook);

export default router;
