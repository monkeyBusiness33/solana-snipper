import { BN, Wallet } from '@project-serum/anchor';
import RaydiumSwap from './RaydiumSwap'
import { Transaction, VersionedTransaction, LAMPORTS_PER_SOL, Connection, PublicKey, Keypair, TransactionInstruction, TransactionMessage, } from '@solana/web3.js'
import base58 from 'bs58'
import 'dotenv/config'
import {
  MARKET_STATE_LAYOUT_V3,
} from '@raydium-io/raydium-sdk'
const bs58 = require("bs58");

const connection = new Connection(
  process.env.RPC_ENDPOINT || 'https://mainnet.helius-rpc.com'
);


const prepareForRaydium = async ({ baseMint, quoteMint, walletAddress }: { baseMint: string, quoteMint: string, walletAddress: string }) => {
  console.log('Preparing...')
  const raydiumSwap = new RaydiumSwap(process.env.RPC_ENDPOINT || 'https://mainnet.helius-rpc.com', walletAddress)
  // console.log(`Raydium swap initialized`)

  // Loading with pool keys from https://api.raydium.io/v2/sdk/liquidity/mainnet.json
  await raydiumSwap.loadPoolKeys()
  // console.log(`Loaded pool keys`)

  // Trying to find pool info in the json we loaded earlier and by comparing baseMint and tokenBAddress
  // let poolInfo = raydiumSwap.findPoolInfoForTokens(baseMint, quoteMint)

  let poolInfo = await raydiumSwap.findRaydiumPoolInfo(baseMint, quoteMint)

  if (!poolInfo) {
    throw new Error("Couldn't find the pool info")
  }

  // console.log('Found pool info', poolInfo)
  console.log('Finished preparing.')
  return {
    raydiumSwap, poolInfo
  }
}

interface ObjInfo {
  wallet: string
  investSolAmount: number
  gasFee: number
  buySlippage: number
}
export const makeSellTransaction = async (obj: ObjInfo) => {
  const quoteMint = process.env.BAST_MINT || ""
  const baseMint = process.env.QUOTE_MINT || ""

  const { raydiumSwap, poolInfo } = await prepareForRaydium({ baseMint, quoteMint, walletAddress: obj.wallet })

  const tx = await raydiumSwap.getSwapTransaction(
    quoteMint,
    obj.investSolAmount,
    poolInfo,
    Number(obj.gasFee) * LAMPORTS_PER_SOL, // Prioritization fee, now set to (0.0005 SOL)
    'out',
    obj.buySlippage// Slippage
  )
  return tx
}

export const makeBuyTransaction = async (obj: ObjInfo) => {
  const baseMint = process.env.BAST_MINT || ""
  const quoteMint = process.env.QUOTE_MINT || ""

  const { raydiumSwap, poolInfo } = await prepareForRaydium({ baseMint, quoteMint, walletAddress: obj.wallet })
  const tx = await raydiumSwap.getSwapTransaction(
    quoteMint,
    // tokenAAmount,
    obj.investSolAmount,
    poolInfo,
    Number(obj.gasFee) * LAMPORTS_PER_SOL,
    // Number(process.env.PRIORITIZAION_FEE) * LAMPORTS_PER_SOL, // Prioritization fee, now set to (0.0005 SOL)
    'in',
    obj.buySlippage// Slippage
  )
  return tx
}
const solAmountTobeSwapped = 0.001



